"use client";

import { useEffect, useRef, useState } from "react";
import { onCorrect } from "../lib/celebration";

const CHEER_LINES = ["Giỏi lắm!", "Đúng rồi!", "Tuyệt vời!", "Xuất sắc!", "Chính xác!"];

export function CheerMascot() {
  const [visible, setVisible] = useState(false);
  const [line, setLine] = useState(CHEER_LINES[0]!);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return onCorrect(() => {
      setLine(CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)]!);
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1600);
    });
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (!visible) return null;

  return (
    <div className="cheer-mascot" aria-hidden="true">
      <div className="cheer-mascot__bubble">{line}</div>
      <svg className="cheer-mascot__figure" viewBox="0 0 120 140" width="100" height="117">
        <ellipse cx="60" cy="128" rx="28" ry="6" fill="#000" opacity="0.12" />
        <rect x="44" y="88" width="32" height="36" rx="8" fill="#0b5cad" />
        <rect x="38" y="96" width="14" height="28" rx="6" fill="#0b5cad" className="cheer-mascot__arm cheer-mascot__arm--left" />
        <rect x="68" y="96" width="14" height="28" rx="6" fill="#0b5cad" className="cheer-mascot__arm cheer-mascot__arm--right" />
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
  );
}
