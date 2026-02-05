import * as Tone from "tone";

export interface Track {
  id: number;
  voice: string;
  pattern: string;
  dsl: string;
  sequence?: Tone.Part;
}
