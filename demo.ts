#!/usr/bin/env bun
/**
 * Automated demo script for Racer
 *
 * This script demonstrates the actual game running with automated gameplay.
 * Perfect for GitHub Actions workflow recordings and demonstrations.
 *
 * Usage:
 *   bun run demo.ts
 */

import words from './words.js';
import { colors } from './src/presentation/theme.js';
import {
	renderWithFrame,
	buildGameScreen,
} from './src/presentation/formatters.js';
import {
	filterSingleWords,
	organizeWordsByLength,
	selectWordAtLength,
	type WordsByLength,
} from './src/core/word-pool.js';
import {
	generateBagOfChars,
} from './src/core/word-generation.js';
import {
	createInitialGameState,
	updateBoardWithNewChar,
	processKeypress,
	CATCH_LINE_POSITION,
	type GameState,
} from './src/core/game-logic.js';

// Demo configuration
const FRAME_WIDTH = 50;
const GAME_TICK_INTERVAL = 500; // ms - slightly faster for demo
const DEMO_DURATION = 18000; // 18 seconds total demo
const AUTO_TYPE_INTERVAL = 250; // ms - auto-type frequently to catch letters

// Initialize word pool
const singleWordLevels = filterSingleWords(words);
const wordsByLength: WordsByLength = organizeWordsByLength(singleWordLevels);

// Game state
let gameState: GameState = createInitialGameState();
let bagOfChars: string[] = [];
let currentTarget: string = '';
let lastFeedback: string = '';
let completedWords: number = 0;
let currentWordLength: number = 7; // Start with medium difficulty word

/**
 * Select and initialize a new word
 */
const initializeWord = (): void => {
	const selectedWord = selectWordAtLength(wordsByLength, currentWordLength, new Set());

	if (!selectedWord) {
		currentTarget = 'Racer';
		console.error('No word found, using fallback');
	} else {
		currentTarget = selectedWord;
	}

	gameState = createInitialGameState();
	bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
	lastFeedback = `${colors.limeGreen}★ Byrjum leik!${colors.reset}`;
};

/**
 * Render the game screen
 */
const renderScreen = (): void => {
	const termWidth = 80;
	const termHeight = 24;

	const lines = buildGameScreen(
		gameState,
		currentTarget,
		1, // level
		completedWords,
		completedWords * 100, // simple score
		lastFeedback,
		CATCH_LINE_POSITION
	);

	const output = renderWithFrame(lines, FRAME_WIDTH, termWidth, termHeight);

	console.clear();
	output.forEach(line => console.log(line));
};

/**
 * Automated typing - catches letters automatically
 */
const autoType = (): void => {
	const nextExpectedChar = currentTarget[gameState.typedProgress.length];
	const itemAtCatchLine = gameState.board[CATCH_LINE_POSITION];

	// Only type if there's a letter at the catch line that matches what we need
	if (itemAtCatchLine && itemAtCatchLine.generated) {
		const letterAtCatch = itemAtCatchLine.generated;

		if (letterAtCatch.toLowerCase() === nextExpectedChar.toLowerCase()) {
			// Type the correct letter
			const result = processKeypress(letterAtCatch, gameState, currentTarget);
			gameState = result.newState;
			lastFeedback = result.feedbackType === 'success'
				? `${colors.limeGreen}${result.feedback}${colors.reset}`
				: `${colors.hotPink}${result.feedback}${colors.reset}`;

			// Regenerate bag for next letter
			if (result.feedbackType === 'success') {
				bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
			}

			// Check if word is complete
			if (result.isLevelComplete) {
				completedWords++;
				lastFeedback = `${colors.limeGreen}★★★ Orð lokið! "${currentTarget}" ★★★${colors.reset}`;

				// Start a new word after a brief pause
				setTimeout(() => {
					initializeWord();
				}, 1000);
			}
		}
	}
};

/**
 * Game tick - add new falling letter
 */
const gameTick = (): void => {
	// Generate new character
	const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

	// Update board with new character
	gameState = updateBoardWithNewChar(gameState, generatedChar, currentTarget);

	// Render
	renderScreen();
};

/**
 * Run the automated demo
 */
async function runDemo() {
	console.clear();

	// Show initial title screen
	console.log('\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m');
	console.log('\x1b[1;36m║                                        ║\x1b[0m');
	console.log('\x1b[1;36m║         \x1b[1;33mRACER - Typing Game\x1b[1;36m         ║\x1b[0m');
	console.log('\x1b[1;36m║                                        ║\x1b[0m');
	console.log('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m');
	console.log('');
	console.log('\x1b[1;32m✨ Automated Demo Starting... ✨\x1b[0m');
	console.log('');

	await new Promise(resolve => setTimeout(resolve, 2000));

	// Initialize first word
	initializeWord();
	renderScreen();

	// Start game loop
	const gameInterval = setInterval(gameTick, GAME_TICK_INTERVAL);

	// Start auto-typing
	const autoTypeInterval = setInterval(autoType, AUTO_TYPE_INTERVAL);

	// Run for demo duration
	await new Promise(resolve => setTimeout(resolve, DEMO_DURATION));

	// Clean up
	clearInterval(gameInterval);
	clearInterval(autoTypeInterval);

	// Show final screen
	console.clear();
	console.log('\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m');
	console.log('\x1b[1;36m║                                        ║\x1b[0m');
	console.log('\x1b[1;36m║         \x1b[1;33mRACER - Typing Game\x1b[1;36m         ║\x1b[0m');
	console.log('\x1b[1;36m║                                        ║\x1b[0m');
	console.log('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m');
	console.log('');
	console.log(`\x1b[1;32m✓ Demo Complete!\x1b[0m`);
	console.log('');
	console.log(`\x1b[1;33m📊 Demo Stats:\x1b[0m`);
	console.log(`  • Words completed: ${completedWords}`);
	console.log(`  • Errors: ${gameState.errorCount}`);
	console.log(`  • Missed letters: ${gameState.missedLetters}`);
	console.log('');
	console.log('\x1b[1;33m🚀 Try it yourself:\x1b[0m');
	console.log('  \x1b[36mnpm install && npm start\x1b[0m');
	console.log('');

	await new Promise(resolve => setTimeout(resolve, 2000));
}

// Run the demo
runDemo()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('\x1b[1;31mDemo error:\x1b[0m', error);
		process.exit(1);
	});
