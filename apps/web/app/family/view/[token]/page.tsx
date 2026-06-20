"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { LoadingState } from "@repo/ui/loading-state";
import { apiFetch } from "../../../../lib/api";

interface SharedData {
  learnerName: string;
  progress: {
    accuracy: number;
    overallMastery: number;
    totalAttempts: number;
    topics: Array<{ topic: string; masteryLevel: number }>;
  };
}

export default function FamilyViewPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch<SharedData>(`/family/shared/${token}`)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <ScreenLayout title="Không mở được" subtitle={error} onBack={() => router.push("/")}>
        <p>Link có thể đã hết hạn. Nhờ học viên tạo link mới.</p>
      </ScreenLayout>
    );
  }

  if (!data) {
    return (
      <ScreenLayout title="Tiến độ học" subtitle="Đang tải..." onBack={() => router.push("/")}>
        <LoadingState message="Đang tải tiến độ..." />
      </ScreenLayout>
    );
  }

  const pct = Math.round(data.progress.overallMastery * 100);
  const acc = Math.round(data.progress.accuracy * 100);

  return (
    <ScreenLayout
      title={`Tiến độ — ${data.learnerName}`}
      subtitle="Chế độ xem gia đình (chỉ đọc)"
      onBack={() => router.push("/")}
    >
      <div className="admin-cards">
        <div className="admin-card">
          <span className="admin-card-label">Mức thành thạo</span>
          <strong>{pct}%</strong>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Độ chính xác</span>
          <strong>{acc}%</strong>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Số lần làm bài</span>
          <strong>{data.progress.totalAttempts}</strong>
        </div>
      </div>

      <section className="admin-section">
        <h2>Theo chủ đề</h2>
        <ul className="admin-list">
          {data.progress.topics.map((t) => (
            <li key={t.topic}>
              <strong>{t.topic.replace(/_/g, " ")}</strong>
              <span>{Math.round(t.masteryLevel * 100)}% thành thạo</span>
            </li>
          ))}
        </ul>
      </section>
    </ScreenLayout>
  );
}
