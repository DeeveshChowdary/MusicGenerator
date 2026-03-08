"use client";

import type { GeneratorControls } from "@/features/generator/types";
import { MOOD_PRESETS } from "@/features/presets/moods";

interface ControlPanelProps {
  controls: GeneratorControls;
  onControlChange: <K extends keyof GeneratorControls>(key: K, value: GeneratorControls[K]) => void;
  onMoodChange: (moodId: string) => void;
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span className="font-mono text-zinc-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800"
      />
    </label>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ControlPanel({ controls, onControlChange, onMoodChange }: ControlPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Vibe Controls</h2>
        <span className="text-xs text-zinc-400">Deterministic seed: {controls.seed}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SelectRow
          label="Mood"
          value={controls.moodId}
          options={MOOD_PRESETS.map((mood) => ({ value: mood.id, label: mood.name }))}
          onChange={onMoodChange}
        />

        <label className="space-y-1">
          <span className="text-xs text-zinc-300">BPM</span>
          <input
            type="number"
            min={56}
            max={108}
            value={controls.bpm}
            onChange={(event) => onControlChange("bpm", Number(event.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
          />
        </label>

        <SelectRow
          label="Key"
          value={controls.key}
          options={[
            "C",
            "C#",
            "D",
            "D#",
            "E",
            "F",
            "F#",
            "G",
            "G#",
            "A",
            "A#",
            "B",
          ].map((key) => ({ value: key, label: key }))}
          onChange={(value) => onControlChange("key", value)}
        />

        <SelectRow
          label="Scale / Mode"
          value={controls.scale}
          options={[
            { value: "minor", label: "Minor" },
            { value: "major", label: "Major" },
            { value: "dorian", label: "Dorian" },
            { value: "mixolydian", label: "Mixolydian" },
            { value: "lydian", label: "Lydian" },
          ]}
          onChange={(value) => onControlChange("scale", value as GeneratorControls["scale"])}
        />

        <SelectRow
          label="Drum Style"
          value={controls.drumStyle}
          options={[
            { value: "boomBap", label: "Boom Bap" },
            { value: "chillHop", label: "Chill Hop" },
            { value: "jazzHop", label: "Jazz Hop" },
            { value: "minimal", label: "Minimal" },
            { value: "sleepy", label: "Sleepy" },
            { value: "tapeCrunch", label: "Tape Crunch" },
          ]}
          onChange={(value) => onControlChange("drumStyle", value as GeneratorControls["drumStyle"])}
        />

        <SelectRow
          label="Drum Source"
          value={controls.drumSource}
          options={[
            { value: "sample", label: "Sample Pack" },
            { value: "synth", label: "Synth Drums" },
          ]}
          onChange={(value) => onControlChange("drumSource", value as GeneratorControls["drumSource"])}
        />

        <SelectRow
          label="Melody Density"
          value={controls.melodyDensity}
          options={[
            { value: "none", label: "None" },
            { value: "sparse", label: "Sparse" },
            { value: "balanced", label: "Balanced" },
            { value: "expressive", label: "Expressive" },
          ]}
          onChange={(value) => onControlChange("melodyDensity", value as GeneratorControls["melodyDensity"])}
        />

        <SelectRow
          label="Ambience"
          value={controls.ambienceType}
          options={[
            { value: "rain", label: "Rain" },
            { value: "vinyl", label: "Vinyl" },
            { value: "cafe", label: "Cafe" },
            { value: "nightCity", label: "Night City" },
            { value: "room", label: "Room" },
            { value: "field", label: "Field" },
            { value: "hiss", label: "Tape Hiss" },
          ]}
          onChange={(value) => onControlChange("ambienceType", value as GeneratorControls["ambienceType"])}
        />

        <SelectRow
          label="Loop Length"
          value={String(controls.loopBars)}
          options={[
            { value: "2", label: "2 bars" },
            { value: "4", label: "4 bars" },
            { value: "8", label: "8 bars" },
          ]}
          onChange={(value) => onControlChange("loopBars", Number(value) as 2 | 4 | 8)}
        />

        <label className="space-y-1">
          <span className="text-xs text-zinc-300">Random Seed</span>
          <input
            type="number"
            value={controls.seed}
            onChange={(event) => onControlChange("seed", Number(event.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-zinc-300">Export Bars</span>
          <input
            type="number"
            min={2}
            max={64}
            value={controls.exportBars}
            onChange={(event) => onControlChange("exportBars", Number(event.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-zinc-300">Arrangement Minutes</span>
          <input
            type="number"
            min={1}
            max={3}
            value={controls.arrangementMinutes}
            onChange={(event) => onControlChange("arrangementMinutes", Number(event.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
          />
        </label>

        <SliderRow label="Swing" min={0} max={0.34} step={0.01} value={controls.swing} onChange={(v) => onControlChange("swing", v)} />
        <SliderRow
          label="Vinyl Amount"
          min={0}
          max={1}
          step={0.01}
          value={controls.vinylAmount}
          onChange={(v) => onControlChange("vinylAmount", v)}
        />
        <SliderRow
          label="Reverb"
          min={0}
          max={1}
          step={0.01}
          value={controls.reverbAmount}
          onChange={(v) => onControlChange("reverbAmount", v)}
        />
        <SliderRow
          label="Wow / Flutter"
          min={0}
          max={1}
          step={0.01}
          value={controls.wowFlutter}
          onChange={(v) => onControlChange("wowFlutter", v)}
        />
        <SliderRow
          label="Low-pass Warmth"
          min={0}
          max={1}
          step={0.01}
          value={controls.lowPassWarmth}
          onChange={(v) => onControlChange("lowPassWarmth", v)}
        />
        <SliderRow
          label="Complexity"
          min={0}
          max={1}
          step={0.01}
          value={controls.complexity}
          onChange={(v) => onControlChange("complexity", v)}
        />
        <SliderRow
          label="Master Volume"
          min={0}
          max={1}
          step={0.01}
          value={controls.masterVolume}
          onChange={(v) => onControlChange("masterVolume", v)}
        />
      </div>
    </section>
  );
}
