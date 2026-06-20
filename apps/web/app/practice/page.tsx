"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { LoadingState } from "@repo/ui/loading-state";
import {
  WA_DRIVE_TEST_INFO,
  WA_PRACTICAL_MANEUVERS,
  WA_VEHICLE_CHECKLIST,
  WA_DAY_OF_TEST_CHECKLIST,
  WA_SCORING_CATEGORIES,
  WA_DOL_DRIVE_VIDEOS,
} from "@repo/learning-engine/wa-practical";
import { ensureUser, useTelemetry } from "../../lib/api";
import { HeaderAction } from "../../components/header-action";
import { ManeuverWalkthrough } from "../../components/maneuver-walkthrough";
import { ManeuverVideoGuide } from "../../components/maneuver-video-guide";
import { ManeuverSimulation } from "../../components/maneuver-simulation";
import { DrivingSimulator } from "../../components/driving-simulator";
import { SIM_SCENARIOS } from "../../lib/drive-sim/scenarios";
import {
  loadPracticalProgress,
  getOverallPercent,
  getManeuverProgress,
  toggleChecklist,
  pullPracticalFromServer,
} from "../../lib/practical-progress";

type Tab = "overview" | "maneuvers" | "simulator" | "checklists";

export default function PracticePage() {
  const router = useRouter();
  const { track } = useTelemetry("practice");
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedManeuver, setSelectedManeuver] = useState<string | null>(null);
  const [simScenario, setSimScenario] = useState<string | null>(null);
  const [, tick] = useState(0);

  const maneuverIds = WA_PRACTICAL_MANEUVERS.map((m) => m.id);
  const vehicleIds = WA_VEHICLE_CHECKLIST.map((c) => c.id);
  const dayIds = WA_DAY_OF_TEST_CHECKLIST.map((c) => c.id);
  const progress = loadPracticalProgress();
  const overall = getOverallPercent(maneuverIds, vehicleIds, dayIds);

  useEffect(() => {
    ensureUser()
      .then((id) => pullPracticalFromServer(id))
      .finally(() => setReady(true));
    const refresh = () => tick((n) => n + 1);
    window.addEventListener("wa-practical-updated", refresh);
    return () => window.removeEventListener("wa-practical-updated", refresh);
  }, []);

  const activeManeuver = WA_PRACTICAL_MANEUVERS.find((m) => m.id === selectedManeuver);

  if (!ready) {
    return (
      <ScreenLayout title="Thi thực hành" subtitle="Chuẩn bị bài thi lái xe WA" headerAction={<HeaderAction />}>
        <LoadingState message="Đang tải..." />
      </ScreenLayout>
    );
  }

  if (simScenario) {
    return (
      <ScreenLayout title="Luyện lái xe" subtitle="Mô phỏng tương tác" headerAction={<HeaderAction />}>
        <DrivingSimulator
          scenarioId={simScenario}
          onExit={() => {
            setSimScenario(null);
            track("practice_sim_exit", { id: simScenario });
          }}
        />
      </ScreenLayout>
    );
  }

  if (activeManeuver) {
    return (
      <ScreenLayout title="Thi thực hành" subtitle={activeManeuver.titleVi} headerAction={<HeaderAction />}>
        <ManeuverWalkthrough
          maneuver={activeManeuver}
          onBack={() => {
            setSelectedManeuver(null);
            track("practice_maneuver_back", { id: activeManeuver.id });
          }}
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Thi thực hành"
      subtitle="Luyện 5 thao tác bắt buộc · Checklist xe · Quiz"
      headerAction={<HeaderAction />}
    >
      <div className="practice-hero">
        <p className="practice-hero__badge">🚗 Washington DOL · Skills test</p>
        <div className="practice-hero__stats">
          <div className="stat-card">
            <div className="stat-card__value">{overall}%</div>
            <div className="stat-card__label">Tiến độ chuẩn bị</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {WA_DRIVE_TEST_INFO.passScore}/{WA_DRIVE_TEST_INFO.maxScore}
            </div>
            <div className="stat-card__label">Điểm cần đậu</div>
          </div>
        </div>
        <p className="practice-hero__note">
          <strong>Mô phỏng 3D</strong> — tự lái xe góc thứ 3, chấm điểm như thi WA. Vẫn cần luyện trên xe thật.
        </p>
      </div>

      <div className="practice-tabs" role="tablist" aria-label="Mục thi thực hành">
        {(
          [
            ["overview", "Tổng quan"],
            ["maneuvers", "5 thao tác"],
            ["simulator", "🎮 Luyện lái"],
            ["checklists", "Checklist"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`practice-tab${tab === id ? " practice-tab--active" : ""}`}
            onClick={() => {
              setTab(id);
              track("practice_tab", { tab: id });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section className="practice-section">
          <h2>Bài thi thực hành WA</h2>
          <ul className="practice-info-list">
            <li>
              <strong>Thời gian:</strong> {WA_DRIVE_TEST_INFO.duration}
            </li>
            <li>
              <strong>Điểm đậu:</strong> {WA_DRIVE_TEST_INFO.passScore}/{WA_DRIVE_TEST_INFO.maxScore}
            </li>
            <li>
              <strong>Điều kiện:</strong> {WA_DRIVE_TEST_INFO.knowledgePrerequisite}
            </li>
          </ul>

          <div className="practice-scoring">
            {WA_SCORING_CATEGORIES.map((cat) => (
              <details key={cat.title} className="practice-scoring__group">
                <summary>{cat.title}</summary>
                <ul>
                  {cat.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          <p className="practice-disclaimer">
            ⚠️ Camera lùi thường <strong>không được dùng</strong> trong bài thi WA — luyện nhìn qua cửa sổ sau.
          </p>

          <h2>Video chính thức DOL</h2>
          <p className="practice-section__lead">
            Bộ 4 video ngắn từ Washington DOL — xem trước khi thi thật.
          </p>
          <div className="practice-videos">
            {WA_DOL_DRIVE_VIDEOS.map((v) => (
              <ManeuverVideoGuide key={v.youtubeId} youtubeId={v.youtubeId} title={`${v.titleVi} (${v.duration})`} />
            ))}
          </div>

          <ElderButton
            onClick={() => {
              track("practice_dol_link");
              window.open(WA_DRIVE_TEST_INFO.dolUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Xem hướng dẫn chính thức DOL
          </ElderButton>

          <ElderButton variant="secondary" onClick={() => router.push("/exam")}>
            ← Quay lại thi lý thuyết
          </ElderButton>
        </section>
      )}

      {tab === "maneuvers" && (
        <section className="practice-section">
          <p className="practice-section__lead">
            Học từng bước → làm quiz → đánh dấu khi đã luyện trên xe.
          </p>
          <div className="maneuver-grid">
            {WA_PRACTICAL_MANEUVERS.map((m) => {
              const mp = getManeuverProgress(m.id);
              const done = mp.quizPassed && mp.practicedInCar && mp.stepsRead >= m.steps.length;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`maneuver-card${done ? " maneuver-card--done" : ""}`}
                  onClick={() => {
                    setSelectedManeuver(m.id);
                    track("practice_maneuver_open", { id: m.id });
                  }}
                >
                  <div className="maneuver-card__preview" aria-hidden>
                    <ManeuverSimulation maneuverId={m.id} step={0} compact />
                  </div>
                  <span className="maneuver-card__icon" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="maneuver-card__title">{m.titleVi}</span>
                  <span className="maneuver-card__meta">
                    {mp.stepsRead}/{m.steps.length} bước
                    {mp.quizPassed ? " · ✓ Quiz" : ""}
                    {mp.practicedInCar ? " · ✓ Xe thật" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {tab === "simulator" && (
        <section className="practice-section">
          <p className="practice-section__lead">
            Lái xe 3D — camera góc thứ 3, vô-lăng + ga + phanh + xi-nhan. Chấm điểm theo tiêu chí DOL.
          </p>
          <div className="sim-picker">
            {SIM_SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="sim-picker__card"
                onClick={() => {
                  setSimScenario(s.id);
                  track("practice_sim_start", { id: s.id });
                }}
              >
                <span className="sim-picker__title">{s.titleVi}</span>
                <span className="sim-picker__brief">{s.briefVi}</span>
                <span className="sim-picker__cta">Bắt đầu luyện →</span>
              </button>
            ))}
          </div>
          <p className="drive-sim__keyboard-hint">
            Máy tính: ↑ ga · ↓ phanh · ←→ vô-lang · Q/E xi-nhan · H nhìn qua vai · R lùi
          </p>
        </section>
      )}

      {tab === "checklists" && (
        <section className="practice-section">
          <h2>Kiểm tra xe trước khi thi</h2>
          <ul className="checklist">
            {WA_VEHICLE_CHECKLIST.map((item) => (
              <li key={item.id}>
                <label className="checklist__item">
                  <input
                    type="checkbox"
                    checked={!!progress.vehicleChecklist[item.id]}
                    onChange={() => toggleChecklist("vehicleChecklist", item.id)}
                  />
                  <span>
                    <strong>{item.label}</strong>
                    {item.detail ? <small>{item.detail}</small> : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <h2>Ngày thi</h2>
          <ul className="checklist">
            {WA_DAY_OF_TEST_CHECKLIST.map((item) => (
              <li key={item.id}>
                <label className="checklist__item">
                  <input
                    type="checkbox"
                    checked={!!progress.dayOfTestChecklist[item.id]}
                    onChange={() => toggleChecklist("dayOfTestChecklist", item.id)}
                  />
                  <span>
                    <strong>{item.label}</strong>
                    {item.detail ? <small>{item.detail}</small> : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ScreenLayout>
  );
}
