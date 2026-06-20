"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setClerkTokenGetter } from "../lib/api";
import { isClerkEnabled } from "../lib/clerk-config";

/** Wires Clerk session JWT into API fetch for server-verified account linking. */
export function ClerkTokenBridge() {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isClerkEnabled()) {
      setClerkTokenGetter(async () => null);
      return;
    }
    setClerkTokenGetter(async () => {
      if (!isLoaded || !isSignedIn) return null;
      return getToken();
    });
  }, [getToken, isSignedIn, isLoaded]);

  return null;
}
