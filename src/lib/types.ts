import * as Tone from "tone";

export interface TrackParams {
  prob: number;
  pattern: (number | string)[];  // Parsed pattern for master clock to read
}

export interface Track {
  id: number;
  voice: string;
  pattern: string;  // Original pattern string (e.g., "pulse:4")
  dsl: string;
  isPlaying: boolean;
  gain: number;
  pan: number;
  prob: number;
  offset: number;
  synth?: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth;
  volume?: Tone.Volume;
  panner?: Tone.Panner;
  params?: TrackParams;
  voiceConfig?: import("./types").VoiceConfig;
}

export interface VoiceConfig {
  name: string;
  synthType: "Synth" | "MembraneSynth" | "MetalSynth";
  synthParams: Record<string, unknown>;
  trigger: {
    note: string;
    duration: string;
  };
}

export interface Kit {
  name: string;
  voices: Map<string, VoiceConfig>;
}
