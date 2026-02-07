import type { PatternSpec, PatternValue } from "./patterns";
import { resolvePattern, applyOffset, generateOn, applyOnModifier, applyOffModifier } from "./patterns";
import type { TrackData } from "./types";

// What a single command intends to change (null = "not specified")
export interface TrackUpdate {
  voice: string | null;
  patternSpec: PatternSpec | null;
  onSteps: number[];
  offSteps: number[];
  gain: number | null;
  pan: number | null;
  prob: number | null;
  offset: number | null;
  octaveMin: number | null;
  octaveMax: number | null;
  shouldStart: boolean;
  shouldStop: boolean;
}

// Result of resolving an update against existing track state
export interface ResolvedTrackState {
  voice: string;
  patternSpec: PatternSpec | null;
  parsedPattern: PatternValue[];
  gain: number;
  pan: number;
  prob: number;
  offset: number;
  octaveMin: number;
  octaveMax: number;
  isPlaying: boolean;
}

// Extract a TrackUpdate from parsed method calls (pure)
export function extractTrackUpdate(
  methods: Array<{ name: string; args: (string | number)[] }>,
): TrackUpdate {
  let voice: string | null = null;
  let patternSpec: PatternSpec | null = null;
  let onSteps: number[] = [];
  let offSteps: number[] = [];
  let gain: number | null = null;
  let pan: number | null = null;
  let prob: number | null = null;
  let offset: number | null = null;
  let octaveMin: number | null = null;
  let octaveMax: number | null = null;
  let shouldStart = false;
  let shouldStop = false;

  for (const method of methods) {
    switch (method.name) {
      case "voice":
        if (method.args.length > 0 && typeof method.args[0] === "string") {
          voice = method.args[0];
        }
        break;
      case "pulse":
        if (method.args.length === 1 && typeof method.args[0] === "number") {
          patternSpec = { type: "pulse", hits: method.args[0], steps: 16 };
        } else if (
          method.args.length === 2 &&
          typeof method.args[0] === "number" &&
          typeof method.args[1] === "number"
        ) {
          patternSpec = { type: "pulse", hits: method.args[0], steps: method.args[1] };
        }
        break;
      case "euclid":
        if (method.args.length === 1 && typeof method.args[0] === "number") {
          patternSpec = { type: "euclid", k: method.args[0], n: 16 };
        } else if (
          method.args.length === 2 &&
          typeof method.args[0] === "number" &&
          typeof method.args[1] === "number"
        ) {
          patternSpec = { type: "euclid", k: method.args[0], n: method.args[1] };
        }
        break;
      case "on":
        if (method.args.length > 0) {
          onSteps = method.args.filter((arg): arg is number => typeof arg === "number");
        }
        break;
      case "off":
        if (method.args.length > 0) {
          offSteps = method.args.filter((arg): arg is number => typeof arg === "number");
        }
        break;
      case "arp":
        if (method.args.length > 0) {
          const degrees = method.args.filter((arg): arg is number => typeof arg === "number");
          if (degrees.length > 0) {
            patternSpec = { type: "arp", degrees };
          }
        }
        break;
      case "gain":
        if (method.args.length > 0 && typeof method.args[0] === "number") {
          gain = method.args[0];
        }
        break;
      case "pan":
        if (method.args.length > 0 && typeof method.args[0] === "number") {
          pan = method.args[0];
        }
        break;
      case "prob":
        if (method.args.length > 0 && typeof method.args[0] === "number") {
          prob = method.args[0];
        }
        break;
      case "offset":
        if (method.args.length > 0 && typeof method.args[0] === "number") {
          offset = method.args[0];
        }
        break;
      case "oct":
        if (method.args.length === 1 && typeof method.args[0] === "number") {
          octaveMin = method.args[0];
          octaveMax = method.args[0];
        } else if (
          method.args.length === 2 &&
          typeof method.args[0] === "number" &&
          typeof method.args[1] === "number"
        ) {
          octaveMin = method.args[0];
          octaveMax = method.args[1];
        }
        break;
      case "start":
        shouldStart = true;
        break;
      case "stop":
        shouldStop = true;
        break;
    }
  }

  return {
    voice,
    patternSpec,
    onSteps,
    offSteps,
    gain,
    pan,
    prob,
    offset,
    octaveMin,
    octaveMax,
    shouldStart,
    shouldStop,
  };
}

// Pure predicate: only start/stop with no data changes
export function isStartStopOnly(update: TrackUpdate): boolean {
  return (
    !update.voice &&
    !update.patternSpec &&
    update.onSteps.length === 0 &&
    update.offSteps.length === 0 &&
    update.gain === null &&
    update.pan === null &&
    update.prob === null &&
    update.offset === null &&
    update.octaveMin === null &&
    update.octaveMax === null
  );
}

// Pure predicate: only hot params changing (no synth recreation needed)
export function isHotUpdateOnly(update: TrackUpdate): boolean {
  return (
    update.voice === null &&
    update.patternSpec === null &&
    update.onSteps.length === 0 &&
    update.offSteps.length === 0 &&
    update.offset === null
  );
}

// Merge update with existing track data, resolve pattern. Returns all computed values.
export function resolveTrackState(
  update: TrackUpdate,
  existingData: TrackData | undefined,
  key: string,
  scale: string,
): ResolvedTrackState {
  const finalVoice = update.voice ?? existingData?.voice ?? "kick";
  const finalGain = update.gain ?? existingData?.gain ?? 1;
  const finalPan = update.pan ?? existingData?.pan ?? 0;
  const finalProb = update.prob ?? existingData?.prob ?? 1;
  const finalOffset = update.offset ?? existingData?.offset ?? 0;
  const finalOctaveMin = update.octaveMin ?? existingData?.octaveMin ?? 2;
  const finalOctaveMax = update.octaveMax ?? existingData?.octaveMax ?? 2;

  // Determine final pattern
  let finalPatternSpec: PatternSpec | null;
  let finalParsedPattern: PatternValue[];

  if (update.patternSpec) {
    // New base pattern was specified
    finalPatternSpec = update.patternSpec;
    finalParsedPattern = resolvePattern(update.patternSpec, key, scale);
  } else if (existingData?.patternSpec) {
    // No new base pattern, re-resolve from existing spec
    finalPatternSpec = existingData.patternSpec;
    finalParsedPattern = existingData.parsedPattern
      ? [...existingData.parsedPattern]
      : resolvePattern(existingData.patternSpec, key, scale);
  } else {
    finalPatternSpec = null;
    finalParsedPattern = [];
  }

  // Apply on/off operations
  if (update.onSteps.length > 0) {
    if (finalParsedPattern.length === 0) {
      finalParsedPattern = generateOn(update.onSteps);
      finalPatternSpec = { type: "on", steps: update.onSteps };
    } else {
      finalParsedPattern = applyOnModifier(finalParsedPattern, update.onSteps);
    }
  }

  if (update.offSteps.length > 0) {
    finalParsedPattern = applyOffModifier(finalParsedPattern, update.offSteps);
  }

  // Apply offset
  const parsedPattern = applyOffset(finalParsedPattern, finalOffset);

  // Determine playing state
  const willBePlaying = update.shouldStop
    ? false
    : update.shouldStart
      ? true
      : (existingData?.isPlaying ?? true);

  return {
    voice: finalVoice,
    patternSpec: finalPatternSpec,
    parsedPattern,
    gain: finalGain,
    pan: finalPan,
    prob: finalProb,
    offset: finalOffset,
    octaveMin: finalOctaveMin,
    octaveMax: finalOctaveMax,
    isPlaying: willBePlaying,
  };
}
