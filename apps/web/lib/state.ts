"use client";

const STATE_KEY = "wa_state_code";

export function getSelectedState(): string {
  if (typeof window === "undefined") return "WA";
  return localStorage.getItem(STATE_KEY) ?? "WA";
}

export function setSelectedState(code: string) {
  localStorage.setItem(STATE_KEY, code.toUpperCase());
}

export const STATE_LABELS: Record<string, string> = {
  WA: "Washington",
  CA: "California",
  TX: "Texas",
  FL: "Florida",
};
