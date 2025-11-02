/**
 * Console Renderer Adapter
 * Simple console-based renderer for demo mode
 */

import type { Renderer } from '../../src/types.ts';

interface ConsoleRendererOptions {
  width?: number;
  height?: number;
}

export const createConsoleRenderer = (options: ConsoleRendererOptions = {}): Renderer => {
  const { width = 80, height = 24 } = options;

  return {
    clear(): void {
      console.clear();
    },

    render(lines: string[]): void {
      lines.forEach((line) => console.log(line));
    },

    getDimensions(): { width: number; height: number } {
      return { width, height };
    },
  };
};
