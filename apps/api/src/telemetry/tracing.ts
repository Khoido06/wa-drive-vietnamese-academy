import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";

export const tracer = trace.getTracer("wa-drive-api", "0.7.1");

let otelEnabled = false;
let otelBackend: "langfuse" | "custom" | "off" = "off";

function parseOtlpHeaders(raw: string | undefined): Record<string, string> | undefined {
  if (!raw?.trim()) return undefined;
  const headers: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    headers[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return Object.keys(headers).length ? headers : undefined;
}

function resolveOtelConfig(): {
  endpoint: string;
  headers?: Record<string, string>;
  backend: "langfuse" | "custom";
} | null {
  const explicit = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (explicit) {
    const url = explicit.includes("/v1/traces") ? explicit : `${explicit.replace(/\/$/, "")}/v1/traces`;
    return {
      endpoint: url,
      headers: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
      backend: "custom",
    };
  }

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  if (!publicKey || !secretKey) return null;

  const base = (process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com").replace(/\/$/, "");
  const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
  return {
    endpoint: `${base}/api/public/otel/v1/traces`,
    headers: {
      Authorization: `Basic ${auth}`,
      "x-langfuse-ingestion-version": "4",
    },
    backend: "langfuse",
  };
}

/** Call once at startup — OTLP via explicit env or Langfuse keys already on Railway. */
export async function initOtel(): Promise<void> {
  const config = resolveOtelConfig();
  if (!config) return;

  const [
    { NodeTracerProvider, BatchSpanProcessor },
    { OTLPTraceExporter },
    { Resource },
    { SEMRESATTRS_SERVICE_NAME },
  ] = await Promise.all([
    import("@opentelemetry/sdk-trace-node"),
    import("@opentelemetry/exporter-trace-otlp-http"),
    import("@opentelemetry/resources"),
    import("@opentelemetry/semantic-conventions"),
  ]);

  const serviceName = process.env.OTEL_SERVICE_NAME ?? "wa-drive-api";
  const provider = new NodeTracerProvider({
    resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: serviceName }),
  });
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: config.endpoint,
        headers: config.headers,
      }),
    ),
  );
  provider.register();
  otelEnabled = true;
  otelBackend = config.backend;
}

export function isOtelEnabled(): boolean {
  return otelEnabled;
}

export function getOtelBackend(): "langfuse" | "custom" | "off" {
  return otelBackend;
}

export async function withSpan<T>(
  name: string,
  attrs: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    for (const [k, v] of Object.entries(attrs)) span.setAttribute(k, v);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      span.end();
    }
  });
}
