"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import posthog from "posthog-js";

function initSentryClient() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentryClient();

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
      });
    }
  }, []);

  return (
    <>
      {children}
      <Analytics />
    </>
  );
}

/** Track custom product events (PostHog free tier) */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(name, props);
  }
}
