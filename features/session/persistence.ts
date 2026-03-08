import type { LoopPattern } from "@/features/generator/types";

const SESSION_STORAGE_KEY = "lofi-foundry:sessions";
const LAST_SESSION_KEY = "lofi-foundry:last-session";

export interface SavedSession {
  id: string;
  name: string;
  createdAt: number;
  pattern: LoopPattern;
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function readSessions(): SavedSession[] {
  if (!hasWindow()) return [];
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SavedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSessions(sessions: SavedSession[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
}

export function persistLastSession(pattern: LoopPattern): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(pattern));
}

export function readLastSession(): LoopPattern | null {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(LAST_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoopPattern;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  if (!hasWindow()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LAST_SESSION_KEY);
  window.localStorage.removeItem("lofi-foundry:api-cache");
}
