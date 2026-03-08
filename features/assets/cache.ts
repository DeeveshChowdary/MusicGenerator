"use client";

const CACHE_KEY = "lofi-foundry:api-cache";

type CacheRecord<T> = {
  value: T;
  expiresAt: number;
};

type CacheShape = Record<string, CacheRecord<unknown>>;

function readCache(): CacheShape {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as CacheShape;
  } catch {
    return {};
  }
}

function writeCache(cache: CacheShape): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getCached<T>(key: string): T | null {
  const cache = readCache();
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    delete cache[key];
    writeCache(cache);
    return null;
  }
  return item.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = 1000 * 60 * 60): void {
  const cache = readCache();
  cache[key] = {
    value,
    expiresAt: Date.now() + ttlMs,
  };
  writeCache(cache);
}
