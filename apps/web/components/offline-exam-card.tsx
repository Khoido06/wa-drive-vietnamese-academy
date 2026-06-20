"use client";

import { ElderButton } from "@repo/ui/elder-button";

interface OfflineExamCardProps {
  ready: boolean;
  loading: boolean;
  isOnline: boolean;
  onStartOffline: () => void;
}

export function OfflineExamCard({ ready, loading, isOnline, onStartOffline }: OfflineExamCardProps) {
  return (
    <div className="offline-exam-card">
      <div className="offline-exam-card__header">
        <span className="offline-exam-card__badge">📴 Không cần WiFi</span>
        <h3 className="offline-exam-card__title">Thi thử Bộ đề 1 trên máy</h3>
      </div>
      <p className="offline-exam-card__desc">
        40 câu · cần 32/40 để đậu · có giải thích tiếng Việt sau khi thi.
        {ready
          ? " Bài thi đã tải sẵn — dùng được cả khi mất mạng."
          : " Mở app một lần khi có mạng để tải bài thi về máy."}
      </p>
      <ul className="offline-exam-card__features">
        <li>✓ Giống giao diện thi thật trên app</li>
        <li>✓ Xem lại câu sai + giải thích</li>
        <li>✓ 🔊 Đọc to câu hỏi</li>
      </ul>
      {!isOnline && (
        <p className="offline-exam-card__hint offline-exam-card__hint--warn">
          Bạn đang không có mạng — bấm nút bên dưới để bắt đầu.
        </p>
      )}
      <ElderButton
        variant="success"
        onClick={onStartOffline}
        loading={loading}
        disabled={!ready && isOnline}
      >
        {ready ? "Bắt đầu thi (không cần mạng)" : "Đang tải bài thi về máy..."}
      </ElderButton>
    </div>
  );
}
