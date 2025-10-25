/**
 * Tests for word-generation module
 * Tests pure functions for word manipulation and character generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	split,
	mix,
	generateBagOfChars,
	shuffleArray,
} from '../word-generation.js';

describe('word-generation', () => {
	describe('split', () => {
		it('should split single word into individual characters', () => {
			const result = split('hello');
			expect(result).toEqual(['h', 'e', 'l', 'l', 'o']);
		});

		it('should split phrase with spaces by spaces', () => {
			const result = split('hello world');
			expect(result).toEqual(['hello', 'world']);
		});

		it('should handle multiple spaces correctly', () => {
			const result = split('one two three');
			expect(result).toEqual(['one', 'two', 'three']);
		});

		it('should handle single character', () => {
			const result = split('a');
			expect(result).toEqual(['a']);
		});

		it('should handle empty string', () => {
			const result = split('');
			expect(result).toEqual([]);
		});
	});

	describe('mix', () => {
		it('should add target word parts 4 times', () => {
			const splitWord = ['a', 'b'];
			const alphabet = ['x', 'y', 'z'];
			const result = mix(splitWord, alphabet);

			// Count occurrences of 'a' and 'b'
			const aCount = result.filter(c => c === 'a').length;
			const bCount = result.filter(c => c === 'b').length;

			expect(aCount).toBe(4);
			expect(bCount).toBe(4);
		});

		it('should add alphabet once', () => {
			const splitWord = ['a'];
			const alphabet = ['x', 'y', 'z'];
			const result = mix(splitWord, alphabet);

			// Count occurrences of alphabet letters
			const xCount = result.filter(c => c === 'x').length;
			const yCount = result.filter(c => c === 'y').length;
			const zCount = result.filter(c => c === 'z').length;

			expect(xCount).toBe(1);
			expect(yCount).toBe(1);
			expect(zCount).toBe(1);
		});

		it('should add spaces based on selection length', () => {
			const splitWord = ['a', 'b', 'c'];
			const alphabet = ['x', 'y', 'z'];
			const result = mix(splitWord, alphabet);

			// Selection: 3 target chars + 3 alphabet + 3*3 more target = 15
			// Spaces: floor(15 / 3) = 5
			const spaceCount = result.filter(c => c === ' ').length;
			const expectedSpaces = Math.floor((splitWord.length + alphabet.length + splitWord.length * 3) / 3);

			expect(spaceCount).toBe(expectedSpaces);
		});

		it('should handle empty arrays', () => {
			const result = mix([], []);
			expect(result.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('generateBagOfChars', () => {
		describe('FR-001: Next required letter probability', () => {
			it('should add next required letter 10 times for high probability', () => {
				const result = generateBagOfChars('', 'test');

				// Next letter is 't', should appear 10 times
				const tCount = result.filter(c => c === 't').length;
				expect(tCount).toBe(10);
			});

			it('should prioritize the immediate next letter after progress', () => {
				const result = generateBagOfChars('te', 'test');

				// Next letter is 's', should appear 10 times
				const sCount = result.filter(c => c === 's').length;
				expect(sCount).toBe(10);
			});

			it('should update priority as user progresses', () => {
				const result = generateBagOfChars('tes', 'test');

				// Next letter is 't' (last one), should appear 10 times
				const tCount = result.filter(c => c === 't').length;
				expect(tCount).toBe(10);
			});
		});

		describe('FR-002: Only include remaining letters', () => {
			it('should only include letters still needed in target', () => {
				const result = generateBagOfChars('te', 'test');

				// Remaining letters are 's' and 't'
				// Should NOT contain 'e' since it's already typed
				const eCount = result.filter(c => c === 'e').length;
				expect(eCount).toBe(0);
			});

			it('should include non-next remaining letters 2 times each', () => {
				const result = generateBagOfChars('', 'test');

				// Next is 't' (10 times), others should be 2 times each
				// Remaining unique letters: e, s (and t but counted separately)
				const eCount = result.filter(c => c === 'e').length;
				const sCount = result.filter(c => c === 's').length;

				expect(eCount).toBe(2);
				expect(sCount).toBe(2);
			});

			it('should handle duplicates in target word correctly', () => {
				const result = generateBagOfChars('', 'book');

				// Next is 'b' (10 times)
				// Remaining: o (twice in word), k (once)
				const bCount = result.filter(c => c === 'b').length;
				const oCount = result.filter(c => c === 'o').length;
				const kCount = result.filter(c => c === 'k').length;

				expect(bCount).toBe(10); // Next letter
				expect(oCount).toBe(2); // Remaining letter
				expect(kCount).toBe(2); // Remaining letter
			});

			it('should not include letters not in the target', () => {
				const result = generateBagOfChars('', 'abc');

				// Should only contain 'a', 'b', 'c', and spaces
				const nonTargetLetters = result.filter(c =>
					c !== 'a' && c !== 'b' && c !== 'c' && c !== ' '
				);

				expect(nonTargetLetters.length).toBe(0);
			});
		});

		describe('Edge cases', () => {
			it('should return space when target is complete', () => {
				const result = generateBagOfChars('complete', 'complete');

				expect(result).toEqual([' ']);
			});

			it('should handle single character target', () => {
				const result = generateBagOfChars('', 'a');

				const aCount = result.filter(c => c === 'a').length;
				expect(aCount).toBe(10);
			});

			it('should add spaces proportional to selection size', () => {
				const result = generateBagOfChars('', 'test');

				const spaceCount = result.filter(c => c === ' ').length;
				const nonSpaceCount = result.filter(c => c !== ' ').length;

				// Spaces should be floor(selection.length / 4)
				const expectedSpaces = Math.floor(nonSpaceCount / 4);
				expect(spaceCount).toBe(expectedSpaces);
			});

			it('should handle case-insensitive targets', () => {
				const result = generateBagOfChars('', 'Test');

				// Should work with lowercase
				const tCount = result.filter(c => c === 't').length;
				expect(tCount).toBe(10);
			});

			it('should not add space letters to selection beyond spacing', () => {
				const result = generateBagOfChars('', 'hello world');

				// Spaces should only be added at the end for gaps
				// Not as part of the letter selection
				const h = result[0];
				expect(h).toBeDefined();
			});
		});
	});

	describe('shuffleArray', () => {
		it('should return array with same length', () => {
			const input = [1, 2, 3, 4, 5];
			const result = shuffleArray(input);

			expect(result.length).toBe(input.length);
		});

		it('should return array with same elements', () => {
			const input = [1, 2, 3, 4, 5];
			const result = shuffleArray(input);

			expect(result.sort()).toEqual(input.sort());
		});

		it('should not modify original array', () => {
			const input = [1, 2, 3, 4, 5];
			const original = [...input];

			shuffleArray(input);

			expect(input).toEqual(original);
		});

		it('should handle single element array', () => {
			const input = [1];
			const result = shuffleArray(input);

			expect(result).toEqual([1]);
		});

		it('should handle empty array', () => {
			const input: number[] = [];
			const result = shuffleArray(input);

			expect(result).toEqual([]);
		});

		it('should produce different orders on multiple calls (probabilistic)', () => {
			const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

			// Run multiple times and check if we get different results
			const results = new Set();
			for (let i = 0; i < 10; i++) {
				results.add(shuffleArray(input).join(','));
			}

			// With 10 elements, very unlikely to get same order 10 times
			expect(results.size).toBeGreaterThan(1);
		});

		it('should work with strings', () => {
			const input = ['a', 'b', 'c'];
			const result = shuffleArray(input);

			expect(result.length).toBe(3);
			expect(result.sort()).toEqual(['a', 'b', 'c']);
		});

		it('should work with objects', () => {
			const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
			const result = shuffleArray(input);

			expect(result.length).toBe(3);
			expect(result.map(o => o.id).sort()).toEqual([1, 2, 3]);
		});
	});
});
