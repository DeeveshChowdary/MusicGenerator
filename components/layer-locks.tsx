"use client";

import { Lock, LockOpen, RefreshCw } from "lucide-react";

import type { LayerLocks, LayerName } from "@/features/generator/types";

const LAYER_LABELS: { key: LayerName; label: string }[] = [
  { key: "drums", label: "Drums" },
  { key: "harmony", label: "Harmony" },
  { key: "bass", label: "Bass" },
  { key: "melody", label: "Melody" },
  { key: "ambience", label: "Ambience" },
];

interface LayerLocksProps {
  locks: LayerLocks;
  onToggleLock: (layer: LayerName) => void;
  onReseedLayer: (layer: LayerName) => void;
}

export function LayerLocks({ locks, onToggleLock, onReseedLayer }: LayerLocksProps) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Layer Locks</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LAYER_LABELS.map((layer) => {
          const locked = locks[layer.key];
          return (
            <div key={layer.key} className="flex items-center justify-between rounded-xl border border-zinc-700/70 px-3 py-2">
              <span className="text-sm text-zinc-200">{layer.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReseedLayer(layer.key)}
                  className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-400"
                  title={`Reseed ${layer.label}`}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLock(layer.key)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    locked
                      ? "border-emerald-300/70 bg-emerald-300/15 text-emerald-200"
                      : "border-zinc-600 text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  {locked ? <Lock size={13} /> : <LockOpen size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
