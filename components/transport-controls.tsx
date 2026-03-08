"use client";

import { Pause, Play, RotateCcw, Shuffle, Sparkles, Square } from "lucide-react";

interface TransportControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onGenerate: () => void;
  onSurprise: () => void;
  onEvolve: () => void;
}

function CircleButton({
  label,
  onClick,
  icon,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-14 w-14 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
        primary
          ? "border-emerald-300/80 bg-emerald-300/20 text-emerald-100 hover:bg-emerald-300/30"
          : "border-zinc-600/70 bg-zinc-900/70 text-zinc-200 hover:border-zinc-400"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function TransportControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onGenerate,
  onSurprise,
  onEvolve,
}: TransportControlsProps) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Transport</h2>
        <p className="text-xs text-zinc-400">Space: Play/Pause</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CircleButton
          label={isPlaying ? "Pause" : "Play"}
          onClick={isPlaying ? onPause : onPlay}
          icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
          primary
        />
        <CircleButton label="Stop" onClick={onStop} icon={<Square size={20} />} />
        <CircleButton label="Generate New Beat" onClick={onGenerate} icon={<RotateCcw size={20} />} />
        <CircleButton label="Surprise Me" onClick={onSurprise} icon={<Shuffle size={20} />} />
        <CircleButton label="Evolve Groove" onClick={onEvolve} icon={<Sparkles size={20} />} />
      </div>
    </section>
  );
}
