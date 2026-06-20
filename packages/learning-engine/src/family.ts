import { randomBytes } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { getDb, caregiverLinks, users } from "@repo/db";
import { getProgress } from "./engine.js";
import { getUserTier } from "./billing.js";

function newToken(): string {
  return randomBytes(16).toString("hex");
}

export async function createCaregiverInvite(learnerUserId: string) {
  const { tier } = await getUserTier(learnerUserId);
  if (tier !== "family" && tier !== "school") {
    throw new Error("Family or School tier required to share progress");
  }

  const db = getDb();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const [link] = await db
    .insert(caregiverLinks)
    .values({
      learnerUserId,
      inviteToken: newToken(),
      expiresAt,
    })
    .returning();

  if (!link) throw new Error("Failed to create invite");
  return link;
}

export async function acceptCaregiverInvite(token: string, caregiverUserId: string) {
  const db = getDb();
  const [link] = await db
    .select()
    .from(caregiverLinks)
    .where(
      and(
        eq(caregiverLinks.inviteToken, token),
        gt(caregiverLinks.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!link) throw new Error("Invite invalid or expired");

  const [updated] = await db
    .update(caregiverLinks)
    .set({ caregiverUserId, accepted: true })
    .where(eq(caregiverLinks.id, link.id))
    .returning();

  return updated;
}

export async function getSharedProgress(token: string) {
  const db = getDb();
  const [link] = await db
    .select()
    .from(caregiverLinks)
    .where(
      and(
        eq(caregiverLinks.inviteToken, token),
        gt(caregiverLinks.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!link) throw new Error("Link invalid or expired");

  const [learner] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, link.learnerUserId))
    .limit(1);

  const progress = await getProgress(link.learnerUserId);

  return {
    learnerName: learner?.displayName ?? "Học viên",
    permission: link.permission,
    progress,
  };
}

export async function listCaregiverLinks(learnerUserId: string) {
  const db = getDb();
  return db
    .select()
    .from(caregiverLinks)
    .where(eq(caregiverLinks.learnerUserId, learnerUserId));
}
