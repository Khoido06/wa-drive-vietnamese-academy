"use client";

import { apiFetch, getUserId } from "../lib/api";
import { getSelectedState } from "../lib/state";

interface TutorFeedbackProps {
  query: string;
  disabled?: boolean;
}

export function TutorFeedback({ query, disabled }: TutorFeedbackProps) {
  if (!query.trim()) return null;

  const send = (helpful: boolean) => {
    apiFetch("/rag/feedback", {
      method: "POST",
      body: JSON.stringify({
        userId: getUserId(),
        query,
        helpful,
        stateCode: getSelectedState(),
      }),
    }).catch(() => {});
  };

  return (
    <div className="tutor-feedback" role="group" aria-label="Đánh giá câu trả lời">
      <span className="tutor-feedback__label">Câu trả lời có hữu ích không?</span>
      <div className="tutor-feedback__buttons">
        <button type="button" className="tutor-feedback__btn" disabled={disabled} onClick={() => send(true)}>
          👍 Có
        </button>
        <button type="button" className="tutor-feedback__btn" disabled={disabled} onClick={() => send(false)}>
          👎 Chưa
        </button>
      </div>
    </div>
  );
}
