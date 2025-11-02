/**
 * Shared Type Definitions - Root Level
 *
 * These types define the contracts between the core game and adapters.
 * They represent the dependency injection interfaces used throughout the application.
 */

/**
 * Input source abstraction - handles user input or automated input
 */
export interface InputSource {
  /**
   * Register callback for input events
   * For keyboard: fires on keypress
   * For auto-type: fires automatically when conditions are met
   */
  onInput(callback: (ch: string) => void): void;

  /**
   * Cleanup input listeners
   */
  cleanup(): void;
}

/**
 * Renderer abstraction - handles display output
 */
export interface Renderer {
  /**
   * Clear the display
   */
  clear(): void;

  /**
   * Render lines to display
   */
  render(lines: string[]): void;

  /**
   * Get current terminal dimensions
   */
  getDimensions(): { width: number; height: number };
}

/**
 * Sound player abstraction - handles audio output
 */
export interface SoundPlayer {
  /**
   * Play a sound by name
   */
  play(soundName: string): void;
}
