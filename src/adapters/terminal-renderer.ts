/**
 * Terminal Renderer Adapter
 * Wraps the existing terminal-adapter for use with the game
 */

import type { Renderer } from '../types.ts';
import { createTerminalAdapter } from './terminal-adapter.ts';

export function createTerminalRenderer(): Renderer {
  const terminal = createTerminalAdapter();

  return {
    clear(): void {
      terminal.clear();
    },

    render(lines: string[]): void {
      lines.forEach((line) => terminal.log(line));
    },

    getDimensions(): { width: number; height: number } {
      return terminal.getDimensions();
    },
  };
}
