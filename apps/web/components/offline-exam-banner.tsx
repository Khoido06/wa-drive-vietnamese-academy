"use client";

interface OfflineExamBannerProps {
  variant?: "compact" | "full";
}

export function OfflineExamBanner({ variant = "compact" }: OfflineExamBannerProps) {
  if (variant === "compact") {
    return (
      <div className="offline-banner offline-banner--compact" role="status">
        <span className="offline-banner__icon" aria-hidden>📴</span>
        <span>Đang thi không cần mạng — kết quả lưu trên máy</span>
      </div>
    );
  }

  return (
    <div className="offline-banner offline-banner--full" role="status">
      <div className="offline-banner__icon-wrap" aria-hidden>📴</div>
      <div>
        <p className="offline-banner__title">Chế độ không mạng</p>
        <p className="offline-banner__desc">
          Bài thi chạy hoàn toàn trên điện thoại. Khi có WiFi, hãy thi lại online để cập nhật tiến độ.
        </p>
      </div>
    </div>
  );
}
