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
    let loaded = false;

    // Try loading .json config first
    try {
      const jsonResponse = await fetch(`/kits/${kitName}/${voiceName}.json`);
      if (jsonResponse.ok) {
        const synthConfig = await jsonResponse.json();
        const voiceConfig: VoiceConfig = {
          ...synthConfig,
          type: "synth" as const,
        };
        voices.set(voiceName, voiceConfig);
        loaded = true;
      }
    } catch (error) {
      // JSON file doesn't exist or failed to parse, try samples
    }

    // If JSON didn't load, try loading sample files
    if (!loaded) {
      for (const ext of ['.wav', '.mp3', '.ogg']) {
        try {
          const sampleResponse = await fetch(`/kits/${kitName}/${voiceName}${ext}`);
          if (sampleResponse.ok) {
            const voiceConfig: VoiceConfig = {
              name: voiceName,
              type: "sample" as const,
              sampleUrl: `/kits/${kitName}/${voiceName}${ext}`,
            };
            voices.set(voiceName, voiceConfig);
            console.log(`Loaded sample: ${voiceName}${ext}`);
            loaded = true;
            break;
          }
        } catch (error) {
          // This extension doesn't exist, try next
        }
      }
    }

    if (!loaded) {
      console.warn(`Could not load voice ${voiceName} from kit ${kitName}`);
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
