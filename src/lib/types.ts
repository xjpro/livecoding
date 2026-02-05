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
