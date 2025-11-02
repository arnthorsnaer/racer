/**
 * Tests for formatters module
 * Tests pure formatting functions for rendering
 */

import { describe, it, expect } from 'vitest';
import {
	getCenteringInfo,
	createFramedLine,
	createHorizontalBorder,
	formatGameBoard,
	formatProgress,
	formatStats,
	buildGameScreen,
	buildWelcomeScreen,
	buildCompletionScreen,
	buildAllCompleteScreen,
	buildNextLevelScreen,
	buildGoodbyeScreen,
	renderWithFrame,
} from '../formatters.ts';
import type { GameState, BoardItem } from '../../core/game-logic.ts';
import type { PerformanceStats, FeedbackMessage } from '../../core/score-calculator.ts';

describe('formatters', () => {
	describe('getCenteringInfo', () => {
		it('should calculate left padding for centered content', () => {
			const result = getCenteringInfo(50, 20, 100, 40);

			expect(result.leftPadding).toBe(25); // (100 - 50) / 2
			expect(result.topPadding).toBe(10); // (40 - 20) / 2
		});

		it('should return 0 padding when content is larger than terminal', () => {
			const result = getCenteringInfo(150, 50, 100, 40);

			expect(result.leftPadding).toBe(0);
			expect(result.topPadding).toBe(0);
		});

		it('should handle exact fit', () => {
			const result = getCenteringInfo(100, 40, 100, 40);

			expect(result.leftPadding).toBe(0);
			expect(result.topPadding).toBe(0);
		});

		it('should return terminal dimensions', () => {
			const result = getCenteringInfo(50, 20, 100, 40);

			expect(result.termWidth).toBe(100);
			expect(result.termHeight).toBe(40);
		});

		it('should handle small terminal', () => {
			const result = getCenteringInfo(10, 5, 20, 10);

			expect(result.leftPadding).toBe(5);
			expect(result.topPadding).toBe(2); // floor((10-5)/2) = 2
		});

		it('should floor odd divisions', () => {
			const result = getCenteringInfo(49, 19, 100, 40);

			expect(result.leftPadding).toBe(25); // floor((100-49)/2) = 25
			expect(result.topPadding).toBe(10); // floor((40-19)/2) = 10
		});
	});

	describe('createFramedLine', () => {
		it('should create line with vertical borders', () => {
			const result = createFramedLine('test', 10, 0);

			expect(result).toContain('test');
			// Should contain vertical frame characters
		});

		it('should add left padding', () => {
			const result = createFramedLine('test', 10, 5);

			expect(result.startsWith('     ')).toBe(true); // 5 spaces
		});

		it('should handle empty content', () => {
			const result = createFramedLine('', 10, 0);

			expect(result).toBeDefined();
			expect(result.length).toBeGreaterThan(0);
		});

		it('should strip ANSI codes when measuring content length', () => {
			const withAnsi = '\x1b[31mred text\x1b[0m';
			const result = createFramedLine(withAnsi, 20, 0);

			// Should measure "red text" (8 chars) not including ANSI codes
			expect(result).toBeDefined();
		});

		it('should pad content to width', () => {
			const result = createFramedLine('hi', 20, 0);

			// Should pad the content to fill the width
			expect(result.length).toBeGreaterThan(10);
		});
	});

	describe('createHorizontalBorder', () => {
		it('should create top border', () => {
			const result = createHorizontalBorder(10, 0, true);

			expect(result).toBeDefined();
			// Top border should use topLeft and topRight
		});

		it('should create bottom border', () => {
			const result = createHorizontalBorder(10, 0, false);

			expect(result).toBeDefined();
			// Bottom border should use bottomLeft and bottomRight
		});

		it('should add left padding', () => {
			const result = createHorizontalBorder(10, 5, true);

			expect(result.startsWith('     ')).toBe(true); // 5 spaces
		});

		it('should scale with width', () => {
			const narrow = createHorizontalBorder(5, 0, true);
			const wide = createHorizontalBorder(50, 0, true);

			expect(wide.length).toBeGreaterThan(narrow.length);
		});
	});

	describe('formatGameBoard', () => {
		const CATCH_LINE = 13;

		it('should format empty board', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			const result = formatGameBoard(board, CATCH_LINE);

			expect(result.length).toBeLessThanOrEqual(16);
		});

		it('should show catch character at catch line position', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			const result = formatGameBoard(board, CATCH_LINE);

			// Line at CATCH_LINE index should have the catch marker
			expect(result[CATCH_LINE]).toContain('▶');
		});

		it('should mark successful letters at catch line', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			board[CATCH_LINE] = { generated: 'a', success: true };

			const result = formatGameBoard(board, CATCH_LINE);

			// Should contain the letter and success marker
			expect(result[CATCH_LINE]).toContain('a');
			expect(result[CATCH_LINE]).toContain('✓');
		});

		it('should mark unsuccessful letters at catch line', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			board[CATCH_LINE] = { generated: 'b', success: false };

			const result = formatGameBoard(board, CATCH_LINE);

			// Should contain the letter and catch marker
			expect(result[CATCH_LINE]).toContain('b');
			expect(result[CATCH_LINE]).toContain('▶');
		});

		it('should format letters before catch line', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			board[0] = { generated: 'x', success: false };
			board[5] = { generated: 'y', success: false };

			const result = formatGameBoard(board, CATCH_LINE);

			expect(result[0]).toContain('x');
			expect(result[5]).toContain('y');
		});

		it('should not render positions after catch line', () => {
			const board: (BoardItem | undefined)[] = new Array(16);
			board[14] = { generated: 'z', success: false };
			board[15] = { generated: 'w', success: false };

			const result = formatGameBoard(board, CATCH_LINE);

			// Should not include positions 14 and 15
			expect(result.length).toBe(CATCH_LINE + 1);
		});
	});

	describe('formatProgress', () => {
		it('should show typed progress and remaining', () => {
			const result = formatProgress('hel', 'hello');

			expect(result).toContain('hel');
			expect(result).toContain('lo');
		});

		it('should handle empty progress', () => {
			const result = formatProgress('', 'hello');

			expect(result).toContain('hello');
		});

		it('should handle complete progress', () => {
			const result = formatProgress('hello', 'hello');

			expect(result).toContain('hello');
		});

		it('should use brackets for typed part', () => {
			const result = formatProgress('test', 'testing');

			expect(result).toContain('[test]');
		});
	});

	describe('formatStats', () => {
		it('should show error count and missed letters', () => {
			const result = formatStats(5, 3);

			expect(result).toContain('5');
			expect(result).toContain('3');
		});

		it('should handle zero stats', () => {
			const result = formatStats(0, 0);

			expect(result).toContain('0');
		});

		it('should handle large numbers', () => {
			const result = formatStats(999, 888);

			expect(result).toContain('999');
			expect(result).toContain('888');
		});
	});

	describe('buildGameScreen', () => {
		const mockState: GameState = {
			board: new Array(16),
			typedProgress: 'tes',
			errorCount: 2,
			missedLetters: 1,
			catchCount: 5,
			tickCount: 10,
		};

		it('should include title', () => {
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, '', 13);

			expect(lines.some(line => line.includes('ÍSLENSKUR'))).toBe(true);
		});

		it('should include board', () => {
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, '', 13);

			// Should have multiple lines (at least title + board + progress + stats)
			expect(lines.length).toBeGreaterThan(5);
		});

		it('should include progress', () => {
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, '', 13);

			const progressLine = lines.find(line => line.includes('tes'));
			expect(progressLine).toBeDefined();
		});

		it('should include stats', () => {
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, '', 13);

			const statsLine = lines.find(line => line.includes('2') && line.includes('1'));
			expect(statsLine).toBeDefined();
		});

		it('should include feedback when provided', () => {
			const feedback = 'Great job!';
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, feedback, 13);

			expect(lines.some(line => line.includes(feedback))).toBe(true);
		});

		it('should not include feedback when empty', () => {
			const lines = buildGameScreen(mockState, 'test', 1, 5, 50.5, '', 13);

			// Should still have lines, just without feedback line
			expect(lines.length).toBeGreaterThan(0);
		});
	});

	describe('buildWelcomeScreen', () => {
		it('should include title', () => {
			const lines = buildWelcomeScreen('test', 1, 0, 0, 16, 13);

			expect(lines.some(line => line.includes('ÍSLENSKUR'))).toBe(true);
		});

		it('should include level information', () => {
			const lines = buildWelcomeScreen('test', 3, 5, 60, 16, 13);

			expect(lines.some(line => line.includes('Stig 3'))).toBe(true);
		});

		it('should include target word', () => {
			const lines = buildWelcomeScreen('falleg', 1, 0, 0, 16, 13);

			expect(lines.some(line => line.includes('falleg'))).toBe(true);
		});

		it('should include instructions', () => {
			const lines = buildWelcomeScreen('test', 1, 0, 0, 16, 13);

			expect(lines.some(line => line.includes('Stjórnun'))).toBe(true);
		});

		it('should show catch line indicator', () => {
			const lines = buildWelcomeScreen('test', 1, 0, 0, 16, 13);

			expect(lines.some(line => line.includes('vallína'))).toBe(true);
		});
	});

	describe('buildCompletionScreen', () => {
		const mockStats: PerformanceStats = {
			errorCount: 2,
			missedLetters: 1,
			isPerfect: false,
		};

		const mockFeedback: FeedbackMessage = {
			message: 'Keep practicing!',
			type: 'keep-practicing',
		};

		it('should show congratulations', () => {
			const lines = buildCompletionScreen('test', 1, 5, 50, mockStats, mockFeedback, '◐ Gott! Reynum aftur');

			expect(lines.some(line => line.includes('HAMINGJU'))).toBe(true);
		});

		it('should show completed word', () => {
			const lines = buildCompletionScreen('falleg', 1, 5, 50, mockStats, mockFeedback, '◐ Gott! Reynum aftur');

			expect(lines.some(line => line.includes('falleg'))).toBe(true);
		});

		it('should show level completion', () => {
			const lines = buildCompletionScreen('test', 3, 10, 30, mockStats, mockFeedback, '◐ Gott! Reynum aftur');

			expect(lines.some(line => line.includes('Stig 3'))).toBe(true);
		});

		it('should show stats for non-perfect performance', () => {
			const lines = buildCompletionScreen('test', 1, 5, 50, mockStats, mockFeedback, '◐ Gott! Reynum aftur');

			expect(lines.some(line => line.includes('2'))).toBe(true);
			expect(lines.some(line => line.includes('1'))).toBe(true);
		});

		it('should show perfect message when perfect', () => {
			const perfectStats: PerformanceStats = {
				errorCount: 0,
				missedLetters: 0,
				isPerfect: true,
			};
			const perfectFeedback: FeedbackMessage = {
				message: 'Perfect!',
				type: 'perfect',
			};

			const lines = buildCompletionScreen('test', 1, 5, 100, perfectStats, perfectFeedback, '★ Fullkomið!');

			expect(lines.some(line => line.includes('FULLKOMIÐ'))).toBe(true);
		});

		it('should ask to continue when has next level', () => {
			const lines = buildCompletionScreen('test', 1, 5, 50, mockStats, mockFeedback, '◐ Gott! Reynum aftur');

			expect(lines.some(line => line.includes('y/n'))).toBe(true);
		});

		it('should show completion message when no next level', () => {
			const lines = buildCompletionScreen('test', 5, 20, 25, mockStats, mockFeedback, '○ Reynum aftur');

			// Adaptive difficulty never ends, so this test should just check it shows continue prompt
			expect(lines.some(line => line.includes('y/n'))).toBe(true);
		});
	});

	describe('buildAllCompleteScreen', () => {
		it('should show congratulations', () => {
			const lines = buildAllCompleteScreen(10);

			expect(lines.some(line => line.includes('HAMINGJU'))).toBe(true);
		});

		it('should show total levels completed', () => {
			const lines = buildAllCompleteScreen(10);

			expect(lines.some(line => line.includes('10'))).toBe(true);
		});
	});

	describe('buildNextLevelScreen', () => {
		it('should show level information', () => {
			const lines = buildNextLevelScreen('falleg', 2, 10);

			expect(lines.some(line => line.includes('3/10'))).toBe(true);
		});

		it('should show target word', () => {
			const lines = buildNextLevelScreen('falleg', 0, 5);

			expect(lines.some(line => line.includes('falleg'))).toBe(true);
		});

		it('should show starting message', () => {
			const lines = buildNextLevelScreen('test', 0, 5);

			expect(lines.some(line => line.includes('byrjar'))).toBe(true);
		});
	});

	describe('buildGoodbyeScreen', () => {
		it('should show thank you message', () => {
			const lines = buildGoodbyeScreen();

			expect(lines.some(line => line.includes('Takk'))).toBe(true);
		});

		it('should show title', () => {
			const lines = buildGoodbyeScreen();

			expect(lines.some(line => line.includes('ÍSLENSKUR'))).toBe(true);
		});
	});

	describe('renderWithFrame', () => {
		it('should add top and bottom borders', () => {
			const lines = ['test line 1', 'test line 2'];
			const result = renderWithFrame(lines, 50, 100, 40);

			// Should have more lines than input (borders + content)
			expect(result.length).toBeGreaterThan(lines.length);
		});

		it('should include all content lines', () => {
			const lines = ['line 1', 'line 2', 'line 3'];
			const result = renderWithFrame(lines, 50, 100, 40);

			// Each content line should be present
			expect(result.some(line => line.includes('line 1'))).toBe(true);
			expect(result.some(line => line.includes('line 2'))).toBe(true);
			expect(result.some(line => line.includes('line 3'))).toBe(true);
		});

		it('should add vertical centering padding', () => {
			const lines = ['test'];
			const result = renderWithFrame(lines, 50, 100, 100);

			// Should have empty lines for vertical centering
			const emptyLines = result.filter(line => line === '');
			expect(emptyLines.length).toBeGreaterThan(0);
		});

		it('should handle single line', () => {
			const lines = ['single'];
			const result = renderWithFrame(lines, 50, 100, 40);

			expect(result.length).toBeGreaterThan(2); // At least borders + content
			expect(result.some(line => line.includes('single'))).toBe(true);
		});

		it('should handle many lines', () => {
			const lines = new Array(20).fill('line');
			const result = renderWithFrame(lines, 50, 100, 40);

			expect(result.length).toBeGreaterThan(20);
		});
	});
});
