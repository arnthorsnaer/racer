/**
 * Real Sound Adapter
 * Wraps the existing sound-adapter for use with the game
 */

import type { SoundPlayer } from '../core/game.js';
import { createSoundAdapter } from './sound-adapter.js';

export function createRealSound(): SoundPlayer {
	const sound = createSoundAdapter();

	return {
		play(soundName: string): void {
			sound.play(soundName);
		}
	};
}
