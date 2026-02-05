# Kits

Kits are collections of voice configurations that define the sounds available in the livecoding environment.

## Kit Structure

Each kit is stored in its own folder under `public/kits/` with the following structure:

```
kits/
  [kit-name]/
    kit.json          # Manifest file listing available voices
    [voice-name].json # Voice configuration file
    ...
```

## Kit Manifest (kit.json)

The `kit.json` file describes the kit and lists all available voices:

```json
{
  "name": "first-post",
  "description": "Default kit with basic drum sounds and bass",
  "voices": ["kick", "hat", "snare", "bass"]
}
```

## Voice Configuration

Each voice is defined in its own JSON file with the following structure:

```json
{
  "name": "kick",
  "synthType": "MembraneSynth",
  "synthParams": {
    "pitchDecay": 0.05,
    "octaves": 10,
    "oscillator": { "type": "sine" },
    "envelope": { "attack": 0.001, "decay": 0.4, "sustain": 0.01, "release": 1.4 }
  },
  "trigger": {
    "note": "C2",
    "duration": "8n"
  }
}
```

### Fields

- **name**: Voice identifier
- **synthType**: Type of Tone.js synthesizer (`Synth`, `MembraneSynth`, or `MetalSynth`)
- **synthParams**: Configuration parameters passed to the Tone.js synth constructor
- **trigger**: Default note and duration for triggering the synth
  - **note**: Musical note (e.g., "C2", "A1", "G#6")
  - **duration**: Note duration in Tone.js notation (e.g., "8n", "16n")

## Creating a New Kit

1. Create a new folder under `public/kits/` with your kit name
2. Create a `kit.json` manifest file
3. Create a JSON file for each voice
4. Update `src/lib/kits.ts` to change the `ACTIVE_KIT` constant (currently hardcoded)
