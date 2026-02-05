// Parse pattern DSL: pulse:hits,steps or pulse(hits, steps)
// Second argument defaults to 16 if not provided
export function parsePattern(patternStr: string): number[] {
  // Try new format: pulse:hits,steps or pulse:hits
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
