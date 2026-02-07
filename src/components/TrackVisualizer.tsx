import { useEffect, useState } from "react";
import * as Tone from "tone";
import { Track } from "../lib/types.ts";
import "./TrackVisualizer.css";

interface TrackVisualizerProps {
  tracks: Track[];
  globalStepRef: React.RefObject<number>;
}

function getFixedTracks(tracks: Track[]): (Track | null)[] {
  const fixedTracks: (Track | null)[] = [];
  for (let i = 0; i < 8; i++) {
    const track = tracks.find((t) => t.id === i);
    fixedTracks.push(track || null);
  }
  return fixedTracks;
}

export function TrackVisualizer({
  tracks,
  globalStepRef,
}: TrackVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Sync visual updates with Tone.js transport for accurate timing
  useEffect(() => {
    const eventId = Tone.getTransport().scheduleRepeat((time) => {
      // Use Tone.Draw to schedule the state update on the main thread
      // Pass the AudioContext time so the draw happens on the nearest animation frame
      Tone.getDraw().schedule(() => {
        if (globalStepRef.current) {
          setCurrentStep(globalStepRef.current);
        }
      }, time);
    }, "16n");

    return () => {
      Tone.getTransport().clear(eventId);
    };
  }, [globalStepRef]);

  const fixedTracks = getFixedTracks(tracks);

  return (
    <div className="track-visualizer">
      {/* Header row with step numbers */}
      <div className="track-row track-row--header">
        <div className="track-header"></div>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="pattern-cell pattern-cell--step-number">
            {i + 1}
          </div>
        ))}
      </div>

      {fixedTracks.map((track, index) => {
        if (track === null) {
          // Empty track placeholder
          return (
            <div key={index} className="track-row track-row--empty">
              <div className="track-header">{index}</div>
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="pattern-cell pattern-cell--placeholder"
                />
              ))}
            </div>
          );
        }

        // Calculate local step position (0-15)
        // Note: Don't apply offset here - the pattern is already rotated
        const localStep = currentStep % 16;

        // Build modifiers string
        const modifiers = [];
        if (track.gain !== 1) modifiers.push(`gain:${track.gain}`);
        if (track.pan !== 0) modifiers.push(`pan:${track.pan}`);
        if (track.prob !== 1) modifiers.push(`prob:${track.prob}`);
        if (track.offset !== 0) modifiers.push(`offset:${track.offset}`);

        // Get the pattern array from params
        const pattern = track.params?.pattern || [];

        // Row class based on playing state
        const rowClass = `track-row ${track.isPlaying ? "track-row--playing" : "track-row--stopped"}`;

        return (
          <div key={track.id} className={rowClass}>
            <div className="track-header">
              t{track.id}: {track.voice}{" "}
              {modifiers.length > 0 && `${modifiers.join(" ")} `}
            </div>
            {Array.from({ length: 16 }).map((_, i) => {
              // Get value from pattern (pattern repeats to fill 16 steps)
              const patternValue = pattern[i % pattern.length];
              const isCurrentStep = i === localStep && track.isPlaying;

              let cellClass = "pattern-cell";
              let cellContent = null;

              if (typeof patternValue === "number") {
                // Pulse pattern (0 or 1)
                cellClass +=
                  patternValue === 0
                    ? " pattern-cell--empty"
                    : " pattern-cell--filled";
              } else if (typeof patternValue === "string") {
                // Arp pattern (note name)
                cellClass += " pattern-cell--note";
                cellContent = <span className="note-text">{patternValue}</span>;
              }

              if (isCurrentStep) {
                cellClass += " pattern-cell--current";
              }

              return (
                <div key={i} className={cellClass}>
                  {cellContent}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
