/**
 * Pure functions for adaptive difficulty progression
 * No side effects - fully testable without mocks
 */

import type { DifficultyState, ProgressionResult, PerformanceStats } from './types.ts';

// Re-export types for backwards compatibility
export type { DifficultyState, ProgressionResult };

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
 * Number of consecutive perfect completions required to upgrade
 */
export const PERFECT_COMPLETIONS_REQUIRED = 1;

/**
 * Calculate the next word length based on performance
 * Respects min/max bounds and starting length floor
 * Requires multiple consecutive perfect completions to upgrade
 *
 * @param currentWordLength - Current difficulty word length
 * @param stats - Performance statistics from completed level
 * @param minWordLength - Minimum word length (floor)
 * @param maxWordLength - Maximum word length (ceiling)
 * @param consecutivePerfect - Number of consecutive perfect completions
 * @returns New word length, progression info, and updated consecutive count
 */
export const calculateNextWordLength = (
	currentWordLength: number,
	stats: PerformanceStats,
	minWordLength: number,
	maxWordLength: number,
	consecutivePerfect: number
): ProgressionResult & { consecutivePerfect: number } => {
	// UPGRADE: Perfect performance AND enough consecutive perfects
	if (shouldUpgrade(stats)) {
		const newConsecutivePerfect = consecutivePerfect + 1;

		if (newConsecutivePerfect >= PERFECT_COMPLETIONS_REQUIRED) {
			const newLength = Math.min(currentWordLength + 1, maxWordLength);
			const isAtMax = newLength === maxWordLength;

			return {
				newWordLength: newLength,
				progressionType: 'upgrade',
				message: isAtMax
					? '★ Frábært! Þú ert á hámarksstigi!'
					: `★ Fullkomið! Að færa þig á stig ${newLength - minWordLength + 1}!`,
				consecutivePerfect: 0, // Reset counter after upgrade
			};
		} else {
			// Perfect but not enough consecutive perfects yet
			return {
				newWordLength: currentWordLength,
				progressionType: 'stay',
				message: `★ Fullkomið! (${newConsecutivePerfect}/${PERFECT_COMPLETIONS_REQUIRED} til að fara upp stig)`,
				consecutivePerfect: newConsecutivePerfect,
			};
		}
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
			consecutivePerfect: 0, // Reset counter on downgrade
		};
	}

	// STAY: Some errors OR some misses (but not both)
	return {
		newWordLength: currentWordLength,
		progressionType: 'stay',
		message: '◐ Gott! Reynum aftur á sama stigi',
		consecutivePerfect: 0, // Reset counter if not perfect
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
	consecutivePerfect: 0,
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
	const progressionResult = calculateNextWordLength(
		state.currentWordLength,
		stats,
		state.minWordLength,
		state.maxWordLength,
		state.consecutivePerfect
	);

	const newUsedWords = new Set(state.usedWords);
	newUsedWords.add(completedWord);

	return {
		newState: {
			...state,
			currentWordLength: progressionResult.newWordLength,
			completedWords: state.completedWords + 1,
			usedWords: newUsedWords,
			consecutivePerfect: progressionResult.consecutivePerfect,
		},
		progression: {
			newWordLength: progressionResult.newWordLength,
			progressionType: progressionResult.progressionType,
			message: progressionResult.message,
		},
	};
};
