"use client";

import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthHeader() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;

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
