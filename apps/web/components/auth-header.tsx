"use client";

import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { isClerkEnabled } from "../lib/clerk-config";

function ClerkAuthHeader() {
  const { isSignedIn } = useAuth();

  return (
    <div className="auth-header">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <button type="button" className="auth-sign-in">
            Đăng nhập
          </button>
        </SignInButton>
      )}
    </div>
  );
}

export function AuthHeader() {
  if (!isClerkEnabled()) return null;
  return <ClerkAuthHeader />;
}
