/** Clerk is optional. Skip pk_test_* keys on production to avoid dev-key warnings. */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key?.trim()) return false;

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  if (isProd && key.startsWith("pk_test_")) return false;

  return true;
}
