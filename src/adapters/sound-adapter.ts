/**
 * Sound adapter - wraps sound library for testability
 * Side effects isolated here
 */

import playSound from 'play-sound';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Sound adapter interface for audio playback
 */
interface SoundAdapter {
  play: (soundName: string) => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a real sound adapter using play-sound library
 */
export const createSoundAdapter = (): SoundAdapter => {
  const player = playSound({});
  let soundEnabled = true;

  return {
    play: (soundName: string) => {
      if (!soundEnabled) return;

      // Navigate from src/adapters/ to sounds/
      const soundPath = path.join(__dirname, '../../sounds', `${soundName}.wav`);
      player.play(soundPath, (err: Error) => {
        if (err && err.message !== 'kill SIGTERM') {
          // Silently ignore errors (sound is optional)
        }
      });
    },

    toggleMute: () => {
      soundEnabled = !soundEnabled;
      return soundEnabled;
    },

    isMuted: () => !soundEnabled,
  };
};

/**
 * Create a mock sound adapter for testing
 */
export const createMockSoundAdapter = (): SoundAdapter & { getPlayHistory: () => string[] } => {
  let soundEnabled = true;
  const playHistory: string[] = [];

  return {
    play: (soundName: string) => {
      if (soundEnabled) {
        playHistory.push(soundName);
      }
    },

    toggleMute: () => {
      soundEnabled = !soundEnabled;
      return soundEnabled;
    },

    isMuted: () => !soundEnabled,

    getPlayHistory: () => [...playHistory],
  };
};
