#!/usr/bin/env node
/**
 * Backfill state_code='WA' on existing rag_chunks after schema migration.
 * Run: pnpm db:push && node --import tsx scripts/backfill-state-code.ts
 */
import { sql } from "drizzle-orm";
import { getDb, closeDb } from "@repo/db";

const db = getDb();
const result = await db.execute(sql`
  UPDATE rag_chunks SET state_code = 'WA' WHERE state_code IS NULL OR state_code = ''
`);
console.log("Backfill complete:", result);
await closeDb();
