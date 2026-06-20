"use client";

import { useCallback, useEffect, useRef } from "react";

/** Procedural engine sound via Web Audio API. */
export function useEngineSound(throttle: number, speed: number, enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    osc.type = "sawtooth";
    osc.frequency.value = 55;
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;

    return () => {
      osc.stop();
      void ctx.close();
    };
  }, [enabled]);

  useEffect(() => {
    const osc = oscRef.current;
    const gain = gainRef.current;
    if (!osc || !gain || !enabled) return;
    const rpm = 60 + Math.abs(speed) * 18 + throttle * 40;
    osc.frequency.setTargetAtTime(rpm, osc.context.currentTime, 0.08);
    gain.gain.setTargetAtTime(throttle > 0 || Math.abs(speed) > 0.2 ? 0.04 + throttle * 0.03 : 0.008, gain.context.currentTime, 0.1);
  }, [throttle, speed, enabled]);
}

export function useBlinkerSound(active: boolean) {
  const tickRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const ctx = new AudioContext();
    const playTick = () => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = 880;
      g.gain.value = 0.06;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    };
    playTick();
    tickRef.current = window.setInterval(playTick, 500);
    return () => {
      clearInterval(tickRef.current);
      void ctx.close();
    };
  }, [active]);
}

export function vibrateShort() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(30);
  }
}
