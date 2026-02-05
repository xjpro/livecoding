import * as Tone from "tone";

export interface Track {
  id: number;
  voice: string;
  pattern: string;
  dsl: string;
  sequence?: Tone.Part;
  isPlaying: boolean;
  gain: number;
  speed: number;
  pan: number;
  prob: number;
  synth?: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth;
  volume?: Tone.Volume;
  panner?: Tone.Panner;
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
