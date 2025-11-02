#!/usr/bin/env node
/**
 * Imperative Shell - Main Game Entry Point
 * Wires together adapters and core game logic
 */

import { startGame } from './src/core/game.ts';
import { createKeyboardInput } from './src/adapters/keyboard-input.ts';
import { createTerminalRenderer } from './src/adapters/terminal-renderer.ts';
import { createRealSound } from './src/adapters/real-sound.ts';

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
