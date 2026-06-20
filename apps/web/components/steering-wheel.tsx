"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onSteer: (value: number) => void;
}

const MAX_ROT = 540;

export function SteeringWheel({ onSteer }: Props) {
  const [rotation, setRotation] = useState(0);
  const dragging = useRef(false);
  const startRot = useRef(0);
  const startY = useRef(0);

  const updateSteer = useCallback(
    (deg: number) => {
      const clamped = Math.max(-MAX_ROT, Math.min(MAX_ROT, deg));
      setRotation(clamped);
      onSteer(clamped / MAX_ROT);
    },
    [onSteer],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startRot.current = rotation;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - startY.current;
    updateSteer(startRot.current + dy * 1.8);
  };

  const onPointerUp = () => {
    dragging.current = false;
    updateSteer(0);
  };

  return (
    <div className="steering-wheel-wrap">
      <p className="steering-wheel-label">Vô-lăng — kéo lên/xuống để lái</p>
      <div
        className="steering-wheel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-label="Vô-lăng"
        aria-valuenow={Math.round(rotation)}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="steering-wheel__ring" />
        <div className="steering-wheel__spoke steering-wheel__spoke--top" />
        <div className="steering-wheel__spoke steering-wheel__spoke--bottom" />
        <div className="steering-wheel__hub">WA</div>
      </div>
    </div>
  );
}
