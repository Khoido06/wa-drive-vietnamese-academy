"use client";

import { useEffect, useRef } from "react";
import { onCelebrate } from "../lib/celebration";

const COLORS = ["#0b5cad", "#007a33", "#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#ef4444"];

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

export function ConfettiOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    return onCelebrate(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles: Particle[] = Array.from({ length: 120 }, () => ({
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
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      aria-hidden="true"
    />
  );
}
