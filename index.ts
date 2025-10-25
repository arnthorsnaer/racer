import keypress from 'keypress';
import levels from './levels.ts';

// ANSI Color codes for terminal styling
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
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
	brightCyan: '\x1b[96m'
} as const;

interface BoardItem {
	generated: string;
	success: boolean;
}

interface Key {
	name: string;
	ctrl?: boolean;
	meta?: boolean;
	shift?: boolean;
}

const alphabet: string[] = ["a","á","b","d","ð","e","é","f","g","h","i","í","j","k","l","m","n","o","ó","p","r","s","t","u","ú","v","x","y","ý","þ","æ","ö"];

// Accepts a target string, returns an array of its constituents
const split = (word: string): string[] => {
	const parts = word.split(' ');
	return parts.length === 1 ? word.split('') : parts;
};

// Take in all the parts + some spaces and mix them together
const mix = (splitWord: string[], alphabet: string[]): string[] => {
	let selection = splitWord.concat(alphabet);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);
	selection = selection.concat(splitWord);

	// Reduce spaces to minimize gaps between characters
	const numberOfSpaces = Math.floor(selection.length / 3);
	const spaces = new Array(numberOfSpaces).fill(' ');

	return selection.concat(spaces);
};

// Make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// Set encoding to UTF-8 to properly handle accented characters
process.stdin.setEncoding('utf8');

const splitWord = split(levels[0].target);
const bagOfChars = mix(splitWord, alphabet);

let targetLeft: string = levels[0].target;
let typedProgress: string = ""; // Track what's been typed successfully
let lastFeedback: string = ""; // Track feedback from last key press
const board: (BoardItem | undefined)[] = new Array(19);

// Auto-progress game every half second (faster!)
const gameInterval = setInterval(() => {
	// Generate new letter
	const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

	board.unshift({ generated: generatedChar, success: false });
	board.pop();

	// Render
	console.clear();
	console.log(`${colors.bright}${colors.brightCyan}=== ICELANDIC TYPING RACER ===${colors.reset}\n`);
	for (let i = board.length - 1; i >= 0; i--) {
		if (board[i] !== undefined) {
			if (i === 4) {
				const marker = board[i]!.success ? `${colors.brightGreen}✓` : `${colors.brightYellow}#`;
				const letterColor = board[i]!.success ? colors.brightGreen : colors.brightMagenta;
				console.log(`${marker}${letterColor}${board[i]!.generated}${colors.reset}`);
			} else {
				console.log(`${colors.cyan}${board[i]!.generated}${colors.reset}`);
			}
		} else {
			console.log('');
		}
	}

	// Show progress with typed part and remaining part
	const fullTarget = levels[0].target;
	const remaining = fullTarget.substring(typedProgress.length);
	console.log(`\n${colors.bright}Progress: ${colors.brightGreen}[${typedProgress}]${colors.brightYellow}${remaining}${colors.reset}`);

	// Show feedback from last action
	if (lastFeedback) {
		console.log(lastFeedback);
	}
}, 500);

process.stdin.on('keypress', (ch: string, key: Key) => {
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
				lastFeedback = `${colors.brightGreen}✓ Caught '${letterAtSelection}'! Great!${colors.reset}`;

				// Check if word is complete
				if (typedProgress === fullTarget) {
					clearInterval(gameInterval);
					console.clear();
					console.log(`${colors.bright}${colors.brightCyan}=== ICELANDIC TYPING RACER ===${colors.reset}\n`);
					console.log(`\n${colors.bright}${colors.brightMagenta}🎉 CONGRATULATIONS! You completed the word: ${colors.brightYellow}${fullTarget}${colors.reset}\n`);
					process.exit(0);
				}
			} else if (pickedChar === letterAtSelection) {
				// Letter matches but it's not the next expected character
				lastFeedback = `${colors.brightRed}✗ Wrong letter! Need '${nextExpectedChar}', got '${letterAtSelection}'${colors.reset}`;
			} else {
				// Pressed key doesn't match the letter at selection
				lastFeedback = `${colors.brightRed}✗ Missed! Pressed '${pickedChar}' but selection shows '${letterAtSelection}'${colors.reset}`;
			}
		} else {
			lastFeedback = `${colors.red}✗ No letter at selection line!${colors.reset}`;
		}
	}
});

// Initial display
console.clear();
console.log(`${colors.bright}${colors.brightCyan}=== ICELANDIC TYPING RACER ===${colors.reset}\n`);
console.log(`${colors.bright}Target word: ${colors.brightYellow}${targetLeft}${colors.reset}`);
console.log(`\n${colors.cyan}Controls:${colors.reset}`);
console.log(`  ${colors.green}- Letters appear automatically every half second${colors.reset}`);
console.log(`  ${colors.green}- Press letter keys to select them${colors.reset}`);
console.log(`  ${colors.green}- Press Ctrl+C to quit${colors.reset}\n`);
console.log(`${colors.magenta}--- Board ---${colors.reset}`);
for (let i = 0; i < board.length; i++) {
	if (i === 4) {
		console.log(`${colors.brightYellow}# (selection line)${colors.reset}`);
	} else {
		console.log('');
	}
}
console.log(`\n${colors.brightGreen}Game starting...${colors.reset}\n`);

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();
