import { useEffect, useState, useRef, FormEvent } from "react";
import * as Tone from "tone";
import "./App.css";
import { parsePattern, applyOffset } from "./lib/patterns.ts";
import { createSynth, triggerSynth } from "./lib/synths.ts";
import { Track, Kit, TrackParams } from "./lib/types.ts";
import { CommandLog, CommandLogEntry } from "./components/CommandLog.tsx";
import { TrackList } from "./components/TrackList.tsx";
import { getActiveKit, getVoiceConfig } from "./lib/kits.ts";

// Helper function to apply octave to a note
function applyOctave(note: string, octaveMin: number, octaveMax: number): string {
  // Remove existing octave number from note (e.g., "C2" -> "C")
  const noteWithoutOctave = note.replace(/\d+$/, "");

  // Pick random octave in range (inclusive)
  const octave = octaveMin === octaveMax
    ? octaveMin
    : Math.floor(Math.random() * (octaveMax - octaveMin + 1)) + octaveMin;

  return noteWithoutOctave + octave;
}

function App() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [bpm] = useState(60);
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [nextLogId, setNextLogId] = useState(0);
  const [kit, setKit] = useState<Kit | null>(null);
  const [key, setKey] = useState("C");
  const [scale, setScale] = useState("major");

  // Ref to hold current tracks for master clock callback
  const tracksRef = useRef<Track[]>([]);
  const globalStepRef = useRef(0);

  // Keep tracksRef in sync with tracks state
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

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

  // Master clock - single source of truth for all track timing
  useEffect(() => {
    const eventId = Tone.getTransport().scheduleRepeat(
      (time) => {
        const currentTracks = tracksRef.current;
        const step = globalStepRef.current;

        currentTracks.forEach((track) => {
          if (!track.isPlaying || !track.synth || !track.params || !track.voiceConfig) {
            return;
          }

          // Apply probability
          if (Math.random() > track.params.prob) return;

          const pattern = track.params.pattern;
          const localStep = step % pattern.length;
          const value = pattern[localStep];

          // Check if pattern contains notes (strings) or just rhythm (numbers)
          const isNotePattern = pattern.some((val) => typeof val === "string");

          if (isNotePattern) {
            // Note-based pattern (arp)
            if (typeof value === "string") {
              const noteWithOctave = applyOctave(value, track.params.octaveMin, track.params.octaveMax);
              triggerSynth(track.synth, time, track.voiceConfig, noteWithOctave);
            }
          } else {
            // Rhythm-based pattern (pulse)
            if (value === 1) {
              triggerSynth(track.synth, time, track.voiceConfig);
            }
          }
        });

        globalStepRef.current++;
      },
      "16n",
      0
    );

    return () => {
      Tone.getTransport().clear(eventId);
    };
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

    // Check for global commands first (key:, scale:, stop)
    if (input.startsWith("key:")) {
      const newKey = input.substring(4).trim();
      setKey(newKey);
      logEntry.status = "success";
      logEntry.command = `Set key to ${newKey}`;
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      setInput("");
      return;
    }

    if (input.startsWith("scale:")) {
      const newScale = input.substring(6).trim();
      setScale(newScale);
      logEntry.status = "success";
      logEntry.command = `Set scale to ${newScale}`;
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      setInput("");
      return;
    }

    if (input === "stop") {
      // Stop all tracks
      setTracks((tracks) =>
        tracks.map((t) => ({ ...t, isPlaying: false }))
      );
      logEntry.status = "success";
      logEntry.command = "stop";
      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      setInput("");
      return;
    }

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
    let pan: number | null = null;
    let prob: number | null = null;
    let offset: number | null = null;
    let octaveMin: number | null = null;
    let octaveMax: number | null = null;
    let shouldStart = false;
    let shouldStop = false;

    for (const part of commandParts) {
      if (part.startsWith("voice:")) {
        voice = part.substring(6);
      } else if (part.startsWith("pulse:")) {
        patternStr = part;
      } else if (part.startsWith("arp:")) {
        patternStr = part;
      } else if (part.startsWith("gain:")) {
        gain = parseFloat(part.substring(5));
      } else if (part.startsWith("pan:")) {
        pan = parseFloat(part.substring(4));
      } else if (part.startsWith("prob:")) {
        prob = parseFloat(part.substring(5));
      } else if (part.startsWith("offset:")) {
        offset = parseInt(part.substring(7));
      } else if (part.startsWith("oct:")) {
        const octaveStr = part.substring(4);
        if (octaveStr.includes(",")) {
          // Range: oct:1,3
          const [min, max] = octaveStr.split(",").map((s) => parseInt(s.trim()));
          octaveMin = min;
          octaveMax = max;
        } else {
          // Single octave: oct:2
          const octave = parseInt(octaveStr);
          octaveMin = octave;
          octaveMax = octave;
        }
      } else if (part === "start") {
        shouldStart = true;
      } else if (part === "stop") {
        shouldStop = true;
      }
    }

    // Get existing track or prepare defaults
    const existingTrack = tracks.find((t) => t.id === trackId);

    // If only start/stop commands with no other changes
    if (
      !voice &&
      !patternStr &&
      !gain &&
      !pan &&
      !prob &&
      offset === null &&
      octaveMin === null &&
      octaveMax === null
    ) {
      if (!existingTrack) {
        logEntry.status = "error";
        logEntry.errorMessage = `Track ${trackId} not found`;
        setCommandLog((prev) => [...prev, logEntry]);
        setNextLogId((id) => id + 1);
        console.error(logEntry.errorMessage);
        setInput("");
        return;
      }

      if (shouldStart && !existingTrack.isPlaying) {
        setTracks((tracks) =>
          tracks.map((t) => (t.id === trackId ? { ...t, isPlaying: true } : t)),
        );
      }

      if (shouldStop && existingTrack.isPlaying) {
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

    // Check if only hot parameters are changing (no recreation needed)
    const needsRecreation = voice !== null || patternStr !== null || offset !== null;

    if (!needsRecreation && existingTrack) {
      // Update hot parameters directly - no synth recreation
      if (gain !== null && existingTrack.volume) {
        existingTrack.volume.volume.value = Tone.gainToDb(gain);
      }
      if (pan !== null && existingTrack.panner) {
        existingTrack.panner.pan.value = pan;
      }
      if (prob !== null && existingTrack.params) {
        existingTrack.params.prob = prob;
      }
      if ((octaveMin !== null || octaveMax !== null) && existingTrack.params) {
        existingTrack.params.octaveMin = octaveMin ?? existingTrack.params.octaveMin;
        existingTrack.params.octaveMax = octaveMax ?? existingTrack.params.octaveMax;
      }

      // Update React state with new parameter values
      setTracks((tracks) =>
        tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                gain: gain ?? t.gain,
                pan: pan ?? t.pan,
                prob: prob ?? t.prob,
                octaveMin: octaveMin ?? t.octaveMin,
                octaveMax: octaveMax ?? t.octaveMax,
                dsl: input,
              }
            : t,
        ),
      );

      setCommandLog((prev) => [...prev, logEntry]);
      setNextLogId((id) => id + 1);
      setInput("");
      return;
    }

    // Merge with existing track properties
    const finalVoice = voice ?? existingTrack?.voice ?? "kick";
    const finalPattern = patternStr ?? existingTrack?.pattern ?? "pulse:4";
    const finalGain = gain ?? existingTrack?.gain ?? 1;
    const finalPan = pan ?? existingTrack?.pan ?? 0;
    const finalProb = prob ?? existingTrack?.prob ?? 1;
    const finalOffset = offset ?? existingTrack?.offset ?? 0;
    const finalOctaveMin = octaveMin ?? existingTrack?.octaveMin ?? 2;
    const finalOctaveMax = octaveMax ?? existingTrack?.octaveMax ?? 2;

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

    // Dispose of old track resources synchronously
    if (existingTrack?.synth) {
      try {
        existingTrack.synth.dispose();
      } catch (e) {
        // Ignore errors from disposing unstarted Players
        console.warn("Error disposing synth:", e);
      }
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

    // Parse pattern and apply offset
    const basePattern = parsePattern(finalPattern, key, scale);
    const parsedPattern = applyOffset(basePattern, finalOffset);

    // Create mutable params object for master clock to read
    const params: TrackParams = {
      prob: finalProb,
      pattern: parsedPattern,
      octaveMin: finalOctaveMin,
      octaveMax: finalOctaveMax,
    };

    // Determine if track should be playing
    const willBePlaying = shouldStop
      ? false
      : shouldStart
        ? true
        : (existingTrack?.isPlaying ?? true);

    // Update tracks
    const newTrack: Track = {
      id: trackId,
      voice: finalVoice,
      pattern: finalPattern,
      dsl: input,
      isPlaying: willBePlaying,
      gain: finalGain,
      pan: finalPan,
      prob: finalProb,
      offset: finalOffset,
      octaveMin: finalOctaveMin,
      octaveMax: finalOctaveMax,
      synth,
      volume,
      panner,
      params,
      voiceConfig,
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
            placeholder="e.g. 0 voice:kick pulse:4, 0 stop, or stop (all)"
          />
        </form>
      </div>
    </div>
  );
}

export default App;
