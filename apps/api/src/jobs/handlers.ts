import type { JobName } from "./queue.js";
import { ingestDocument, resolveStateDocumentPath, DEFAULT_RAG_CONFIG } from "@repo/ai-core";
import type { StateCode } from "@repo/ai-core";
import { sendReviewReminders } from "./review-reminders.js";
import { logger } from "../middleware/logger.js";

export async function runJob(name: JobName, data: Record<string, unknown>): Promise<void> {
  switch (name) {
    case "ingest": {
      const stateCode = String(data.stateCode ?? "WA") as StateCode;
      const docPath = resolveStateDocumentPath(stateCode);
      logger.info("job: ingest starting", { stateCode, docPath });
      const result = await ingestDocument(docPath, DEFAULT_RAG_CONFIG, {
        stateCode,
        sourceDocument: docPath,
      });
      logger.info("job: ingest complete", { stateCode, chunks: result.chunksCreated });
      break;
    }
    case "reembed": {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY required — set EMBED_PROVIDER=openai and run db:reindex:hnsw");
      }
      logger.info("job: reembed — enqueue complete; run `pnpm db:reindex:hnsw` on deploy host");
      break;
    }
    case "review-reminders": {
      const result = await sendReviewReminders();
      logger.info("job: review-reminders done", result);
      break;
    }
    default:
      throw new Error(`Unknown job: ${name}`);
  }
}
