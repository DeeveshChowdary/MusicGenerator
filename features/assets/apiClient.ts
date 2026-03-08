"use client";

import { getCached, setCached } from "./cache";

export interface FreesoundResult {
  id: number;
  name: string;
  preview: string;
  duration: number;
  username: string;
  license: string;
  url: string;
}

export interface PixabayImageResult {
  id: number;
  tags: string;
  previewURL: string;
  largeImageURL: string;
  user: string;
  pageURL: string;
}

export interface IntegrationStatusResponse {
  freesoundConfigured: boolean;
  pixabayConfigured: boolean;
  freesoundReachable: boolean;
  pixabayReachable: boolean;
}

export async function fetchIntegrationStatus(): Promise<IntegrationStatusResponse> {
  const cacheKey = "status";
  const cached = getCached<IntegrationStatusResponse>(cacheKey);
  if (cached) return cached;

  const response = await fetch("/api/integrations/status", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to read integration status.");
  }
  const data = (await response.json()) as IntegrationStatusResponse;
  setCached(cacheKey, data, 1000 * 30);
  return data;
}

export async function searchFreesound(query: string): Promise<FreesoundResult[]> {
  const cacheKey = `fs:${query}`;
  const cached = getCached<FreesoundResult[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/assets/freesound?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unable to search Freesound" }));
    throw new Error(err.error || "Unable to search Freesound");
  }
  const data = (await response.json()) as { results: FreesoundResult[] };
  setCached(cacheKey, data.results, 1000 * 60 * 30);
  return data.results;
}

export async function searchPixabayImages(query: string): Promise<PixabayImageResult[]> {
  const cacheKey = `pix:${query}`;
  const cached = getCached<PixabayImageResult[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/assets/pixabay?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Unable to search Pixabay" }));
    throw new Error(err.error || "Unable to search Pixabay");
  }
  const data = (await response.json()) as { results: PixabayImageResult[] };
  setCached(cacheKey, data.results, 1000 * 60 * 60);
  return data.results;
}
