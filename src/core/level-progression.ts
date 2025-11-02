/**
 * Pure functions for level progression and management
 * No side effects - fully testable without mocks
 */

import { shuffleArray } from './word-generation.ts';
import type { Level } from './types.ts';

// Re-export types for backwards compatibility
export type { Level };

/**
 * FR-003: Create a randomized order of level indices
 * Pure function - same input produces same output (given same Math.random sequence)
 */
export const createShuffledLevelIndices = (levels: Level[]): number[] => {
  return shuffleArray(levels.map((_, index) => index));
};

/**
 * Get the actual level based on shuffled indices
 */
export const getActualLevel = (
  shuffledIndices: number[],
  currentLevelIndex: number,
  levels: Level[]
): Level => {
  const actualIndex = shuffledIndices[currentLevelIndex];
  if (actualIndex === undefined) {
    throw new Error('Invalid level index');
  }
  const level = levels[actualIndex];
  if (!level) {
    throw new Error('Level not found');
  }
  return level;
};

/**
 * Check if there's a next level available
 */
export const hasNextLevel = (currentLevelIndex: number, totalLevels: number): boolean => {
  return currentLevelIndex + 1 < totalLevels;
};

/**
 * Get the next level index
 */
export const getNextLevelIndex = (currentLevelIndex: number): number => {
  return currentLevelIndex + 1;
};
