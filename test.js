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
	// Check if i pressed a key
	let pickedChar = "";

	if (key && key.name !== "enter") {
		pickedChar = key.name;
		// TODO: check if it matched my selected square
		// TODO: check board position X for match
		// targetLeft = targetLeft.replace(new RegExp(pickedChar, "gi"), '');
		// bagOfChars = mix(split(targetLeft), alphabet);
	}

	// Process rest
	if (key && key.name === "enter") {
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

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();
