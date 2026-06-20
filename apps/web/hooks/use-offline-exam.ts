"use client";

import { useEffect, useState } from "react";
import { loadOfflineExamBundle, type OfflineExamBundle } from "../lib/offline";

export function useOfflineExamReady() {
  const [ready, setReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [bundle, setBundle] = useState<OfflineExamBundle | null>(null);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    loadOfflineExamBundle()
      .then((b) => {
        setBundle(b);
        setReady(!!b);
      })
      .catch(() => setReady(false));
  }, []);

  return { ready, isOnline, bundle };
}
