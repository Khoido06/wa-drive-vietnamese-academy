import { readFileSync, existsSync } from "node:fs";
import { isAbsolute, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pdf from "pdf-parse";
import { getDb, ragChunks } from "@repo/db";
import { embedText } from "../llm/client.js";
import { extractSections, chunkText } from "./chunker.js";
import { DEFAULT_RAG_CONFIG, type RagConfig } from "../types.js";

export interface IngestResult {
  chunksCreated: number;
  sourceDocument: string;
  pages: number;
}

function resolvePdfPath(pdfPath: string): string {
  if (isAbsolute(pdfPath)) return pdfPath;
  const root = process.env.PROJECT_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  return resolve(root, pdfPath);
}

export interface IngestOptions {
  stateCode?: string;
  sourceDocument?: string;
}

export async function ingestPdf(
  pdfPath: string,
  config: RagConfig = DEFAULT_RAG_CONFIG,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const resolved = resolvePdfPath(pdfPath);
  if (!existsSync(resolved)) {
    throw new Error(`PDF not found: ${resolved}. Place Washington Driver Guide at this path.`);
  }

  const buffer = readFileSync(resolved);
  const parsed = await pdf(buffer);
  const stateCode = options.stateCode ?? config.stateCode ?? "WA";
  const sourceDocument = options.sourceDocument ?? `driver-guide-vi-${stateCode.toLowerCase()}`;

  const sections = extractSections(parsed.text);
  const allChunks = sections.flatMap((section) => {
    const subChunks = chunkText(section.content, config.chunkSize, config.chunkOverlap);
    return subChunks.map((c) => ({
      ...c,
      sectionTitle: section.sectionTitle,
    }));
  });

  const db = getDb();
  let chunksCreated = 0;

  for (const chunk of allChunks) {
    const embedding = await embedText(chunk.content, config);
    await db.insert(ragChunks).values({
      sourceDocument,
      stateCode,
      content: chunk.content,
      chunkIndex: chunk.index,
      sectionTitle: chunk.sectionTitle ?? null,
      pageNumber: chunk.pageNumber ?? null,
      embedding,
      metadata: { wordCount: chunk.content.split(/\s+/).length },
    });
    chunksCreated++;
  }

  return {
    chunksCreated,
    sourceDocument,
    pages: parsed.numpages,
  };
}

export async function getChunkCount(): Promise<number> {
  const db = getDb();
  const rows = await db.select().from(ragChunks).limit(1);
  if (rows.length === 0) return 0;

  const all = await db.select({ id: ragChunks.id }).from(ragChunks);
  return all.length;
}
