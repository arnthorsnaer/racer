/**
 * Pure functions for word pool management
 * Organizes words by length and handles selection with anti-repetition
 */

import { Level } from './level-progression.js';

export interface WordsByLength {
	[length: number]: string[];
}

/**
 * Filter levels to only include single words (no spaces)
 *
 * @param levels - All available levels
 * @returns Only levels with single words
 */
export const filterSingleWords = (levels: Level[]): Level[] => {
	return levels.filter(level => !level.target.includes(' '));
};

/**
 * Organize words by their character length
 *
 * @param levels - Levels containing single words
 * @returns Map of length -> array of words
 */
export const organizeWordsByLength = (levels: Level[]): WordsByLength => {
	const wordsByLength: WordsByLength = {};

	levels.forEach(level => {
		const length = level.target.length;
		if (!wordsByLength[length]) {
			wordsByLength[length] = [];
		}
		wordsByLength[length].push(level.target);
	});

	return wordsByLength;
};

/**
 * Get all available word lengths in ascending order
 *
 * @param wordsByLength - Organized word pool
 * @returns Sorted array of available lengths
 */
export const getAvailableLengths = (wordsByLength: WordsByLength): number[] => {
	return Object.keys(wordsByLength)
		.map(Number)
		.sort((a, b) => a - b);
};

/**
 * Get the maximum word length available in the pool
 *
 * @param wordsByLength - Organized word pool
 * @returns Maximum word length
 */
export const getMaxWordLength = (wordsByLength: WordsByLength): number => {
	const lengths = getAvailableLengths(wordsByLength);
	return lengths.length > 0 ? lengths[lengths.length - 1] : 3;
};

/**
 * Select a random word at the specified length, avoiding recently used words
 *
 * @param wordsByLength - Organized word pool
 * @param targetLength - Desired word length
 * @param usedWords - Set of recently used words to avoid
 * @returns Random word of target length, or null if none available
 */
export const selectWordAtLength = (
	wordsByLength: WordsByLength,
	targetLength: number,
	usedWords: Set<string> = new Set()
): string | null => {
	const wordsAtLength = wordsByLength[targetLength];

	if (!wordsAtLength || wordsAtLength.length === 0) {
		return null;
	}

	// Filter out used words
	const availableWords = wordsAtLength.filter(word => !usedWords.has(word));

	// If all words at this length have been used, reset and use any
	if (availableWords.length === 0) {
		const randomIndex = Math.floor(Math.random() * wordsAtLength.length);
		return wordsAtLength[randomIndex];
	}

	// Select random from available unused words
	const randomIndex = Math.floor(Math.random() * availableWords.length);
	return availableWords[randomIndex];
};

/**
 * Find the closest available word length if exact target is not available
 *
 * @param wordsByLength - Organized word pool
 * @param targetLength - Desired word length
 * @returns Closest available length
 */
export const findClosestLength = (
	wordsByLength: WordsByLength,
	targetLength: number
): number => {
	const availableLengths = getAvailableLengths(wordsByLength);

	if (availableLengths.length === 0) {
		return targetLength; // Fallback
	}

	// Find closest length
	return availableLengths.reduce((closest, current) => {
		const currentDiff = Math.abs(current - targetLength);
		const closestDiff = Math.abs(closest - targetLength);
		return currentDiff < closestDiff ? current : closest;
	});
};

/**
 * Get count of words available at each length
 * Useful for debugging and ensuring sufficient variety
 *
 * @param wordsByLength - Organized word pool
 * @returns Map of length -> count
 */
export const getWordCounts = (wordsByLength: WordsByLength): { [length: number]: number } => {
	const counts: { [length: number]: number } = {};
	Object.keys(wordsByLength).forEach(length => {
		counts[Number(length)] = wordsByLength[Number(length)].length;
	});
	return counts;
};
