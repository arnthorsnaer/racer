/**
 * Tests for level-progression module
 * Tests pure functions for level progression and management
 */

import { describe, it, expect } from 'vitest';
import {
	createShuffledLevelIndices,
	getActualLevel,
	hasNextLevel,
	getNextLevelIndex,
	type Level,
} from '../level-progression.js';

describe('level-progression', () => {
	// Mock levels for testing
	const mockLevels: Level[] = [
		{ target: 'first' },
		{ target: 'second' },
		{ target: 'third' },
		{ target: 'fourth' },
		{ target: 'fifth' },
	];

	describe('createShuffledLevelIndices', () => {
		it('should return array with same length as input', () => {
			const result = createShuffledLevelIndices(mockLevels);

			expect(result.length).toBe(mockLevels.length);
		});

		it('should return all indices from 0 to length-1', () => {
			const result = createShuffledLevelIndices(mockLevels);

			expect(result.sort()).toEqual([0, 1, 2, 3, 4]);
		});

		it('should handle single level', () => {
			const singleLevel = [{ target: 'only' }];
			const result = createShuffledLevelIndices(singleLevel);

			expect(result).toEqual([0]);
		});

		it('should handle empty level array', () => {
			const result = createShuffledLevelIndices([]);

			expect(result).toEqual([]);
		});

		it('should produce different orders on multiple calls (probabilistic)', () => {
			const results = new Set();

			// Run multiple times to check randomization
			for (let i = 0; i < 10; i++) {
				const shuffled = createShuffledLevelIndices(mockLevels);
				results.add(shuffled.join(','));
			}

			// With 5 levels, very unlikely to get the same order 10 times
			expect(results.size).toBeGreaterThan(1);
		});

		it('should not modify original levels array', () => {
			const original = [...mockLevels];

			createShuffledLevelIndices(mockLevels);

			expect(mockLevels).toEqual(original);
		});

		it('should work with two levels', () => {
			const twoLevels = [{ target: 'a' }, { target: 'b' }];
			const result = createShuffledLevelIndices(twoLevels);

			expect(result.length).toBe(2);
			expect(result.sort()).toEqual([0, 1]);
		});
	});

	describe('getActualLevel', () => {
		it('should return correct level based on shuffled index', () => {
			const shuffledIndices = [2, 0, 4, 1, 3]; // Specific shuffle order

			const level = getActualLevel(shuffledIndices, 0, mockLevels);

			expect(level).toEqual({ target: 'third' }); // Index 2
		});

		it('should work for different positions', () => {
			const shuffledIndices = [2, 0, 4, 1, 3];

			expect(getActualLevel(shuffledIndices, 0, mockLevels).target).toBe('third');
			expect(getActualLevel(shuffledIndices, 1, mockLevels).target).toBe('first');
			expect(getActualLevel(shuffledIndices, 2, mockLevels).target).toBe('fifth');
			expect(getActualLevel(shuffledIndices, 3, mockLevels).target).toBe('second');
			expect(getActualLevel(shuffledIndices, 4, mockLevels).target).toBe('fourth');
		});

		it('should work with sequential indices', () => {
			const sequentialIndices = [0, 1, 2, 3, 4]; // No shuffle

			const level = getActualLevel(sequentialIndices, 2, mockLevels);

			expect(level).toEqual({ target: 'third' });
		});

		it('should work with single level', () => {
			const singleLevel = [{ target: 'only' }];
			const indices = [0];

			const level = getActualLevel(indices, 0, singleLevel);

			expect(level).toEqual({ target: 'only' });
		});

		it('should work at first position', () => {
			const shuffledIndices = [4, 3, 2, 1, 0]; // Reversed

			const level = getActualLevel(shuffledIndices, 0, mockLevels);

			expect(level.target).toBe('fifth');
		});

		it('should work at last position', () => {
			const shuffledIndices = [4, 3, 2, 1, 0]; // Reversed

			const level = getActualLevel(shuffledIndices, 4, mockLevels);

			expect(level.target).toBe('first');
		});
	});

	describe('hasNextLevel', () => {
		it('should return true when not at last level', () => {
			expect(hasNextLevel(0, 5)).toBe(true);
			expect(hasNextLevel(1, 5)).toBe(true);
			expect(hasNextLevel(2, 5)).toBe(true);
			expect(hasNextLevel(3, 5)).toBe(true);
		});

		it('should return false when at last level', () => {
			expect(hasNextLevel(4, 5)).toBe(false);
		});

		it('should work with single level', () => {
			expect(hasNextLevel(0, 1)).toBe(false);
		});

		it('should work with two levels', () => {
			expect(hasNextLevel(0, 2)).toBe(true);
			expect(hasNextLevel(1, 2)).toBe(false);
		});

		it('should work at boundary', () => {
			expect(hasNextLevel(98, 100)).toBe(true);
			expect(hasNextLevel(99, 100)).toBe(false);
		});

		it('should handle zero levels edge case', () => {
			expect(hasNextLevel(0, 0)).toBe(false);
		});
	});

	describe('getNextLevelIndex', () => {
		it('should increment by one', () => {
			expect(getNextLevelIndex(0)).toBe(1);
			expect(getNextLevelIndex(1)).toBe(2);
			expect(getNextLevelIndex(2)).toBe(3);
		});

		it('should work from any index', () => {
			expect(getNextLevelIndex(10)).toBe(11);
			expect(getNextLevelIndex(99)).toBe(100);
		});

		it('should work with negative index (though not expected in practice)', () => {
			expect(getNextLevelIndex(-1)).toBe(0);
		});

		it('should be pure function - same input produces same output', () => {
			const index = 5;

			const result1 = getNextLevelIndex(index);
			const result2 = getNextLevelIndex(index);

			expect(result1).toBe(result2);
			expect(result1).toBe(6);
		});
	});

	describe('integration: level progression flow', () => {
		it('should allow complete traversal of all levels', () => {
			const shuffledIndices = createShuffledLevelIndices(mockLevels);
			const visitedLevels: string[] = [];
			let currentIndex = 0;

			// Traverse all levels
			while (currentIndex < mockLevels.length) {
				const level = getActualLevel(shuffledIndices, currentIndex, mockLevels);
				visitedLevels.push(level.target);

				if (hasNextLevel(currentIndex, mockLevels.length)) {
					currentIndex = getNextLevelIndex(currentIndex);
				} else {
					break;
				}
			}

			// Should visit all 5 levels
			expect(visitedLevels.length).toBe(5);

			// Should visit each level exactly once (order may vary)
			expect(visitedLevels.sort()).toEqual(['fifth', 'first', 'fourth', 'second', 'third']);
		});

		it('should stop at last level', () => {
			const shuffledIndices = [0, 1, 2];
			const levels: Level[] = [
				{ target: 'a' },
				{ target: 'b' },
				{ target: 'c' },
			];

			let currentIndex = 0;
			const visitedCount = [];

			while (true) {
				getActualLevel(shuffledIndices, currentIndex, levels);
				visitedCount.push(currentIndex);

				if (!hasNextLevel(currentIndex, levels.length)) {
					break;
				}

				currentIndex = getNextLevelIndex(currentIndex);
			}

			expect(visitedCount).toEqual([0, 1, 2]);
			expect(currentIndex).toBe(2);
		});
	});
});
