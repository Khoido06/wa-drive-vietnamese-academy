"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { LoadingState } from "@repo/ui/loading-state";
import { vi } from "@repo/ui/i18n/vi";
import { apiFetch, ensureUser, useTelemetry } from "../../lib/api";
import { HeaderAction } from "../../components/header-action";

interface Progress {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  overallMastery: number;
  topics: Array<{ topic: string; masteryLevel: number }>;
}

const TOPIC_LABELS: Record<string, string> = {
  traffic_signs: "Biển báo giao thông",
  right_of_way: "Quyền ưu tiên",
  speed_limits: "Giới hạn tốc độ",
  parking: "Đỗ xe",
  lane_changes: "Chuyển làn",
  intersections: "Ngã tư",
  pedestrians: "Người đi bộ",
  school_zones: "Khu vực trường học",
  highway_driving: "Lái xe cao tốc",
  night_driving: "Lái xe ban đêm",
  weather_conditions: "Thời tiết xấu",
  emergency_vehicles: "Xe ưu tiên",
  dui_laws: "Luật say rượu",
  seat_belts: "Dây an toàn",
  sharing_the_road: "Chia sẻ đường",
};

export default function ProgressPage() {
  const router = useRouter();
  useTelemetry("progress");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureUser()
      .then((userId) => apiFetch<Progress>(`/learning/${userId}/progress`))
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenLayout title={vi.progress.title} subtitle={vi.progress.subtitle} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
      {loading && <LoadingState />}
      {progress && (
        <>
          <div className="progress-grid">
            <div className="stat-card">
              <p className="stat-card__value">{Math.round(progress.overallMastery * 100)}%</p>
              <p className="stat-card__label">{vi.progress.mastery}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__value">{Math.round(progress.accuracy * 100)}%</p>
              <p className="stat-card__label">{vi.progress.accuracy}</p>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: "var(--space-lg)" }}>
            {vi.progress.attempts}: <strong>{progress.totalAttempts}</strong>
          </p>
          {progress.topics.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {progress.topics.map((t) => (
                <div key={t.topic} className="topic-row">
                  <div className="topic-row__header">
                    <span className="topic-row__name">{TOPIC_LABELS[t.topic] ?? t.topic}</span>
                    <span className="topic-row__pct">{Math.round(t.masteryLevel * 100)}%</span>
                  </div>
                  <div className="topic-bar">
                    <div className="topic-bar__fill" style={{ width: `${t.masteryLevel * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-xl) 0" }}>
              Chưa có dữ liệu — hãy bắt đầu học!
            </p>
          )}
          <ElderButton variant="success" onClick={() => router.push("/learn")} style={{ marginTop: "var(--space-lg)" }}>
            {vi.home.continueLearning}
          </ElderButton>
        </>
      )}
    </ScreenLayout>
  );
}
