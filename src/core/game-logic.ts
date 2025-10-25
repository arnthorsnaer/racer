/**
 * Pure functions for game logic and state management
 * No side effects - fully testable without mocks
 */

export interface BoardItem {
	generated: string;
	success: boolean;
}

export interface GameState {
	board: (BoardItem | undefined)[];
	typedProgress: string;
	errorCount: number;
	missedLetters: number;
	catchCount: number;
	tickCount: number;
}

export interface KeypressResult {
	newState: GameState;
	feedback: string;
	feedbackType: 'success' | 'error' | 'miss' | 'empty';
	isLevelComplete: boolean;
	shouldPlaySound: string | null;
}

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

	// Check if we're about to lose a needed letter
	const poppedItem = newBoard[newBoard.length - 1];
	let newMissedLetters = state.missedLetters;

	if (poppedItem !== undefined) {
		const nextExpectedChar = fullTarget[state.typedProgress.length];
		// If the popped letter was the next expected character and wasn't caught, count it as missed
		if (poppedItem.generated.toLowerCase() === nextExpectedChar.toLowerCase() && !poppedItem.success) {
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
