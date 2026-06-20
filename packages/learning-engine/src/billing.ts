import { eq } from "drizzle-orm";
import { getDb, users } from "@repo/db";

export type SubscriptionTier = "free" | "pro" | "family" | "school";

const PRO_STATES = new Set(["WA", "CA", "TX", "FL"]);

export async function getUserTier(userId: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return { tier: "free" as SubscriptionTier, selectedState: "WA", stripeCustomerId: null };
  }
  return {
    tier: (user.subscriptionTier ?? "free") as SubscriptionTier,
    selectedState: user.selectedState ?? "WA",
    stripeCustomerId: user.stripeCustomerId,
  };
}

export async function setUserSubscription(
  userId: string,
  tier: SubscriptionTier,
  stripeCustomerId?: string,
) {
  const db = getDb();
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      stripeCustomerId: stripeCustomerId ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function setUserState(userId: string, stateCode: string) {
  const db = getDb();
  const { tier } = await getUserTier(userId);
  if (stateCode !== "WA" && tier === "free") {
    throw new Error("Pro required for additional states");
  }
  if (!PRO_STATES.has(stateCode)) {
    throw new Error("State not supported");
  }
  await db
    .update(users)
    .set({ selectedState: stateCode, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export function isPremium(tier: SubscriptionTier): boolean {
  return tier === "pro" || tier === "family" || tier === "school";
}

export async function findUserByStripeCustomer(stripeCustomerId: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return user ?? null;
}

export async function findUserById(userId: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}
