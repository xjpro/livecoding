import { useEffect, useState, FormEvent } from "react";
import * as Tone from "tone";
import "./App.css";

function App() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);

  const bpm = 80;

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTracks((tracks) => [...tracks, input]);
    setInput("");
  }

  return (
    <>
      <h1>Vite + React</h1>
      <div>
        {tracks.map((track) => (
          <div>{track}</div>
        ))}
      </div>

      <form onSubmit={submit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <div className="card">
        <button onClick={toggle}>Toggle</button>
      </div>
    </>
  );
}

export default App;
