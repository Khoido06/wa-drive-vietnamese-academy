"use client";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Đang tải..." }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
