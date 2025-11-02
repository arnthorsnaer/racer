/**
 * Real Sound Adapter
 * Wraps the existing sound-adapter for use with the game
 */

import type { SoundPlayer } from '../types.ts';
import { createSoundAdapter } from './sound-adapter.ts';

export function createRealSound(): SoundPlayer {
	const sound = createSoundAdapter();

	return {
		play(soundName: string): void {
			sound.play(soundName);
		}
	};
}
