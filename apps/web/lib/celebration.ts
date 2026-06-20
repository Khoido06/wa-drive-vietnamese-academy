"use client";

type Listener = () => void;

let celebrateListeners: Listener[] = [];

export function onCelebrate(fn: Listener): () => void {
  celebrateListeners.push(fn);
  return () => {
    celebrateListeners = celebrateListeners.filter((l) => l !== fn);
  };
}

export function triggerCelebrate(): void {
  celebrateListeners.forEach((fn) => fn());
}
