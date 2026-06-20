"use client";

import { useSpeechInput } from "../lib/use-speech-input";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const { start, stop, listening, supported } = useSpeechInput(onTranscript);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`voice-btn voice-btn--input ${listening ? "voice-btn--active" : ""}`}
      onClick={() => (listening ? stop() : start())}
      disabled={disabled}
      aria-label={listening ? "Dừng nghe" : "Nói câu hỏi"}
    >
      {listening ? "🎙️ Đang nghe..." : "🎤 Nói câu hỏi"}
    </button>
  );
}
