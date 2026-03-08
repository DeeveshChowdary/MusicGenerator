"use client";

import { Download, Loader2 } from "lucide-react";

import type { ArrangementSection } from "@/features/generator/types";

interface ExportPanelProps {
  exportBars: number;
  arrangement: ArrangementSection[];
  isExporting: boolean;
  onExportLoop: () => void;
}

export function ExportPanel({ exportBars, arrangement, isExporting, onExportLoop }: ExportPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Export & Arrangement</h2>
        <button
          type="button"
          disabled={isExporting}
          onClick={onExportLoop}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-300/60 bg-emerald-300/15 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-70"
        >
          {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export {exportBars} Bars WAV
        </button>
      </div>

      <div className="grid gap-2 text-xs text-zinc-300 sm:grid-cols-5">
        {arrangement.map((section) => (
          <div key={section.name} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
            <p className="font-semibold capitalize text-zinc-100">{section.name}</p>
            <p>{section.bars} bars</p>
            <p>Hats {Math.round(section.hatsDensity * 100)}%</p>
            <p>Melody {Math.round(section.melodyPresence * 100)}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
