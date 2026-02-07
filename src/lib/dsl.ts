// Parse the new DSL syntax
export interface ParsedGlobalCommand {
  type: "global";
  command: "key" | "scale" | "stop" | "bpm";
  value: string;
}

export interface ParsedTrackCommand {
  type: "track";
  trackId: number;
  methods: Array<{ name: string; args: (string | number)[] }>;
}

export interface ParsedError {
  type: "error";
  message: string;
}

export type ParsedCommand = ParsedGlobalCommand | ParsedTrackCommand | ParsedError;

export function parseNewDSL(input: string): ParsedCommand {
  // Remove semicolon and trim
  const cleaned = input.replace(/;$/, "").trim();

  // Global commands: key('C') or scale('major')
  if (cleaned.startsWith("key(")) {
    const match = cleaned.match(/^key\(['"](.+)['"]\)$/);
    if (match) {
      return { type: "global", command: "key", value: match[1] };
    }
    return { type: "error", message: "Invalid key() syntax" };
  }

  if (cleaned.startsWith("scale(")) {
    const match = cleaned.match(/^scale\(['"](.+)['"]\)$/);
    if (match) {
      return { type: "global", command: "scale", value: match[1] };
    }
    return { type: "error", message: "Invalid scale() syntax" };
  }

  // Global bpm command: bpm(120)
  if (cleaned.startsWith("bpm(")) {
    const match = cleaned.match(/^bpm\((\d+)\)$/);
    if (match) {
      return { type: "global", command: "bpm", value: match[1] };
    }
    return { type: "error", message: "Invalid bpm() syntax" };
  }

  // Global stop command: stop()
  if (cleaned === "stop()") {
    return { type: "global", command: "stop", value: "" };
  }

  // Track commands: t0.voice('kick').pulse(4)
  const trackMatch = cleaned.match(/^t(\d+)\.(.+)$/);
  if (!trackMatch) {
    return {
      type: "error",
      message: "Invalid syntax. Expected: t0.method() or key()/scale()",
    };
  }

  const trackId = parseInt(trackMatch[1]);
  const methodChain = trackMatch[2];

  // Parse method calls
  const methods: Array<{ name: string; args: (string | number)[] }> = [];
  const methodRegex = /(\w+)\(([^)]*)\)/g;
  let match;

  while ((match = methodRegex.exec(methodChain)) !== null) {
    const methodName = match[1];
    const argsStr = match[2];

    // Parse arguments
    const args: (string | number)[] = [];
    if (argsStr.trim()) {
      // Split by comma, but respect quotes
      const argMatches = argsStr.match(/(?:[^,'"]+|'[^']*'|"[^"]*")+/g) || [];
      for (const arg of argMatches) {
        const trimmed = arg.trim();
        // Remove quotes from strings
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          args.push(trimmed.slice(1, -1));
        } else {
          // Try to parse as number
          const num = parseFloat(trimmed);
          args.push(isNaN(num) ? trimmed : num);
        }
      }
    }

    methods.push({ name: methodName, args });
  }

  return { type: "track", trackId, methods };
}
