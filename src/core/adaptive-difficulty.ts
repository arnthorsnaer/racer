/**
 * Pure functions for adaptive difficulty progression
 * No side effects - fully testable without mocks
 */

import { PerformanceStats } from './score-calculator.js';

export interface DifficultyState {
	currentWordLength: number; // Current target word length
	minWordLength: number;     // Floor (can't go below this)
	maxWordLength: number;     // Ceiling (can't go above this)
	completedWords: number;    // Total words completed
	usedWords: Set<string>;    // Words already used (to avoid repetition)
}

export interface ProgressionResult {
	newWordLength: number;
	progressionType: 'upgrade' | 'stay' | 'downgrade';
	message: string;
}

/**
 * Determine if performance qualifies for upgrade
 * UPGRADE: 0 errors AND 0 misses (perfect)
 */
export const shouldUpgrade = (stats: PerformanceStats): boolean => {
	return stats.errorCount === 0 && stats.missedLetters === 0;
};

/**
 * Determine if performance qualifies for downgrade
 * DOWNGRADE: Some errors AND some misses (both > 0)
 */
export const shouldDowngrade = (stats: PerformanceStats): boolean => {
	return stats.errorCount > 0 && stats.missedLetters > 0;
};

/**
 * Determine if performance qualifies for staying at same level
 * STAY: (Some errors OR some misses) but not both
 */
export const shouldStay = (stats: PerformanceStats): boolean => {
	return !shouldUpgrade(stats) && !shouldDowngrade(stats);
};

/**
 * Calculate the next word length based on performance
 * Respects min/max bounds and starting length floor
 *
 * @param currentWordLength - Current difficulty word length
 * @param stats - Performance statistics from completed level
 * @param minWordLength - Minimum word length (floor)
 * @param maxWordLength - Maximum word length (ceiling)
 * @returns New word length and progression info
 */
export const calculateNextWordLength = (
	currentWordLength: number,
	stats: PerformanceStats,
	minWordLength: number,
	maxWordLength: number
): ProgressionResult => {
	// UPGRADE: Perfect performance
	if (shouldUpgrade(stats)) {
		const newLength = Math.min(currentWordLength + 1, maxWordLength);
		const isAtMax = newLength === maxWordLength;

		return {
			newWordLength: newLength,
			progressionType: 'upgrade',
			message: isAtMax
				? '★ Frábært! Þú ert á hámarksstigi!'
				: `★ Fullkomið! Að færa þig á stig ${newLength - minWordLength + 1}!`,
		};
	}

	// DOWNGRADE: Both errors and misses
	if (shouldDowngrade(stats)) {
		const newLength = Math.max(currentWordLength - 1, minWordLength);
		const isAtMin = newLength === minWordLength;

		return {
			newWordLength: newLength,
			progressionType: 'downgrade',
			message: isAtMin
				? '○ Reynum aftur á þessum stigi'
				: `○ Æfum á stigi ${newLength - minWordLength + 1}`,
		};
	}

	// STAY: Some errors OR some misses (but not both)
	return {
		newWordLength: currentWordLength,
		progressionType: 'stay',
		message: '◐ Gott! Reynum aftur á sama stigi',
	};
};

/**
 * Create initial difficulty state
 *
 * @param startingLength - Starting word length (typically 3)
 * @param maxLength - Maximum available word length
 * @returns Initial difficulty state
 */
export const createInitialDifficultyState = (
	startingLength: number,
	maxLength: number
): DifficultyState => ({
	currentWordLength: startingLength,
	minWordLength: startingLength,
	maxWordLength: maxLength,
	completedWords: 0,
	usedWords: new Set(),
});

/**
 * Update difficulty state after completing a word
 *
 * @param state - Current difficulty state
 * @param completedWord - The word that was just completed
 * @param stats - Performance statistics
 * @returns Updated difficulty state and progression result
 */
export const updateDifficultyState = (
	state: DifficultyState,
	completedWord: string,
	stats: PerformanceStats
): { newState: DifficultyState; progression: ProgressionResult } => {
	const progression = calculateNextWordLength(
		state.currentWordLength,
		stats,
		state.minWordLength,
		state.maxWordLength
	);

	const newUsedWords = new Set(state.usedWords);
	newUsedWords.add(completedWord);

	return {
		newState: {
			...state,
			currentWordLength: progression.newWordLength,
			completedWords: state.completedWords + 1,
			usedWords: newUsedWords,
		},
		progression,
	};
};
