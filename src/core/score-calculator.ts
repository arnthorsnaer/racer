/**
 * Pure functions for score calculation and performance evaluation
 * No side effects - fully testable without mocks
 */

export interface PerformanceStats {
	errorCount: number;
	missedLetters: number;
	isPerfect: boolean;
}

export interface FeedbackMessage {
	message: string;
	type: 'perfect' | 'good-accuracy' | 'good-efficiency' | 'keep-practicing';
}

/**
 * Check if the performance was perfect
 */
export const isPerfect = (errorCount: number, missedLetters: number): boolean => {
	return errorCount === 0 && missedLetters === 0;
};

/**
 * Calculate performance statistics
 */
export const calculateStats = (errorCount: number, missedLetters: number): PerformanceStats => ({
	errorCount,
	missedLetters,
	isPerfect: isPerfect(errorCount, missedLetters),
});

/**
 * Generate feedback message based on performance
 */
export const generateFeedback = (stats: PerformanceStats): FeedbackMessage => {
	if (stats.isPerfect) {
		return {
			message: 'Engar villur og náðir hverjum staf í fyrstu tilraun!',
			type: 'perfect',
		};
	}

	if (stats.errorCount === 0 && stats.missedLetters > 0) {
		return {
			message: 'Frábær nákvæmni! Reyndu að ná stöfum hraðar næst.',
			type: 'good-accuracy',
		};
	}

	if (stats.errorCount > 0 && stats.missedLetters === 0) {
		return {
			message: 'Fullkomin skilvirkni! Einbeittu þér að því að fækka villum.',
			type: 'good-efficiency',
		};
	}

	return {
		message: 'Haltu áfram að æfa til að ná fullkomnum árangri!',
		type: 'keep-practicing',
	};
};
