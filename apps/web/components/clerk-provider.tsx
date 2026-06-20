"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { isClerkEnabled } from "../lib/clerk-config";

export function OptionalClerkProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!isClerkEnabled() || !key) return <>{children}</>;

  return (
    <ClerkProvider publishableKey={key} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
