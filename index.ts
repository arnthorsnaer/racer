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
	filterSingleWords,
	organizeWordsByLength,
	getMaxWordLength,
	selectWordAtLength,
	type WordsByLength,
} from './src/core/word-pool.js';
import {
	generateBagOfChars,
} from './src/core/word-generation.js';
import {
	createInitialDifficultyState,
	updateDifficultyState,
	type DifficultyState,
} from './src/core/adaptive-difficulty.js';
import {
	getLevelFromWordLength,
	calculateScore,
	STARTING_WORD_LENGTH,
} from './src/core/adaptive-scoring.js';
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

// Initialize word pool and adaptive difficulty
const singleWordLevels = filterSingleWords(levels);
const wordsByLength: WordsByLength = organizeWordsByLength(singleWordLevels);
const maxWordLength = getMaxWordLength(wordsByLength);

// Initialize game state
let difficultyState: DifficultyState = createInitialDifficultyState(STARTING_WORD_LENGTH, maxWordLength);
let gameState: GameState = createInitialGameState();
let bagOfChars: string[] = [];
let currentTarget: string = '';
let lastFeedback: string = '';
let progressionMessage: string = '';
let gameInterval: NodeJS.Timeout | null = null;
let isWaitingForContinue = false;

/**
 * Select and initialize a new word based on current difficulty
 */
const initializeWord = (): void => {
	const selectedWord = selectWordAtLength(
		wordsByLength,
		difficultyState.currentWordLength,
		difficultyState.usedWords
	);

	if (!selectedWord) {
		// Fallback: if no word found, try closest length
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

	// If waiting for continue choice, handle y/n input
	if (isWaitingForContinue) {
		if (ch === 'y' || ch === 'Y') {
			// Initialize new word at current difficulty
			initializeWord();

			const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
			const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

			// Show progression screen briefly
			const lines = [
				`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`,
				'',
				`${colors.electricBlue}Stig ${currentLevel} (${currentTarget.length}-stafa orð)${colors.reset}`,
				`${colors.sunsetOrange}Næsta orð: ${currentTarget}${colors.reset}`,
				`${colors.limeGreen}Orð kláruð: ${difficultyState.completedWords}${colors.reset}  ${colors.cosmicPurple}Skor: ${currentScore.toFixed(1)}${colors.reset}`,
				'',
				`${colors.bright}${progressionMessage}${colors.reset}`,
				'',
				`${colors.limeGreen}Leikur byrjar...${colors.reset}`,
			];
			renderScreen(lines);

			startGameLoop();
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

		// Update difficulty state based on performance
		const updateResult = updateDifficultyState(difficultyState, currentTarget, stats);
		difficultyState = updateResult.newState;
		progressionMessage = updateResult.progression.message;

		// Calculate new score
		const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
		const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

		// Build completion screen
		const lines = buildCompletionScreen(
			currentTarget,
			currentLevel,
			difficultyState.completedWords,
			currentScore,
			stats,
			feedback,
			progressionMessage
		);
		renderScreen(lines);

		// Play victory sound
		sound.play('victory');

		// Always wait for continue choice (adaptive difficulty never ends)
		isWaitingForContinue = true;
	}
};

// Main entry point
const main = (): void => {
	// Initialize input
	input.initialize();
	input.onKeypress(handleKeypress);

	// Initialize first word
	initializeWord();

	// Calculate initial values for display
	const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
	const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

	// Show welcome screen
	const lines = buildWelcomeScreen(
		currentTarget,
		currentLevel,
		difficultyState.completedWords,
		currentScore,
		gameState.board.length,
		CATCH_LINE_POSITION
	);
	renderScreen(lines);

	// Start the game loop
	startGameLoop();
};

// Run the game
main();
