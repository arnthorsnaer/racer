/**
 * Tests for game-logic module
 * These are pure function tests - NO MOCKS NEEDED!
 */

import { describe, it, expect } from 'vitest';
import {
	createInitialGameState,
	processKeypress,
	updateBoardWithNewChar,
	getTickSound,
	CATCH_LINE_POSITION,
} from '../game-logic.js';

describe('game-logic (pure functions)', () => {
	describe('createInitialGameState', () => {
		it('should create initial state with empty board', () => {
			const state = createInitialGameState();

			expect(state.board.length).toBe(16);
			expect(state.typedProgress).toBe('');
			expect(state.errorCount).toBe(0);
			expect(state.missedLetters).toBe(0);
		});
	});

	describe('processKeypress', () => {
		it('should mark correct letter as success', () => {
			const state = createInitialGameState();
			// Place 'f' at catch line
			state.board[CATCH_LINE_POSITION] = { generated: 'f', success: false };

			const result = processKeypress('f', state, 'falleg');

			expect(result.feedbackType).toBe('success');
			expect(result.newState.typedProgress).toBe('f');
			expect(result.newState.board[CATCH_LINE_POSITION]?.success).toBe(true);
			expect(result.shouldPlaySound).toContain('success');
		});

		it('should count wrong key as error', () => {
			const state = createInitialGameState();
			state.board[CATCH_LINE_POSITION] = { generated: 'x', success: false };

			const result = processKeypress('y', state, 'falleg');

			expect(result.feedbackType).toBe('miss');
			expect(result.newState.errorCount).toBe(1);
			expect(result.shouldPlaySound).toBe('error');
		});

		it('should detect level completion', () => {
			const state = createInitialGameState();
			state.typedProgress = 'falle'; // Almost done
			state.board[CATCH_LINE_POSITION] = { generated: 'g', success: false };

			const result = processKeypress('g', state, 'falleg');

			expect(result.isLevelComplete).toBe(true);
			expect(result.newState.typedProgress).toBe('falleg');
		});

		it('should return empty feedback when no letter at catch line', () => {
			const state = createInitialGameState();
			// No letter at catch line

			const result = processKeypress('a', state, 'falleg');

			expect(result.feedbackType).toBe('empty');
			expect(result.shouldPlaySound).toBe(null);
		});
	});

	describe('updateBoardWithNewChar', () => {
		it('should add new char at front and remove from back', () => {
			const state = createInitialGameState();
			state.board[0] = { generated: 'a', success: false };

			const newState = updateBoardWithNewChar(state, 'b', 'test');

			expect(newState.board[0]?.generated).toBe('b');
			expect(newState.board[1]?.generated).toBe('a');
		});

		it('should count missed letters when needed letter is popped', () => {
			const state = createInitialGameState();
			// Put the needed letter at the end (about to be popped)
			state.board[15] = { generated: 't', success: false };

			const newState = updateBoardWithNewChar(state, 'x', 'test');

			expect(newState.missedLetters).toBe(1);
		});
	});

	describe('getTickSound', () => {
		it('should alternate between tick1 and tick2', () => {
			expect(getTickSound(0)).toBe('tick2');
			expect(getTickSound(1)).toBe('tick1');
			expect(getTickSound(2)).toBe('tick2');
			expect(getTickSound(3)).toBe('tick1');
		});
	});
});

// Testing with mocked adapters (integration-style test)
describe('adapters integration', () => {
	it('should allow testing with mock sound adapter', async () => {
		// Dynamic import the mock adapter
		const { createMockSoundAdapter } = await import('../../adapters/sound-adapter.js');
		const mockSound = createMockSoundAdapter();

		// Use it
		mockSound.play('success0');
		mockSound.play('tick1');

		// Verify
		const history = mockSound.getPlayHistory();
		expect(history).toEqual(['success0', 'tick1']);
	});
});
