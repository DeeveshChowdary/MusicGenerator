# TODO (Prioritized)

## P0 - Product Hardening

1. Add true arrangement playback mode that mutates layers in real time across sections (not only section planning/export context).
2. Add end-to-end browser tests for transport lifecycle and export flow.
3. Add schema validation (`zod`) for imported session JSON before state hydration.
4. Add guardrails for extreme control combinations to prevent unusable loops.

## P1 - Audio Quality Improvements

1. Add sidechain-style envelope follower for bass/chord ducking on kicks.
2. Add optional tape stop/start transitions and section turnarounds.
3. Improve melody phrase memory across regenerations for stronger thematic continuity.
4. Add extra drum kits and ambient texture variants.

## P1 - UX Improvements

1. Add a proper toast/notification system for import/export/status feedback.
2. Add preset favorites and recent generation history panel.
3. Add compact mobile bottom-sheet controls for small screens.
4. Add focus timer (Pomodoro mode) integrated with arrangement durations.

## P2 - Integration & Assets

1. Add attribution ledger download for all externally fetched assets used in a session.
2. Add indexedDB caching for audio previews and selected ambience packs.
3. Add one-click “promote preview to ambience layer” workflow.

## P2 - Export & Interop

1. Add MIDI export for chord/bass/melody tracks.
2. Add optional stem export (drums/chords/bass/melody/ambience).
3. Add MP3 export path with license-safe encoder integration.

## P3 - Platform

1. Add PWA install support and offline cache manifest.
2. Add feature flags for experimentation and A/B generation presets.
3. Add telemetry hooks (privacy-safe, opt-in) for product learning.
