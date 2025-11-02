/**
 * Adapter Type Definitions
 *
 * Types specific to adapter implementations that abstract
 * external dependencies (keyboard, terminal, sound, etc.)
 */

// ============================================================================
// Input Adapter Types
// ============================================================================

/**
 * Key information from keypress events
 */
export interface Key {
	name: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
}

/**
 * Handler function for keypress events
 */
export type KeypressHandler = (ch: string, key: Key) => void;

/**
 * Input adapter interface for keyboard input
 */
export interface InputAdapter {
	initialize: () => void;
	onKeypress: (handler: KeypressHandler) => void;
	cleanup: () => void;
}

// ============================================================================
// Sound Adapter Types
// ============================================================================

/**
 * Sound adapter interface for audio playback
 */
export interface SoundAdapter {
	play: (soundName: string) => void;
	toggleMute: () => boolean;
	isMuted: () => boolean;
}

// ============================================================================
// Terminal Adapter Types
// ============================================================================

/**
 * Terminal dimensions
 */
export interface TerminalDimensions {
	width: number;
	height: number;
}

/**
 * Terminal adapter interface for console output
 */
export interface TerminalAdapter {
	clear: () => void;
	log: (message: string) => void;
	getDimensions: () => TerminalDimensions;
}
