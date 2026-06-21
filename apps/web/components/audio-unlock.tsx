"use client";

import { useEffect } from "react";
import { unlockAudio } from "../lib/correct-sound";

/** Unlock Web Audio on first user tap anywhere — required for iOS Safari. */
export function AudioUnlock() {
  useEffect(() => {
    const onGesture = () => unlockAudio();
    const opts = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", onGesture, opts);
    document.addEventListener("touchstart", onGesture, opts);
    document.addEventListener("click", onGesture, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("touchstart", onGesture, true);
      document.removeEventListener("click", onGesture, true);
    };
  }, []);
  return null;
}
