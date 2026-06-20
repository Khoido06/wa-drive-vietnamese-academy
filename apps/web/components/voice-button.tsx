"use client";

import { useVoice } from "../lib/use-voice";

interface VoiceButtonProps {
  text: string;
  label?: string;
}

export function VoiceButton({ text, label = "🔊 Đọc to" }: VoiceButtonProps) {
  const { speak, stop, speaking } = useVoice();

  return (
    <button
      type="button"
      className="voice-btn"
      onClick={() => (speaking ? stop() : speak(text))}
      aria-label={speaking ? "Dừng đọc" : "Đọc to"}
    >
      {speaking ? "⏹ Dừng" : label}
    </button>
  );
}
