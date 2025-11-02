/**
 * No-Op Sound Adapter
 * Silent sound player for demo mode
 */

import type { SoundPlayer } from '../../src/core/game.ts';

export function createNoopSound(): SoundPlayer {
	return {
		play(_soundName: string): void {
			// Do nothing - silent mode
		}
	};
}
