// Parse pattern DSL: pulse(hits, steps)
export function parsePattern(patternStr: string): number[] {
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
