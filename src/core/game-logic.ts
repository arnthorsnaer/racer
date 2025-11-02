/**
 * Pure functions for game logic and state management
 * No side effects - fully testable without mocks
 */

import type { BoardItem, GameState, KeypressResult } from './types.ts';

// Re-export types for backwards compatibility
export type { BoardItem, GameState, KeypressResult };

/**
 * Constants for game configuration
 */
export const BOARD_SIZE = 16;
export const CATCH_LINE_POSITION = 13;

/**
 * Create initial game state
 */
export const createInitialGameState = (): GameState => ({
	board: new Array(BOARD_SIZE),
	typedProgress: '',
	errorCount: 0,
	missedLetters: 0,
	catchCount: 0,
	tickCount: 0,
});

/**
 * Update board with a new character
 * Returns new state with updated board and miss count
 */
export const updateBoardWithNewChar = (
	state: GameState,
	newChar: string,
	fullTarget: string
): GameState => {
	const newBoard = [...state.board];
	let newMissedLetters = state.missedLetters;

	// Check if the letter at the catch line is a needed letter that wasn't caught
	// This check happens BEFORE the board shifts, so we're checking the letter
	// that's about to leave the catch line position
	const catchLineItem = newBoard[CATCH_LINE_POSITION];

	if (catchLineItem !== undefined && catchLineItem.generated) {
		const nextExpectedChar = fullTarget[state.typedProgress.length];
		// If this letter was the next needed letter and wasn't caught, count as miss
		// Only check if we haven't completed the word yet
		if (nextExpectedChar !== undefined &&
			catchLineItem.generated.toLowerCase() === nextExpectedChar.toLowerCase() &&
			!catchLineItem.success) {
			newMissedLetters++;
		}
	}

	// Add new character at the front
	newBoard.unshift({ generated: newChar, success: false });
	newBoard.pop();

	return {
		...state,
		board: newBoard,
		missedLetters: newMissedLetters,
		tickCount: state.tickCount + 1,
	};
};

/**
 * Process a keypress and return the new game state
 * Pure function - no side effects
 */
export const processKeypress = (
	pressedChar: string,
	state: GameState,
	fullTarget: string
): KeypressResult => {
	const nextExpectedChar = fullTarget[state.typedProgress.length];
	const itemAtCatchLine = state.board[CATCH_LINE_POSITION];

	// No letter at catch line
	if (itemAtCatchLine === undefined || !itemAtCatchLine.generated) {
		return {
			newState: state,
			feedback: '✗ Enginn stafur á vallínu!',
			feedbackType: 'empty',
			isLevelComplete: false,
			shouldPlaySound: null,
		};
	}

	const letterAtSelection = itemAtCatchLine.generated;

	// Success: Pressed key matches letter AND it's the next expected character
	if (
		nextExpectedChar &&
		pressedChar.toLowerCase() === letterAtSelection.toLowerCase() &&
		letterAtSelection.toLowerCase() === nextExpectedChar.toLowerCase()
	) {
		const newBoard = [...state.board];
		newBoard[CATCH_LINE_POSITION] = { ...itemAtCatchLine, success: true };
		const newTypedProgress = state.typedProgress + letterAtSelection;
		const isComplete = newTypedProgress === fullTarget;

		// Calculate success sound index (capped at 29)
		const successSoundIndex = Math.min(state.catchCount, 29);

		return {
			newState: {
				...state,
				board: newBoard,
				typedProgress: newTypedProgress,
				catchCount: state.catchCount + 1,
			},
			feedback: `★ Náðir '${letterAtSelection}'! Frábært!`,
			feedbackType: 'success',
			isLevelComplete: isComplete,
			shouldPlaySound: `success${successSoundIndex}`,
		};
	}

	// Error: Letter matches but it's not the next expected character
	if (pressedChar.toLowerCase() === letterAtSelection.toLowerCase()) {
		return {
			newState: {
				...state,
				errorCount: state.errorCount + 1,
			},
			feedback: `✗ Rangur stafur! Þarft '${nextExpectedChar}', fékk '${letterAtSelection}'`,
			feedbackType: 'error',
			isLevelComplete: false,
			shouldPlaySound: 'error',
		};
	}

	// Miss: Pressed key doesn't match the letter at selection
	return {
		newState: {
			...state,
			errorCount: state.errorCount + 1,
		},
		feedback: `✗ Missir! Ýttir á '${pressedChar}' en valið sýnir '${letterAtSelection}'`,
		feedbackType: 'miss',
		isLevelComplete: false,
		shouldPlaySound: 'error',
	};
};

/**
 * Get the tick sound name based on tick count
 */
export const getTickSound = (tickCount: number): string => {
	return tickCount % 2 === 0 ? 'tick2' : 'tick1';
};
