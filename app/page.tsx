"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cog, Headphones, Music4 } from "lucide-react";
import { useCallback, useEffect } from "react";

import { AssetFinder } from "@/components/asset-finder";
import { ControlPanel } from "@/components/control-panel";
import { ExportPanel } from "@/components/export-panel";
import { LayerLocks } from "@/components/layer-locks";
import { LoopVisualizer } from "@/components/loop-visualizer";
import { MeterBridge } from "@/components/meter-bridge";
import { SessionPanel } from "@/components/session-panel";
import { SettingsModal } from "@/components/settings-modal";
import { TransportControls } from "@/components/transport-controls";
import { fetchIntegrationStatus } from "@/features/assets/apiClient";
import { useAudioEngine } from "@/features/audio/useAudioEngine";
import { buildSessionFilename, buildWavFilename } from "@/features/export/exportNaming";
import { useLoFiStore } from "@/features/session/store";
import { downloadBlob, downloadText } from "@/lib/download";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";

export default function HomePage() {
  const {
    controls,
    locks,
    pattern,
    isPlaying,
    settingsOpen,
    sessions,
    integrationStatus,
    hydrateFromStorage,
    setControl,
    setMood,
    toggleLock,
    regenerate,
    reseedOneLayer,
    surpriseMe,
    evolve,
    setIsPlaying,
    saveSession,
    loadSession,
    deleteSession,
    exportSessionJson,
    importSessionJson,
    setSettingsOpen,
    setAudioReady,
    setIntegrationStatus,
    clearLocalCache,
  } = useLoFiStore();

  const audio = useAudioEngine(pattern);
  const songBars = Math.max(
    pattern.controls.loopBars,
    pattern.arrangement.reduce((sum, section) => sum + section.bars, 0),
  );

  const refreshIntegrationStatus = useCallback(async () => {
    try {
      const status = await fetchIntegrationStatus();
      setIntegrationStatus(status);
    } catch {
      // Keep UI operational even if status endpoint fails.
    }
  }, [setIntegrationStatus]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    refreshIntegrationStatus();
  }, [refreshIntegrationStatus]);

  const play = useCallback(async () => {
    await audio.init();
    setAudioReady(true);
    await audio.play();
    setIsPlaying(true);
  }, [audio, setAudioReady, setIsPlaying]);

  const pause = useCallback(() => {
    audio.pause();
    setIsPlaying(false);
  }, [audio, setIsPlaying]);

  const stop = useCallback(() => {
    audio.stop();
    setIsPlaying(false);
  }, [audio, setIsPlaying]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
      return;
    }
    play().catch(() => {
      // Browser may block if no gesture; play button handles normal path.
    });
  }, [isPlaying, pause, play]);

  useKeyboardShortcuts({
    onTogglePlay: togglePlay,
    onGenerate: regenerate,
    onSurprise: surpriseMe,
    onSettings: () => setSettingsOpen(true),
  });

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.14),transparent_38%),radial-gradient(circle_at_78%_14%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(251,191,36,0.08),transparent_45%)]" />

      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.36, 0.55, 0.36] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.32em] text-zinc-400">LoFi Foundry</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 md:text-4xl">Endless Chill Study Beats</h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                Deterministic seed-based lo-fi generation with transport control, layer locks, ambience design, session recall, and WAV export.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-400"
              >
                <Cog size={16} /> Settings
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <button
              type="button"
              onClick={togglePlay}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-300/20 text-emerald-100 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300/30"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <span className="absolute inset-0 rounded-full border border-emerald-300/70 group-hover:scale-110 group-hover:opacity-0" />
              <Music4 size={28} />
            </button>

            <div>
              <p className="text-sm text-zinc-200">{isPlaying ? "Playing" : "Ready"}</p>
              <p className="text-xs text-zinc-500">
                Mood: {pattern.controls.moodId.replaceAll("-", " ")} • {pattern.controls.key} {pattern.controls.scale} • {pattern.controls.bpm} BPM
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <Headphones size={12} /> Press <kbd className="rounded bg-zinc-800 px-1 py-0.5">Space</kbd> to play/pause
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <TransportControls
              isPlaying={isPlaying}
              onPlay={() => {
                play().catch(() => undefined);
              }}
              onPause={pause}
              onStop={stop}
              onGenerate={regenerate}
              onSurprise={surpriseMe}
              onEvolve={evolve}
            />

            <LayerLocks locks={locks} onToggleLock={toggleLock} onReseedLayer={reseedOneLayer} />

            <LoopVisualizer pattern={pattern} isPlaying={isPlaying} />

            <ExportPanel
              exportBars={controls.exportBars}
              songBars={songBars}
              arrangement={pattern.arrangement}
              isExporting={audio.isExporting}
              onExportLoop={async () => {
                const blob = await audio.exportWav(controls.exportBars);
                if (!blob) return;
                downloadBlob(blob, buildWavFilename(controls));
              }}
              onExportSong={async () => {
                const blob = await audio.exportWav(songBars);
                if (!blob) return;
                downloadBlob(blob, `lofi-foundry-song-${controls.seed}-${songBars}bars.wav`);
              }}
            />

            <AssetFinder moodName={pattern.controls.moodId.replaceAll("-", " ")} />
          </div>

          <div className="space-y-4">
            <ControlPanel controls={controls} onControlChange={setControl} onMoodChange={setMood} />
            <MeterBridge meters={audio.meters} />
            <SessionPanel
              sessions={sessions}
              onSave={() => saveSession()}
              onLoad={loadSession}
              onDelete={deleteSession}
              onExportJson={() => {
                const raw = exportSessionJson();
                navigator.clipboard.writeText(raw).catch(() => undefined);
                return raw;
              }}
              onImportJson={importSessionJson}
              onDownloadProject={() => {
                downloadText(exportSessionJson(), buildSessionFilename(controls.seed));
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          integrationStatus={integrationStatus}
          onRefreshStatus={refreshIntegrationStatus}
          onClearCache={clearLocalCache}
        />
      </AnimatePresence>
    </main>
  );
}
