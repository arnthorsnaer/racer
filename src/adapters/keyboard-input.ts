/**
 * Keyboard Input Adapter
 * Wraps the existing input-adapter for use with the game
 */

import type { InputSource } from '../core/game.js';
import { createInputAdapter, type Key } from './input-adapter.js';

export function createKeyboardInput(): InputSource {
	const input = createInputAdapter();

	return {
		onInput(callback: (ch: string) => void): void {
			// Initialize input handling
			input.initialize();

			// Register keypress handler with adapter
			input.onKeypress((ch: string, key: Key) => {
				// Handle Ctrl+C to quit
				if (key && key.ctrl && key.name === 'c') {
					this.cleanup();
					console.log('\n\nHætti í leik...\n');
					process.exit(0);
				}

				// Skip control characters and special keys (except letters/numbers)
				if (key && (key.name === "enter" || key.name === "return" || key.name === "escape")) {
					return;
				}

				// Only process if we have a valid character
				if (!ch || ch.length === 0) {
					return;
				}

				callback(ch);
			});
		},

		cleanup(): void {
			input.cleanup();
		}
	};
}
