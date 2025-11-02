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
