"use client";

import { playCorrectSound } from "./correct-sound";

const CORRECT_EVENT = "wa-correct";
const CELEBRATE_EVENT = "wa-celebrate";

/** Sound + mascot/confetti on every correct answer. Uses window events so all bundles share one bus. */
export function triggerCorrect(): void {
  playCorrectSound();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CORRECT_EVENT));
  }
}

/** Full confetti for milestones (combo, daily goal, exam pass). */
export function triggerCelebrate(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CELEBRATE_EVENT));
  }
}

export function onCorrect(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CORRECT_EVENT, fn);
  return () => window.removeEventListener(CORRECT_EVENT, fn);
}

export function onCelebrate(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CELEBRATE_EVENT, fn);
  return () => window.removeEventListener(CELEBRATE_EVENT, fn);
}
