"use client";

import { Download, FileJson, Save, Upload } from "lucide-react";
import { useRef, useState } from "react";

import type { SavedSession } from "@/features/session/persistence";

interface SessionPanelProps {
  sessions: SavedSession[];
  onSave: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onExportJson: () => string;
  onImportJson: (raw: string) => { ok: boolean; error?: string };
  onDownloadProject: () => void;
}

export function SessionPanel({
  sessions,
  onSave,
  onLoad,
  onDelete,
  onExportJson,
  onImportJson,
  onDownloadProject,
}: SessionPanelProps) {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/70 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Sessions</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-400"
          >
            <Save size={13} /> Save
          </button>
          <button
            type="button"
            onClick={onDownloadProject}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-400"
          >
            <Download size={13} /> Download State
          </button>
        </div>
      </div>

      <div className="mb-3 max-h-40 space-y-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
        {sessions.length === 0 && <p className="text-xs text-zinc-500">No saved sessions yet.</p>}
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between rounded-md border border-zinc-800 px-2 py-1 text-xs">
            <div>
              <p className="text-zinc-200">{session.name}</p>
              <p className="text-zinc-500">{new Date(session.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onLoad(session.id)}
                className="rounded border border-zinc-600 px-2 py-0.5 text-zinc-200 hover:border-zinc-400"
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                className="rounded border border-zinc-700 px-2 py-0.5 text-zinc-400 hover:text-zinc-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setImportText(onExportJson());
              textareaRef.current?.focus();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-400"
          >
            <FileJson size={13} /> Copy Session JSON
          </button>
          <button
            type="button"
            onClick={() => {
              const result = onImportJson(importText);
              setMessage(result.ok ? "Session imported" : result.error ?? "Import failed");
            }}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-400"
          >
            <Upload size={13} /> Import JSON
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          className="h-24 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 font-mono text-xs text-zinc-300"
          placeholder="Paste session JSON here"
        />
        {message && <p className="text-xs text-zinc-400">{message}</p>}
      </div>
    </section>
  );
}
