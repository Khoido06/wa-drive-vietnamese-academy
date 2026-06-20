"use client";

import { useEffect, useState } from "react";
import { ElderButton } from "@repo/ui/elder-button";
import { apiFetch, ensureUser, getUserId } from "../lib/api";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!VAPID_KEY || typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "denied") return;

    const dismissed = localStorage.getItem("wa_push_dismissed");
    if (dismissed) return;

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (Notification.permission === "granted") {
          const existing = await reg.pushManager.getSubscription();
          if (existing) return;
        }
        setVisible(true);
      } catch {
        setVisible(true);
      }
    })();
  }, []);

  if (!visible || !VAPID_KEY) return null;

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Bạn có thể bật thông báo sau trong cài đặt trình duyệt");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
        });
      }

      const userId = getUserId() ?? (await ensureUser());
      await apiFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ userId, subscription: sub.toJSON() }),
      });
      setStatus("✅ Đã bật nhắc học hàng ngày");
      setVisible(false);
    } catch {
      setStatus("Không bật được thông báo — bạn vẫn học bình thường");
    }
  };

  const dismiss = () => {
    localStorage.setItem("wa_push_dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="push-prompt" role="region" aria-label="Nhắc học">
      <p>🔔 Bật nhắc học mỗi ngày? (SM-2 spaced repetition)</p>
      {status && <p style={{ fontSize: "var(--font-size-sm)" }}>{status}</p>}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <ElderButton variant="success" onClick={subscribe}>
          Bật nhắc
        </ElderButton>
        <ElderButton variant="secondary" onClick={dismiss}>
          Để sau
        </ElderButton>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
