import * as Tone from "tone";
import type { PatternSpec, PatternValue } from "./patterns";

// Pure data — no Tone.js objects. This is what React state holds.
export interface TrackData {
  id: number;
  voice: string;
  patternSpec: PatternSpec | null; // Structured pattern intent (no string round-trip)
  parsedPattern: PatternValue[]; // Resolved pattern array for visualizer
  dsl: string; // Original DSL command
  isPlaying: boolean;
  gain: number;
  pan: number;
  prob: number;
  offset: number;
  octaveMin: number;
  octaveMax: number;
}

// Live Tone.js objects — stored in a useRef, not React state
export interface TrackRuntime {
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.Player;
  volume: Tone.Volume;
  panner: Tone.Panner;
  voiceConfig: VoiceConfig;
}

export interface SynthVoiceConfig {
  name: string;
  type: "synth";
  synthType: "Synth" | "MembraneSynth" | "MetalSynth";
  synthParams: Record<string, unknown>;
  trigger: {
    note: string;
    duration: string;
  };
}

export interface SampleVoiceConfig {
  name: string;
  type: "sample";
  sampleUrl: string;
  trigger?: {
    playbackRate?: number;
  };
}

export type VoiceConfig = SynthVoiceConfig | SampleVoiceConfig;

export interface Kit {
  name: string;
  voices: Map<string, VoiceConfig>;
}
