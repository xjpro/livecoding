import { Track } from "../lib/types.ts";

interface TrackListProps {
  tracks: Track[];
}

export function TrackList({ tracks }: TrackListProps) {
  return (
    <div className="track-list">
      {tracks.map((track) => {
        const modifiers = [];
        if (track.gain !== 1) modifiers.push(`gain:${track.gain}`);
        if (track.speed !== 1) modifiers.push(`speed:${track.speed}`);
        if (track.pan !== 0) modifiers.push(`pan:${track.pan}`);
        if (track.prob !== 1) modifiers.push(`prob:${track.prob}`);

        return (
          <div key={track.id} className="track-item">
            {track.id}/ voice:{track.voice} {track.pattern}{" "}
            {modifiers.length > 0 && `${modifiers.join(" ")} `}
            {track.isPlaying ? "▶" : "⏸"}
          </div>
        );
      })}
    </div>
  );
}
