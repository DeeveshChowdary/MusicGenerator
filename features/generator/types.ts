export type ScaleMode = "major" | "minor" | "dorian" | "mixolydian" | "lydian";

export type DrumStyle =
  | "boomBap"
  | "chillHop"
  | "jazzHop"
  | "minimal"
  | "sleepy"
  | "tapeCrunch";

export type MelodyDensity = "none" | "sparse" | "balanced" | "expressive";

export type AmbienceType =
  | "vinyl"
  | "rain"
  | "cafe"
  | "nightCity"
  | "room"
  | "field"
  | "hiss";

export interface LayerLocks {
  drums: boolean;
  harmony: boolean;
  bass: boolean;
  melody: boolean;
  ambience: boolean;
}

export interface GeneratorControls {
  seed: number;
  bpm: number;
  swing: number;
  key: string;
  scale: ScaleMode;
  moodId: string;
  drumStyle: DrumStyle;
  drumSource: "synth" | "sample";
  melodyDensity: MelodyDensity;
  ambienceType: AmbienceType;
  vinylAmount: number;
  reverbAmount: number;
  wowFlutter: number;
  lowPassWarmth: number;
  complexity: number;
  loopBars: 2 | 4 | 8;
  masterVolume: number;
  arrangementMinutes: number;
  exportBars: number;
}

export interface DrumHit {
  instrument: "kick" | "snare" | "hatClosed" | "hatOpen" | "perc";
  step: number;
  velocity: number;
  offset: number;
  muted?: boolean;
}

export interface ChordEvent {
  bar: number;
  beat: number;
  durationBeats: number;
  notes: number[];
  root: string;
  quality: string;
  name: string;
}

export interface NoteEvent {
  step: number;
  midi: number;
  velocity: number;
  durationSteps: number;
  offset: number;
  glideTo?: number;
}

export interface AmbienceLayer {
  type: AmbienceType;
  level: number;
  noiseColor: number;
  rainAmount: number;
  roomAmount: number;
}

export interface ArrangementSection {
  name: "intro" | "main" | "strip" | "variation" | "outro";
  bars: number;
  hatsDensity: number;
  melodyPresence: number;
  ambienceIntensity: number;
  filterCutoff: number;
  dropoutChance: number;
  fillChance: number;
}

export interface LoopPattern {
  id: string;
  seed: number;
  generatedAt: number;
  controls: GeneratorControls;
  chords: ChordEvent[];
  bass: NoteEvent[];
  melody: NoteEvent[];
  drums: DrumHit[];
  ambience: AmbienceLayer;
  arrangement: ArrangementSection[];
}

export interface MoodPreset {
  id: string;
  name: string;
  description: string;
  bpmRange: [number, number];
  keys: string[];
  scales: ScaleMode[];
  chordStyles: string[];
  drumDensity: number;
  bassMotion: number;
  ambienceType: AmbienceType;
  filterAmount: number;
  tapeWobble: number;
  reverbWidth: number;
  swing: number;
  melodicComplexity: number;
  fillProbability: number;
  defaultDrumStyle: DrumStyle;
}

export type LayerName = keyof LayerLocks;
