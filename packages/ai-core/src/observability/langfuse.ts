import { Langfuse } from "langfuse";

let client: Langfuse | null | undefined;

export function getLangfuse(): Langfuse | null {
  if (client !== undefined) return client;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  if (!publicKey || !secretKey) {
    client = null;
    return null;
  }

  client = new Langfuse({
    publicKey,
    secretKey,
    baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
  });
  return client;
}

export interface RagTraceHandle {
  end: (output: Record<string, unknown>) => Promise<void>;
  fail: (error: unknown) => Promise<void>;
}

/** Optional Langfuse trace for RAG — no-op when keys unset (free). */
export async function startRagTrace(
  name: string,
  input: Record<string, unknown>,
): Promise<RagTraceHandle> {
  const lf = getLangfuse();
  if (!lf) {
    return {
      end: async () => {},
      fail: async () => {},
    };
  }

  const trace = lf.trace({ name, input });
  const generation = trace.generation({ name: `${name}-llm`, input });

  return {
    end: async (output) => {
      generation.end({ output });
      trace.update({ output });
      await lf.flushAsync();
    },
    fail: async (error) => {
      generation.end({
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : String(error),
      });
      await lf.flushAsync();
    },
  };
}
