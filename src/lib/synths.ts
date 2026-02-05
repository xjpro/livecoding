import * as Tone from "tone";

// Create synth for voice (not connected to destination)
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
      });
      break;
    case "hat":
      synth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.05, release: 0.025 },
        harmonicity: 12,
        modulationIndex: 12,
        resonance: 6000,
        octaves: 2.5,
      });
      break;
    case "snare":
      synth = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 6,
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      });
      break;
    case "bass":
      synth = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
        filter: {
          type: "lowpass",
          frequency: 800,
          Q: 2,
        },
        filterEnvelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.5,
          release: 0.2,
          baseFrequency: 200,
          octaves: 2.5,
        },
      });
      break;
    default:
      synth = new Tone.Synth();
  }

  return synth;
}

export function triggerSynth(
  synth: Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth,
  time: number,
  voice?: string,
) {
  if (synth instanceof Tone.MembraneSynth) {
    synth.triggerAttackRelease("C2", "8n", time);
  } else if (synth instanceof Tone.MetalSynth) {
    synth.triggerAttackRelease("G#6", "16n", time);
  } else {
    // For bass voice, play at bass frequency, otherwise middle C
    const note = voice === "bass" ? "A1" : "C4";
    synth.triggerAttackRelease(note, "8n", time);
  }
}
