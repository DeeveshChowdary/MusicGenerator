# LoFi Foundry Architecture

## Overview

LoFi Foundry is a deterministic, client-side generative music application with optional server-assisted free API connectors.
The architecture is designed around modular generation layers, a transport-driven Tone.js playback engine, and local-first persistence.

## Core Goals

- Deterministic loop generation from seed
- Coherent lo-fi musical output (not random chaos)
- Real-time low-latency playback
- Layer-level regeneration and locking
- Offline-capable fallback without external keys
- Exportable audio and sessions

## High-Level Diagram

```text
UI (React + Tailwind + Framer)
  -> Zustand Store (controls, locks, pattern, sessions, settings)
    -> Generator Modules (pure deterministic logic)
      -> LoopPattern
        -> Tone Audio Engine (transport scheduling + buses + effects)

Optional integrations
UI Asset Finder -> Next Route Handlers -> Freesound / Pixabay APIs
```

## Module Breakdown

### `features/generator/`

Pure deterministic generation modules:

- `rng.ts`: seeded PRNG + layer-specific seed hashing
- `musicTheory.ts`: scales, chord intervals, quantization, voice-leading support
- `harmony.ts`: progression templates, borrowed color, inversion, voice leading
- `drums.ts`: style templates, swing, velocity/timing humanization, fills
- `bass.ts`: root-driven + passing-tone movement
- `melody.ts`: motif-based understated top-line with silence and variation
- `ambience.ts`: texture profile selection and level shaping
- `arrangement.ts`: intro/main/strip/variation/outro section plan
- `index.ts`: orchestration, layer-lock-aware generation, reseed layer, evolve

All outputs are strongly typed via `features/generator/types.ts`.

### `features/audio/`

Tone.js runtime engine:

- `audioEngine.ts`:
  - Owns transport scheduling
  - Owns mixer buses
  - Owns synth + sample instruments
  - Applies effect controls
  - Handles playback and stop/pause
  - Exports loop to WAV via offline rendering
- `useAudioEngine.ts`:
  - Client-only engine lifecycle
  - Meter polling
  - UI-facing methods (`play`, `pause`, `stop`, `exportWav`)

### `features/session/`

Local session state and persistence:

- `store.ts` (Zustand): controls, locks, generated pattern, sessions, settings
- `persistence.ts`: localStorage read/write for session list + last session

### `features/assets/`

Optional free API integrations:

- `apiClient.ts`: typed client fetch wrappers + cache
- `cache.ts`: localStorage TTL cache

### API Routes (`app/api/*`)

- `/api/integrations/status`: key/config health
- `/api/assets/freesound`: optional Freesound search proxy
- `/api/assets/pixabay`: optional Pixabay image search proxy

These routes fail gracefully with clear setup messaging if keys are missing.

## Determinism Strategy

Single user `seed` is transformed into per-layer seeds using `hashSeed(seed, layerSalt)`.
That guarantees:

- stable output for same controls + seed
- predictable layer behavior
- layer reseeding without breaking other locked layers

## Layer Locking Strategy

Generation pipeline accepts `previousPattern + locks`.
Locked layers reuse previous generated content, while unlocked layers regenerate from current controls.
This enables practical iterative music making.

## Tone Graph

```text
drums -> drumsBus -> masterInput
chords -> chordsBus -> reverb/wow -> masterInput
bass -> bassBus -> masterInput
melody -> melodyBus -> delay/reverb/wow -> masterInput
ambience -> ambienceBus -> masterInput

masterInput -> lowPass -> highPass -> compressor -> limiter -> destination
```

Additional layer meters feed the UI meter bridge.

## Export Path

- Offline render replays scheduled events for requested bars.
- Output is converted to WAV (`audiobuffer-to-wav`) and downloaded client-side.
- Export does not rely on remote services.

## Offline Fallback

Local fallback is always available:

- procedural built-in sample pack in `public/assets/`
- synth-based instruments always available
- no API keys required for core playback/generation/export/session features

## Folder Structure Rationale

The repository is organized by domain, not by file type only.
Generator logic is isolated and testable independently from UI/audio runtime.
This keeps behavior-oriented testing fast and deterministic.

## Testing Strategy

- Unit tests target RNG determinism and generator behavior
- Integration tests validate bounded musical outputs and core orchestration
- Build-time type checking ensures strict contract consistency

## Tradeoffs

- Export currently focuses on loop rendering (reliable offline path) over full arrangement stem export.
- Asset finder integration is optional and kept separate from core playback path to preserve offline UX.
- Session persistence uses localStorage for v1 speed and simplicity.

## Extension Points

- MIDI export module
- full arrangement render with per-section automation
- indexed asset downloads + attribution ledger
- audio worklet for custom tape/flutter and sidechain dynamics
- PWA install + background playback enhancements
