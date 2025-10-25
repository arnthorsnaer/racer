/**
 * Theme constants for terminal styling
 * Pure constants - no side effects
 */

// ANSI Color codes for terminal styling
// Theme: "Arcade Neon" - Inspired by Synthwave/Dracula CLI themes
export const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',

	// Raw ANSI colors
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	brightRed: '\x1b[91m',
	brightGreen: '\x1b[92m',
	brightYellow: '\x1b[93m',
	brightBlue: '\x1b[94m',
	brightMagenta: '\x1b[95m',
	brightCyan: '\x1b[96m',

	// Semantic theme colors (Arcade Neon palette)
	neonPink: '\x1b[95m',        // Bright Magenta - Headers, celebration
	electricCyan: '\x1b[96m',    // Bright Cyan - Success, progress typed
	limeGreen: '\x1b[92m',       // Bright Green - Positive feedback
	sunsetOrange: '\x1b[93m',    // Bright Yellow - Progress remaining, attention
	hotPink: '\x1b[91m',         // Bright Red - Errors
	deepPurple: '\x1b[35m',      // Magenta - Subtle accents
	electricBlue: '\x1b[94m',    // Bright Blue - Frame, structure
	arcadeGreen: '\x1b[32m',     // Green - Info text
	neonCyan: '\x1b[36m'         // Cyan - Stream letters
} as const;

// Frame characters for Tetris-style border
export const frame = {
	topLeft: '╔',
	topRight: '╗',
	bottomLeft: '╚',
	bottomRight: '╝',
	horizontal: '═',
	vertical: '║'
} as const;

// Icelandic alphabet
export const alphabet: string[] = [
	"a", "á", "b", "d", "ð", "e", "é", "f", "g", "h", "i", "í", "j", "k", "l", "m",
	"n", "o", "ó", "p", "r", "s", "t", "u", "ú", "v", "x", "y", "ý", "þ", "æ", "ö"
];
