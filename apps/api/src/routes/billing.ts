import type { Context } from "hono";
import Stripe from "stripe";
import {
  findUserById,
  findUserByStripeCustomer,
  getUserTier,
  setUserSubscription,
  isUserPremium,
  type SubscriptionTier,
} from "@repo/learning-engine";
import { getUsageStatus } from "../services/usage.js";
import { logger } from "../middleware/logger.js";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const PRICE_MAP: Record<string, SubscriptionTier> = {
  pro: "pro",
  family: "family",
};

export async function billingStatus(c: Context): Promise<Response> {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);

  try {
    const { tier, selectedState } = await getUserTier(userId);
    const premium = await isUserPremium(userId);
    const usage = await getUsageStatus(userId, premium);
    return c.json({ tier, selectedState, usage, premium });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing status failed";
    return c.json({ error: message }, 500);
  }
}

export async function createCheckout(c: Context): Promise<Response> {
  const stripe = getStripe();
  if (!stripe) {
    return c.json({ error: "Stripe not configured" }, 503);
  }

  const { userId, plan } = await c.req.json<{ userId: string; plan: "pro" | "family" }>();
  if (!userId || !plan) return c.json({ error: "userId and plan required" }, 400);

  const user = await findUserById(userId);
  if (!user) return c.json({ error: "User not found" }, 404);

  const priceId =
    plan === "pro"
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_FAMILY;
  if (!priceId) {
    return c.json({ error: `Stripe price for ${plan} not configured` }, 503);
  }

  const webUrl = process.env.WEB_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId: user.id },
      name: user.displayName,
    });
    customerId = customer.id;
    await setUserSubscription(user.id, user.subscriptionTier as SubscriptionTier, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webUrl}/pricing?success=1`,
    cancel_url: `${webUrl}/pricing?cancelled=1`,
    metadata: { userId: user.id, plan },
  });

  return c.json({ url: session.url });
}

export async function stripeWebhook(c: Context): Promise<Response> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return c.json({ error: "Stripe webhook not configured" }, 503);
  }

  const sig = c.req.header("stripe-signature");
  const body = await c.req.text();
  if (!sig) return c.json({ error: "Missing signature" }, 400);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return c.json({ error: message }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = (session.metadata?.plan ?? "pro") as SubscriptionTier;
    if (userId) {
      await setUserSubscription(userId, PRICE_MAP[plan] ?? "pro", String(session.customer));
      logger.info("subscription activated", { userId, plan });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const user = await findUserByStripeCustomer(String(sub.customer));
    if (user) {
      await setUserSubscription(user.id, "free");
      logger.info("subscription cancelled", { userId: user.id });
    }
  }

  return c.json({ received: true });
}

export async function createPortal(c: Context): Promise<Response> {
  const stripe = getStripe();
  if (!stripe) return c.json({ error: "Stripe not configured" }, 503);

  const { userId } = await c.req.json<{ userId: string }>();
  if (!userId) return c.json({ error: "userId required" }, 400);

  const { stripeCustomerId } = await getUserTier(userId);
  if (!stripeCustomerId) return c.json({ error: "No billing account" }, 404);

  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${webUrl}/pricing`,
  });

  return c.json({ url: session.url });
}
