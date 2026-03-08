"use client";

import { X } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  integrationStatus: {
    freesoundConfigured: boolean;
    pixabayConfigured: boolean;
    freesoundReachable: boolean;
    pixabayReachable: boolean;
  };
  onRefreshStatus: () => void;
  onClearCache: () => void;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.08em] ${
        ok ? "border-emerald-300/70 bg-emerald-300/10 text-emerald-200" : "border-zinc-600 bg-zinc-800 text-zinc-300"
      }`}
    >
      {label}: {ok ? "Ready" : "Missing"}
    </span>
  );
}

export function SettingsModal({
  open,
  onClose,
  integrationStatus,
  onRefreshStatus,
  onClearCache,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Settings & Integrations</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 p-1 text-zinc-300 hover:border-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Integration Health</h3>
          <div className="flex flex-wrap gap-2">
            <StatusPill ok={integrationStatus.freesoundConfigured} label="Freesound Key" />
            <StatusPill ok={integrationStatus.pixabayConfigured} label="Pixabay Key" />
            <StatusPill ok={integrationStatus.freesoundReachable} label="Freesound API" />
            <StatusPill ok={integrationStatus.pixabayReachable} label="Pixabay API" />
          </div>
          <button
            type="button"
            onClick={onRefreshStatus}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-400"
          >
            Refresh Status
          </button>
        </section>

        <section className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          <h3 className="font-semibold text-zinc-100">Free API Setup</h3>
          <p>
            Freesound: create a free API key at <a className="text-emerald-200 underline" href="https://freesound.org/apiv2/apply/">freesound.org/apiv2/apply</a>.
            Add it to <code className="mx-1 rounded bg-zinc-800 px-1">NEXT_PUBLIC_FREESOUND_API_KEY</code> in <code>.env.local</code>.
          </p>
          <p>
            Pixabay: create a free API key at <a className="text-emerald-200 underline" href="https://pixabay.com/api/docs/">pixabay.com/api/docs</a>.
            Add it to <code className="mx-1 rounded bg-zinc-800 px-1">NEXT_PUBLIC_PIXABAY_API_KEY</code> in <code>.env.local</code>.
          </p>
          <p>Both integrations are optional. The app stays fully functional without keys using built-in offline assets.</p>
        </section>

        <section className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          <h3 className="font-semibold text-zinc-100">Audio Notes</h3>
          <p>Browsers require a user gesture before audio can start. Click Play once to unlock audio context.</p>
          <p>If audio is silent, check output device, tab permissions, and ensure another app is not holding exclusive output mode.</p>
          <p>Export uses offline rendering to WAV and does not require external APIs.</p>
        </section>

        <section className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          <h3 className="font-semibold text-zinc-100">Cache & Licenses</h3>
          <p>Use clear cache when API results look stale. Local sessions and API search cache are stored in localStorage.</p>
          <button
            type="button"
            onClick={onClearCache}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-400"
          >
            Clear Local Cache
          </button>
          <p>
            Built-in sample pack was procedurally generated in-repo. See <code className="rounded bg-zinc-800 px-1">ASSETS_LICENSES.md</code> and
            <code className="mx-1 rounded bg-zinc-800 px-1">public/assets/metadata/asset-manifest.json</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
