import keypress from 'keypress';
import levels from './levels.ts';
import playSound from 'play-sound';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize sound player
const player = playSound({});
let soundEnabled = true;

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

// Sound helper functions
const playGameSound = (soundName: string) => {
	if (!soundEnabled) return;

	const soundPath = path.join(__dirname, 'sounds', `${soundName}.wav`);
	player.play(soundPath, (err: Error) => {
		if (err && err.message !== 'kill SIGTERM') {
			// Silently ignore errors (sound is optional)
		}
	});
};

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

// Performance tracking
let errorCount: number = 0; // Track wrong key presses
let missedLetters: number = 0; // Track letters that should have been caught but weren't

// Auto-progress game every half second (faster!)
const gameInterval = setInterval(() => {
	// Generate new letter
	const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

	// Check if we're about to lose a needed letter
	const poppedItem = board[board.length - 1];
	if (poppedItem !== undefined) {
		const fullTarget = levels[0].target;
		const nextExpectedChar = fullTarget[typedProgress.length];
		// If the popped letter was the next expected character and wasn't caught, count it as missed
		if (poppedItem.generated === nextExpectedChar && !poppedItem.success) {
			missedLetters++;
		}
	}

	board.unshift({ generated: generatedChar, success: false });
	board.pop();

	// Play tick sound for new letter
	playGameSound('tick');

	// Render
	console.clear();
	console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
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
	console.log(`\n${colors.bright}Framvinda: ${colors.brightGreen}[${typedProgress}]${colors.brightYellow}${remaining}${colors.reset}`);

	// Show feedback from last action
	if (lastFeedback) {
		console.log(lastFeedback);
	}
}, 500);

process.stdin.on('keypress', (ch: string, key: Key) => {
	// Handle Ctrl+C to quit
	if (key && key.ctrl && key.name === 'c') {
		clearInterval(gameInterval);
		console.log('\n\nHætti í leik...\n');
		process.exit(0);
	}

	// Handle F1 key to toggle mute
	if (key && key.name === 'f1') {
		soundEnabled = !soundEnabled;
		lastFeedback = soundEnabled
			? `${colors.brightCyan}🔊 Hljóð á${colors.reset}`
			: `${colors.brightCyan}🔇 Hljóð af${colors.reset}`;
		return;
	}

	// Only process if we have a valid character
	// Prefer 'ch' for actual character input, especially for accented characters
	if (!ch || ch.length === 0) {
		return; // Ignore empty character events (like dead keys alone)
	}

	// Skip control characters and special keys
	if (key && (key.name === "enter" || key.name === "return" || key.name === "escape")) {
		return;
	}

	const pickedChar = ch; // Use the actual character typed
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
			lastFeedback = `${colors.brightGreen}✓ Náðir '${letterAtSelection}'! Frábært!${colors.reset}`;

			// Play success sound
			playGameSound('success');

			// Check if word is complete
			if (typedProgress === fullTarget) {
				clearInterval(gameInterval);
				console.clear();
				console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
				console.log(`\n${colors.bright}${colors.brightMagenta}🎉 TIL HAMINGJU! Þú kláraðir orðið: ${colors.brightYellow}${fullTarget}${colors.reset}\n`);

				// Display performance stats
				const isPerfect = errorCount === 0 && missedLetters === 0;

				console.log(`${colors.bright}${colors.brightCyan}=== STATTAR ===${colors.reset}`);

				if (isPerfect) {
					console.log(`${colors.bright}${colors.brightGreen}★ FULLKOMIÐ! ★${colors.reset}`);
					console.log(`${colors.brightGreen}Engar villur og náðir hverjum staf í fyrstu tilraun!${colors.reset}\n`);
				} else {
					console.log(`${colors.brightYellow}Villur (rangar lyklar): ${colors.brightRed}${errorCount}${colors.reset}`);
					console.log(`${colors.brightYellow}Missaðir stafir: ${colors.brightRed}${missedLetters}${colors.reset}\n`);

					if (errorCount === 0 && missedLetters > 0) {
						console.log(`${colors.cyan}Frábær nákvæmni! Reyndu að ná stöfum hraðar næst.${colors.reset}\n`);
					} else if (errorCount > 0 && missedLetters === 0) {
						console.log(`${colors.cyan}Fullkomin skilvirkni! Einbeittu þér að því að fækka villum.${colors.reset}\n`);
					} else {
						console.log(`${colors.cyan}Haltu áfram að æfa til að ná fullkomnum árangri!${colors.reset}\n`);
					}
				}

				// Play victory sound
				playGameSound('victory');

				// Wait a bit before exiting so victory sound can play
				setTimeout(() => process.exit(0), 1000);
			}
		} else if (pickedChar === letterAtSelection) {
			// Letter matches but it's not the next expected character
			errorCount++;
			lastFeedback = `${colors.brightRed}✗ Rangur stafur! Þarft '${nextExpectedChar}', fékk '${letterAtSelection}'${colors.reset}`;
			playGameSound('error');
		} else {
			// Pressed key doesn't match the letter at selection
			errorCount++;
			lastFeedback = `${colors.brightRed}✗ Missir! Ýttir á '${pickedChar}' en valið sýnir '${letterAtSelection}'${colors.reset}`;
			playGameSound('error');
		}
	} else {
		lastFeedback = `${colors.red}✗ Enginn stafur á vallínu!${colors.reset}`;
	}
});

// Initial display
console.clear();
console.log(`${colors.bright}${colors.brightCyan}=== ICELANDIC TYPING RACER ===${colors.reset}\n`);
console.log(`${colors.bright}Markmiðsorð: ${colors.brightYellow}${targetLeft}${colors.reset}`);
console.log(`\n${colors.cyan}Stjórnun:${colors.reset}`);
console.log(`  ${colors.green}- Stafir birtast sjálfkrafa á hálfs sekúndu fresti${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á stafatakka til að velja þá${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á F1 til að kveikja/slökkva á hljóði${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á Ctrl+C til að hætta${colors.reset}\n`);
console.log(`${colors.magenta}--- Borð ---${colors.reset}`);
for (let i = 0; i < board.length; i++) {
	if (i === 4) {
		console.log(`${colors.brightYellow}# (vallína)${colors.reset}`);
	} else {
		console.log('');
	}
}
console.log(`\n${colors.brightGreen}Leikur byrjar...${colors.reset}\n`);

if (process.stdin.isTTY) {
	process.stdin.setRawMode(true);
}
process.stdin.resume();
