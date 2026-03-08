"use client";

import { create } from "zustand";

import { createSurpriseControls, generateLoopPattern, reseedLayer } from "@/features/generator";
import type { GeneratorControls, LayerLocks, LayerName, LoopPattern } from "@/features/generator/types";
import { DEFAULT_CONTROLS, MOOD_PRESETS, controlsFromMood } from "@/features/presets/moods";

import {
  type SavedSession,
  clearCache,
  persistLastSession,
  readLastSession,
  readSessions,
  writeSessions,
} from "./persistence";

interface IntegrationStatus {
  freesoundConfigured: boolean;
  pixabayConfigured: boolean;
  freesoundReachable: boolean;
  pixabayReachable: boolean;
}

interface LoFiState {
  controls: GeneratorControls;
  locks: LayerLocks;
  pattern: LoopPattern;
  hasHydratedFromStorage: boolean;
  isPlaying: boolean;
  audioReady: boolean;
  settingsOpen: boolean;
  sessions: SavedSession[];
  integrationStatus: IntegrationStatus;
  hydrateFromStorage: () => void;
  setAudioReady: (ready: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setControl: <K extends keyof GeneratorControls>(key: K, value: GeneratorControls[K]) => void;
  setMood: (moodId: string) => void;
  toggleLock: (layer: LayerName) => void;
  regenerate: () => void;
  evolve: () => void;
  reseedOneLayer: (layer: LayerName) => void;
  surpriseMe: () => void;
  saveSession: (name?: string) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  importSessionJson: (raw: string) => { ok: boolean; error?: string };
  exportSessionJson: () => string;
  setSettingsOpen: (open: boolean) => void;
  setIntegrationStatus: (status: Partial<IntegrationStatus>) => void;
  clearLocalCache: () => void;
}

const DEFAULT_LOCKS: LayerLocks = {
  drums: false,
  harmony: false,
  bass: false,
  melody: false,
  ambience: false,
};

const initialPattern = generateLoopPattern(DEFAULT_CONTROLS, null, DEFAULT_LOCKS);

function clampBpm(bpm: number): number {
  return Math.max(56, Math.min(108, bpm));
}

export const useLoFiStore = create<LoFiState>((set, get) => {
  return {
    controls: initialPattern.controls ?? DEFAULT_CONTROLS,
    locks: DEFAULT_LOCKS,
    pattern: initialPattern,
    hasHydratedFromStorage: false,
    isPlaying: false,
    audioReady: false,
    settingsOpen: false,
    sessions: [],
    integrationStatus: {
      freesoundConfigured: false,
      pixabayConfigured: false,
      freesoundReachable: false,
      pixabayReachable: false,
    },

    hydrateFromStorage: () => {
      if (get().hasHydratedFromStorage) return;
      const storedPattern = readLastSession();
      const storedSessions = readSessions();
      if (storedPattern) {
        set({
          pattern: storedPattern,
          controls: storedPattern.controls,
          sessions: storedSessions,
          hasHydratedFromStorage: true,
        });
        return;
      }
      set({ sessions: storedSessions, hasHydratedFromStorage: true });
    },
    setAudioReady: (audioReady) => set({ audioReady }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setControl: (key, value) => {
      const nextControls = { ...get().controls, [key]: key === "bpm" ? clampBpm(value as number) : value };
      const pattern = { ...get().pattern, controls: nextControls };
      persistLastSession(pattern);
      set({ controls: nextControls, pattern });
    },
    setMood: (moodId) => {
      const controls = controlsFromMood(moodId, get().controls);
      const pattern = generateLoopPattern(controls, get().pattern, get().locks);
      persistLastSession(pattern);
      set({ controls, pattern });
    },
    toggleLock: (layer) => {
      set({ locks: { ...get().locks, [layer]: !get().locks[layer] } });
    },
    regenerate: () => {
      const nextControls = { ...get().controls, seed: get().controls.seed + 1 };
      const pattern = generateLoopPattern(nextControls, get().pattern, get().locks);
      persistLastSession(pattern);
      set({ controls: nextControls, pattern });
    },
    evolve: () => {
      const nextControls = { ...get().controls, seed: get().controls.seed + 97 };
      const pattern = generateLoopPattern(nextControls, get().pattern, {
        ...get().locks,
        harmony: true,
        bass: true,
        ambience: true,
      });
      persistLastSession(pattern);
      set({ controls: nextControls, pattern });
    },
    reseedOneLayer: (layer) => {
      const nextControls = { ...get().controls, seed: get().controls.seed + 13 };
      const nextPattern = reseedLayer(nextControls, get().pattern, layer);
      persistLastSession(nextPattern);
      set({ controls: nextControls, pattern: nextPattern });
    },
    surpriseMe: () => {
      const controls = createSurpriseControls(get().controls, MOOD_PRESETS);
      const pattern = generateLoopPattern(controls, get().pattern, {
        drums: false,
        harmony: false,
        bass: false,
        melody: false,
        ambience: false,
      });
      persistLastSession(pattern);
      set({ controls, pattern });
    },
    saveSession: (name) => {
      const session: SavedSession = {
        id: `${Date.now()}`,
        name: name?.trim() || `Session ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        pattern: get().pattern,
      };
      const sessions = [session, ...get().sessions].slice(0, 20);
      writeSessions(sessions);
      persistLastSession(get().pattern);
      set({ sessions });
    },
    loadSession: (sessionId) => {
      const session = get().sessions.find((item) => item.id === sessionId);
      if (!session) return;
      persistLastSession(session.pattern);
      set({ pattern: session.pattern, controls: session.pattern.controls });
    },
    deleteSession: (sessionId) => {
      const sessions = get().sessions.filter((item) => item.id !== sessionId);
      writeSessions(sessions);
      set({ sessions });
    },
    importSessionJson: (raw) => {
      try {
        const parsed = JSON.parse(raw) as LoopPattern;
        if (!parsed || !parsed.controls || !Array.isArray(parsed.chords) || !Array.isArray(parsed.drums)) {
          return { ok: false, error: "Invalid session JSON shape." };
        }
        persistLastSession(parsed);
        set({ pattern: parsed, controls: parsed.controls });
        return { ok: true };
      } catch {
        return { ok: false, error: "JSON parsing failed." };
      }
    },
    exportSessionJson: () => JSON.stringify(get().pattern, null, 2),
    setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    setIntegrationStatus: (status) => {
      set({ integrationStatus: { ...get().integrationStatus, ...status } });
    },
    clearLocalCache: () => {
      clearCache();
      set({ sessions: [] });
    },
  };
});
