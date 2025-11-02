/**
 * Core Game - Main game loop with dependency injection
 *
 * This module provides the central startGame() function that contains
 * all shared game logic. Different game modes (main game, demo, etc.) inject
 * their specific adapters to customize behavior.
 */

import type { GameState } from './game-logic.js';
import type { DifficultyState } from './adaptive-difficulty.js';
import type { WordsByLength } from './word-pool.js';
import {
	createInitialGameState,
	updateBoardWithNewChar,
	processKeypress,
	getTickSound,
	CATCH_LINE_POSITION,
} from './game-logic.js';
import {
	createInitialDifficultyState,
	updateDifficultyState,
} from './adaptive-difficulty.js';
import {
	organizeWordsByLength,
	filterSingleWords,
	selectWordAtLength,
	getMaxWordLength,
} from './word-pool.js';
import { generateBagOfChars } from './word-generation.js';
import { buildGameScreen, buildCompletionScreen } from '../presentation/formatters.js';
import { renderWithFrame } from '../presentation/formatters.js';
import { calculateScore, getLevelFromWordLength } from './adaptive-scoring.js';
import { calculateStats, generateFeedback } from './score-calculator.js';
import { STARTING_WORD_LENGTH } from './adaptive-scoring.js';
import words from '../../words.js';
import { colors } from '../presentation/theme.js';
import { GAME_CONFIG } from '../config/game.js';

/**
 * Input source abstraction - handles user input or automated input
 */
export interface InputSource {
	/**
	 * Register callback for input events
	 * For keyboard: fires on keypress
	 * For auto-type: fires automatically when conditions are met
	 */
	onInput(callback: (ch: string) => void): void;

	/**
	 * Cleanup input listeners
	 */
	cleanup(): void;
}

/**
 * Renderer abstraction - handles display output
 */
export interface Renderer {
	/**
	 * Clear the display
	 */
	clear(): void;

	/**
	 * Render lines to display
	 */
	render(lines: string[]): void;

	/**
	 * Get current terminal dimensions
	 */
	getDimensions(): { width: number; height: number };
}

/**
 * Sound player abstraction - handles audio output
 */
export interface SoundPlayer {
	/**
	 * Play a sound by name
	 */
	play(soundName: string): void;
}

/**
 * Configuration options for the game
 */
export interface GameOptions {
	// Required dependencies
	inputSource: InputSource;
	renderer: Renderer;
	soundPlayer: SoundPlayer;

	// Optional configuration
	tickInterval?: number;           // Default: 600ms
	duration?: number;                // Default: undefined (infinite)
	adaptiveDifficulty?: boolean;     // Default: true
	showCompletionScreens?: boolean;  // Default: true
	showProgressionScreens?: boolean; // Default: true
}

/**
 * Controller for managing game lifecycle
 */
export interface GameController {
	/**
	 * Stop the game and cleanup resources
	 */
	stop(): void;

	/**
	 * Get current game state (for testing/debugging)
	 */
	getState(): GameState;
}

/**
 * Main game function
 *
 * Contains all shared game logic and coordinates between different adapters.
 * This function eliminates duplication between main game and demo modes.
 *
 * @param options - Game configuration and adapter instances
 * @returns Controller for managing game lifecycle
 */
export function startGame(options: GameOptions): GameController {
	// 1. Extract options with defaults
	const {
		inputSource,
		renderer,
		soundPlayer,
		tickInterval = GAME_CONFIG.GAME_TICK_INTERVAL,
		duration,
		adaptiveDifficulty = true,
		showCompletionScreens = true,
		showProgressionScreens = true,
	} = options;

	// 2. Initialize word pool (same for both modes)
	const singleWordLevels = filterSingleWords(words);
	const wordsByLength: WordsByLength = organizeWordsByLength(singleWordLevels);
	const maxWordLength = getMaxWordLength(wordsByLength);

	// 3. Initialize game state
	let difficultyState: DifficultyState = adaptiveDifficulty
		? createInitialDifficultyState(STARTING_WORD_LENGTH, maxWordLength)
		: createInitialDifficultyState(STARTING_WORD_LENGTH, STARTING_WORD_LENGTH); // Fixed difficulty

	let gameState: GameState = createInitialGameState();
	let bagOfChars: string[] = [];
	let currentTarget: string = '';
	let lastFeedback: string = '';
	let progressionMessage: string = '';
	let gameInterval: NodeJS.Timeout | null = null;
	let isWaitingForContinue = false;

	// 4. Define internal functions

	/**
	 * Initialize a new word and reset state
	 */
	const initializeWord = (): void => {
		const selectedWord = selectWordAtLength(
			wordsByLength,
			difficultyState.currentWordLength,
			difficultyState.usedWords
		);

		if (!selectedWord) {
			currentTarget = 'error';
			console.error('No word found for length:', difficultyState.currentWordLength);
			return;
		}

		currentTarget = selectedWord;
		gameState = createInitialGameState();
		bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
		lastFeedback = '';
		isWaitingForContinue = false;
	};

	/**
	 * Render the current game state
	 */
	const renderGame = (): void => {
		const dimensions = renderer.getDimensions();
		const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
		const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

		const lines = buildGameScreen(
			gameState,
			currentTarget,
			currentLevel,
			difficultyState.completedWords,
			currentScore,
			lastFeedback,
			CATCH_LINE_POSITION
		);

		const output = renderWithFrame(
			lines,
			GAME_CONFIG.FRAME_WIDTH,
			dimensions.width,
			dimensions.height
		);

		renderer.clear();
		renderer.render(output);
	};

	/**
	 * Game tick - generate new character and update board
	 */
	const gameTick = (): void => {
		if (isWaitingForContinue) return;

		// Generate new character
		const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

		// Update board with new character
		gameState = updateBoardWithNewChar(gameState, generatedChar, currentTarget);

		// Play tick sound
		const tickSound = getTickSound(gameState.tickCount);
		soundPlayer.play(tickSound);

		// Render game screen
		renderGame();
	};

	/**
	 * Handle user input (keyboard or automated)
	 */
	const handleInput = (ch: string): void => {
		if (isWaitingForContinue) {
			// Handle continue prompt (y/n)
			if (ch.toLowerCase() === 'y') {
				initializeWord();
				startGameLoop();
			} else if (ch.toLowerCase() === 'n') {
				stop();
				process.exit(0);
			}
			return;
		}

		// Process keypress through game logic
		const result = processKeypress(ch, gameState, currentTarget);
		gameState = result.newState;

		// Update feedback with colors
		lastFeedback = result.feedbackType === 'success'
			? `${colors.limeGreen}${result.feedback}${colors.reset}`
			: `${colors.hotPink}${result.feedback}${colors.reset}`;

		// Play sound if needed
		if (result.shouldPlaySound) {
			soundPlayer.play(result.shouldPlaySound);
		}

		// Update bag of chars on success
		if (result.feedbackType === 'success') {
			bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
		}

		// Handle word completion
		if (result.isLevelComplete) {
			if (gameInterval) {
				clearInterval(gameInterval);
				gameInterval = null;
			}

			if (showCompletionScreens) {
				// Calculate stats and update difficulty
				const stats = calculateStats(gameState.errorCount, gameState.missedLetters);
				const feedback = generateFeedback(stats);

				const updateResult = updateDifficultyState(difficultyState, currentTarget, stats);
				difficultyState = updateResult.newState;
				progressionMessage = showProgressionScreens ? updateResult.progression.message : '';

				const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
				const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

				// Show completion screen
				const lines = buildCompletionScreen(
					currentTarget,
					currentLevel,
					difficultyState.completedWords,
					currentScore,
					stats,
					feedback,
					progressionMessage
				);

				const dimensions = renderer.getDimensions();
				const output = renderWithFrame(
					lines,
					GAME_CONFIG.FRAME_WIDTH,
					dimensions.width,
					dimensions.height
				);

				renderer.clear();
				renderer.render(output);

				soundPlayer.play('victory');
				isWaitingForContinue = true;
			} else {
				// Demo mode: just continue to next word
				if (!adaptiveDifficulty) {
					// For demo, keep same difficulty
					difficultyState.completedWords++;
				}
				lastFeedback = `${colors.limeGreen}★★★ Orð lokið! "${currentTarget}" ★★★${colors.reset}`;

				setTimeout(() => {
					initializeWord();
					startGameLoop();
				}, 1000);
			}
		}

		// Render after input processing
		if (!result.isLevelComplete) {
			renderGame();
		}
	};

	/**
	 * Start the game loop
	 */
	const startGameLoop = (): void => {
		if (gameInterval) {
			clearInterval(gameInterval);
		}

		gameInterval = setInterval(gameTick, tickInterval);
	};

	/**
	 * Stop the game and cleanup resources
	 */
	const stop = (): void => {
		if (gameInterval) {
			clearInterval(gameInterval);
			gameInterval = null;
		}
		inputSource.cleanup();
	};

	// 5. Initialize first word
	initializeWord();

	// 6. Start game loop
	startGameLoop();

	// 7. Setup input handling
	inputSource.onInput(handleInput);

	// 7a. If auto-type adapter, provide state accessor
	if ('setStateAccessor' in inputSource) {
		(inputSource as any).setStateAccessor(() => ({
			gameState,
			currentTarget
		}));
	}

	// 8. Optional: auto-stop after duration (for demo mode)
	if (duration) {
		setTimeout(() => {
			stop();
		}, duration);
	}

	// 9. Return controller for external control
	return {
		stop,
		getState: () => gameState
	};
}
