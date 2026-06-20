"use client";

import { apiFetch, getUserId } from "./api";

export interface BillingStatus {
  tier: string;
  selectedState: string;
  premium: boolean;
  usage: {
    tutor: { used: number; limit: number; remaining: number };
    practice: { used: number; limit: number; remaining: number };
  };
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const userId = getUserId();
  if (!userId) return null;
  return apiFetch<BillingStatus>(`/billing/status/${userId}`);
}

export async function startCheckout(plan: "pro" | "family"): Promise<string | null> {
  const userId = getUserId();
  if (!userId) throw new Error("Cần tạo hồ sơ học viên trước");
  const res = await apiFetch<{ url: string }>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ userId, plan }),
  });
  return res.url;
}

export async function openBillingPortal(): Promise<string | null> {
  const userId = getUserId();
  if (!userId) throw new Error("Chưa có tài khoản thanh toán");
  const res = await apiFetch<{ url: string }>("/billing/portal", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return res.url;
}

export async function syncUserState(stateCode: string) {
  const userId = getUserId();
  if (!userId) return;
  await apiFetch(`/users/${userId}/state`, {
    method: "POST",
    body: JSON.stringify({ stateCode }),
  });
}
