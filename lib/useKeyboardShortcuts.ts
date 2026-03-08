"use client";

import { useEffect } from "react";

interface Handlers {
  onTogglePlay: () => void;
  onGenerate: () => void;
  onSurprise: () => void;
  onSettings: () => void;
}

export function useKeyboardShortcuts({ onTogglePlay, onGenerate, onSurprise, onSettings }: Handlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        onTogglePlay();
      }

      if (event.key.toLowerCase() === "g") {
        event.preventDefault();
        onGenerate();
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSurprise();
      }

      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        onSettings();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onGenerate, onSettings, onSurprise, onTogglePlay]);
}
