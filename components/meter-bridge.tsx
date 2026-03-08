"use client";

import type { MeterSnapshot } from "@/features/audio/audioEngine";

interface MeterBridgeProps {
  meters: MeterSnapshot;
}

const ITEMS: Array<{ key: keyof MeterSnapshot; label: string; color: string }> = [
  { key: "drums", label: "Drums", color: "bg-emerald-400" },
  { key: "chords", label: "Chords", color: "bg-cyan-400" },
  { key: "bass", label: "Bass", color: "bg-amber-400" },
  { key: "melody", label: "Melody", color: "bg-fuchsia-400" },
  { key: "ambience", label: "Ambience", color: "bg-zinc-300" },
  { key: "master", label: "Master", color: "bg-rose-400" },
];

export function MeterBridge({ meters }: MeterBridgeProps) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Layer Meters</h2>
      <div className="space-y-2">
        {ITEMS.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>{item.label}</span>
              <span className="font-mono text-zinc-400">{Math.round(meters[item.key] * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900">
              <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${meters[item.key] * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
