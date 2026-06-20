"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiFetch, getUserId, setUserId } from "../lib/api";
import { isClerkEnabled } from "../lib/clerk-config";

/** Sync Clerk account → API user so progress syncs across devices */
function UserSync() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const synced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || synced.current) return;
    synced.current = true;

    const displayName =
      (typeof window !== "undefined" ? localStorage.getItem("wa_display_name") : null)?.trim() ||
      user.firstName ||
      user.fullName ||
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
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
  if (!isClerkEnabled()) return null;
  return <UserSync />;
}
