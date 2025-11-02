#!/usr/bin/env bun
/**
 * Automated demo script for Racer
 *
 * This script demonstrates the actual game running with automated gameplay.
 * Perfect for GitHub Actions workflow recordings and demonstrations.
 *
 * Usage:
 *   bun run demo/index.ts
 */

import { startGame } from '../src/core/game.js';
import { createAutoTypeInput } from './adapters/auto-type-input.js';
import { createConsoleRenderer } from './adapters/console-renderer.js';
import { createNoopSound } from './adapters/noop-sound.js';
import { GAME_CONFIG } from '../src/config/game.js';
import { CATCH_LINE_POSITION } from '../src/core/game-logic.js';

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

	// Create adapters
	const inputSource = createAutoTypeInput({
		interval: GAME_CONFIG.AUTO_TYPE_INTERVAL,
		catchLinePosition: CATCH_LINE_POSITION,
	});
	const renderer = createConsoleRenderer({ width: 80, height: 24 });
	const soundPlayer = createNoopSound();

	// Start demo
	const demo = startGame({
		inputSource,
		renderer,
		soundPlayer,
		tickInterval: GAME_CONFIG.DEMO_TICK_INTERVAL,
		duration: GAME_CONFIG.DEMO_DURATION,
		adaptiveDifficulty: false,
		showCompletionScreens: false,
		showProgressionScreens: false,
	});

	// Wait for demo to complete
	await new Promise(resolve => setTimeout(resolve, GAME_CONFIG.DEMO_DURATION + 500));

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
	const state = demo.getState();
	console.log(`  • Errors: ${state.errorCount}`);
	console.log(`  • Missed letters: ${state.missedLetters}`);
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
