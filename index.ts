#!/usr/bin/env node
/**
 * Imperative Shell - Main Game Entry Point
 * Orchestrates side effects and wires together pure core logic
 */

import { startGame } from './src/core/game-orchestrator.js';
import { createKeyboardInput } from './src/adapters/keyboard-input.js';
import { createTerminalRenderer } from './src/adapters/terminal-renderer.js';
import { createRealSound } from './src/adapters/real-sound.js';

// Create adapters
const inputSource = createKeyboardInput();
const renderer = createTerminalRenderer();
const soundPlayer = createRealSound();

// Start game
const game = startGame({
	inputSource,
	renderer,
	soundPlayer,
	adaptiveDifficulty: true,
	showCompletionScreens: true,
	showProgressionScreens: true,
});

// Handle Ctrl+C gracefully (already handled in keyboard adapter, but this is backup)
process.on('SIGINT', () => {
	game.stop();
	process.exit(0);
});
