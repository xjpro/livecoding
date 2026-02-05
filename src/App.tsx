import { useEffect, useState, FormEvent } from "react";
import * as Tone from "tone";
import "./App.css";
import { parsePattern } from "./lib/patterns.ts";
import { createSynth, triggerSynth } from "./lib/synths.ts";
import { Track, Kit } from "./lib/types.ts";
import { CommandLog, CommandLogEntry } from "./components/CommandLog.tsx";
import { TrackList } from "./components/TrackList.tsx";
import { getActiveKit, getVoiceConfig } from "./lib/kits.ts";

function App() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [bpm] = useState(80);
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [nextLogId, setNextLogId] = useState(0);
  const [kit, setKit] = useState<Kit | null>(null);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    // Load the active kit on mount
    getActiveKit().then((loadedKit) => {
      setKit(loadedKit);
      console.log(`Loaded kit: ${loadedKit.name}`, loadedKit.voices);
    });
  }, []);

  useEffect(() => {
    const transport = Tone.getTransport();
    if (started) {
      transport.start();
    } else {
      transport.stop();
    }
  }, [started]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const commandText = input.trim();
    if (!commandText) return; // Skip empty commands

    // Auto-start on first command
    if (!started) {
      await Tone.start();
      setStarted(true);
    }

    const logEntry: CommandLogEntry = {
      id: nextLogId,
      timestamp: Date.now(),
      command: commandText,
      status: "success",
    };

    // Parse DSL: [trackId][whitespace][command parts...]
    const match = input.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      logEntry.status = "error";
      logEntry.errorMessage =
        "Invalid format. Expected: [track#] [command parts]";
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      console.error(logEntry.errorMessage);
      return;
    }

    const trackId = parseInt(match[1]);
    const commandParts = match[2].trim().split(/\s+/);

    // Parse command parts
    let voice: string | null = null;
    let patternStr: string | null = null;
    let gain: number | null = null;
    let speed: number | null = null;
    let pan: number | null = null;
    let prob: number | null = null;
    let shouldStart = false;
    let shouldStop = false;

    for (const part of commandParts) {
      if (part.startsWith("voice:")) {
        voice = part.substring(6);
      } else if (part.startsWith("pulse:")) {
        patternStr = part;
      } else if (part.startsWith("gain:")) {
        gain = parseFloat(part.substring(5));
      } else if (part.startsWith("speed:")) {
        speed = parseFloat(part.substring(6));
      } else if (part.startsWith("pan:")) {
        pan = parseFloat(part.substring(4));
      } else if (part.startsWith("prob:")) {
        prob = parseFloat(part.substring(5));
      } else if (part === "start") {
        shouldStart = true;
      } else if (part === "stop") {
        shouldStop = true;
      }
    }

    // Get existing track or prepare defaults
    const existingTrack = tracks.find((t) => t.id === trackId);

    // If only start/stop commands with no other changes
    if (!voice && !patternStr && !gain && !speed && !pan && !prob) {
      if (!existingTrack) {
        logEntry.status = "error";
        logEntry.errorMessage = `Track ${trackId} not found`;
        setCommandLog((prev) => [...prev, logEntry]);
        setNextLogId((id) => id + 1);
        console.error(logEntry.errorMessage);
        setInput("");
        return;
      }

      if (shouldStart && !existingTrack.isPlaying && existingTrack.sequence) {
        const startTime = Tone.getTransport().state === "started" ? "@1m" : 0;
        existingTrack.sequence.start(startTime);
        setTracks((tracks) =>
          tracks.map((t) => (t.id === trackId ? { ...t, isPlaying: true } : t)),
        );
      }

      if (shouldStop && existingTrack.isPlaying && existingTrack.sequence) {
        const stopTime = Tone.getTransport().state === "started" ? "@1m" : 0;
        existingTrack.sequence.stop(stopTime);
        setTracks((tracks) =>
          tracks.map((t) =>
            t.id === trackId ? { ...t, isPlaying: false } : t,
          ),
        );
      }

      // After the stop command block
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      setInput("");
      return;
    }

    // Merge with existing track properties
    const finalVoice = voice ?? existingTrack?.voice ?? "kick";
    const finalPattern = patternStr ?? existingTrack?.pattern ?? "pulse:4";
    const finalGain = gain ?? existingTrack?.gain ?? 1;
    const finalSpeed = speed ?? existingTrack?.speed ?? 1;
    const finalPan = pan ?? existingTrack?.pan ?? 0;
    const finalProb = prob ?? existingTrack?.prob ?? 1;

    // Get voice configuration from kit
    if (!kit) {
      logEntry.status = "error";
      logEntry.errorMessage = "Kit not loaded yet";
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      console.error(logEntry.errorMessage);
      setInput("");
      return;
    }

    const voiceConfig = getVoiceConfig(kit, finalVoice);
    if (!voiceConfig) {
      logEntry.status = "error";
      logEntry.errorMessage = `Voice "${finalVoice}" not found in kit "${kit.name}"`;
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      console.error(logEntry.errorMessage);
      setInput("");
      return;
    }

    // Dispose of old track resources if they exist
    if (existingTrack?.sequence) {
      const stopTime = Tone.getTransport().state === "started" ? "@1m" : 0;
      existingTrack.sequence.stop(stopTime);
      existingTrack.sequence.dispose();
    }
    if (existingTrack?.synth) {
      existingTrack.synth.dispose();
    }
    if (existingTrack?.volume) {
      existingTrack.volume.dispose();
    }
    if (existingTrack?.panner) {
      existingTrack.panner.dispose();
    }

    // Create audio chain: synth -> volume -> panner -> destination
    const synth = createSynth(voiceConfig);
    const volume = new Tone.Volume(Tone.gainToDb(finalGain));
    const panner = new Tone.Panner(finalPan);

    // Connect the audio chain
    synth.connect(volume);
    volume.connect(panner);
    panner.toDestination();

    // Parse pattern
    const pattern = parsePattern(finalPattern);

    // Pre-compute active steps to minimize work in the audio callback
    const activeSteps = new Set(
      pattern
        .map((val, idx) => (val === 1 ? idx : -1))
        .filter((idx) => idx !== -1),
    );

    // Create Tone.js sequence
    const sequence = new Tone.Sequence(
      (time, step) => {
        // Apply probability
        if (Math.random() > finalProb) return;

        // Check if step is active
        if (activeSteps.has(step)) {
          triggerSynth(synth, time, voiceConfig);
        }
      },
      Array.from({ length: pattern.length }, (_, i) => i),
      "16n", // Each step is a 16th note
    );

    sequence.loop = true;

    // Apply speed modifier
    sequence.playbackRate = finalSpeed;

    // Determine if track should be playing
    const willBePlaying = shouldStop
      ? false
      : shouldStart
        ? true
        : (existingTrack?.isPlaying ?? true);

    // Start sequence if it should be playing
    if (willBePlaying) {
      if (Tone.getTransport().state === "started") {
        sequence.start("@1m");
      } else {
        sequence.start(0);
      }
    }

    // Update tracks
    const newTrack: Track = {
      id: trackId,
      voice: finalVoice,
      pattern: finalPattern,
      dsl: input,
      sequence,
      isPlaying: willBePlaying,
      gain: finalGain,
      speed: finalSpeed,
      pan: finalPan,
      prob: finalProb,
      synth,
      volume,
      panner,
    };

    setTracks((tracks) => {
      const filtered = tracks.filter((t) => t.id !== trackId);
      return [...filtered, newTrack].sort((a, b) => a.id - b.id);
    });

    setCommandLog((prev) => [...prev, logEntry]);
    setNextLogId((id) => id + 1);
    setInput("");
  }

  return (
    <div className="app-container">
      <TrackList tracks={tracks} />

      <CommandLog entries={commandLog} />

      <div className="app-controls">
        <form onSubmit={submit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 0 voice:kick pulse:4 or 0 stop"
          />
        </form>
      </div>
    </div>
  );
}

export default App;
