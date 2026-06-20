import { trace, SpanStatusCode, type Span } from "@opentelemetry/api";

export const tracer = trace.getTracer("wa-drive-api", "0.7.0");

let otelEnabled = false;

/** Call once at startup — loads OTLP exporter when OTEL_EXPORTER_OTLP_ENDPOINT is set. */
export async function initOtel(): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (!endpoint) return;

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
  provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter({ url: endpoint })));
  provider.register();
  otelEnabled = true;
}

export function isOtelEnabled(): boolean {
  return otelEnabled;
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
