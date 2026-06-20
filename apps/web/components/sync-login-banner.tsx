"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { isClerkEnabled } from "../lib/clerk-config";

function SyncLoginBannerInner() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded || isSignedIn) return null;
  if (typeof window !== "undefined" && !localStorage.getItem("wa_onboarding_done")) return null;

  return (
    <div className="sync-login-banner" role="note">
      <p className="sync-login-banner__text">
        <strong>💾 Lưu tiến độ:</strong> đăng nhập 1 lần (email hoặc Google) — khi đổi điện thoại vẫn giữ bài đã học.
      </p>
      <Link href="/sign-in" className="sync-login-banner__btn">
        Đăng nhập
      </Link>
    </div>
  );
}

/** Nhắc mẹ đăng nhập 1 lần để đồng bộ tiến độ khi đổi điện thoại */
export function SyncLoginBanner() {
  if (!isClerkEnabled()) return null;
  return <SyncLoginBannerInner />;
}
