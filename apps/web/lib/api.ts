"use client";

import { useCallback, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem("wa_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("wa_session_id", id);
  }
  return id;
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wa_user_id");
}

export function setUserId(id: string) {
  localStorage.setItem("wa_user_id", id);
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export function useTelemetry(screen: string) {
  const mounted = useRef(false);

  const track = useCallback(
    (eventType: string, payload?: Record<string, unknown>) => {
      apiFetch("/telemetry", {
        method: "POST",
        body: JSON.stringify({
          userId: getUserId(),
          sessionId: getSessionId(),
          eventType,
          screen,
          payload,
        }),
      }).catch(() => {});
    },
    [screen],
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      track("screen_view");
    }
    return () => {
      track("screen_exit");
    };
  }, [track]);

  return { track };
}

export async function ensureUser(displayName?: string): Promise<string> {
  const existing = getUserId();
  if (existing) return existing;

  const name =
    displayName ??
    (typeof window !== "undefined" ? localStorage.getItem("wa_display_name") : null) ??
    "Học viên";

  const user = await apiFetch<{ id: string }>("/users", {
    method: "POST",
    body: JSON.stringify({ displayName: name }),
  });
  setUserId(user.id);
  return user.id;
}

/** SSE streaming for AI tutor (ChatGPT-style) */
export async function streamRagQuery(
  query: string,
  onToken: (token: string) => void,
  onDone: (data: unknown) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/rag/query/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const event = JSON.parse(line.slice(5).trim()) as { type: string; data: unknown };
        if (event.type === "token") onToken(String(event.data));
        if (event.type === "done") onDone(event.data);
      } catch { /* skip */ }
    }
  }
}
