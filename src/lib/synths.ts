import * as Tone from "tone";
import type { VoiceConfig } from "./types";

// Create synth for voice using voice configuration
export function createSynth(
  voiceConfig: VoiceConfig,
): Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth {
  let synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth;

  switch (voiceConfig.synthType) {
    case "MembraneSynth":
      synth = new Tone.MembraneSynth(voiceConfig.synthParams);
      break;
    case "MetalSynth":
      synth = new Tone.MetalSynth(voiceConfig.synthParams);
      break;
    case "Synth":
      synth = new Tone.Synth(voiceConfig.synthParams);
      break;
    default:
      synth = new Tone.Synth();
  }

  return synth;
}

export function triggerSynth(
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth,
  time: number,
  voiceConfig: VoiceConfig,
) {
  synth.triggerAttackRelease(
    voiceConfig.trigger.note,
    voiceConfig.trigger.duration,
    time,
  );
}
