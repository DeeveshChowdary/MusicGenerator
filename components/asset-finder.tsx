"use client";

import { useMemo, useState } from "react";

import {
  type FreesoundResult,
  type PixabayImageResult,
  searchFreesound,
  searchPixabayImages,
} from "@/features/assets/apiClient";

interface AssetFinderProps {
  moodName: string;
}

export function AssetFinder({ moodName }: AssetFinderProps) {
  const [query, setQuery] = useState("rain ambience");
  const [freesound, setFreesound] = useState<FreesoundResult[]>([]);
  const [pixabay, setPixabay] = useState<PixabayImageResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggested = useMemo(() => `${moodName} ambience`, [moodName]);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sounds, images] = await Promise.all([searchFreesound(query), searchPixabayImages(query)]);
      setFreesound(sounds);
      setPixabay(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Asset Finder (Optional)</h2>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-56 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200"
          placeholder="Search textures or ambience"
        />
        <button
          type="button"
          onClick={() => setQuery(suggested)}
          className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-400"
        >
          Use Mood Query
        </button>
        <button
          type="button"
          onClick={runSearch}
          className="rounded-md border border-emerald-300/60 bg-emerald-300/15 px-3 py-1.5 text-xs text-emerald-200"
        >
          {loading ? "Searching..." : "Find Textures"}
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-zinc-400">Freesound</p>
          <div className="max-h-52 space-y-2 overflow-auto">
            {freesound.length === 0 && <p className="text-xs text-zinc-500">No results yet.</p>}
            {freesound.map((item) => (
              <div key={item.id} className="rounded border border-zinc-800 p-2 text-xs text-zinc-300">
                <p className="font-medium text-zinc-100">{item.name}</p>
                <p>{item.username}</p>
                <p>{item.license}</p>
                <audio className="mt-1 w-full" controls preload="none" src={item.preview} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
          <p className="mb-2 text-xs uppercase tracking-[0.08em] text-zinc-400">Pixabay Visuals</p>
          <div className="grid max-h-52 grid-cols-2 gap-2 overflow-auto">
            {pixabay.length === 0 && <p className="col-span-2 text-xs text-zinc-500">No results yet.</p>}
            {pixabay.map((item) => (
              <a
                key={item.id}
                href={item.pageURL}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded border border-zinc-800"
                title={`${item.tags} by ${item.user}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewURL} alt={item.tags} className="h-20 w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
