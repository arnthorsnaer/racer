/**
 * Auto-Type Input Adapter
 * Automatically types letters when they appear at the catch line
 * Used for demo mode to showcase the game
 */

import type { InputSource } from '../../src/types.ts';
import type { GameState } from '../../src/core/types.ts';

interface AutoTypeOptions {
  /** Milliseconds between auto-type checks */
  interval: number;
  /** Position of the catch line */
  catchLinePosition: number;
}

/**
 * Extended InputSource that supports state access for auto-typing
 */
export interface AutoTypeInputSource extends InputSource {
  /**
   * Provide access to current game state
   * This allows the adapter to check the catch line and current target
   */
  setStateAccessor(accessor: () => { gameState: GameState; currentTarget: string }): void;
}

export const createAutoTypeInput = (options: AutoTypeOptions): AutoTypeInputSource => {
  const { interval, catchLinePosition } = options;
  let intervalId: NodeJS.Timeout | null = null;
  let callback: ((ch: string) => void) | null = null;
  let gameStateAccessor: (() => { gameState: GameState; currentTarget: string }) | null = null;

  return {
    onInput(cb: (ch: string) => void): void {
      callback = cb;

      // Start auto-typing interval
      intervalId = setInterval(() => {
        if (!callback || !gameStateAccessor) return;

        const { gameState, currentTarget } = gameStateAccessor();
        const nextExpectedChar = currentTarget[gameState.typedProgress.length];
        const itemAtCatchLine = gameState.board[catchLinePosition];

        // Only type if there's a letter at the catch line that matches what we need
        if (itemAtCatchLine?.generated && nextExpectedChar !== undefined) {
          const letterAtCatch = itemAtCatchLine.generated;

          if (letterAtCatch.toLowerCase() === nextExpectedChar.toLowerCase()) {
            callback(letterAtCatch);
          }
        }
      }, interval);
    },

    cleanup(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      callback = null;
      gameStateAccessor = null;
    },

    setStateAccessor(accessor: () => { gameState: GameState; currentTarget: string }): void {
      gameStateAccessor = accessor;
    },
  };
};
