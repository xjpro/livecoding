import { useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import "./App.css";
import { loop, Loop, measure, phrase } from "./music.ts";

function App() {
  const [started, setStarted] = useState(false);
  const [loops, setLoops] = useState<Loop[]>([
    loop().add(
      phrase().add(
        measure()
          .add({ note: "A4", length: "4n" })
          .add({ note: "A4", length: "4n" })
          .add({ note: "A4", length: "4n" })
          .add({ note: "A4", length: "4n" }),
      ),
    ),
  ]);
  const bpm = 80;
  const toneLoopsRef = useRef<Tone.Loop[]>([]);

  useEffect(() => {
    // Set up Transport BPM
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;

    // Clean up any existing loops
    toneLoopsRef.current.forEach((toneLoop) => toneLoop.dispose());
    toneLoopsRef.current = [];

    // Create a synth for playback
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();

    // Set up continuous loops for each loop
    loops.forEach((loop) => {
      loop.phrases.forEach((phrase) => {
        phrase.measures.forEach((measure) => {
          // Calculate total measure duration (4 quarter notes = "1m")
          const measureDuration = "1m";

          // Create a repeating loop for this measure
          const toneLoop = new Tone.Loop((time) => {
            let beatTime = time;

            // For now, assume 4 quarter notes per measure
            // If measure has no beats, play silence
            if (measure.beats.length === 0) {
              // Silent measure - do nothing
            } else {
              // Play each beat in the measure
              measure.beats.forEach((beat) => {
                // Default to "A4" note if not specified
                const note = beat.note || "A4";
                synth.triggerAttackRelease(note, beat.length, beatTime);
                beatTime += Tone.Time(beat.length).toSeconds();
              });
            }
          }, measureDuration);

          toneLoop.start(0);
          toneLoopsRef.current.push(toneLoop);
        });
      });
    });

    // Cleanup function
    return () => {
      toneLoopsRef.current.forEach((toneLoop) => toneLoop.dispose());
      toneLoopsRef.current = [];
      synth.dispose();
    };
  }, [loops, bpm]);

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

  return (
    <>
      <h1>Vite + React</h1>
      <div>
        <textarea></textarea>
        <button>Execute</button>
      </div>

      <div className="card">
        <button onClick={toggle}>Toggle</button>
      </div>
    </>
  );
}

export default App;
