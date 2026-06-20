"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBillingStatus, type BillingStatus } from "../lib/billing";

interface UsageMeterProps {
  /** Show only tutor, only practice, or both */
  show?: "both" | "tutor" | "practice";
  compact?: boolean;
}

export function UsageMeter({ show = "both", compact = false }: UsageMeterProps) {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    fetchBillingStatus().then(setStatus).catch(() => setStatus(null));
    const refresh = () => fetchBillingStatus().then(setStatus).catch(() => {});
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  if (!status || status.premium) return null;

  const { tutor, practice } = status.usage;
  const tutorLow = tutor.remaining <= 2;
  const practiceLow = practice.remaining <= 3;

  if (compact) {
    const line =
      show === "tutor"
        ? `🎓 AI: còn ${tutor.remaining}/${tutor.limit} hôm nay`
        : show === "practice"
          ? `📖 Luyện: còn ${practice.remaining}/${practice.limit} hôm nay`
          : `🎓 ${tutor.remaining} AI · 📖 ${practice.remaining} luyện`;

    return (
      <p
        className={`usage-meter usage-meter--compact${tutorLow || practiceLow ? " usage-meter--warn" : ""}`}
        role="status"
      >
        {line}
        {(tutorLow || practiceLow) && (
          <button type="button" className="usage-meter__link" onClick={() => router.push("/pricing")}>
            Nâng cấp Pro →
          </button>
        )}
      </p>
    );
  }

  return (
    <section
      className={`usage-meter${tutorLow || practiceLow ? " usage-meter--warn" : ""}`}
      aria-label="Giới hạn Free hôm nay"
    >
      <p className="usage-meter__title">Gói Free — hôm nay còn</p>
      <div className="usage-meter__grid">
        {(show === "both" || show === "tutor") && (
          <div className="usage-meter__item">
            <span className="usage-meter__label">🎓 Hỏi AI</span>
            <span className="usage-meter__value">
              <strong>{tutor.remaining}</strong>/{tutor.limit} câu
            </span>
            <div className="usage-meter__bar">
              <div
                className="usage-meter__bar-fill usage-meter__bar-fill--tutor"
                style={{ width: `${Math.min(100, (tutor.used / tutor.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {(show === "both" || show === "practice") && (
          <div className="usage-meter__item">
            <span className="usage-meter__label">📖 Luyện / Thi</span>
            <span className="usage-meter__value">
              <strong>{practice.remaining}</strong>/{practice.limit} lượt
            </span>
            <div className="usage-meter__bar">
              <div
                className="usage-meter__bar-fill usage-meter__bar-fill--practice"
                style={{ width: `${Math.min(100, (practice.used / practice.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {(tutorLow || practiceLow) && (
        <button type="button" className="usage-meter__cta" onClick={() => router.push("/pricing")}>
          ⭐ Nâng cấp Pro — không giới hạn
        </button>
      )}
    </section>
  );
}
