import { Scale, Chord } from "tonal";

// Pattern can be either rhythm (numbers) or notes (strings)
export type PatternValue = number | string;

// Parse pattern DSL: pulse:hits,steps or arp:1,5,4,1
// Supports additive modifiers like: pulse:4|on:3,7
export function parsePattern(
  patternStr: string,
  key: string = "C",
  scale: string = "major",
): PatternValue[] {
  // Split pattern into base and modifiers (e.g., "pulse:4|on:3,7")
  const [basePatternStr, ...modifiers] = patternStr.split("|");
  let pattern: PatternValue[] = [];

  // Parse base pattern
  // Try pulse format: pulse:hits,steps or pulse:hits
  const colonMatch = basePatternStr.match(/pulse:(\d+)(?:,\s*(\d+))?/);
  if (colonMatch) {
    const hits = parseInt(colonMatch[1]);
    const steps = colonMatch[2] ? parseInt(colonMatch[2]) : 16;
    pattern = generatePulse(hits, steps);
  }

  // Try old format: pulse(hits, steps)
  const pulseMatch = basePatternStr.match(/pulse\((\d+),\s*(\d+)\)/);
  if (pulseMatch) {
    const hits = parseInt(pulseMatch[1]);
    const steps = parseInt(pulseMatch[2]);
    pattern = generatePulse(hits, steps);
  }

  // Try euclid format: euclid:k,n or euclid:k (defaults to n=16)
  const euclidMatch = basePatternStr.match(/euclid:(\d+)(?:,\s*(\d+))?/);
  if (euclidMatch) {
    const k = parseInt(euclidMatch[1]);
    const n = euclidMatch[2] ? parseInt(euclidMatch[2]) : 16;
    pattern = generateEuclid(k, n);
  }

  // Try on format as standalone: on:1,5,9,13
  const onMatch = basePatternStr.match(/on:([\d,]+)/);
  if (onMatch) {
    const steps = onMatch[1].split(",").map((d) => parseInt(d.trim()));
    pattern = generateOn(steps);
  }

  // Try arp format: arp:1,1,5,1
  const arpMatch = basePatternStr.match(/arp:([\d,]+)/);
  if (arpMatch) {
    const degrees = arpMatch[1].split(",").map((d) => parseInt(d.trim()));
    pattern = generateArp(degrees, key, scale);
  }

  // Apply modifiers
  for (const modifier of modifiers) {
    const modOnMatch = modifier.match(/on:([\d,]+)/);
    if (modOnMatch) {
      const steps = modOnMatch[1].split(",").map((d) => parseInt(d.trim()));
      pattern = applyOnModifier(pattern, steps);
    }

    const modOffMatch = modifier.match(/off:([\d,]+)/);
    if (modOffMatch) {
      const steps = modOffMatch[1].split(",").map((d) => parseInt(d.trim()));
      pattern = applyOffModifier(pattern, steps);
    }
  }

  return pattern;
}

// Generate pulse pattern (evenly spaced hits)
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

// Generate Euclidean rhythm pattern using Bjorklund's algorithm
// Distributes k hits as evenly as possible across n steps
function generateEuclid(k: number, n: number): number[] {
  const pattern: number[] = new Array(n).fill(0);

  // Edge cases
  if (k === 0 || n === 0 || k > n) return pattern;
  if (k === n) return new Array(n).fill(1);

  // Bjorklund algorithm: for each step i, a hit occurs when
  // floor((i * k) / n) != floor(((i - 1) * k) / n)
  // This places hits at the START of each bucket interval
  for (let i = 0; i < n; i++) {
    const currentBucket = Math.floor((i * k) / n);
    const prevBucket = i > 0 ? Math.floor(((i - 1) * k) / n) : -1;
    if (currentBucket !== prevBucket) {
      pattern[i] = 1;
    }
  }

  return pattern;
}

// Generate pattern with hits on specific steps
export function generateOn(steps: number[]): number[] {
  // Find max step to determine pattern length (default to 16)
  const maxStep = steps.length > 0 ? Math.max(...steps) : 0;
  const patternLength = Math.max(16, maxStep);
  const pattern: number[] = new Array(patternLength).fill(0);

  // Place hits on specified steps (1-indexed, so subtract 1)
  for (const step of steps) {
    if (step >= 1 && step <= patternLength) {
      pattern[step - 1] = 1;
    }
  }

  return pattern;
}

// Apply on modifier to existing pattern (additive - adds hits to the pattern)
export function applyOnModifier(pattern: PatternValue[], steps: number[]): PatternValue[] {
  // Only works with rhythm patterns (number arrays)
  if (pattern.some((val) => typeof val === "string")) {
    console.warn("Cannot apply .on() modifier to note-based patterns (arp)");
    return pattern;
  }

  // Clone the pattern
  const newPattern = [...pattern] as number[];

  // Expand pattern if needed to accommodate all specified steps
  const maxStep = steps.length > 0 ? Math.max(...steps) : 0;
  if (maxStep > newPattern.length) {
    while (newPattern.length < maxStep) {
      newPattern.push(0);
    }
  }

  // Add hits on specified steps (1-indexed, so subtract 1)
  for (const step of steps) {
    if (step >= 1 && step <= newPattern.length) {
      newPattern[step - 1] = 1;
    }
  }

  return newPattern;
}

// Apply off modifier to existing pattern (subtractive - removes hits from the pattern)
export function applyOffModifier(pattern: PatternValue[], steps: number[]): PatternValue[] {
  // Only works with rhythm patterns (number arrays)
  if (pattern.some((val) => typeof val === "string")) {
    console.warn("Cannot apply .off() modifier to note-based patterns (arp)");
    return pattern;
  }

  // Clone the pattern
  const newPattern = [...pattern] as number[];

  // Remove hits on specified steps (1-indexed, so subtract 1)
  for (const step of steps) {
    if (step >= 1 && step <= newPattern.length) {
      newPattern[step - 1] = 0;
    }
  }

  return newPattern;
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
