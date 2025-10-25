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
const board = new Array(19);

process.stdin.on('keypress', (ch, key) => {
	// Handle Ctrl+C to quit
	if (key && key.ctrl && key.name === 'c') {
		console.log('\n\nExiting game...\n');
		process.exit(0);
	}

	// Check if i pressed a key
	let pickedChar = "";

	if (key && key.name !== "enter" && key.name !== "return") {
		pickedChar = key.name;
		// TODO: check if it matched my selected square
		// TODO: check board position X for match
		// targetLeft = targetLeft.replace(new RegExp(pickedChar, "gi"), '');
		// bagOfChars = mix(split(targetLeft), alphabet);
	}

	// Process rest
	if (key && (key.name === "enter" || key.name === "return")) {
		// Generate new letter
		const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

		board.unshift({ generated: generatedChar, success: false });
		board.pop();

		// Render
		for (let i = board.length - 1; i >= 0; i--) {
			if (board[i] !== undefined) {
				if (i === 4) {
					console.log(`#${board[i].generated}`);
				} else {
					console.log(board[i].generated);
				}
			}
		}

		console.log(`Target word : ${targetLeft}`);
	}
});

// Initial display
console.clear();
console.log('=== ICELANDIC TYPING RACER ===\n');
console.log(`Target word: ${targetLeft}`);
console.log('\nControls:');
console.log('  - Press ENTER to generate a new letter');
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
console.log('\nPress ENTER to start!\n');

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();
