"use client";

interface FeedbackBannerProps {
  type: "success" | "error";
  title: string;
  subtitle?: string;
  explanation?: string | null;
  celebrate?: boolean;
}

export function FeedbackBanner({ type, title, subtitle, explanation, celebrate }: FeedbackBannerProps) {
  return (
    <div
      className={`feedback feedback--${type === "success" ? "success" : "error"}${celebrate ? " feedback--celebrate" : ""}`}
    >
      <div className="feedback__icon" aria-hidden="true">
        {type === "success" ? "✅" : "❌"}
      </div>
      <p className="feedback__title">{title}</p>
      {subtitle && <p className="feedback__subtitle">{subtitle}</p>}
      {explanation && (
        <p className="feedback__body">
          <strong>Giải thích:</strong> {explanation}
        </p>
      )}
    </div>
  );
}
