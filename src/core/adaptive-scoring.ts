/**
 * Pure functions for adaptive scoring system
 * No side effects - fully testable without mocks
 */

/**
 * The starting word length (3 letters) is considered Level 1
 */
export const STARTING_WORD_LENGTH = 3;

/**
 * Convert word length to level number (1-indexed)
 * Level 1 = 3-letter words, Level 2 = 4-letter words, etc.
 *
 * @param wordLength - The length of words at this difficulty
 * @returns The level number (1-indexed)
 */
export const getLevelFromWordLength = (wordLength: number): number => {
  return wordLength - STARTING_WORD_LENGTH + 1;
};

/**
 * Convert level number back to word length
 *
 * @param level - The level number (1-indexed)
 * @returns The word length for this level
 */
export const getWordLengthFromLevel = (level: number): number => {
  return level + STARTING_WORD_LENGTH - 1;
};

/**
 * Calculate player score based on efficiency
 * Score rewards getting to higher levels with fewer words completed
 *
 * Formula: (completedLevels / completedWords) * 100
 *
 * - Perfect progression (upgrade every time): score = 100
 * - Some practice needed: score < 100
 * - Score never exceeds 100, never goes below 0
 *
 * @param completedLevels - Current level number (1-indexed)
 * @param completedWords - Total number of words completed
 * @returns Score between 0 and 100
 */
export const calculateScore = (completedLevels: number, completedWords: number): number => {
  if (completedWords === 0) return 0;
  if (completedLevels < 0) return 0;

  const score = (completedLevels / completedWords) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
};
