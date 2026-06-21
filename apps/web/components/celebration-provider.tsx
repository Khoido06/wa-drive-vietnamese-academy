"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onCelebrate, onCorrect } from "../lib/celebration";
import { unlockAudio } from "../lib/correct-sound";

const COLORS = ["#0b5cad", "#007a33", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#ef4444"];
const CHEER_LINES = ["Giỏi lắm!", "Đúng rồi!", "Tuyệt vời!", "Xuất sắc!", "Chính xác!"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  spin: number;
  life: number;
}

export function CelebrationProvider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const [cheer, setCheer] = useState<{ visible: boolean; line: string; key: number }>({
    visible: false,
    line: CHEER_LINES[0]!,
    key: 0,
  });

  const burst = useCallback((count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -16 - 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of particles) {
        p.life = Math.max(0, 1 - elapsed / 2800);
        if (p.life <= 0) continue;
        alive++;
        p.vy += 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (alive > 0 && elapsed < 3000) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const showCheer = useCallback(() => {
    setCheer({
      visible: true,
      line: CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)]!,
      key: Date.now(),
    });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setCheer((s) => ({ ...s, visible: false }));
    }, 1600);
  }, []);

  useEffect(() => {
    const onGesture = () => unlockAudio();
    const opts = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", onGesture, opts);
    document.addEventListener("touchstart", onGesture, opts);
    document.addEventListener("click", onGesture, { capture: true });

    const unsubCorrect = onCorrect(() => {
      burst(50);
      showCheer();
    });
    const unsubCelebrate = onCelebrate(() => burst(120));

    return () => {
      document.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("touchstart", onGesture, true);
      document.removeEventListener("click", onGesture, true);
      unsubCorrect();
      unsubCelebrate();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [burst, showCheer]);

  return (
    <>
      <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
      {cheer.visible ? (
        <div key={cheer.key} className="cheer-mascot" aria-hidden="true">
          <div className="cheer-mascot__bubble">{cheer.line}</div>
          <svg className="cheer-mascot__figure" viewBox="0 0 120 140" width="100" height="117">
            <ellipse cx="60" cy="128" rx="28" ry="6" fill="#000" opacity="0.12" />
            <g className="cheer-mascot__arm cheer-mascot__arm--left">
              <rect x="38" y="96" width="14" height="28" rx="6" fill="#0b5cad" />
            </g>
            <g className="cheer-mascot__arm cheer-mascot__arm--right">
              <rect x="68" y="96" width="14" height="28" rx="6" fill="#0b5cad" />
            </g>
            <rect x="44" y="88" width="32" height="36" rx="8" fill="#0b5cad" />
            <circle cx="60" cy="52" r="30" fill="#fcd9b6" />
            <circle cx="60" cy="48" r="32" fill="#1a1a1a" />
            <circle cx="60" cy="52" r="28" fill="#fcd9b6" />
            <circle cx="50" cy="50" r="4" fill="#1a1a1a" />
            <circle cx="70" cy="50" r="4" fill="#1a1a1a" />
            <path d="M 50 62 Q 60 72 70 62" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="44" cy="58" r="5" fill="#fca5a5" opacity="0.5" />
            <circle cx="76" cy="58" r="5" fill="#fca5a5" opacity="0.5" />
            <text x="82" y="38" fontSize="22">🎉</text>
          </svg>
        </div>
      ) : null}
    </>
  );
}
