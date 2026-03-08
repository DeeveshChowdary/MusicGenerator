"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { LoopPattern } from "@/features/generator/types";

import { LoFiAudioEngine, type MeterSnapshot } from "./audioEngine";

const EMPTY_METERS: MeterSnapshot = {
  drums: 0,
  chords: 0,
  bass: 0,
  melody: 0,
  ambience: 0,
  master: 0,
};

export function useAudioEngine(pattern: LoopPattern | null) {
  const engineRef = useRef<LoFiAudioEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [meters, setMeters] = useState<MeterSnapshot>(EMPTY_METERS);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const engine = new LoFiAudioEngine();
    engineRef.current = engine;
    setEngineReady(true);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!engineReady || !pattern || !engineRef.current) return;
    engineRef.current.setPattern(pattern);
  }, [engineReady, pattern]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (engineRef.current) {
        setMeters(engineRef.current.getMeters());
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return useMemo(
    () => ({
      meters,
      isExporting,
      init: async () => {
        await engineRef.current?.init();
      },
      play: async () => {
        await engineRef.current?.play();
      },
      pause: () => {
        engineRef.current?.pause();
      },
      stop: () => {
        engineRef.current?.stop();
      },
      exportWav: async (bars: number) => {
        if (!engineRef.current) return null;
        setIsExporting(true);
        try {
          return await engineRef.current.exportLoopToWav(bars);
        } finally {
          setIsExporting(false);
        }
      },
    }),
    [isExporting, meters],
  );
}
