"use client";

import { useEffect } from "react";
import { unlockAudio } from "../lib/correct-sound";

/** Unlock Web Audio on first user tap anywhere — required for iOS Safari. */
export function AudioUnlock() {
  useEffect(() => {
    const onGesture = () => unlockAudio();
    document.addEventListener("touchstart", onGesture, { capture: true, passive: true });
    document.addEventListener("click", onGesture, { capture: true });
    return () => {
      document.removeEventListener("touchstart", onGesture, true);
      document.removeEventListener("click", onGesture, true);
    };
  }, []);
  return null;
}
