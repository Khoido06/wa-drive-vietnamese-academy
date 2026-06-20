"use client";

import type { RefObject } from "react";

interface Props {
  rearRef: RefObject<HTMLCanvasElement | null>;
  leftRef: RefObject<HTMLCanvasElement | null>;
  rightRef: RefObject<HTMLCanvasElement | null>;
  headCheckActive: boolean;
}

export function MirrorHud({ rearRef, leftRef, rightRef, headCheckActive }: Props) {
  return (
    <div className="mirror-hud" aria-label="Gương chiếu hậu">
      <div className="mirror-hud__bar">
        <div className="mirror-hud__mirror mirror-hud__mirror--side">
          <span className="mirror-hud__label">Trái</span>
          <canvas ref={leftRef} width={192} height={120} className="mirror-hud__canvas" />
        </div>
        <div className="mirror-hud__mirror mirror-hud__mirror--rear">
          <span className="mirror-hud__label">Trong xe</span>
          <canvas ref={rearRef} width={240} height={120} className="mirror-hud__canvas" />
        </div>
        <div className="mirror-hud__mirror mirror-hud__mirror--side">
          <span className="mirror-hud__label">Phải</span>
          <canvas ref={rightRef} width={192} height={120} className="mirror-hud__canvas" />
        </div>
      </div>
      {headCheckActive ? (
        <p className="mirror-hud__headcheck">👀 Đã kiểm tra điểm mù — an toàn để đổi làn</p>
      ) : (
        <p className="mirror-hud__hint">Kiểm tra 3 gương trước khi lùi / đổi làn · Nhấn «Qua vai» cho điểm mù</p>
      )}
    </div>
  );
}
