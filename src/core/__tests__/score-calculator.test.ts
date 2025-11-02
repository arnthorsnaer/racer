/**
 * Tests for score-calculator module
 * Tests pure functions for score calculation and performance evaluation
 */

import { describe, it, expect } from 'vitest';
import {
	isPerfect,
	calculateStats,
	generateFeedback,
	type PerformanceStats,
} from '../score-calculator.ts';

describe('score-calculator', () => {
	describe('isPerfect', () => {
		it('should return true when no errors and no missed letters', () => {
			expect(isPerfect(0, 0)).toBe(true);
		});

		it('should return false when there are errors', () => {
			expect(isPerfect(1, 0)).toBe(false);
			expect(isPerfect(5, 0)).toBe(false);
		});

		it('should return false when there are missed letters', () => {
			expect(isPerfect(0, 1)).toBe(false);
			expect(isPerfect(0, 10)).toBe(false);
		});

		it('should return false when both errors and missed letters exist', () => {
			expect(isPerfect(1, 1)).toBe(false);
			expect(isPerfect(5, 3)).toBe(false);
		});
	});

	describe('calculateStats', () => {
		it('should calculate stats for perfect performance', () => {
			const stats = calculateStats(0, 0);

			expect(stats.errorCount).toBe(0);
			expect(stats.missedLetters).toBe(0);
			expect(stats.isPerfect).toBe(true);
		});

		it('should calculate stats with errors', () => {
			const stats = calculateStats(5, 0);

			expect(stats.errorCount).toBe(5);
			expect(stats.missedLetters).toBe(0);
			expect(stats.isPerfect).toBe(false);
		});

		it('should calculate stats with missed letters', () => {
			const stats = calculateStats(0, 3);

			expect(stats.errorCount).toBe(0);
			expect(stats.missedLetters).toBe(3);
			expect(stats.isPerfect).toBe(false);
		});

		it('should calculate stats with both errors and misses', () => {
			const stats = calculateStats(2, 4);

			expect(stats.errorCount).toBe(2);
			expect(stats.missedLetters).toBe(4);
			expect(stats.isPerfect).toBe(false);
		});
	});

	describe('generateFeedback', () => {
		describe('perfect performance feedback', () => {
			it('should return perfect message when no errors or misses', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('perfect');
				expect(feedback.message).toBe('Engar villur og náðir hverjum staf í fyrstu tilraun!');
			});
		});

		describe('good-accuracy feedback', () => {
			it('should return good-accuracy message when no errors but some misses', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 3,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-accuracy');
				expect(feedback.message).toBe('Frábær nákvæmni! Reyndu að ná stöfum hraðar næst.');
			});

			it('should work with just one missed letter', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 1,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-accuracy');
			});

			it('should work with many missed letters', () => {
				const stats: PerformanceStats = {
					errorCount: 0,
					missedLetters: 100,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-accuracy');
			});
		});

		describe('good-efficiency feedback', () => {
			it('should return good-efficiency message when errors but no misses', () => {
				const stats: PerformanceStats = {
					errorCount: 2,
					missedLetters: 0,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-efficiency');
				expect(feedback.message).toBe('Fullkomin skilvirkni! Einbeittu þér að því að fækka villum.');
			});

			it('should work with just one error', () => {
				const stats: PerformanceStats = {
					errorCount: 1,
					missedLetters: 0,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-efficiency');
			});

			it('should work with many errors', () => {
				const stats: PerformanceStats = {
					errorCount: 50,
					missedLetters: 0,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('good-efficiency');
			});
		});

		describe('keep-practicing feedback', () => {
			it('should return keep-practicing message when both errors and misses', () => {
				const stats: PerformanceStats = {
					errorCount: 3,
					missedLetters: 2,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('keep-practicing');
				expect(feedback.message).toBe('Haltu áfram að æfa til að ná fullkomnum árangri!');
			});

			it('should work with minimal errors and misses', () => {
				const stats: PerformanceStats = {
					errorCount: 1,
					missedLetters: 1,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('keep-practicing');
			});

			it('should work with many errors and misses', () => {
				const stats: PerformanceStats = {
					errorCount: 100,
					missedLetters: 100,
					isPerfect: false,
				};

				const feedback = generateFeedback(stats);

				expect(feedback.type).toBe('keep-practicing');
			});
		});

		describe('feedback type coverage', () => {
			it('should cover all four feedback types', () => {
				const feedbackTypes = new Set<string>();

				// Perfect
				feedbackTypes.add(generateFeedback({
					errorCount: 0,
					missedLetters: 0,
					isPerfect: true,
				}).type);

				// Good accuracy
				feedbackTypes.add(generateFeedback({
					errorCount: 0,
					missedLetters: 1,
					isPerfect: false,
				}).type);

				// Good efficiency
				feedbackTypes.add(generateFeedback({
					errorCount: 1,
					missedLetters: 0,
					isPerfect: false,
				}).type);

				// Keep practicing
				feedbackTypes.add(generateFeedback({
					errorCount: 1,
					missedLetters: 1,
					isPerfect: false,
				}).type);

				expect(feedbackTypes.size).toBe(4);
				expect(feedbackTypes.has('perfect')).toBe(true);
				expect(feedbackTypes.has('good-accuracy')).toBe(true);
				expect(feedbackTypes.has('good-efficiency')).toBe(true);
				expect(feedbackTypes.has('keep-practicing')).toBe(true);
			});
		});
	});
});
