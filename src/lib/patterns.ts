import { Scale, Chord } from "tonal";

// Pattern can be either rhythm (numbers) or notes (strings)
export type PatternValue = number | string;

// Parse pattern DSL: pulse:hits,steps or arp:1,5,4,1
export function parsePattern(
  patternStr: string,
  key: string = "C",
  scale: string = "major",
): PatternValue[] {
  // Try pulse format: pulse:hits,steps or pulse:hits
  const colonMatch = patternStr.match(/pulse:(\d+)(?:,\s*(\d+))?/);
  if (colonMatch) {
    const hits = parseInt(colonMatch[1]);
    const steps = colonMatch[2] ? parseInt(colonMatch[2]) : 16;
    return generatePulse(hits, steps);
  }

  // Try old format: pulse(hits, steps)
  const pulseMatch = patternStr.match(/pulse\((\d+),\s*(\d+)\)/);
  if (pulseMatch) {
    const hits = parseInt(pulseMatch[1]);
    const steps = parseInt(pulseMatch[2]);
    return generatePulse(hits, steps);
  }

  // Try arp format: arp:1,1,5,1
  const arpMatch = patternStr.match(/arp:([\d,]+)/);
  if (arpMatch) {
    const degrees = arpMatch[1].split(",").map((d) => parseInt(d.trim()));
    return generateArp(degrees, key, scale);
  }

  return [];
}

// Generate euclidean rhythm pattern
function generatePulse(hits: number, steps: number): number[] {
  const pattern: number[] = new Array(steps).fill(0);
  if (hits === 0 || steps === 0) return pattern;

  const interval = steps / hits;
  for (let i = 0; i < hits; i++) {
    const index = Math.floor(i * interval);
    pattern[index] = 1;
  }
  return pattern;
}

// Apply offset to a pattern by rotating it
export function applyOffset(pattern: PatternValue[], offset: number): PatternValue[] {
  if (offset === 0 || pattern.length === 0) return pattern;

  // Normalize offset to be within pattern length
  const normalizedOffset = ((offset % pattern.length) + pattern.length) % pattern.length;

  // Rotate the pattern
  return [...pattern.slice(normalizedOffset), ...pattern.slice(0, normalizedOffset)];
}

// Generate arpeggio pattern based on scale degrees
// Each degree gets 4 steps (one bar in 4/4 time)
function generateArp(
  degrees: number[],
  key: string,
  scaleName: string,
): string[] {
  const pattern: string[] = [];

  // Get scale notes
  const scaleNotes = Scale.get(`${key} ${scaleName}`).notes;
  console.log(scaleNotes)
  if (scaleNotes.length === 0) {
    console.error(`Invalid scale: ${key} ${scaleName}`);
    return new Array(16).fill(0) as unknown as string[];
  }

  // For each degree in the progression
  for (const degree of degrees) {
    // Get the chord built on this scale degree (1-indexed)
    const rootNote = scaleNotes[(degree - 1) % scaleNotes.length];
    const chordQuality = getChordQuality(degree, scaleName);
    const chord = Chord.getChord(chordQuality, rootNote);

    if (chord.notes.length === 0) {
      console.error(`Could not build chord for degree ${degree}`);
      // Fill with rests
      pattern.push(...new Array(4).fill(0));
      continue;
    }

    // Add octave number to each chord note (default to octave 2 for bass)
    const chordNotesWithOctave = chord.notes.map((note) => note + "2");

    // Arpeggiate through chord tones for 4 steps (one bar)
    for (let step = 0; step < 4; step++) {
      pattern.push(chordNotesWithOctave[step % chordNotesWithOctave.length]);
    }
  }

  console.log(pattern)

  return pattern;
}

// Get chord quality for scale degree based on scale type
function getChordQuality(degree: number, scaleName: string): string {
  // Major scale chord qualities: I, ii, iii, IV, V, vi, vii°
  const majorQualities = ["M", "m", "m", "M", "M", "m", "dim"];

  // Minor scale (natural) chord qualities: i, ii°, III, iv, v, VI, VII
  const minorQualities = ["m", "dim", "M", "m", "m", "M", "M"];

  const qualities =
    scaleName.toLowerCase().includes("minor") ||
    scaleName.toLowerCase().includes("aeolian")
      ? minorQualities
      : majorQualities;

  return qualities[(degree - 1) % qualities.length];
}
