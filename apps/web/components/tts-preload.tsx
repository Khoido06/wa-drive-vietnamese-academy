"use client";

import { useEffect } from "react";
import { preloadTtsVoices } from "../lib/use-voice";

/** Mount once in layout to warm up Web Speech voices. */
export function TtsPreload() {
  useEffect(() => {
    preloadTtsVoices();
  }, []);
  return null;
}
