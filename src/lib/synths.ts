import * as Tone from "tone";
import type { VoiceConfig } from "./types";

// Create synth or player for voice using voice configuration
export function createSynth(
  voiceConfig: VoiceConfig,
): Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.Player {
  if (voiceConfig.type === "sample") {
    const player = new Tone.Player({
      url: voiceConfig.sampleUrl,
      onload: () => console.log(`Sample loaded: ${voiceConfig.name}`),
    });
    if (voiceConfig.trigger?.playbackRate) {
      player.playbackRate = voiceConfig.trigger.playbackRate;
    }
    return player;
  }

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
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth | Tone.Player,
  time: number,
  voiceConfig: VoiceConfig,
  note?: string,
) {
  if (synth instanceof Tone.Player) {
    synth.start(time);
  } else {
    synth.triggerAttackRelease(
      note ?? voiceConfig.trigger.note,
      voiceConfig.trigger.duration,
      time,
    );
  }
}
