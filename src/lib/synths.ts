import * as Tone from "tone";

// Get or create synth for voice
export function createSynth(
  voice: string,
): Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth {
  let synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth;

  switch (voice.toLowerCase()) {
    case "kick":
      synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
      }).toDestination();
      break;
    case "hat":
      synth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.025 },
        harmonicity: 12,
        modulationIndex: 12,
        resonance: 6000,
        octaves: 2.5,
      }).toDestination();
      break;
    case "snare":
      synth = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 6,
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      }).toDestination();
      break;
    default:
      synth = new Tone.Synth().toDestination();
  }

  return synth;
}

export function triggerSynth(
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth,
  time: number,
) {
  if (synth instanceof Tone.MembraneSynth) {
    synth.triggerAttackRelease("C2", "8n", time);
  } else if (synth instanceof Tone.MetalSynth) {
    synth.triggerAttackRelease("G#6", "16n", time);
  } else {
    synth.triggerAttackRelease("C4", "8n", time);
  }
}
