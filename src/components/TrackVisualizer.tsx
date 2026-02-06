import { useEffect, useState } from "react";
import { Track } from "../lib/types.ts";
import "./TrackVisualizer.css";

interface TrackVisualizerProps {
  tracks: Track[];
  globalStepRef: React.RefObject<number>;
}

function getFixedTracks(tracks: Track[]): (Track | null)[] {
  const fixedTracks: (Track | null)[] = [];
  for (let i = 0; i < 8; i++) {
    const track = tracks.find(t => t.id === i);
    fixedTracks.push(track || null);
  }
  return fixedTracks;
}

export function TrackVisualizer({ tracks, globalStepRef }: TrackVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // RAF loop for smooth updates at 30fps
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 1000 / 30; // 30fps

    const updateStep = (timestamp: number) => {
      if (timestamp - lastUpdate >= UPDATE_INTERVAL) {
        setCurrentStep(globalStepRef.current);
        lastUpdate = timestamp;
      }
      rafId = requestAnimationFrame(updateStep);
    };

    rafId = requestAnimationFrame(updateStep);
    return () => cancelAnimationFrame(rafId);
  }, [globalStepRef]);

  const fixedTracks = getFixedTracks(tracks);

  return (
    <div className="track-visualizer">
      {fixedTracks.map((track, index) => {
        if (track === null) {
          // Empty track placeholder
          return (
            <div key={index} className="track-row track-row--empty">
              <div className="track-header">
                Track {index}: (empty)
              </div>
              <div className="pattern-grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="pattern-cell pattern-cell--placeholder" />
                ))}
              </div>
            </div>
          );
        }

        // Calculate local step position (0-15)
        const localStep = currentStep % 16;

        // Apply offset (shift pattern to the left)
        const adjustedLocalStep = (localStep + track.offset) % 16;

        // Build modifiers string
        const modifiers = [];
        if (track.gain !== 1) modifiers.push(`gain:${track.gain}`);
        if (track.pan !== 0) modifiers.push(`pan:${track.pan}`);
        if (track.prob !== 1) modifiers.push(`prob:${track.prob}`);
        if (track.offset !== 0) modifiers.push(`offset:${track.offset}`);

        // Get the pattern array from params
        const pattern = track.params?.pattern || [];

        // Row class based on playing state
        const rowClass = `track-row ${track.isPlaying ? 'track-row--playing' : 'track-row--stopped'}`;

        return (
          <div key={track.id} className={rowClass}>
            <div className="track-header">
              Track {track.id}: {track.voice} {track.pattern}{" "}
              {modifiers.length > 0 && `${modifiers.join(" ")} `}
              {track.isPlaying ? "▶" : "⏸"}
            </div>
            <div className="pattern-grid">
              {Array.from({ length: 16 }).map((_, i) => {
                // Get value from pattern (pattern repeats to fill 16 steps)
                const patternValue = pattern[i % pattern.length];
                const isCurrentStep = i === adjustedLocalStep && track.isPlaying;

                let cellClass = "pattern-cell";
                let cellContent = null;

                if (typeof patternValue === "number") {
                  // Pulse pattern (0 or 1)
                  cellClass += patternValue === 0
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
          </div>
        );
      })}
    </div>
  );
}
