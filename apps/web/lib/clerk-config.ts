/** Clerk UI — needs publishable key only (client). */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.trim());
}

/** Clerk middleware — needs both keys (API JWT verification). */
export function isClerkMiddlewareEnabled(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const sk = process.env.CLERK_SECRET_KEY?.trim();
  return Boolean(pk && sk);
}

/** True when using Clerk Development keys (pk_test_) on a deployed host. */
export function isClerkDevKeys(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return Boolean(key?.startsWith("pk_test_"));
}
