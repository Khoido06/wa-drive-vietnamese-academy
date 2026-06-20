"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function OptionalClerkProvider({ children }: { children: React.ReactNode }) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return <>{children}</>;

  return (
    <ClerkProvider publishableKey={key} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
