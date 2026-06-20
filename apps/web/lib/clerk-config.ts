/** Clerk is optional — mom never forced to sign in. Enabled when publishable key is set. */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key?.trim());
}

/** True when using Clerk Development keys (pk_test_) on a deployed host. */
export function isClerkDevKeys(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  return Boolean(key?.startsWith("pk_test_"));
}
