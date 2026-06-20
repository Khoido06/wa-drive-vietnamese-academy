"use client";

interface FeedbackBannerProps {
  type: "success" | "error";
  title: string;
  explanation?: string | null;
}

export function FeedbackBanner({ type, title, explanation }: FeedbackBannerProps) {
  return (
    <div className={`feedback feedback--${type === "success" ? "success" : "error"}`}>
      <div className="feedback__icon" aria-hidden="true">
        {type === "success" ? "✅" : "❌"}
      </div>
      <p className="feedback__title">{title}</p>
      {explanation && (
        <p className="feedback__body">
          <strong>Giải thích:</strong> {explanation}
        </p>
      )}
    </div>
  );
}
