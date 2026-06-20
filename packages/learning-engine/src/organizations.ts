import { createHash, randomBytes } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { getDb, organizations, ragFeedback } from "@repo/db";

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `wa_sk_${randomBytes(24).toString("hex")}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 16),
  };
}

export async function createOrganization(name: string, seatLimit = 50) {
  const db = getDb();
  const { raw, hash, prefix } = generateApiKey();

  const [org] = await db
    .insert(organizations)
    .values({ name, apiKeyHash: hash, apiKeyPrefix: prefix, seatLimit })
    .returning();

  if (!org) throw new Error("Failed to create organization");
  return { organization: org, apiKey: raw };
}

export async function listOrganizations() {
  const db = getDb();
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      apiKeyPrefix: organizations.apiKeyPrefix,
      seatLimit: organizations.seatLimit,
      seatsUsed: organizations.seatsUsed,
      requestCount: organizations.requestCount,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt));
}

export async function verifyOrganizationApiKey(rawKey: string) {
  const db = getDb();
  const hash = hashApiKey(rawKey);
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.apiKeyHash, hash))
    .limit(1);
  return org ?? null;
}

export async function incrementOrgUsage(orgId: string) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) return;
  await db
    .update(organizations)
    .set({ requestCount: org.requestCount + 1, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));
}

export async function recordRagFeedback(input: {
  userId?: string;
  query: string;
  helpful: boolean;
  traceId?: string;
  stateCode?: string;
}) {
  const db = getDb();
  await db.insert(ragFeedback).values({
    userId: input.userId ?? null,
    query: input.query,
    helpful: input.helpful,
    traceId: input.traceId ?? null,
    stateCode: input.stateCode ?? "WA",
  });
}
