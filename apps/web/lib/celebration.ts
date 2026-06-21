"use client";

import { playCorrectSound } from "./correct-sound";

type Listener = () => void;

let correctListeners: Listener[] = [];
let celebrateListeners: Listener[] = [];

export function onCorrect(fn: Listener): () => void {
  correctListeners.push(fn);
  return () => {
    correctListeners = correctListeners.filter((l) => l !== fn);
  };
}

export function onCelebrate(fn: Listener): () => void {
  celebrateListeners.push(fn);
  return () => {
    celebrateListeners = celebrateListeners.filter((l) => l !== fn);
  };
}

/** Sound + mascot on every correct answer. */
export function triggerCorrect(): void {
  playCorrectSound();
  correctListeners.forEach((fn) => fn());
}

/** Full confetti for milestones (combo, daily goal, exam pass). */
export function triggerCelebrate(): void {
  celebrateListeners.forEach((fn) => fn());
}
