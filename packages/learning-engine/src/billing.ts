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

function parseList(envVal: string | undefined): string[] {
  if (!envVal) return [];
  return envVal.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Unlimited AI + practice — Pro tier, family env, or whitelisted name/id */
export async function isUserPremium(userId: string): Promise<boolean> {
  if (process.env.FAMILY_UNLIMITED === "true") return true;

  const ids = parseList(process.env.PREMIUM_USER_IDS);
  if (ids.includes(userId)) return true;

  const user = await findUserById(userId);
  if (!user) return false;

  if (isPremium((user.subscriptionTier ?? "free") as SubscriptionTier)) return true;

  const names = parseList(process.env.PREMIUM_DISPLAY_NAMES);
  const normalized = user.displayName.trim().toLowerCase();
  return names.some((n) => normalized.includes(n.toLowerCase()) || n.toLowerCase().includes(normalized));
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
