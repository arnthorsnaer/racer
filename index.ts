/**
 * Imperative Shell - Entry point
 * Orchestrates side effects and wires together pure core logic
 */

import levels from './levels.js';
import { colors } from './src/presentation/theme.js';
import { alphabet } from './src/presentation/theme.js';
import {
	renderWithFrame,
	buildGameScreen,
	buildWelcomeScreen,
	buildCompletionScreen,
	buildAllCompleteScreen,
	buildNextLevelScreen,
	buildGoodbyeScreen,
} from './src/presentation/formatters.js';
import {
	createShuffledLevelIndices,
	getActualLevel,
	hasNextLevel,
	getNextLevelIndex,
} from './src/core/level-progression.js';
import {
	generateBagOfChars,
} from './src/core/word-generation.js';
import {
	createInitialGameState,
	updateBoardWithNewChar,
	processKeypress,
	getTickSound,
	CATCH_LINE_POSITION,
	type GameState,
} from './src/core/game-logic.js';
import {
	calculateStats,
	generateFeedback,
} from './src/core/score-calculator.js';
import { createSoundAdapter } from './src/adapters/sound-adapter.js';
import { createTerminalAdapter } from './src/adapters/terminal-adapter.js';
import { createInputAdapter, type Key } from './src/adapters/input-adapter.js';

// Initialize adapters (side effects)
const sound = createSoundAdapter();
const terminal = createTerminalAdapter();
const input = createInputAdapter();

// Game configuration
const FRAME_WIDTH = 50;
const GAME_TICK_INTERVAL = 400; // ms

// Initialize game state
const shuffledLevelIndices = createShuffledLevelIndices(levels);
let currentLevelIndex = 0;
let gameState: GameState = createInitialGameState();
let bagOfChars: string[] = [];
let currentTarget: string = '';
let lastFeedback: string = '';
let gameInterval: NodeJS.Timeout | null = null;
let isWaitingForLevelChoice = false;

/**
 * Initialize a level - sets up state for a new level
 */
const initializeLevel = (levelIndex: number): void => {
	currentLevelIndex = levelIndex;
	const level = getActualLevel(shuffledLevelIndices, currentLevelIndex, levels);
	currentTarget = level.target;
	gameState = createInitialGameState();
	bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
	lastFeedback = '';
	isWaitingForLevelChoice = false;
};

/**
 * Render a screen to the terminal
 */
const renderScreen = (lines: string[]): void => {
	const dimensions = terminal.getDimensions();
	const output = renderWithFrame(lines, FRAME_WIDTH, dimensions.width, dimensions.height);

	terminal.clear();
	output.forEach(line => terminal.log(line));
};

/**
 * Start the game loop
 */
const startGameLoop = (): void => {
	if (gameInterval) {
		clearInterval(gameInterval);
	}

	gameInterval = setInterval(() => {
		// Generate new character
		const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

		// Update board with new character
		gameState = updateBoardWithNewChar(gameState, generatedChar, currentTarget);

		// Play tick sound
		const tickSound = getTickSound(gameState.tickCount);
		sound.play(tickSound);

		// Render game screen
		const lines = buildGameScreen(
			gameState,
			currentTarget,
			currentLevelIndex,
			levels.length,
			lastFeedback,
			CATCH_LINE_POSITION
		);
		renderScreen(lines);
	}, GAME_TICK_INTERVAL);
};

/**
 * Handle keypress events
 */
const handleKeypress = (ch: string, key: Key): void => {
	// Handle Ctrl+C to quit
	if (key && key.ctrl && key.name === 'c') {
		if (gameInterval) clearInterval(gameInterval);
		terminal.log('\n\nHætti í leik...\n');
		process.exit(0);
	}

	// If waiting for level choice, handle y/n input
	if (isWaitingForLevelChoice) {
		if (ch === 'y' || ch === 'Y') {
			// Check if there's a next level
			if (hasNextLevel(currentLevelIndex, levels.length)) {
				initializeLevel(getNextLevelIndex(currentLevelIndex));

				const lines = buildNextLevelScreen(currentTarget, currentLevelIndex, levels.length);
				renderScreen(lines);

				startGameLoop();
			} else {
				// All levels completed!
				const lines = buildAllCompleteScreen(levels.length);
				renderScreen(lines);

				setTimeout(() => process.exit(0), 2000);
			}
		} else if (ch === 'n' || ch === 'N') {
			const lines = buildGoodbyeScreen();
			renderScreen(lines);

			setTimeout(() => process.exit(0), 1000);
		}
		return;
	}

	// Handle F1 key to toggle mute
	if (key && key.name === 'f1') {
		const isEnabled = sound.toggleMute();
		lastFeedback = isEnabled
			? `${colors.electricCyan}♪ Hljóð á${colors.reset}`
			: `${colors.deepPurple}♪ Hljóð af${colors.reset}`;
		return;
	}

	// Only process if we have a valid character
	if (!ch || ch.length === 0) {
		return;
	}

	// Skip control characters and special keys
	if (key && (key.name === "enter" || key.name === "return" || key.name === "escape")) {
		return;
	}

	// Process the keypress using pure logic
	const result = processKeypress(ch, gameState, currentTarget);

	// Update game state
	gameState = result.newState;
	lastFeedback = result.feedbackType === 'success'
		? `${colors.limeGreen}${result.feedback}${colors.reset}`
		: `${colors.hotPink}${result.feedback}${colors.reset}`;

	// Play sound if needed
	if (result.shouldPlaySound) {
		sound.play(result.shouldPlaySound);
	}

	// If successful, regenerate bag for next letter
	if (result.feedbackType === 'success') {
		bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
	}

	// Check if level is complete
	if (result.isLevelComplete) {
		if (gameInterval) clearInterval(gameInterval);

		// Calculate stats and generate feedback
		const stats = calculateStats(gameState.errorCount, gameState.missedLetters);
		const feedback = generateFeedback(stats);

		// Build completion screen
		const lines = buildCompletionScreen(
			currentTarget,
			currentLevelIndex,
			levels.length,
			stats,
			feedback,
			hasNextLevel(currentLevelIndex, levels.length)
		);
		renderScreen(lines);

		// Play victory sound
		sound.play('victory');

		// Set waiting for choice if there are more levels
		if (hasNextLevel(currentLevelIndex, levels.length)) {
			isWaitingForLevelChoice = true;
		} else {
			setTimeout(() => process.exit(0), 2000);
		}
	}
};

// Main entry point
const main = (): void => {
	// Initialize input
	input.initialize();
	input.onKeypress(handleKeypress);

	// Initialize first level
	initializeLevel(0);

	// Show welcome screen
	const lines = buildWelcomeScreen(
		currentTarget,
		currentLevelIndex,
		levels.length,
		gameState.board.length,
		CATCH_LINE_POSITION
	);
	renderScreen(lines);

	// Start the game loop
	startGameLoop();
};

// Run the game
main();
