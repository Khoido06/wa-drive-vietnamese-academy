"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { NavCard } from "@repo/ui/nav-card";
import { LoadingState } from "@repo/ui/loading-state";
import { vi } from "@repo/ui/i18n/vi";
import { useTelemetry, ensureUser } from "../lib/api";
import { HeaderAction } from "../components/header-action";
import { StatePicker } from "../components/state-picker";
import { SyncLoginBanner } from "../components/sync-login-banner";
import { StudyMotivation } from "../components/study-motivation";

export default function HomePage() {
  const router = useRouter();
  const { track } = useTelemetry("home");
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("wa_display_name") ?? "");
    ensureUser().then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const go = (path: string, label: string) => {
    track("navigation", { target: path, label });
    router.push(path);
  };

  if (!ready) {
    return (
      <ScreenLayout title={vi.appName} subtitle={vi.appSubtitle} hero headerAction={<HeaderAction />}>
        <LoadingState message="Đang chuẩn bị..." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title={vi.appName} subtitle={vi.appSubtitle} hero headerAction={<HeaderAction />}>
      <div className="hero-badge">🚗 Washington State · Tiếng Việt · Đáp án chuẩn DMV</div>
      <p className="hero-greeting">
        {name ? `Chào ${name}!` : vi.home.welcome}
      </p>
      <p className="hero-sub">Chọn hoạt động — học từng câu có giải thích, thi thử 40 câu giống DMV</p>

      <SyncLoginBanner />

      <StudyMotivation />

      <StatePicker />

      <nav className="nav-grid" aria-label="Menu chính">
        <NavCard icon="📖" label={vi.home.continueLearning} description="Ôn chủ đề yếu · Có giải thích" primary onClick={() => go("/learn", vi.home.continueLearning)} />
        <NavCard icon="📝" label={vi.home.practiceExam} description="40 câu · cần 32/40 (80%) để đậu" onClick={() => go("/exam", vi.home.practiceExam)} />
        <NavCard icon="🎓" label={vi.home.askQuestion} description="Hỏi AI · Trả lời tức thì" onClick={() => go("/tutor", vi.home.askQuestion)} />
        <NavCard icon="📊" label={vi.home.viewProgress} description="Theo dõi tiến độ học" onClick={() => go("/progress", vi.home.viewProgress)} />
        <NavCard icon="⭐" label="Gói Pro" description="Không giới hạn · Thêm bang" onClick={() => go("/pricing", "pricing")} />
        <NavCard icon="👨‍👩‍👧" label="Gia đình" description="Chia sẻ tiến độ với con" onClick={() => go("/family", "family")} />
      </nav>
    </ScreenLayout>
  );
}
