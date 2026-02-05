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
  const synthsRef = useRef<
    Map<string, Tone.Synth | Tone.MembraneSynth | Tone.MetalSynth>
  >(new Map());

  const bpm = 80;

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, []);

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

    // Parse DSL: [track#]:[voice] [pattern]
    const match = input.match(/^(\d+):(\w+)\s+(.+)$/);
    if (!match) {
      console.error("Invalid DSL format. Expected: [track#]:[voice] [pattern]");
      return;
    }

    const trackId = parseInt(match[1]);
    const voice = match[2];
    const patternStr = match[3];

    // Remove existing track with same ID
    const existingTrack = tracks.find((t) => t.id === trackId);
    if (existingTrack?.sequence) {
      existingTrack.sequence.stop();
      existingTrack.sequence.dispose();
    }

    // Parse pattern
    const pattern = parsePattern(patternStr);
    const synth = getSynth(voice);

    // Create Tone.js sequence
    const sequence = new Tone.Part(
      (time, value) => {
        if (value === 1) {
          triggerSynth(synth, time);
        }
      },
      pattern.map((value, index) => [
        index * Tone.Time("16n").toSeconds(),
        value,
      ]),
    );

    sequence.loop = true;
    sequence.loopEnd = pattern.length * Tone.Time("16n").toSeconds();
    sequence.start(0);

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
      <h1>Vite + React</h1>
      <div>
        {tracks.map((track) => (
          <div key={track.id}>
            Track {track.id}: {track.voice} - {track.pattern}
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 0:kick pulse(4,16)"
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
