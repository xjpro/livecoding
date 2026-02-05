import type { Kit, VoiceConfig } from "./types";

// Active kit - hardcoded to "first-post" for now
const ACTIVE_KIT = "first-post";

// Cache for loaded voices
let kitCache: Kit | null = null;

interface KitManifest {
  name: string;
  description: string;
  voices: string[];
}

export async function loadKit(kitName: string): Promise<Kit> {
  const voices = new Map<string, VoiceConfig>();

  // Load kit manifest
  const manifestResponse = await fetch(`/kits/${kitName}/kit.json`);
  if (!manifestResponse.ok) {
    throw new Error(`Failed to load kit manifest for ${kitName}`);
  }
  const manifest: KitManifest = await manifestResponse.json();

  // Load each voice from the manifest
  for (const voiceName of manifest.voices) {
    try {
      const response = await fetch(`/kits/${kitName}/${voiceName}.json`);
      if (response.ok) {
        const voiceConfig: VoiceConfig = await response.json();
        voices.set(voiceName, voiceConfig);
      }
    } catch (error) {
      console.error(`Failed to load voice ${voiceName} from kit ${kitName}:`, error);
    }
  }

  return {
    name: kitName,
    voices,
  };
}

export async function getActiveKit(): Promise<Kit> {
  if (!kitCache) {
    kitCache = await loadKit(ACTIVE_KIT);
  }
  return kitCache;
}

export function getVoiceConfig(kit: Kit, voiceName: string): VoiceConfig | undefined {
  return kit.voices.get(voiceName.toLowerCase());
}
