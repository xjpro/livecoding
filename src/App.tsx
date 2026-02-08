import { useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import "./App.css";
import { applyOffset, resolvePattern, applyOctave } from "./lib/patterns.ts";
import { createSynth, triggerSynth } from "./lib/synths.ts";
import { TrackData, TrackRuntime, Kit } from "./lib/types.ts";
import { TrackVisualizer } from "./components/TrackVisualizer.tsx";
import { getActiveKit, getVoiceConfig } from "./lib/kits.ts";
import { parseNewDSL } from "./lib/dsl.ts";
import {
  extractTrackUpdate,
  isStartStopOnly,
  isHotUpdateOnly,
  resolveTrackState,
} from "./lib/command.ts";

// Track colors matching TrackVisualizer.css rainbow sequence
const TRACK_COLORS = [
  { id: 0, hsl: "0, 100%, 50%" }, // Red
  { id: 1, hsl: "30, 100%, 50%" }, // Orange
  { id: 2, hsl: "60, 100%, 50%" }, // Yellow
  { id: 3, hsl: "120, 100%, 50%" }, // Green
  { id: 4, hsl: "180, 100%, 50%" }, // Cyan
  { id: 5, hsl: "240, 100%, 50%" }, // Blue
  { id: 6, hsl: "270, 100%, 45%" }, // Indigo
  { id: 7, hsl: "300, 100%, 50%" }, // Purple
];

function getGlowStyles(
  tracks: TrackData[],
  pulseIntensity: number,
): React.CSSProperties {
  // Filter to find currently playing tracks
  const playingTracks = tracks.filter((t) => t.isPlaying);

  if (playingTracks.length === 0) {
    // No tracks playing - transparent, no glow
    return {
      "--glow-1": "transparent",
      "--glow-2": "transparent",
      "--glow-3": "transparent",
      "--glow-intensity": "1.0",
    } as React.CSSProperties;
  }

  // Sort playing tracks by ID and take first 3 for visual clarity
  const glowColors = playingTracks
    .sort((a, b) => a.id - b.id)
    .slice(0, 3)
    .map((track) => {
      const color = TRACK_COLORS[track.id];
      return `hsla(${color.hsl}, 0.6)`;
    });

  // Pad with transparent if fewer than 3 tracks playing
  while (glowColors.length < 3) {
    glowColors.push("transparent");
  }

  return {
    "--glow-1": glowColors[0],
    "--glow-2": glowColors[1],
    "--glow-3": glowColors[2],
    "--glow-intensity": pulseIntensity.toString(),
  } as React.CSSProperties;
}

function App() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [bpm, setBpm] = useState(60);
  const [kit, setKit] = useState<Kit | null>(null);
  const [key, setKey] = useState("C");
  const [scale, setScale] = useState("major");

  // Ref to hold current tracks for master clock callback
  const tracksRef = useRef<TrackData[]>([]);
  const globalStepRef = useRef(0);
  const [glowPulse, setGlowPulse] = useState(1.0);

  // Runtime map: live Tone.js objects, keyed by track ID
  const runtimeMapRef = useRef<Map<number, TrackRuntime>>(new Map());

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

  // Recompute arp patterns when key or scale changes
  useEffect(() => {
    if (tracks.length === 0) return;

    setTracks((currentTracks) =>
      currentTracks.map((track) => {
        // Only recompute arp patterns (pulse patterns don't use key/scale)
        if (!track.patternSpec || track.patternSpec.type !== "arp") {
          return track;
        }

        // Resolve pattern with new key/scale
        const basePattern = resolvePattern(track.patternSpec, key, scale);
        const newPattern = applyOffset(basePattern, track.offset);

        // Update the runtime params too (for master clock)
        const runtime = runtimeMapRef.current.get(track.id);
        if (runtime) {
          // We store prob/octave/pattern on TrackData now, but runtime
          // doesn't hold params — the master clock reads from tracksRef
        }

        return {
          ...track,
          parsedPattern: newPattern,
        };
      }),
    );
  }, [key, scale]);

  // Master clock - single source of truth for all track timing
  useEffect(() => {
    const eventId = Tone.getTransport().scheduleRepeat(
      (time) => {
        const currentTracks = tracksRef.current;
        const runtimeMap = runtimeMapRef.current;
        const step = globalStepRef.current;
        let soundTriggered = false;

        currentTracks.forEach((track) => {
          if (!track.isPlaying || track.parsedPattern.length === 0) return;

          const runtime = runtimeMap.get(track.id);
          if (!runtime) return;

          // Apply probability
          if (Math.random() > track.prob) return;

          const pattern = track.parsedPattern;
          const localStep = step % pattern.length;
          const value = pattern[localStep];

          // Check if pattern contains notes (strings) or just rhythm (numbers)
          const isNotePattern = pattern.some((val) => typeof val === "string");

          if (isNotePattern) {
            // Note-based pattern (arp)
            if (typeof value === "string") {
              const noteWithOctave = applyOctave(
                value,
                track.octaveMin,
                track.octaveMax,
              );
              triggerSynth(
                runtime.synth,
                time,
                runtime.voiceConfig,
                noteWithOctave,
              );
              soundTriggered = true;
            }
          } else {
            // Rhythm-based pattern (pulse)
            if (value === 1) {
              triggerSynth(runtime.synth, time, runtime.voiceConfig);
              soundTriggered = true;
            }
          }
        });

        // Trigger glow pulse only when sounds are actually played
        if (soundTriggered) {
          Tone.Draw.schedule(() => {
            setGlowPulse(1.3); // Brighten to 130%
            // Decay back to base after a short duration
            setTimeout(() => setGlowPulse(1.0), 50);
          }, time);
        }

        globalStepRef.current++;
      },
      "16n",
      0,
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Handle Cmd/Ctrl + Enter for command submission
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      const textareaElement = event.currentTarget;

      let commandText = "";

      // Check if text is selected
      if (textareaElement.selectionStart !== textareaElement.selectionEnd) {
        // Use selected text
        commandText = textareaElement.value
          .substring(
            textareaElement.selectionStart,
            textareaElement.selectionEnd,
          )
          .trim();
      } else {
        // Nothing selected - select and submit current line
        const text = textareaElement.value;
        const cursorPos = textareaElement.selectionStart;

        // Find start of current line (search backwards for newline)
        const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;

        // Find end of current line (search forwards for newline)
        let lineEnd = text.indexOf("\n", cursorPos);
        if (lineEnd === -1) lineEnd = text.length;

        // Select the current line
        textareaElement.selectionStart = lineStart;
        textareaElement.selectionEnd = lineEnd;

        // Don't set line text, allow a follow up ctrl+enter to complete
      }

      if (commandText) {
        submitCommand(commandText);
      }
    }

    // Handle Tab key for indentation (insert 2 spaces)
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 2 spaces at cursor position
      const newValue =
        textarea.value.substring(0, start) +
        "  " +
        textarea.value.substring(end);

      setInput(newValue);

      // Move cursor after inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }

  async function submitCommand(commandText: string) {
    if (!commandText) return;

    // Auto-start on first command
    if (!started) {
      await Tone.start();
      setStarted(true);
    }

    // 1. Parse
    const parsed = parseNewDSL(commandText);

    if (parsed.type === "error") {
      console.error(parsed.message);
      return;
    }

    // 2. Global commands → set React state
    if (parsed.type === "global") {
      if (parsed.command === "key") {
        setKey(parsed.value);
      } else if (parsed.command === "scale") {
        setScale(parsed.value);
      } else if (parsed.command === "bpm") {
        const newBpm = parseInt(parsed.value);
        if (!isNaN(newBpm) && newBpm > 0) {
          setBpm(newBpm);
        }
      } else if (parsed.command === "stop") {
        setTracks((tracks) => tracks.map((t) => ({ ...t, isPlaying: false })));
      }
      return;
    }

    // 3. Extract intent
    const trackId = parsed.trackId;
    const update = extractTrackUpdate(parsed.methods);
    const existingData = tracks.find((t) => t.id === trackId);

    // 4. Start/stop only path
    if (isStartStopOnly(update)) {
      if (!existingData) {
        console.error(`Track ${trackId} not found`);
        return;
      }
      if (update.shouldStart && !existingData.isPlaying) {
        setTracks((tracks) =>
          tracks.map((t) => (t.id === trackId ? { ...t, isPlaying: true } : t)),
        );
      }
      if (update.shouldStop && existingData.isPlaying) {
        setTracks((tracks) =>
          tracks.map((t) =>
            t.id === trackId ? { ...t, isPlaying: false } : t,
          ),
        );
      }
      return;
    }

    // 5. Hot path — mutate runtime objects + update React state (no synth recreation)
    if (isHotUpdateOnly(update) && existingData) {
      const runtime = runtimeMapRef.current.get(trackId);
      if (runtime) {
        if (update.gain !== null) {
          runtime.volume.volume.value = Tone.gainToDb(update.gain);
        }
        if (update.pan !== null) {
          runtime.panner.pan.value = update.pan;
        }
      }

      setTracks((tracks) =>
        tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                gain: update.gain ?? t.gain,
                pan: update.pan ?? t.pan,
                prob: update.prob ?? t.prob,
                octaveMin: update.octaveMin ?? t.octaveMin,
                octaveMax: update.octaveMax ?? t.octaveMax,
                dsl: commandText,
              }
            : t,
        ),
      );
      return;
    }

    // 6. Cold path — resolve state, create synth chain, store in runtime map
    const resolved = resolveTrackState(update, existingData, key, scale);

    if (!kit) {
      console.error("Kit not loaded yet");
      return;
    }

    const voiceConfig = getVoiceConfig(kit, resolved.voice);
    if (!voiceConfig) {
      console.error(`Voice "${resolved.voice}" not found in kit "${kit.name}"`);
      return;
    }

    // Dispose of old runtime
    const oldRuntime = runtimeMapRef.current.get(trackId);
    if (oldRuntime) {
      try {
        oldRuntime.synth.dispose();
      } catch (e) {
        console.warn("Error disposing synth:", e);
      }
      oldRuntime.volume.dispose();
      oldRuntime.panner.dispose();
    }

    // Create audio chain: synth -> volume -> panner -> destination
    const synth = createSynth(voiceConfig);
    const volume = new Tone.Volume(Tone.gainToDb(resolved.gain));
    const panner = new Tone.Panner(resolved.pan);
    synth.connect(volume);
    volume.connect(panner);
    panner.toDestination();

    // Store in runtime map
    runtimeMapRef.current.set(trackId, { synth, volume, panner, voiceConfig });

    // Update React state with pure data
    const newTrackData: TrackData = {
      id: trackId,
      voice: resolved.voice,
      patternSpec: resolved.patternSpec,
      parsedPattern: resolved.parsedPattern,
      dsl: commandText,
      isPlaying: resolved.isPlaying,
      gain: resolved.gain,
      pan: resolved.pan,
      prob: resolved.prob,
      offset: resolved.offset,
      octaveMin: resolved.octaveMin,
      octaveMax: resolved.octaveMax,
    };

    setTracks((tracks) => {
      const filtered = tracks.filter((t) => t.id !== trackId);
      return [...filtered, newTrackData].sort((a, b) => a.id - b.id);
    });
  }

  return (
    <div className="app-container" style={getGlowStyles(tracks, glowPulse)}>
      <TrackVisualizer tracks={tracks} globalStepRef={globalStepRef} />

      <div className="app-controls">
        <form onSubmit={(e) => e.preventDefault()}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="// Live coding sequencer - Press Cmd/Ctrl + Enter to execute"
            rows={12}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </form>
      </div>
    </div>
  );
}

export default App;
