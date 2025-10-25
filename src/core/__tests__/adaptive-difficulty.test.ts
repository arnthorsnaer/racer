/**
 * Tests for adaptive difficulty progression system
 * These tests serve as documentation for the upgrade/downgrade logic
 */

import { describe, it, expect } from 'vitest';
import {
	shouldUpgrade,
	shouldDowngrade,
	shouldStay,
	calculateNextWordLength,
	createInitialDifficultyState,
	updateDifficultyState,
} from '../adaptive-difficulty';
import { PerformanceStats } from '../score-calculator';

describe('adaptive-difficulty', () => {
	describe('shouldUpgrade', () => {
		it('should return true for perfect performance (0 errors, 0 misses)', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};
			expect(shouldUpgrade(stats)).toBe(true);
		});

		it('should return false when there are errors but no misses', () => {
			const stats: PerformanceStats = {
				errorCount: 2,
				missedLetters: 0,
				isPerfect: false,
			};
			expect(shouldUpgrade(stats)).toBe(false);
		});

		it('should return false when there are misses but no errors', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 3,
				isPerfect: false,
			};
			expect(shouldUpgrade(stats)).toBe(false);
		});

		it('should return false when there are both errors and misses', () => {
			const stats: PerformanceStats = {
				errorCount: 1,
				missedLetters: 1,
				isPerfect: false,
			};
			expect(shouldUpgrade(stats)).toBe(false);
		});
	});

	describe('shouldDowngrade', () => {
		it('should return true when there are both errors AND misses', () => {
			const stats: PerformanceStats = {
				errorCount: 1,
				missedLetters: 1,
				isPerfect: false,
			};
			expect(shouldDowngrade(stats)).toBe(true);
		});

		it('should return true even with multiple errors and misses', () => {
			const stats: PerformanceStats = {
				errorCount: 5,
				missedLetters: 3,
				isPerfect: false,
			};
			expect(shouldDowngrade(stats)).toBe(true);
		});

		it('should return false for perfect performance', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};
			expect(shouldDowngrade(stats)).toBe(false);
		});

		it('should return false when only errors (no misses)', () => {
			const stats: PerformanceStats = {
				errorCount: 2,
				missedLetters: 0,
				isPerfect: false,
			};
			expect(shouldDowngrade(stats)).toBe(false);
		});

		it('should return false when only misses (no errors)', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 2,
				isPerfect: false,
			};
			expect(shouldDowngrade(stats)).toBe(false);
		});
	});

	describe('shouldStay', () => {
		it('should return true when there are errors but no misses', () => {
			const stats: PerformanceStats = {
				errorCount: 2,
				missedLetters: 0,
				isPerfect: false,
			};
			expect(shouldStay(stats)).toBe(true);
		});

		it('should return true when there are misses but no errors', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 2,
				isPerfect: false,
			};
			expect(shouldStay(stats)).toBe(true);
		});

		it('should return false for perfect performance (should upgrade instead)', () => {
			const stats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};
			expect(shouldStay(stats)).toBe(false);
		});

		it('should return false when both errors and misses (should downgrade instead)', () => {
			const stats: PerformanceStats = {
				errorCount: 1,
				missedLetters: 1,
				isPerfect: false,
			};
			expect(shouldStay(stats)).toBe(false);
		});
	});

	describe('calculateNextWordLength', () => {
		const MIN_LENGTH = 3;
		const MAX_LENGTH = 10;

		describe('UPGRADE progression', () => {
			it('should increase word length by 1 on perfect performance', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				};

				const result = calculateNextWordLength(5, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(6);
				expect(result.progressionType).toBe('upgrade');
			});

			it('should not exceed max word length', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				};

				const result = calculateNextWordLength(MAX_LENGTH, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(MAX_LENGTH);
				expect(result.progressionType).toBe('upgrade');
			});

			it('should cap at max even when trying to upgrade beyond', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				};

				const result = calculateNextWordLength(9, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(10);
			});
		});

		describe('DOWNGRADE progression', () => {
			it('should decrease word length by 1 when both errors and misses', () => {
				const stats: PerformanceStats = {
					errorCount: 2,
					missedLetters: 1,
					isPerfect: false,
				};

				const result = calculateNextWordLength(5, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(4);
				expect(result.progressionType).toBe('downgrade');
			});

			it('should not go below min word length', () => {
				const stats: PerformanceStats = {
					errorCount: 2,
					missedLetters: 1,
					isPerfect: false,
				};

				const result = calculateNextWordLength(MIN_LENGTH, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(MIN_LENGTH);
				expect(result.progressionType).toBe('downgrade');
			});

			it('should floor at min even when trying to downgrade below', () => {
				const stats: PerformanceStats = {
					errorCount: 5,
					missedLetters: 5,
					isPerfect: false,
				};

				const result = calculateNextWordLength(4, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(3);
			});
		});

		describe('STAY progression', () => {
			it('should stay at same length when only errors (no misses)', () => {
				const stats: PerformanceStats = {
					errorCount: 2,
					missedLetters: 0,
					isPerfect: false,
				};

				const result = calculateNextWordLength(5, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(5);
				expect(result.progressionType).toBe('stay');
			});

			it('should stay at same length when only misses (no errors)', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 3,
					isPerfect: false,
				};

				const result = calculateNextWordLength(5, stats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(5);
				expect(result.progressionType).toBe('stay');
			});
		});

		describe('edge cases', () => {
			it('should handle starting at min length', () => {
				const perfectStats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				};

				const result = calculateNextWordLength(MIN_LENGTH, perfectStats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(MIN_LENGTH + 1);
			});

			it('should handle being at max length', () => {
				const badStats: PerformanceStats = {
					errorCount: 2,
					missedLetters: 2,
					isPerfect: false,
				};

				const result = calculateNextWordLength(MAX_LENGTH, badStats, MIN_LENGTH, MAX_LENGTH);
				expect(result.newWordLength).toBe(MAX_LENGTH - 1);
			});
		});
	});

	describe('createInitialDifficultyState', () => {
		it('should create state with starting length', () => {
			const state = createInitialDifficultyState(3, 10);

			expect(state.currentWordLength).toBe(3);
			expect(state.minWordLength).toBe(3);
			expect(state.maxWordLength).toBe(10);
			expect(state.completedWords).toBe(0);
			expect(state.usedWords.size).toBe(0);
		});
	});

	describe('updateDifficultyState', () => {
		it('should update state after perfect performance', () => {
			const state = createInitialDifficultyState(3, 10);
			const perfectStats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};

			const { newState, progression } = updateDifficultyState(state, 'bók', perfectStats);

			expect(newState.currentWordLength).toBe(4);
			expect(newState.completedWords).toBe(1);
			expect(newState.usedWords.has('bók')).toBe(true);
			expect(progression.progressionType).toBe('upgrade');
		});

		it('should track used words to avoid repetition', () => {
			let state = createInitialDifficultyState(3, 10);
			const perfectStats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};

			// Complete first word
			const result1 = updateDifficultyState(state, 'bók', perfectStats);
			state = result1.newState;

			// Complete second word
			const result2 = updateDifficultyState(state, 'vatn', perfectStats);
			state = result2.newState;

			expect(state.usedWords.size).toBe(2);
			expect(state.usedWords.has('bók')).toBe(true);
			expect(state.usedWords.has('vatn')).toBe(true);
		});

		it('should handle downgrade without going below min', () => {
			const state = createInitialDifficultyState(3, 10);
			const badStats: PerformanceStats = {
				errorCount: 2,
				missedLetters: 2,
				isPerfect: false,
			};

			const { newState, progression } = updateDifficultyState(state, 'bók', badStats);

			expect(newState.currentWordLength).toBe(3); // Can't go below min
			expect(newState.completedWords).toBe(1);
			expect(progression.progressionType).toBe('downgrade');
		});

		it('should handle stay progression', () => {
			const state = createInitialDifficultyState(3, 10);
			const stayStats: PerformanceStats = {
				errorCount: 2,
				missedLetters: 0,
				isPerfect: false,
			};

			const { newState, progression } = updateDifficultyState(state, 'bók', stayStats);

			expect(newState.currentWordLength).toBe(3);
			expect(newState.completedWords).toBe(1);
			expect(progression.progressionType).toBe('stay');
		});
	});

	describe('complete game scenarios', () => {
		it('should handle perfect progression through multiple levels', () => {
			let state = createInitialDifficultyState(3, 6);
			const perfectStats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};

			// Level 1: 3-letter word
			const result1 = updateDifficultyState(state, 'bók', perfectStats);
			state = result1.newState;
			expect(state.currentWordLength).toBe(4);

			// Level 2: 4-letter word
			const result2 = updateDifficultyState(state, 'vatn', perfectStats);
			state = result2.newState;
			expect(state.currentWordLength).toBe(5);

			// Level 3: 5-letter word
			const result3 = updateDifficultyState(state, 'fjall', perfectStats);
			state = result3.newState;
			expect(state.currentWordLength).toBe(6);

			expect(state.completedWords).toBe(3);
		});

		it('should handle mixed performance with upgrades and downgrades', () => {
			let state = createInitialDifficultyState(3, 6);

			// Perfect - upgrade to 4
			const perfect: PerformanceStats = { errorCount: 0, missedLetters: 0, isPerfect: true };
			state = updateDifficultyState(state, 'bók', perfect).newState;
			expect(state.currentWordLength).toBe(4);

			// Bad (both errors and misses) - downgrade to 3
			const bad: PerformanceStats = { errorCount: 2, missedLetters: 2, isPerfect: false };
			state = updateDifficultyState(state, 'vatn', bad).newState;
			expect(state.currentWordLength).toBe(3);

			// Stay (only errors)
			const stay: PerformanceStats = { errorCount: 2, missedLetters: 0, isPerfect: false };
			state = updateDifficultyState(state, 'sól', stay).newState;
			expect(state.currentWordLength).toBe(3);

			// Perfect - upgrade to 4 again
			state = updateDifficultyState(state, 'ský', perfect).newState;
			expect(state.currentWordLength).toBe(4);

			expect(state.completedWords).toBe(4);
		});
	});
});
