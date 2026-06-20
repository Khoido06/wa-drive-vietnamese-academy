import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";

export type ClerkAuthVariables = {
  clerkUserId?: string;
};

/** Validates Bearer JWT when CLERK_SECRET_KEY is set. Anonymous routes still work for mom. */
export const optionalClerkAuth = createMiddleware<{
  Variables: ClerkAuthVariables;
}>(async (c, next) => {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  const auth = c.req.header("Authorization");
  if (!secret || !auth?.startsWith("Bearer ")) {
    await next();
    return;
  }
  try {
    const { sub } = await verifyToken(auth.slice(7), { secretKey: secret });
    if (sub) c.set("clerkUserId", sub);
  } catch {
    return c.json({ error: "Invalid session" }, 401);
  }
  await next();
});

export function requireClerkMatch(bodyClerkId: string, jwtClerkId: string | undefined): boolean {
  if (!jwtClerkId) return true;
  return jwtClerkId === bodyClerkId;
}
