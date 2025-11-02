/**
 * Core Type Definitions
 *
 * All domain-specific types used within the core game logic.
 * This centralizes types that are shared across multiple core modules.
 */

// ============================================================================
// Game Logic Types
// ============================================================================

/**
 * Represents a single item on the game board
 */
export interface BoardItem {
	generated: string;  // The character that was generated
	success: boolean;   // Whether the character was successfully caught
}

/**
 * The complete game state
 */
export interface GameState {
	board: (BoardItem | undefined)[];  // The game board with characters
	typedProgress: string;             // Progress towards completing the word
	errorCount: number;                // Number of input errors
	missedLetters: number;             // Number of letters that fell off
	catchCount: number;                // Number of successful catches
	tickCount: number;                 // Number of game ticks elapsed
}

/**
 * Result of processing a keypress
 */
export interface KeypressResult {
	newState: GameState;
	feedback: string;
	feedbackType: 'success' | 'error' | 'miss' | 'empty';
	isLevelComplete: boolean;
	shouldPlaySound: string | null;
}

// ============================================================================
// Difficulty and Progression Types
// ============================================================================

/**
 * Tracks the current difficulty state
 */
export interface DifficultyState {
	currentWordLength: number;   // Current target word length
	minWordLength: number;       // Floor (can't go below this)
	maxWordLength: number;       // Ceiling (can't go above this)
	completedWords: number;      // Total words completed
	usedWords: Set<string>;      // Words already used (to avoid repetition)
	consecutivePerfect: number;  // Consecutive perfect completions at current level
}

/**
 * Result of difficulty progression calculation
 */
export interface ProgressionResult {
	newWordLength: number;
	progressionType: 'upgrade' | 'stay' | 'downgrade';
	message: string;
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Performance statistics for a completed word
 */
export interface PerformanceStats {
	errorCount: number;
	missedLetters: number;
	isPerfect: boolean;
}

/**
 * Feedback message based on performance
 */
export interface FeedbackMessage {
	message: string;
	type: 'perfect' | 'good-accuracy' | 'good-efficiency' | 'keep-practicing';
}

// ============================================================================
// Word Management Types
// ============================================================================

/**
 * Represents a level with a target word
 */
export interface Level {
	target: string;
}

/**
 * Words organized by their character length
 */
export interface WordsByLength {
	[length: number]: string[];
}
