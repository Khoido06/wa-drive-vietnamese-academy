"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { apiFetch, ensureUser, getUserId } from "../../lib/api";
import { HeaderAction } from "../../components/header-action";

export default function FamilyPage() {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createLink = async () => {
    setLoading(true);
    setError("");
    try {
      const userId = await ensureUser();
      const res = await apiFetch<{ shareUrl: string; token: string }>("/family/invite", {
        method: "POST",
        body: JSON.stringify({ learnerUserId: userId }),
      });
      setShareUrl(res.shareUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cần gói Family để chia sẻ tiến độ");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (shareUrl) await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <ScreenLayout
      title="Gia đình"
      subtitle="Chia sẻ tiến độ học với con cháu (gói Family)"
      onBack={() => router.push("/")}
      headerAction={<HeaderAction />}
    >
      <p style={{ lineHeight: 1.6 }}>
        Tạo link để con cháu xem tiến độ học của bạn — chỉ đọc, không chỉnh sửa.
      </p>

      <ElderButton onClick={createLink} loading={loading}>
        Tạo link chia sẻ
      </ElderButton>

      {error && <p className="admin-error">{error}</p>}

      {shareUrl && (
        <div className="family-share-box">
          <p className="family-share-label">Gửi link này cho con:</p>
          <code className="family-share-url">{shareUrl}</code>
          <ElderButton onClick={copy}>📋 Sao chép link</ElderButton>
        </div>
      )}

      <p className="family-hint">
        Học viên: {getUserId()?.slice(0, 8) ?? "—"}… · Cần gói{" "}
        <Link href="/pricing">Family</Link>
      </p>
    </ScreenLayout>
  );
}
