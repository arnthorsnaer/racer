import keypress from 'keypress';
import levels from './levels.js';

const alphabet = ["a","á","b","d","ð","e","é","f","g","h","i","í","j","k","l","m","n","o","ó","p","r","s","t","u","ú","v","x","y","ý","þ","æ","ö"];

// Accepts a target string, returns an array of its constituents
const split = (word) => {
	const parts = word.split(' ');
	return parts.length === 1 ? word.split('') : parts;
};

// Take in all the parts + some spaces and mix them together
const mix = (splitWord, alphabet) => {
	let selection = splitWord.concat(alphabet);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);

	const numberOfZeroesNeeded = selection.length;
	const zeroes = new Array(numberOfZeroesNeeded + 1).fill(' ');

	return selection.concat(zeroes);
};

// Make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

const splitWord = split(levels[0].target);
const bagOfChars = mix(splitWord, alphabet);

let targetLeft = levels[0].target;
let typedProgress = ""; // Track what's been typed successfully
let lastFeedback = ""; // Track feedback from last key press
const board = new Array(19);

// Auto-progress game every second
const gameInterval = setInterval(() => {
	// Generate new letter
	const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

	board.unshift({ generated: generatedChar, success: false });
	board.pop();

	// Render
	console.clear();
	console.log('=== ICELANDIC TYPING RACER ===\n');
	for (let i = board.length - 1; i >= 0; i--) {
		if (board[i] !== undefined) {
			if (i === 4) {
				const marker = board[i].success ? '✓' : '#';
				console.log(`${marker}${board[i].generated}`);
			} else {
				console.log(board[i].generated);
			}
		} else {
			console.log('');
		}
	}

	// Show progress with typed part and remaining part
	const fullTarget = levels[0].target;
	const remaining = fullTarget.substring(typedProgress.length);
	console.log(`\nProgress: [${typedProgress}]${remaining}`);

	// Show feedback from last action
	if (lastFeedback) {
		console.log(lastFeedback);
	}
}, 1000);

process.stdin.on('keypress', (ch, key) => {
	// Handle Ctrl+C to quit
	if (key && key.ctrl && key.name === 'c') {
		clearInterval(gameInterval);
		console.log('\n\nExiting game...\n');
		process.exit(0);
	}

	// Check if i pressed a key
	if (key && key.name !== "enter" && key.name !== "return") {
		const pickedChar = ch || key.name;
		const fullTarget = levels[0].target;
		const nextExpectedChar = fullTarget[typedProgress.length];

		// Check if there's a letter at the selection line (position 4)
		if (board[4] !== undefined && board[4].generated) {
			const letterAtSelection = board[4].generated;

			// Check if pressed key matches the letter at selection AND it's the next expected character
			if (pickedChar === letterAtSelection && letterAtSelection === nextExpectedChar) {
				// Success! Caught the right letter
				board[4].success = true;
				typedProgress += letterAtSelection;
				lastFeedback = `✓ Caught '${letterAtSelection}'! Great!`;

				// Check if word is complete
				if (typedProgress === fullTarget) {
					clearInterval(gameInterval);
					console.clear();
					console.log('=== ICELANDIC TYPING RACER ===\n');
					console.log(`\n🎉 CONGRATULATIONS! You completed the word: ${fullTarget}\n`);
					process.exit(0);
				}
			} else if (pickedChar === letterAtSelection) {
				// Letter matches but it's not the next expected character
				lastFeedback = `✗ Wrong letter! Need '${nextExpectedChar}', got '${letterAtSelection}'`;
			} else {
				// Pressed key doesn't match the letter at selection
				lastFeedback = `✗ Missed! Pressed '${pickedChar}' but selection shows '${letterAtSelection}'`;
			}
		} else {
			lastFeedback = `✗ No letter at selection line!`;
		}
	}
});

// Initial display
console.clear();
console.log('=== ICELANDIC TYPING RACER ===\n');
console.log(`Target word: ${targetLeft}`);
console.log('\nControls:');
console.log('  - Letters appear automatically every second');
console.log('  - Press letter keys to select them');
console.log('  - Press Ctrl+C to quit\n');
console.log('--- Board ---');
for (let i = 0; i < board.length; i++) {
	if (i === 4) {
		console.log('# (selection line)');
	} else {
		console.log('');
	}
}
console.log('\nGame starting...\n');

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();
