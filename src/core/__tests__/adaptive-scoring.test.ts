/**
 * Tests for adaptive scoring system
 * These tests serve as documentation for the scoring logic
 */

import { describe, it, expect } from 'vitest';
import {
  getLevelFromWordLength,
  getWordLengthFromLevel,
  calculateScore,
  STARTING_WORD_LENGTH,
} from '../adaptive-scoring';

describe('adaptive-scoring', () => {
  describe('getLevelFromWordLength', () => {
    it('should convert 3-letter words to Level 1', () => {
      expect(getLevelFromWordLength(3)).toBe(1);
    });

    it('should convert 4-letter words to Level 2', () => {
      expect(getLevelFromWordLength(4)).toBe(2);
    });

    it('should convert 5-letter words to Level 3', () => {
      expect(getLevelFromWordLength(5)).toBe(3);
    });

    it('should convert 10-letter words to Level 8', () => {
      expect(getLevelFromWordLength(10)).toBe(8);
    });
  });

  describe('getWordLengthFromLevel', () => {
    it('should convert Level 1 to 3-letter words', () => {
      expect(getWordLengthFromLevel(1)).toBe(3);
    });

    it('should convert Level 2 to 4-letter words', () => {
      expect(getWordLengthFromLevel(2)).toBe(4);
    });

    it('should convert Level 5 to 7-letter words', () => {
      expect(getWordLengthFromLevel(5)).toBe(7);
    });

    it('should round-trip correctly', () => {
      const level = 7;
      const wordLength = getWordLengthFromLevel(level);
      expect(getLevelFromWordLength(wordLength)).toBe(level);
    });
  });

  describe('calculateScore', () => {
    describe('perfect progression (upgrade every time)', () => {
      it('should return 100 when completedLevels equals completedWords', () => {
        expect(calculateScore(5, 5)).toBe(100);
      });

      it('should return 100 for any perfect progression', () => {
        expect(calculateScore(1, 1)).toBe(100);
        expect(calculateScore(10, 10)).toBe(100);
        expect(calculateScore(20, 20)).toBe(100);
      });
    });

    describe('imperfect progression (some practice needed)', () => {
      it('should return 25 when player takes 4x as many words as levels', () => {
        // Level 3, but took 12 words to get there
        expect(calculateScore(3, 12)).toBe(25);
      });

      it('should return 50 when player takes 2x as many words as levels', () => {
        // Level 5, but took 10 words to get there
        expect(calculateScore(5, 10)).toBe(50);
      });

      it('should return 10 when player is struggling', () => {
        // Still at Level 1 after 10 words
        expect(calculateScore(1, 10)).toBe(10);
      });

      it('should return 20 when player completed 2 levels in 10 words', () => {
        expect(calculateScore(2, 10)).toBe(20);
      });
    });

    describe('edge cases and bounds', () => {
      it('should return 0 when no words completed', () => {
        expect(calculateScore(0, 0)).toBe(0);
        expect(calculateScore(1, 0)).toBe(0);
      });

      it('should never exceed 100', () => {
        // Even if somehow levels > words (shouldn't happen in real game)
        expect(calculateScore(10, 5)).toBe(100);
      });

      it('should never go below 0', () => {
        expect(calculateScore(-1, 10)).toBe(0);
        expect(calculateScore(0, 10)).toBe(0);
      });

      it('should handle decimal results correctly', () => {
        // (7 / 20) * 100 = 35
        expect(calculateScore(7, 20)).toBe(35);
      });

      it('should round fractional scores', () => {
        // (2 / 3) * 100 = 66.666...
        const score = calculateScore(2, 3);
        expect(score).toBeCloseTo(66.67, 1);
      });
    });

    describe('realistic game scenarios', () => {
      it('should score efficient player highly', () => {
        // Player upgraded 4 times with only 1 stay/downgrade
        // Completed 5 words, reached Level 5
        expect(calculateScore(5, 5)).toBe(100);
      });

      it('should score learning player moderately', () => {
        // Player practicing, some upgrades and downgrades
        // Completed 8 words, reached Level 3
        const score = calculateScore(3, 8);
        expect(score).toBe(37.5);
      });

      it('should score struggling player low', () => {
        // Player still at starting level after many attempts
        // Completed 15 words, still at Level 1
        const score = calculateScore(1, 15);
        expect(score).toBeCloseTo(6.67, 1);
      });
    });
  });
});
