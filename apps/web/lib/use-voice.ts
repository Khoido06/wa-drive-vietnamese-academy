"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preprocessForVietnameseTts } from "./tts-preprocess";

let cachedViVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function pickViVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const vi = voices.filter((v) => v.lang.startsWith("vi"));
  if (!vi.length) return undefined;

  const rank = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    if (/google.*viet|viet.*google/.test(name)) return 0;
    if (/linh|ban|female|nữ/.test(name)) return 1;
    if (v.lang === "vi-VN") return 2;
    if (v.lang.startsWith("vi")) return 3;
    return 4;
  };

  return [...vi].sort((a, b) => rank(a) - rank(b))[0];
}

function loadVoices(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    cachedViVoice = pickViVoice(voices) ?? null;
    voicesReady = true;
  }
  return cachedViVoice;
}

/** Preload Vietnamese voice on app start (Chrome loads voices async). */
export function preloadTtsVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

/** Web Speech API — Vietnamese TTS with preprocessing for DMV terms */
export function useVoice() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(!!window.speechSynthesis);
    preloadTtsVoices();
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const processed = preprocessForVietnameseTts(text);
    if (!processed) return;

    const utterance = new SpeechSynthesisUtterance(processed);
    utterance.lang = "vi-VN";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = loadVoices() ?? cachedViVoice;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;

    // iOS Safari: resume if paused
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);

    if (!voicesReady) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = loadVoices();
        if (v && utteranceRef.current) utteranceRef.current.voice = v;
      };
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
