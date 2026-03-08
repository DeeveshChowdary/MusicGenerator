"use client";

import { motion } from "framer-motion";

import type { LoopPattern } from "@/features/generator/types";

interface LoopVisualizerProps {
  pattern: LoopPattern;
  isPlaying: boolean;
}

function dotOpacity(steps: Set<number>, step: number): number {
  return steps.has(step) ? 0.92 : 0.14;
}

export function LoopVisualizer({ pattern, isPlaying }: LoopVisualizerProps) {
  const totalSteps = pattern.controls.loopBars * 16;
  const loopSeconds = (60 / pattern.controls.bpm) * pattern.controls.loopBars * 4;

  const kickSteps = new Set(pattern.drums.filter((hit) => hit.instrument === "kick").map((hit) => hit.step));
  const snareSteps = new Set(pattern.drums.filter((hit) => hit.instrument === "snare").map((hit) => hit.step));
  const hatSteps = new Set(pattern.drums.filter((hit) => hit.instrument === "hatClosed").map((hit) => hit.step));
  const melodySteps = new Set(pattern.melody.map((note) => note.step));

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Loop View</h2>
        <span className="text-xs text-zinc-400">
          {pattern.controls.loopBars} bars @ {pattern.controls.bpm} BPM
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={`kick-${idx}`} className="h-2 rounded-sm bg-emerald-200" style={{ opacity: dotOpacity(kickSteps, idx) }} />
          ))}
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={`snare-${idx}`} className="h-2 rounded-sm bg-amber-200" style={{ opacity: dotOpacity(snareSteps, idx) }} />
          ))}
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={`hat-${idx}`} className="h-2 rounded-sm bg-cyan-200" style={{ opacity: dotOpacity(hatSteps, idx) }} />
          ))}
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={`melody-${idx}`} className="h-2 rounded-sm bg-fuchsia-200" style={{ opacity: dotOpacity(melodySteps, idx) }} />
          ))}
        </div>

        <motion.div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white/65"
          initial={false}
          animate={
            isPlaying
              ? {
                  left: ["0%", "100%"],
                }
              : {
                  left: "0%",
                }
          }
          transition={
            isPlaying
              ? {
                  ease: "linear",
                  duration: loopSeconds,
                  repeat: Number.POSITIVE_INFINITY,
                }
              : {
                  duration: 0.2,
                }
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
        <span>Kick</span>
        <span>Snare</span>
        <span>Hat</span>
        <span>Melody</span>
      </div>
    </section>
  );
}
