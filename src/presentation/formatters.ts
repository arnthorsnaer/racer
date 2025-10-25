/**
 * Pure formatting functions for rendering
 * All functions return strings - no side effects
 */

import { colors, frame } from './theme.js';
import type { BoardItem, GameState } from '../core/game-logic.js';
import type { PerformanceStats, FeedbackMessage } from '../core/score-calculator.js';

export interface CenteringInfo {
	leftPadding: number;
	topPadding: number;
	termWidth: number;
	termHeight: number;
}

/**
 * Helper function to get terminal dimensions and calculate centering
 */
export const getCenteringInfo = (
	contentWidth: number,
	contentHeight: number,
	termWidth: number,
	termHeight: number
): CenteringInfo => {
	const leftPadding = Math.max(0, Math.floor((termWidth - contentWidth) / 2));
	const topPadding = Math.max(0, Math.floor((termHeight - contentHeight) / 2));

	return { leftPadding, topPadding, termWidth, termHeight };
};

/**
 * Helper function to create a framed line
 */
export const createFramedLine = (content: string, width: number, leftPadding: number): string => {
	const padding = ' '.repeat(leftPadding);
	// Strip ANSI codes to measure actual content length
	const strippedContent = content.replace(/\x1b\[[0-9;]*m/g, '');
	const contentPadding = ' '.repeat(Math.max(0, width - strippedContent.length - 2));
	return `${padding}${colors.deepPurple}${frame.vertical}${colors.reset} ${content}${contentPadding}${colors.deepPurple}${frame.vertical}${colors.reset}`;
};

/**
 * Helper function to create horizontal border
 */
export const createHorizontalBorder = (width: number, leftPadding: number, isTop: boolean): string => {
	const padding = ' '.repeat(leftPadding);
	const leftChar = isTop ? frame.topLeft : frame.bottomLeft;
	const rightChar = isTop ? frame.topRight : frame.bottomRight;
	const line = frame.horizontal.repeat(width);
	return `${padding}${colors.deepPurple}${leftChar}${line}${rightChar}${colors.reset}`;
};

/**
 * Format the game board lines
 */
export const formatGameBoard = (
	board: (BoardItem | undefined)[],
	catchLinePosition: number
): string[] => {
	const lines: string[] = [];

	for (let i = 0; i < board.length; i++) {
		// Always show the catch character at position 13
		if (i === catchLinePosition) {
			if (board[i] !== undefined) {
				const marker = board[i]!.success ? `${colors.limeGreen}✓` : `${colors.sunsetOrange}▶`;
				const letterColor = board[i]!.success ? colors.limeGreen : colors.electricCyan;
				lines.push(`${marker}${letterColor}${board[i]!.generated}${colors.reset}`);
			} else {
				// Show just the catch character even when no letter is there
				lines.push(`${colors.sunsetOrange}▶${colors.reset}`);
			}
		} else if (i < catchLinePosition) {
			// Only render positions before the catch line
			if (board[i] !== undefined) {
				lines.push(`${colors.neonCyan}${board[i]!.generated}${colors.reset}`);
			} else {
				lines.push('');
			}
		}
		// Skip positions after the catch line to eliminate spacing
	}

	return lines;
};

/**
 * Format the progress display
 */
export const formatProgress = (typedProgress: string, fullTarget: string): string => {
	const remaining = fullTarget.substring(typedProgress.length);
	return `${colors.bright}${colors.electricCyan}[${typedProgress}]${colors.dim}${colors.sunsetOrange}${remaining}${colors.reset}`;
};

/**
 * Format the stats display
 */
export const formatStats = (errorCount: number, missedLetters: number): string => {
	return `${colors.neonPink}Villur: ${colors.hotPink}${errorCount}${colors.reset}  ${colors.neonPink}Missir: ${colors.hotPink}${missedLetters}${colors.reset}`;
};

/**
 * Build the main game screen lines
 */
export const buildGameScreen = (
	state: GameState,
	fullTarget: string,
	currentLevel: number,
	completedWords: number,
	score: number,
	feedback: string,
	catchLinePosition: number
): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');

	// Adaptive difficulty info
	const levelInfo = `${colors.electricCyan}STIG: ${currentLevel}${colors.reset} ${colors.sunsetOrange}(${fullTarget.length}-stafa orð)${colors.reset}`;
	const wordInfo = `${colors.limeGreen}Orð kláruð: ${completedWords}${colors.reset}`;
	const scoreInfo = `${colors.cosmicPurple}Skor: ${score.toFixed(1)}${colors.reset}`;
	lines.push(`${levelInfo}  ${wordInfo}  ${scoreInfo}`);
	lines.push('');

	// Board
	lines.push(...formatGameBoard(state.board, catchLinePosition));

	// Progress
	lines.push('');
	lines.push(formatProgress(state.typedProgress, fullTarget));

	// Stats
	lines.push(formatStats(state.errorCount, state.missedLetters));

	// Feedback
	if (feedback) {
		lines.push('');
		lines.push(feedback);
	}

	return lines;
};

/**
 * Build the initial/welcome screen lines
 */
export const buildWelcomeScreen = (
	targetWord: string,
	currentLevel: number,
	completedWords: number,
	score: number,
	boardSize: number,
	catchLinePosition: number
): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');
	lines.push(`${colors.bright}${colors.electricBlue}Stig ${currentLevel} (${targetWord.length}-stafa orð)${colors.reset}`);
	lines.push(`${colors.bright}Markmiðsorð: ${colors.sunsetOrange}${targetWord}${colors.reset}`);
	lines.push(`${colors.limeGreen}Orð kláruð: ${completedWords}${colors.reset}  ${colors.cosmicPurple}Skor: ${score.toFixed(1)}${colors.reset}`);
	lines.push('');
	lines.push(`${colors.electricCyan}Stjórnun:${colors.reset}`);
	lines.push(`  ${colors.arcadeGreen}▶ Stafir birtast sjálfkrafa á 0.4 sekúndu fresti${colors.reset}`);
	lines.push(`  ${colors.arcadeGreen}▶ Ýttu á stafatakka til að velja þá${colors.reset}`);
	lines.push(`  ${colors.arcadeGreen}▶ Ýttu á F1 til að kveikja/slökkva á hljóði${colors.reset}`);
	lines.push(`  ${colors.arcadeGreen}▶ Ýttu á Ctrl+C til að hætta${colors.reset}`);
	lines.push('');
	lines.push(`${colors.neonPink}━━━ Borð ━━━${colors.reset}`);

	for (let i = 0; i < boardSize; i++) {
		if (i === catchLinePosition) {
			lines.push(`${colors.sunsetOrange}▶ (vallína)${colors.reset}`);
		} else {
			lines.push('');
		}
	}

	lines.push('');
	lines.push(`${colors.limeGreen}Leikur byrjar...${colors.reset}`);

	return lines;
};

/**
 * Build the level completion screen lines
 */
export const buildCompletionScreen = (
	fullTarget: string,
	currentLevel: number,
	completedWords: number,
	score: number,
	stats: PerformanceStats,
	feedback: FeedbackMessage,
	progressionMessage: string
): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');
	lines.push(`${colors.bright}${colors.neonPink}★ TIL HAMINGJU! Þú kláraðir orðið: ${colors.sunsetOrange}${fullTarget}${colors.reset}`);
	lines.push(`${colors.bright}${colors.electricBlue}Stig ${currentLevel} lokið!${colors.reset}`);
	lines.push(`${colors.limeGreen}Orð kláruð: ${completedWords}${colors.reset}  ${colors.cosmicPurple}Skor: ${score.toFixed(1)}${colors.reset}`);
	lines.push('');

	// Display performance stats
	lines.push(`${colors.bright}${colors.electricCyan}▓▒░ STATTAR ░▒▓${colors.reset}`);
	lines.push('');

	if (stats.isPerfect) {
		lines.push(`${colors.bright}${colors.limeGreen}★ FULLKOMIÐ! ★${colors.reset}`);
		lines.push(`${colors.limeGreen}${feedback.message}${colors.reset}`);
	} else {
		lines.push(`${colors.neonPink}Villur (rangar lyklar): ${colors.hotPink}${stats.errorCount}${colors.reset}`);
		lines.push(`${colors.neonPink}Missaðir stafir: ${colors.hotPink}${stats.missedLetters}${colors.reset}`);
		lines.push('');
		lines.push(`${colors.electricCyan}${feedback.message}${colors.reset}`);
	}

	// Show progression message
	lines.push('');
	lines.push(`${colors.bright}${colors.electricBlue}${progressionMessage}${colors.reset}`);

	// Ask if user wants to continue
	lines.push('');
	lines.push(`${colors.bright}${colors.sunsetOrange}Viltu halda áfram? (y/n)${colors.reset}`);

	return lines;
};

/**
 * Build the "all levels complete" screen
 */
export const buildAllCompleteScreen = (totalLevels: number): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');
	lines.push(`${colors.bright}${colors.neonPink}★ TIL HAMINGJU! ★${colors.reset}`);
	lines.push(`${colors.limeGreen}Þú hefur klárað öll ${totalLevels} stigin!${colors.reset}`);

	return lines;
};

/**
 * Build the "next level starting" screen
 */
export const buildNextLevelScreen = (
	targetWord: string,
	currentLevel: number,
	totalLevels: number
): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');
	lines.push(`${colors.bright}${colors.electricBlue}Stig ${currentLevel + 1}/${totalLevels}${colors.reset}`);
	lines.push(`${colors.bright}Markmiðsorð: ${colors.sunsetOrange}${targetWord}${colors.reset}`);
	lines.push('');
	lines.push(`${colors.limeGreen}Leikur byrjar...${colors.reset}`);

	return lines;
};

/**
 * Build the goodbye screen
 */
export const buildGoodbyeScreen = (): string[] => {
	const lines: string[] = [];

	lines.push(`${colors.bright}${colors.neonPink}▓▒░ ÍSLENSKUR STAFA-KAPPAKSTUR ░▒▓${colors.reset}`);
	lines.push('');
	lines.push(`${colors.electricCyan}Takk fyrir að spila!${colors.reset}`);

	return lines;
};

/**
 * Render lines with frame and centering
 * Returns array of strings ready to be logged
 */
export const renderWithFrame = (
	lines: string[],
	frameWidth: number,
	termWidth: number,
	termHeight: number
): string[] => {
	const output: string[] = [];
	const contentHeight = lines.length + 2; // +2 for top and bottom borders
	const { leftPadding, topPadding } = getCenteringInfo(frameWidth + 2, contentHeight, termWidth, termHeight);

	// Top padding (vertical centering)
	for (let i = 0; i < topPadding; i++) {
		output.push('');
	}

	// Top border
	output.push(createHorizontalBorder(frameWidth, leftPadding, true));

	// Content with side borders
	for (const line of lines) {
		output.push(createFramedLine(line, frameWidth, leftPadding));
	}

	// Bottom border
	output.push(createHorizontalBorder(frameWidth, leftPadding, false));

	return output;
};
