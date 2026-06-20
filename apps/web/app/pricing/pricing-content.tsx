"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { ensureUser } from "../../lib/api";
import { fetchBillingStatus, startCheckout, openBillingPortal } from "../../lib/billing";
import { HeaderAction } from "../../components/header-action";

const PLANS = [
  {
    id: "free" as const,
    name: "Miễn phí",
    price: "$0",
    features: ["10 câu hỏi AI/ngày", "20 bài luyện/ngày", "Washington (WA)", "Đọc to · TTS"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$4.99/tháng",
    features: ["Hỏi AI không giới hạn", "Luyện tập không giới hạn", "Thêm bang (CA, TX, FL)", "Thi thử đầy đủ"],
  },
  {
    id: "family" as const,
    name: "Family",
    price: "$9.99/tháng",
    features: ["Tất cả Pro", "2 tài khoản gia đình", "Caregiver dashboard (sắp ra)"],
  },
];

export default function PricingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState<string | null>(null);
  const success = params.get("success");

  useEffect(() => {
    ensureUser()
      .then(() => fetchBillingStatus())
      .then((s) => {
        if (s) setTier(s.tier);
      })
      .catch(() => {});
  }, []);

  const upgrade = async (plan: "pro" | "family") => {
    setLoading(plan);
    try {
      await ensureUser();
      const url = await startCheckout(plan);
      if (url) window.location.href = url;
    } catch {
      alert("Stripe chưa cấu hình hoặc có lỗi. Mom vẫn dùng miễn phí bình thường.");
    } finally {
      setLoading(null);
    }
  };

  const portal = async () => {
    setLoading("portal");
    try {
      const url = await openBillingPortal();
      if (url) window.location.href = url;
    } catch {
      alert("Chưa có tài khoản thanh toán");
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScreenLayout
      title="Gói học"
      subtitle="Mom luôn học WA miễn phí — Pro là tùy chọn"
      onBack={() => router.push("/")}
      headerAction={<HeaderAction />}
    >
      {success && (
        <p className="pricing-success">✅ Cảm ơn! Gói của bạn sẽ được kích hoạt trong vài giây.</p>
      )}

      <p className="pricing-note">
        Gói hiện tại: <strong>{tier}</strong>
        {tier !== "free" && (
          <button type="button" className="pricing-portal-link" onClick={portal}>
            Quản lý thanh toán
          </button>
        )}
      </p>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <article key={plan.id} className={`pricing-card ${tier === plan.id ? "pricing-card--active" : ""}`}>
            <h2>{plan.name}</h2>
            <p className="pricing-price">{plan.price}</p>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {plan.id === "pro" && tier === "free" && (
              <ElderButton onClick={() => upgrade("pro")} loading={loading === "pro"}>
                Nâng cấp Pro
              </ElderButton>
            )}
            {plan.id === "family" && tier !== "family" && (
              <ElderButton onClick={() => upgrade("family")} loading={loading === "family"}>
                Nâng cấp Family
              </ElderButton>
            )}
            {tier === plan.id && plan.id !== "free" && (
              <p className="pricing-current">Đang dùng gói này</p>
            )}
          </article>
        ))}
      </div>

      <Link href="/" className="admin-back">
        ← Về trang chủ
      </Link>
    </ScreenLayout>
  );
}
