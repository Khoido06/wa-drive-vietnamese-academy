"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiFetch, getUserId, setUserId } from "../lib/api";

/** Sync Clerk account → API user so mom keeps progress across devices */
export function UserSync() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || synced.current) return;
    synced.current = true;

    const displayName =
      user.firstName ??
      user.fullName ??
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ??
      "Học viên";

    apiFetch<{ id: string }>("/users/link", {
      method: "POST",
      body: JSON.stringify({
        clerkId: user.id,
        displayName,
        localUserId: getUserId() ?? undefined,
      }),
    })
      .then((linked) => setUserId(linked.id))
      .catch(() => {
        synced.current = false;
      });
  }, [isSignedIn, user]);

  return null;
}

export function OptionalUserSync() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;
  return <UserSync />;
}
