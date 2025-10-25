/**
 * Pure functions for word manipulation and character generation
 * No side effects - fully testable without mocks
 */

/**
 * Splits a target string into its constituents
 * If the word contains spaces, splits by spaces
 * Otherwise, splits into individual characters
 */
export const split = (word: string): string[] => {
	const parts = word.split(' ');
	return parts.length === 1 ? word.split('') : parts;
};

/**
 * Mixes split word parts with alphabet to create a selection pool
 * Target word parts are added 4x, alphabet once, plus some spaces
 */
export const mix = (splitWord: string[], alphabet: string[]): string[] => {
	let selection = splitWord.concat(alphabet);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);

	// Reduce spaces to minimize gaps between characters
	const numberOfSpaces = Math.floor(selection.length / 3);
	const spaces = new Array(numberOfSpaces).fill(' ');

	return selection.concat(spaces);
};

/**
 * FR-001 & FR-002: Generate a smart bag of characters based on current progress
 * Increases probability of next required letter and eliminates irrelevant letters
 *
 * @param typedProgress - What has been successfully typed so far
 * @param fullTarget - The complete target word/phrase
 * @returns Array of characters with weighted probabilities
 */
export const generateBagOfChars = (typedProgress: string, fullTarget: string): string[] => {
	// Get the remaining part of the target word
	const remaining = fullTarget.substring(typedProgress.length);

	if (remaining.length === 0) {
		return [' ']; // No more letters needed
	}

	// Get the next required letter (the one we need RIGHT NOW)
	const nextLetter = remaining[0].toLowerCase();

	// Get all unique letters still needed (including duplicates in remaining)
	const remainingLetters = remaining.toLowerCase().split('');

	let selection: string[] = [];

	// FR-001: Add the NEXT required letter many times (10x) for high probability
	for (let i = 0; i < 10; i++) {
		selection.push(nextLetter);
	}

	// FR-002: Only add letters that are still needed in the remaining part
	// Add each remaining letter 2 times (but not the next letter again since it's already added 10x)
	const uniqueRemaining = new Set(remainingLetters);
	uniqueRemaining.forEach(letter => {
		if (letter !== nextLetter && letter !== ' ') {
			selection.push(letter);
			selection.push(letter);
		}
	});

	// Add some spaces to create gaps
	const numberOfSpaces = Math.floor(selection.length / 4);
	const spaces = new Array(numberOfSpaces).fill(' ');

	return selection.concat(spaces);
};

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 * Pure function - does not modify input array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};
