import * as Tone from "tone";

export interface TrackParams {
  prob: number;
}

export interface Track {
  id: number;
  voice: string;
  pattern: string;
  dsl: string;
  sequence?: Tone.Sequence;
  isPlaying: boolean;
  gain: number;
  speed: number;
  pan: number;
  prob: number;
  offset: number;
  synth?: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth;
  volume?: Tone.Volume;
  panner?: Tone.Panner;
  params?: TrackParams;
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
