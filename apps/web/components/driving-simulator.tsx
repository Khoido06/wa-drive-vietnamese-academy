"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ElderButton } from "@repo/ui/elder-button";
import { FeedbackBanner } from "@repo/ui/feedback-banner";
import { createCar, updateCar, type CarState } from "../lib/drive-sim/engine";
import {
  evaluateScenario,
  getScenario,
  type SimResult,
} from "../lib/drive-sim/scenarios";
import { useEngineSound, useBlinkerSound, vibrateShort } from "../lib/drive-sim/engine-sound";
import { spawnTraffic, updateTraffic, type AiVehicle } from "../lib/drive-sim/traffic";
import { applyCollisionResponse, detectCollision } from "../lib/drive-sim/collision";
import { SteeringWheel } from "./steering-wheel";
import { MirrorHud } from "./mirror-hud";
import type { CameraMode, WeatherMode } from "./drive-sim-3d/drive-canvas-3d";
import { triggerCelebrate, triggerCorrect } from "../lib/celebration";
import { unlockAudio } from "../lib/correct-sound";

const DriveCanvas3D = dynamic(
  () => import("./drive-sim-3d/drive-canvas-3d").then((m) => m.DriveCanvas3D),
  {
    ssr: false,
    loading: () => (
      <div className="drive-sim__viewport drive-sim__loading">
        <p>Đang tải mô phỏng 3D...</p>
      </div>
    ),
  },
);

interface Props {
  scenarioId: string;
  onExit?: () => void;
}

interface Controls {
  throttle: number;
  brake: number;
  steer: number;
  reverse: boolean;
}

const WORLD_W = 800;
const WORLD_H = 600;

export function DrivingSimulator({ scenarioId, onExit }: Props) {
  const scenario = getScenario(scenarioId);
  const isHill = scenario?.id === "hill_parking";
  const carRef = useRef<CarState>(scenario?.init() ?? createCar(200, 300));
  const controlsRef = useRef<Controls>({ throttle: 0, brake: 0, steer: 0, reverse: false });
  const rafRef = useRef<number>(0);

  const [signalLeft, setSignalLeft] = useState(false);
  const [signalRight, setSignalRight] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [headCheckRecent, setHeadCheckRecent] = useState(false);
  const [stoppedAtLine, setStoppedAtLine] = useState(false);
  const [wheelChoice, setWheelChoice] = useState<"toward-curb" | "away-curb" | "toward-edge" | undefined>();
  const [handbrake, setHandbrake] = useState(false);
  const [inPark, setInPark] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [steerHeld, setSteerHeld] = useState<"left" | "right" | null>(null);
  const [steerWheel, setSteerWheel] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("cockpit");
  const [throttleHeld, setThrottleHeld] = useState(0);
  const rearMirrorRef = useRef<HTMLCanvasElement>(null);
  const leftMirrorRef = useRef<HTMLCanvasElement>(null);
  const rightMirrorRef = useRef<HTMLCanvasElement>(null);
  const [hillMode, setHillMode] = useState<"down-curb" | "up-curb" | "no-curb">("down-curb");
  const [speedDisplay, setSpeedDisplay] = useState(0);
  const [weather, setWeather] = useState<WeatherMode>("day");
  const [collisionCount, setCollisionCount] = useState(0);
  const [collisionMsg, setCollisionMsg] = useState<string | null>(null);
  const trafficRef = useRef<AiVehicle[]>([]);
  const [trafficIds, setTrafficIds] = useState<string[]>([]);
  const lastHitAtRef = useRef(0);
  const collisionMsgTimerRef = useRef<number>(0);

  const steerValue =
    Math.abs(steerWheel) > 0.04
      ? steerWheel
      : steerHeld === "left"
        ? -1
        : steerHeld === "right"
          ? 1
          : 0;

  useEngineSound(throttleHeld, speedDisplay / 8, !isHill);
  useBlinkerSound(signalLeft || signalRight);

  const reset = useCallback(() => {
    if (!scenario) return;
    carRef.current = scenario.init();
    const traffic = spawnTraffic(scenario);
    trafficRef.current = traffic;
    setTrafficIds(traffic.map((v) => v.id));
    setSignalLeft(false);
    setSignalRight(false);
    setReverse(false);
    setHeadCheckRecent(false);
    setStoppedAtLine(false);
    setWheelChoice(undefined);
    setHandbrake(false);
    setInPark(false);
    setResult(null);
    setSpeedDisplay(0);
    setSteerWheel(0);
    setCollisionCount(0);
    setCollisionMsg(null);
    lastHitAtRef.current = 0;
    controlsRef.current = { throttle: 0, brake: 0, steer: 0, reverse: false };
  }, [scenario]);

  useEffect(() => {
    reset();
  }, [scenarioId, reset]);

  const doHeadCheck = useCallback(() => {
    setHeadCheckRecent(true);
    vibrateShort();
    window.setTimeout(() => setHeadCheckRecent(false), 5000);
  }, []);

  useEffect(() => {
    if (!scenario || scenario.id === "hill_parking") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setSteerHeld("left");
      if (e.key === "ArrowRight") setSteerHeld("right");
      if (e.key === " " || e.key === "ArrowDown") controlsRef.current.brake = 1;
      if (e.key === "ArrowUp" || e.key === "w") controlsRef.current.throttle = 1;
      if (e.key === "r") setReverse((v) => !v);
      if (e.key === "q") {
        setSignalLeft(true);
        setSignalRight(false);
      }
      if (e.key === "e") {
        setSignalRight(true);
        setSignalLeft(false);
      }
      if (e.key === "h") doHeadCheck();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") setSteerHeld(null);
      if (e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "w") {
        controlsRef.current.brake = 0;
        controlsRef.current.throttle = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = () => {
      const car = carRef.current;
      const ctrl = controlsRef.current;
      ctrl.reverse = reverse;
      ctrl.steer = steerValue;
      setThrottleHeld(ctrl.throttle);

      updateCar(car, ctrl);
      car.x = Math.max(40, Math.min(WORLD_W - 40, car.x));
      car.y = Math.max(40, Math.min(WORLD_H - 40, car.y));
      setSpeedDisplay(Math.abs(car.speed * 8));

      updateTraffic(trafficRef.current);
      const hit = detectCollision(car, trafficRef.current, scenario.curbX, lastHitAtRef.current);
      if (hit) {
        lastHitAtRef.current = Date.now();
        applyCollisionResponse(car, hit.kind);
        setCollisionCount((c) => c + 1);
        setCollisionMsg(hit.message);
        vibrateShort();
        window.clearTimeout(collisionMsgTimerRef.current);
        collisionMsgTimerRef.current = window.setTimeout(() => setCollisionMsg(null), 2500);
      }

      if (scenario.stopLineX) {
        const nearLine =
          car.x >= scenario.stopLineX - 25 &&
          car.x <= scenario.stopLineX + 15 &&
          Math.abs(car.speed) < 0.12;
        if (nearLine) setStoppedAtLine(true);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [scenario, reverse, steerValue, doHeadCheck]);

  const checkScore = () => {
    if (!scenario) return;
    unlockAudio();
    const hillScenario =
      scenario.id === "hill_parking" ? { ...scenario, hillMode } : scenario;
    const res = evaluateScenario(hillScenario, carRef.current, {
      signalLeft,
      signalRight,
      signalBeforeAction: signalLeft || signalRight,
      headCheckRecent,
      stoppedAtLine,
      wheelChoice,
      handbrake,
      inPark,
      collisions: collisionCount,
    });
    setResult(res);
    if (res.passed) {
      triggerCorrect();
      triggerCelebrate();
    }
  };

  if (!scenario) {
    return <p>Không tìm thấy bài luyện tập.</p>;
  }

  return (
    <div className="drive-sim">
      <div className="drive-sim__header">
        <h3>{scenario.titleVi}</h3>
        <p>{scenario.briefVi}</p>
        {!isHill ? (
          <p className="drive-sim__tagline">
            Mô phỏng 3D · Xe AI · Va chạm · {weather === "rain" ? "Mưa" : weather === "night" ? "Đêm" : "Ban ngày"} ·{" "}
            {cameraMode === "cockpit" ? "Ngồi trong xe" : "Nhìn từ sau"}
          </p>
        ) : null}
        {!isHill ? (
          <div className="drive-sim__cam-toggle">
            <button
              type="button"
              className={`drive-sim__cam-btn${weather === "day" ? " drive-sim__cam-btn--on" : ""}`}
              onClick={() => setWeather("day")}
            >
              ☀️ Ngày
            </button>
            <button
              type="button"
              className={`drive-sim__cam-btn${weather === "night" ? " drive-sim__cam-btn--on" : ""}`}
              onClick={() => setWeather("night")}
            >
              🌙 Đêm
            </button>
            <button
              type="button"
              className={`drive-sim__cam-btn${weather === "rain" ? " drive-sim__cam-btn--on" : ""}`}
              onClick={() => setWeather("rain")}
            >
              🌧️ Mưa
            </button>
          </div>
        ) : null}
        {!isHill ? (
          <div className="drive-sim__cam-toggle">
            <button
              type="button"
              className={`drive-sim__cam-btn${cameraMode === "cockpit" ? " drive-sim__cam-btn--on" : ""}`}
              onClick={() => setCameraMode("cockpit")}
            >
              🪑 Trong xe
            </button>
            <button
              type="button"
              className={`drive-sim__cam-btn${cameraMode === "chase" ? " drive-sim__cam-btn--on" : ""}`}
              onClick={() => setCameraMode("chase")}
            >
              🎥 Góc ngoài
            </button>
          </div>
        ) : null}
      </div>

      {isHill ? (
        <div className="drive-sim__hill">
          <div className="drive-sim__hill-modes">
            {(
              [
                ["down-curb", "Dốc xuống + lề"],
                ["up-curb", "Dốc lên + lề"],
                ["no-curb", "Không lề"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`drive-sim__hill-mode${hillMode === mode ? " drive-sim__hill-mode--on" : ""}`}
                onClick={() => {
                  setHillMode(mode);
                  setWheelChoice(undefined);
                  setResult(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="drive-sim__hill-visual">
            <p className="drive-sim__hill-label">
              {hillMode === "down-curb"
                ? "⛰️ Dốc xuống + có vỉa hè"
                : hillMode === "up-curb"
                  ? "⛰️ Dốc lên + có vỉa hè"
                  : "⛰️ Dốc + không vỉa hè"}
            </p>
            <div className="drive-sim__hill-car">🚗</div>
          </div>
          <p className="drive-sim__hill-prompt">Quay bánh xe hướng nào?</p>
          <div className="drive-sim__hill-options">
            <button
              type="button"
              className={`drive-sim__hill-btn${wheelChoice === "toward-curb" ? " drive-sim__hill-btn--on" : ""}`}
              onClick={() => setWheelChoice("toward-curb")}
            >
              ↙ Về phía lề
            </button>
            <button
              type="button"
              className={`drive-sim__hill-btn${wheelChoice === "away-curb" ? " drive-sim__hill-btn--on" : ""}`}
              onClick={() => setWheelChoice("away-curb")}
            >
              ↗ Ra xa lề
            </button>
            <button
              type="button"
              className={`drive-sim__hill-btn${wheelChoice === "toward-edge" ? " drive-sim__hill-btn--on" : ""}`}
              onClick={() => setWheelChoice("toward-edge")}
            >
              → Về rìa đường
            </button>
          </div>
          <label className="drive-sim__toggle">
            <input type="checkbox" checked={handbrake} onChange={(e) => setHandbrake(e.target.checked)} />
            🅿️ Kéo phanh tay
          </label>
          <label className="drive-sim__toggle">
            <input type="checkbox" checked={inPark} onChange={(e) => setInPark(e.target.checked)} />
            Số P (Park)
          </label>
        </div>
      ) : (
        <>
          <MirrorHud
            rearRef={rearMirrorRef}
            leftRef={leftMirrorRef}
            rightRef={rightMirrorRef}
            headCheckActive={headCheckRecent}
          />
          <DriveCanvas3D
            carRef={carRef}
            scenario={scenario}
            signalLeft={signalLeft}
            signalRight={signalRight}
            steer={steerValue}
            cameraMode={cameraMode}
            weather={weather}
            trafficRef={trafficRef}
            trafficIds={trafficIds}
            mirrors={{
              rear: rearMirrorRef,
              left: leftMirrorRef,
              right: rightMirrorRef,
            }}
          />
          {collisionMsg ? (
            <div className="drive-sim__collision-warn" role="alert">
              {collisionMsg}
            </div>
          ) : null}
          <div className="drive-sim__hud">
            <span>{Math.round(speedDisplay)} mph</span>
            {collisionCount > 0 ? <span className="drive-sim__hud-hit">💥 {collisionCount}</span> : null}
            {reverse ? <span className="drive-sim__hud-rev">LÙI</span> : null}
            {signalLeft ? <span className="drive-sim__hud-blink">◀</span> : null}
            {signalRight ? <span className="drive-sim__hud-blink">▶</span> : null}
          </div>
        </>
      )}

      <ul className="drive-sim__tips">
        {scenario.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      {!isHill && (
        <div className="drive-sim__controls">
          <div className="drive-sim__row">
            <button
              type="button"
              className={`drive-sim__pedal drive-sim__pedal--signal${signalLeft ? " drive-sim__pedal--active" : ""}`}
              onClick={() => {
                setSignalLeft((v) => !v);
                setSignalRight(false);
              }}
            >
              ◀ Trái
            </button>
            <button
              type="button"
              className={`drive-sim__pedal drive-sim__pedal--signal${signalRight ? " drive-sim__pedal--active" : ""}`}
              onClick={() => {
                setSignalRight((v) => !v);
                setSignalLeft(false);
              }}
            >
              Phải ▶
            </button>
            <button type="button" className="drive-sim__pedal drive-sim__pedal--look" onClick={doHeadCheck}>
              👀 Qua vai
            </button>
          </div>

          <div className="drive-sim__row drive-sim__row--steer">
            <SteeringWheel onSteer={setSteerWheel} />
          </div>

          <div className="drive-sim__row drive-sim__row--keys">
            <button type="button" className="drive-sim__steer" onTouchStart={() => setSteerHeld("left")} onTouchEnd={() => setSteerHeld(null)} onMouseDown={() => setSteerHeld("left")} onMouseUp={() => setSteerHeld(null)} onMouseLeave={() => setSteerHeld(null)}>◀</button>
            <span className="drive-sim__keys-hint">hoặc phím ← →</span>
            <button type="button" className="drive-sim__steer" onTouchStart={() => setSteerHeld("right")} onTouchEnd={() => setSteerHeld(null)} onMouseDown={() => setSteerHeld("right")} onMouseUp={() => setSteerHeld(null)} onMouseLeave={() => setSteerHeld(null)}>▶</button>
          </div>

          <div className="drive-sim__row">
            <button
              type="button"
              className="drive-sim__pedal drive-sim__pedal--brake"
              onTouchStart={() => {
                controlsRef.current.brake = 1;
                vibrateShort();
              }}
              onTouchEnd={() => {
                controlsRef.current.brake = 0;
              }}
              onMouseDown={() => {
                controlsRef.current.brake = 1;
              }}
              onMouseUp={() => {
                controlsRef.current.brake = 0;
              }}
              onMouseLeave={() => {
                controlsRef.current.brake = 0;
              }}
            >
              🛑 Phanh
            </button>
            <button
              type="button"
              className={`drive-sim__pedal drive-sim__pedal--rev${reverse ? " drive-sim__pedal--active" : ""}`}
              onClick={() => setReverse((r) => !r)}
            >
              {reverse ? "⏪ Lùi" : "▶️ Tiến"}
            </button>
            <button
              type="button"
              className="drive-sim__pedal drive-sim__pedal--gas"
              onTouchStart={() => {
                controlsRef.current.throttle = 1;
              }}
              onTouchEnd={() => {
                controlsRef.current.throttle = 0;
              }}
              onMouseDown={() => {
                controlsRef.current.throttle = 1;
              }}
              onMouseUp={() => {
                controlsRef.current.throttle = 0;
              }}
              onMouseLeave={() => {
                controlsRef.current.throttle = 0;
              }}
            >
              ⚡ Ga
            </button>
          </div>
        </div>
      )}

      <div className="drive-sim__actions">
        <ElderButton onClick={checkScore}>Kiểm tra điểm</ElderButton>
        <ElderButton variant="secondary" onClick={reset}>
          Làm lại
        </ElderButton>
        {onExit ? (
          <ElderButton variant="secondary" onClick={onExit}>
            ← Quay lại
          </ElderButton>
        ) : null}
      </div>

      {result ? (
        <FeedbackBanner
          type={result.passed ? "success" : "error"}
          title={result.passed ? `Đạt ${result.score}/100 điểm!` : "Chưa đạt — thử lại"}
          subtitle={result.message}
          celebrate={result.passed}
        />
      ) : null}
    </div>
  );
}
