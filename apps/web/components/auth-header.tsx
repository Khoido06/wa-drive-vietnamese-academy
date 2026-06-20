"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { isClerkEnabled } from "../lib/clerk-config";

function ClerkAuthHeader() {
  const { isSignedIn } = useAuth();

  return (
    <div className="auth-header">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <Link href="/sign-in" className="auth-sign-in">
          Đăng nhập
        </Link>
      )}
    </div>
  );
}

export function AuthHeader() {
  if (!isClerkEnabled()) return null;
  return <ClerkAuthHeader />;
}
