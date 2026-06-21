"use client";

const MUTE_KEY = "wa_sound_muted";

let audioCtx: AudioContext | null = null;
let unlocked = false;

/** Call synchronously inside a user gesture (tap/click) to unlock iOS Safari audio. */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MUTE_KEY) === "1") return;

  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();

  if (unlocked) return;
  try {
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
    unlocked = true;
  } catch {
    // iOS may reject until gesture — retry on next tap
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem(MUTE_KEY) === "1") return null;
  if (!audioCtx || !unlocked) return null;
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function playTone(ctx: AudioContext, freq: number, start: number, dur: number, vol = 0.14) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

/** Duolingo-style ascending chime on correct answer. */
export function playCorrectSound(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  playTone(ctx, 523.25, t, 0.13);
  playTone(ctx, 659.25, t + 0.09, 0.18);
  playTone(ctx, 783.99, t + 0.18, 0.22, 0.1);
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}
