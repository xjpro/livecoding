import { useEffect, useState, FormEvent, useRef } from "react";
import * as Tone from "tone";
import "./App.css";
import { parsePattern } from "./lib/patterns.ts";
import { createSynth, triggerSynth } from "./lib/synths.ts";
import { Track } from "./lib/types.ts";

function App() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [bpm] = useState(80);
  const synthsRef = useRef<
    Map<string, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth>
  >(new Map());

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    const transport = Tone.getTransport();
    if (started) {
      transport.start();
    } else {
      transport.stop();
    }
  }, [started]);

  async function toggle() {
    await Tone.start();
    setStarted((started) => !started);
  }

  function getSynth(
    voice: string,
  ): Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth {
    if (synthsRef.current.has(voice)) {
      return synthsRef.current.get(voice)!;
    }

    const synth = createSynth(voice);
    synthsRef.current.set(voice, synth);
    return synth;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Parse DSL: see dsl.md for more details
    const match = input.match(/^(\d+)\/(\w+)\s+(.+)$/);
    if (!match) {
      console.error("Invalid DSL format. Expected: [track#]/[voice] [pattern]");
      return;
    }

    const trackId = parseInt(match[1]);
    const voice = match[2];
    const patternStr = match[3];

    // Remove existing track with same ID
    const existingTrack = tracks.find((t) => t.id === trackId);
    if (existingTrack?.sequence) {
      const stopTime = Tone.getTransport().state === "started" ? "@1m" : 0;
      existingTrack.sequence.stop(stopTime);
      existingTrack.sequence?.dispose();
    }

    // Parse pattern
    const pattern = parsePattern(patternStr);
    const synth = getSynth(voice);

    // Pre-compute active steps to minimize work in the audio callback
    const activeSteps = new Set(
      pattern
        .map((val, idx) => (val === 1 ? idx : -1))
        .filter((idx) => idx !== -1),
    );

    // Create Tone.js sequence - cleaner and more efficient for step sequencing
    const sequence = new Tone.Sequence(
      (time, step) => {
        // Minimal work in audio callback - just a Set lookup (O(1))
        if (activeSteps.has(step)) {
          triggerSynth(synth, time);
        }
      },
      Array.from({ length: pattern.length }, (_, i) => i),
      "16n", // Each step is a 16th note
    );

    sequence.loop = true;

    // Start at the next measure if transport is running, otherwise at 0
    if (Tone.getTransport().state === "started") {
      sequence.start("@1m");
    } else {
      sequence.start(0);
    }

    // Update tracks
    const newTrack: Track = {
      id: trackId,
      voice,
      pattern: patternStr,
      dsl: input,
      sequence,
    };

    setTracks((tracks) => {
      const filtered = tracks.filter((t) => t.id !== trackId);
      return [...filtered, newTrack].sort((a, b) => a.id - b.id);
    });

    setInput("");
  }

  return (
    <>
      <div>
        {tracks.map((track) => (
          <div key={track.id}>
            {track.id}/{track.voice} - {track.pattern}
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 0/kick pulse(4,16)"
        />
        <button type="submit">Add</button>
      </form>

      <div className="card">
        <button onClick={toggle}>{started ? "Stop" : "Start"}</button>
      </div>
    </>
  );
}

export default App;
