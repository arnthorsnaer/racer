/**
 * Game configuration constants
 * Centralized configuration for all game modes
 */

export const GAME_CONFIG = {
	/** Frame width for rendering */
	FRAME_WIDTH: 50,

	/** Default tick interval for main game (ms) */
	GAME_TICK_INTERVAL: 600,

	/** Auto-type check interval for demo mode (ms) */
	AUTO_TYPE_INTERVAL: 250,

	/** Demo duration (ms) */
	DEMO_DURATION: 18000,

	/** Tick interval for demo mode (ms) - slightly faster */
	DEMO_TICK_INTERVAL: 500,

	/** Starting word length */
	STARTING_WORD_LENGTH: 3,
} as const;
