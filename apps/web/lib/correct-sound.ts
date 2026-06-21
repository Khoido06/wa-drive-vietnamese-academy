"use client";

const MUTE_KEY = "wa_sound_muted";
const CTX_KEY = "__waAudioCtx";

type WaWindow = Window & { [CTX_KEY]?: AudioContext };

function getCtxRef(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return (window as WaWindow)[CTX_KEY] ?? null;
}

function setCtxRef(ctx: AudioContext | undefined): void {
  if (typeof window === "undefined") return;
  (window as WaWindow)[CTX_KEY] = ctx;
}

async function getRunningCtx(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem(MUTE_KEY) === "1") return null;

  let ctx = getCtxRef();
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioContext();
    setCtxRef(ctx);
  }

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }

  return ctx.state === "running" ? ctx : null;
}

function playSilentWarmup(ctx: AudioContext): void {
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // ignore — resume() alone may be enough
  }
}

/** Call synchronously inside a user gesture (tap/click) to unlock iOS Safari audio. */
export function unlockAudio(): void {
  void (async () => {
    const ctx = await getRunningCtx();
    if (ctx) playSilentWarmup(ctx);
  })();
}

function playTone(ctx: AudioContext, freq: number, start: number, dur: number, vol = 0.2) {
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

function scheduleChime(ctx: AudioContext): void {
  const t = ctx.currentTime;
  playTone(ctx, 523.25, t, 0.13);
  playTone(ctx, 659.25, t + 0.09, 0.18);
  playTone(ctx, 783.99, t + 0.18, 0.22, 0.14);
}

/** Duolingo-style ascending chime on correct answer. */
export function playCorrectSound(): void {
  void (async () => {
    let ctx = await getRunningCtx();
    if (!ctx) {
      await new Promise((r) => setTimeout(r, 80));
      ctx = await getRunningCtx();
    }
    if (!ctx) return;
    scheduleChime(ctx);
  })();
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}
