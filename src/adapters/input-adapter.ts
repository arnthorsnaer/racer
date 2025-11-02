/**
 * Input adapter - wraps keypress library and stdin for testability
 * Side effects isolated here
 */

import keypress from 'keypress';
import type { Key, KeypressHandler } from './types.ts';

/**
 * Input adapter interface for keyboard input
 */
interface InputAdapter {
	initialize: () => void;
	onKeypress: (handler: KeypressHandler) => void;
	cleanup: () => void;
}

/**
 * Create a real input adapter using keypress library
 */
export const createInputAdapter = (): InputAdapter => {
	let isInitialized = false;

	return {
		initialize: () => {
			if (isInitialized) return;

			// Make `process.stdin` begin emitting "keypress" events
			keypress(process.stdin);

			// Set encoding to UTF-8 to properly handle accented characters
			process.stdin.setEncoding('utf8');

			if (process.stdin.isTTY) {
				process.stdin.setRawMode(true);
			}
			process.stdin.resume();

			isInitialized = true;
		},

		onKeypress: (handler: KeypressHandler) => {
			process.stdin.on('keypress', handler);
		},

		cleanup: () => {
			process.stdin.pause();
			if (process.stdin.isTTY) {
				process.stdin.setRawMode(false);
			}
		},
	};
};

/**
 * Create a mock input adapter for testing
 */
export const createMockInputAdapter = (): InputAdapter & {
	simulateKeypress: (ch: string, key: Key) => void;
} => {
	let handler: KeypressHandler | null = null;

	return {
		initialize: () => {
			// Mock initialization - no-op
		},

		onKeypress: (h: KeypressHandler) => {
			handler = h;
		},

		cleanup: () => {
			handler = null;
		},

		simulateKeypress: (ch: string, key: Key) => {
			if (handler) {
				handler(ch, key);
			}
		},
	};
};
