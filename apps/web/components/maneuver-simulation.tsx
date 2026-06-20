"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ElderButton } from "@repo/ui/elder-button";

interface CarPose {
  x: number;
  y: number;
  rot: number;
}

interface SceneHint {
  text: string;
  signal?: "left" | "right";
  lookBack?: boolean;
  wheelDir?: "toward-curb" | "away-curb" | "toward-edge";
  hill?: "up" | "down";
  hasCurb?: boolean;
}

interface Scene {
  caption: string;
  car: CarPose;
  hints?: SceneHint;
  path?: string;
}

const SCENES: Record<string, Scene[]> = {
  parallel_parking: [
    { caption: "Dừng song song xe trước, bật xi-nhan phải", car: { x: 95, y: 72, rot: 0 }, hints: { text: "Xi-nhan →", signal: "right" } },
    { caption: "Lùi chậm, quay vô-lăng phải", car: { x: 118, y: 98, rot: 38 }, hints: { text: "Nhìn gương + qua vai", lookBack: true } },
    { caption: "Quay vô-lăng trái (~45°)", car: { x: 138, y: 118, rot: -8 }, hints: { text: "Chỉnh góc vào chỗ" } },
    { caption: "Căn song song lề, cách ≤12 inch", car: { x: 155, y: 128, rot: 0 }, hints: { text: "Số P + phanh tay" } },
    { caption: "Xi-nhan trái, rời chỗ đỗ", car: { x: 148, y: 118, rot: -18 }, hints: { text: "Kiểm tra điểm mù", signal: "left", lookBack: true } },
  ],
  hill_parking: [
    { caption: "Dốc xuống + có lề → quay bánh về lề", car: { x: 200, y: 118, rot: 0 }, hints: { text: "Toward curb", wheelDir: "toward-curb", hill: "down", hasCurb: true } },
    { caption: "Dốc lên + có lề → quay bánh ra xa lề", car: { x: 200, y: 98, rot: 0 }, hints: { text: "Away from curb", wheelDir: "away-curb", hill: "up", hasCurb: true } },
    { caption: "Không lề → quay về rìa đường", car: { x: 200, y: 108, rot: 0 }, hints: { text: "Toward shoulder", wheelDir: "toward-edge", hill: "down", hasCurb: false } },
    { caption: "Luôn kéo phanh tay + số P", car: { x: 200, y: 108, rot: 0 }, hints: { text: "Phanh tay (P)" } },
  ],
  backing_corner: [
    { caption: "Xi-nhan phải, quan sát phía sau", car: { x: 72, y: 168, rot: 0 }, hints: { text: "Không dùng camera lùi", signal: "right", lookBack: true } },
    { caption: "Lùi chậm quanh góc, sát lề", car: { x: 98, y: 142, rot: 52 }, hints: { text: "Trong 18 inch lề", lookBack: true }, path: "M72 168 Q110 150 128 118" },
    { caption: "Tiếp tục lùi thẳng theo lề", car: { x: 128, y: 98, rot: 90 }, hints: { text: "Nhìn cửa sổ sau", lookBack: true } },
    { caption: "Dừng khi giám khảo ra lệnh", car: { x: 128, y: 72, rot: 90 }, hints: { text: "Dừng hoàn toàn" } },
  ],
  lane_change: [
    { caption: "Bật xi-nhan trước ≥100 feet", car: { x: 110, y: 118, rot: 0 }, hints: { text: "Xi-nhan sớm", signal: "left" } },
    { caption: "Kiểm tra gương trong + ngoài", car: { x: 110, y: 118, rot: 0 }, hints: { text: "Gương ↔" } },
    { caption: "Nhìn qua vai — điểm mù", car: { x: 110, y: 118, rot: 0 }, hints: { text: "Head check!", lookBack: true } },
    { caption: "Đổi làn mượt, tắt xi-nhan", car: { x: 110, y: 78, rot: 0 }, hints: { text: "Giữ tốc độ" } },
  ],
  enter_exit_traffic: [
    { caption: "STOP — dừng hoàn toàn trước vạch", car: { x: 168, y: 148, rot: 0 }, hints: { text: "Cuộn xe = trừ điểm" } },
    { caption: "Nhường người đi bộ tại vạch", car: { x: 168, y: 148, rot: 0 }, hints: { text: "Nhường đi bộ" } },
    { caption: "Hòa nhập làn — khớp tốc độ", car: { x: 118, y: 108, rot: -12 }, hints: { text: "Xi-nhan + head check", signal: "left", lookBack: true } },
    { caption: "Giữ tốc độ giới hạn (25 mph khu dân cư)", car: { x: 72, y: 88, rot: 0 }, hints: { text: "25 mph" } },
  ],
};

function Car({ pose, color = "#2563eb" }: { pose: CarPose; color?: string }) {
  return (
    <g
      className="sim-car"
      transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rot})`}
    >
      <rect x="-22" y="-10" width="44" height="20" rx="4" fill={color} stroke="#1e3a8a" strokeWidth="1.5" />
      <rect x="-14" y="-8" width="12" height="16" rx="2" fill="#93c5fd" opacity="0.85" />
      <rect x="4" y="-8" width="12" height="16" rx="2" fill="#93c5fd" opacity="0.85" />
      <circle cx="-16" cy="10" r="4" fill="#1c1917" />
      <circle cx="16" cy="10" r="4" fill="#1c1917" />
    </g>
  );
}

function TopDownRoad({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 200" className="maneuver-sim__svg" role="img" aria-hidden>
      <rect width="320" height="200" fill="#e7e5e4" />
      <rect x="248" y="0" width="72" height="200" fill="#d6d3d1" />
      <line x1="248" y1="0" x2="248" y2="200" stroke="#78716c" strokeWidth="4" />
      <line x1="0" y1="100" x2="248" y2="100" stroke="#fafafa" strokeWidth="2" strokeDasharray="16 12" />
      {children}
    </svg>
  );
}

function HillSideView({ scene }: { scene: Scene }) {
  const h = scene.hints;
  const curb = h?.hasCurb !== false;
  const up = h?.hill === "up";

  return (
    <svg viewBox="0 0 320 180" className="maneuver-sim__svg" role="img" aria-hidden>
      <rect width="320" height="180" fill="#ecfdf5" />
      <polygon
        points={up ? "0,140 320,90 320,180 0,180" : "0,90 320,140 320,180 0,180"}
        fill="#d6d3d1"
      />
      {curb ? (
        <rect x="200" y={up ? 95 : 125} width="12" height="55" fill="#78716c" rx="2" />
      ) : null}
      <g transform={`translate(160 ${up ? 108 : 128})`}>
        <rect x="-28" y="-12" width="56" height="24" rx="4" fill="#2563eb" stroke="#1e3a8a" />
        <circle cx="-18" cy="-14" r="7" fill="#1c1917" />
        <circle cx="18" cy="-14" r="7" fill="#1c1917" />
        {h?.wheelDir === "toward-curb" ? (
          <path d="M-18 -14 L-8 -22" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arr)" />
        ) : null}
        {h?.wheelDir === "away-curb" ? (
          <path d="M18 -14 L28 -6" stroke="#f59e0b" strokeWidth="2" />
        ) : null}
        {h?.wheelDir === "toward-edge" ? (
          <path d="M-18 -14 L-28 -6" stroke="#f59e0b" strokeWidth="2" />
        ) : null}
      </g>
      {scene.caption.includes("phanh") ? (
        <text x="240" y="50" fontSize="28" fontWeight="bold" fill="#dc2626">
          P
        </text>
      ) : null}
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
        </marker>
      </defs>
    </svg>
  );
}

function LaneRoad({ car, signal }: { car: CarPose; signal?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 320 200" className="maneuver-sim__svg" role="img" aria-hidden>
      <rect width="320" height="200" fill="#57534e" />
      {[55, 105, 155].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#fafafa" strokeWidth="2" strokeDasharray="20 14" />
      ))}
      <Car pose={car} />
      {signal === "left" ? (
        <text x={car.x - 36} y={car.y - 18} fontSize="14" fill="#f59e0b">
          ◀ blink
        </text>
      ) : null}
      {signal === "right" ? (
        <text x={car.x + 18} y={car.y - 18} fontSize="14" fill="#f59e0b">
          blink ▶
        </text>
      ) : null}
    </svg>
  );
}

function TrafficScene({ scene }: { scene: Scene }) {
  const stepIdx = scene.caption.includes("STOP") ? 0 : scene.caption.includes("đi bộ") ? 1 : scene.caption.includes("Hòa") ? 2 : 3;
  return (
    <svg viewBox="0 0 320 200" className="maneuver-sim__svg" role="img" aria-hidden>
      <rect width="320" height="200" fill="#e7e5e4" />
      {stepIdx <= 1 ? (
        <>
          <polygon points="200,40 230,70 200,100 170,70" fill="#dc2626" />
          <text x="188" y="78" fill="white" fontSize="11" fontWeight="bold">
            STOP
          </text>
          <rect x="140" y="130" width="140" height="8" fill="#fafafa" />
        </>
      ) : (
        <>
          <path d="M0 120 Q60 100 120 108 L200 88" stroke="#57534e" strokeWidth="36" fill="none" />
          <line x1="0" y1="100" x2="320" y2="100" stroke="#fafafa" strokeWidth="2" strokeDasharray="14 10" />
        </>
      )}
      <Car pose={scene.car} />
    </svg>
  );
}

function ParallelScene({ scene }: { scene: Scene }) {
  return (
    <TopDownRoad>
      <rect x="150" y="48" width="44" height="20" rx="4" fill="#a8a29e" stroke="#57534e" />
      {scene.path ? (
        <path d={scene.path} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
      ) : null}
      <rect x="248" y="110" width="8" height="50" fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 3" />
      <Car pose={scene.car} />
      {scene.hints?.signal === "right" ? (
        <text x={scene.car.x + 24} y={scene.car.y - 14} fontSize="12" fill="#f59e0b">
          ▶ xi-nhan
        </text>
      ) : null}
      {scene.hints?.signal === "left" ? (
        <text x={scene.car.x - 48} y={scene.car.y - 14} fontSize="12" fill="#f59e0b">
          ◀ xi-nhan
        </text>
      ) : null}
      {scene.hints?.lookBack ? (
        <text x={scene.car.x - 10} y={scene.car.y + 28} fontSize="11" fill="#7c3aed">
          👀 nhìn sau
        </text>
      ) : null}
    </TopDownRoad>
  );
}

function BackingScene({ scene }: { scene: Scene }) {
  return (
    <TopDownRoad>
      <path d="M248 40 L248 180" stroke="#78716c" strokeWidth="3" />
      {scene.path ? (
        <path d={scene.path} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" />
      ) : null}
      <Car pose={scene.car} />
      {scene.hints?.lookBack ? (
        <text x={scene.car.x - 20} y={scene.car.y + 30} fontSize="11" fill="#7c3aed">
          👀 cửa sổ sau
        </text>
      ) : null}
    </TopDownRoad>
  );
}

interface Props {
  maneuverId: string;
  step: number;
  compact?: boolean;
}

export function ManeuverSimulation({ maneuverId, step, compact }: Props) {
  const scenes = SCENES[maneuverId] ?? [];
  const idx = Math.min(step, scenes.length - 1);
  const scene = scenes[idx];
  const [playing, setPlaying] = useState(false);
  const [playStep, setPlayStep] = useState(idx);

  useEffect(() => {
    setPlayStep(Math.min(step, scenes.length - 1));
  }, [step, scenes.length]);

  useEffect(() => {
    if (!playing || scenes.length === 0) return;
    const timer = window.setInterval(() => {
      setPlayStep((s) => (s + 1 >= scenes.length ? 0 : s + 1));
    }, 2200);
    return () => window.clearInterval(timer);
  }, [playing, scenes.length]);

  const active = playing ? scenes[playStep] : scene;
  if (!active) return null;

  const renderView = () => {
    if (maneuverId === "hill_parking") return <HillSideView scene={active} />;
    if (maneuverId === "lane_change") return <LaneRoad car={active.car} signal={active.hints?.signal} />;
    if (maneuverId === "enter_exit_traffic") return <TrafficScene scene={active} />;
    if (maneuverId === "backing_corner") return <BackingScene scene={active} />;
    return <ParallelScene scene={active} />;
  };

  return (
    <div className={`maneuver-sim${compact ? " maneuver-sim--compact" : ""}`}>
      <div className="maneuver-sim__viewport">{renderView()}</div>
      {!compact ? <p className="maneuver-sim__caption">{active.caption}</p> : null}
      {!compact ? (
        <div className="maneuver-sim__controls">
          <ElderButton
            variant="secondary"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? "⏸ Dừng mô phỏng" : "▶ Phát tự động"}
          </ElderButton>
          <span className="maneuver-sim__step">
            Bước { (playing ? playStep : idx) + 1}/{scenes.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}
