import { useEffect, useState } from "react";
import * as Tone from "tone";
import "./App.css";
import { loop, Loop, measure, phrase } from "./music.ts";

function App() {
  const [started, setStarted] = useState(false);
  const [loops, setLoops] = useState<Loop[]>([loop().add(phrase().add(measure()))]);
  const bpm = 80;

  useEffect(() => {
    if (started) {
      Tone.start();
    }
  }, [started]);

  function toggle() {
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
