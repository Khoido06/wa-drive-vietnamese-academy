import type { Context, Next } from "hono";
import { verifyOrganizationApiKey, incrementOrgUsage } from "@repo/learning-engine";
import { createRateLimit } from "./rate-limit-upstash.js";

const orgRateLimit = createRateLimit({ windowMs: 60_000, max: 100, keyPrefix: "b2b" });

declare module "hono" {
  interface ContextVariableMap {
    organization: {
      id: string;
      name: string;
      seatLimit: number;
      seatsUsed: number;
    };
  }
}

export function orgApiKeyAuth() {
  return async (c: Context, next: Next) => {
    const raw =
      c.req.header("X-API-Key") ??
      c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");

    if (!raw) {
      return c.json({ error: "X-API-Key required" }, 401);
    }

    const org = await verifyOrganizationApiKey(raw);
    if (!org) {
      return c.json({ error: "Invalid API key" }, 401);
    }

    if (org.seatsUsed >= org.seatLimit) {
      return c.json({ error: "Seat limit reached" }, 403);
    }

    c.set("organization", {
      id: org.id,
      name: org.name,
      seatLimit: org.seatLimit,
      seatsUsed: org.seatsUsed,
    });

    await incrementOrgUsage(org.id);
    await next();
  };
}

export { orgRateLimit };
