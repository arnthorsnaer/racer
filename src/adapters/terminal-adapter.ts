/**
 * Terminal adapter - wraps console/process for testability
 * Side effects isolated here
 */

/**
 * Terminal dimensions
 */
interface TerminalDimensions {
	width: number;
	height: number;
}

/**
 * Terminal adapter interface for console output
 */
interface TerminalAdapter {
	clear: () => void;
	log: (message: string) => void;
	getDimensions: () => TerminalDimensions;
}

/**
 * Create a real terminal adapter using process.stdout
 */
export const createTerminalAdapter = (): TerminalAdapter => ({
	clear: () => {
		console.clear();
	},

	log: (message: string) => {
		console.log(message);
	},

	getDimensions: () => ({
		width: process.stdout.columns || 80,
		height: process.stdout.rows || 24,
	}),
});

/**
 * Create a mock terminal adapter for testing
 */
export const createMockTerminalAdapter = (
	width: number = 80,
	height: number = 24
): TerminalAdapter & { getOutput: () => string[] } => {
	const output: string[] = [];

	return {
		clear: () => {
			output.push('[CLEAR]');
		},

		log: (message: string) => {
			output.push(message);
		},

		getDimensions: () => ({ width, height }),

		getOutput: () => [...output],
	};
};
