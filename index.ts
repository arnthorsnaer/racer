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

// FR-001 & FR-002: Generate a smart bag of characters based on current progress
// Increases probability of next required letter and eliminates irrelevant letters
const generateBagOfChars = (typedProgress: string, fullTarget: string): string[] => {
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

// FR-003: Fisher-Yates shuffle algorithm for randomizing level order
const shuffleArray = <T>(array: T[]): T[] => {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

// Make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// Set encoding to UTF-8 to properly handle accented characters
process.stdin.setEncoding('utf8');

// FR-003: Create a randomized order of level indices
const shuffledLevelIndices: number[] = shuffleArray(levels.map((_, index) => index));

// Track current level (index into shuffledLevelIndices)
let currentLevelIndex: number = 0;

let splitWord!: string[];
let bagOfChars!: string[];
let targetLeft!: string;
let typedProgress: string = ""; // Track what's been typed successfully
let lastFeedback: string = ""; // Track feedback from last key press
let board!: (BoardItem | undefined)[];

// Performance tracking
let errorCount: number = 0; // Track wrong key presses
let missedLetters: number = 0; // Track letters that should have been caught but weren't
let catchCount: number = 0; // Track number of successful catches for sound variation
let tickCount: number = 0; // Track tick count for alternating tick sound
let gameInterval: NodeJS.Timeout | null = null;
let isWaitingForLevelChoice: boolean = false;

// Function to initialize game state for a level
const initializeLevel = (levelIndex: number) => {
	currentLevelIndex = levelIndex;
	// FR-003: Use shuffled level order
	const actualLevelIndex = shuffledLevelIndices[currentLevelIndex];
	splitWord = split(levels[actualLevelIndex].target);
	targetLeft = levels[actualLevelIndex].target;
	typedProgress = "";
	// FR-001 & FR-002: Generate smart bag based on current progress
	bagOfChars = generateBagOfChars(typedProgress, targetLeft);
	lastFeedback = "";
	board = new Array(16);
	errorCount = 0;
	missedLetters = 0;
	catchCount = 0;
	tickCount = 0;
	isWaitingForLevelChoice = false;
};

// Function to start the game loop
const startGameLoop = () => {
	if (gameInterval) {
		clearInterval(gameInterval);
	}

	// Auto-progress game every 400ms (20% faster than before!)
	gameInterval = setInterval(() => {
	// Generate new letter
	const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

	// Check if we're about to lose a needed letter
	const poppedItem = board[board.length - 1];
	if (poppedItem !== undefined) {
		// FR-003: Use shuffled level order
		const actualLevelIndex = shuffledLevelIndices[currentLevelIndex];
		const fullTarget = levels[actualLevelIndex].target;
		const nextExpectedChar = fullTarget[typedProgress.length];
		// If the popped letter was the next expected character and wasn't caught, count it as missed
		if (poppedItem.generated.toLowerCase() === nextExpectedChar.toLowerCase() && !poppedItem.success) {
			missedLetters++;
		}
	}

	board.unshift({ generated: generatedChar, success: false });
	board.pop();

	// Play alternating tick sound for new letter (tik-tok pattern)
	tickCount++;
	const tickSound = (tickCount % 2 === 0) ? 'tick2' : 'tick1';
	playGameSound(tickSound);

	// Render
	console.clear();
	console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
	for (let i = 0; i < board.length; i++) {
		// Always show the catch character at position 13
		if (i === 13) {
			if (board[i] !== undefined) {
				const marker = board[i]!.success ? `${colors.brightGreen}✓` : `${colors.brightYellow}#`;
				const letterColor = board[i]!.success ? colors.brightGreen : colors.brightMagenta;
				console.log(`${marker}${letterColor}${board[i]!.generated}${colors.reset}`);
			} else {
				// Show just the catch character even when no letter is there
				console.log(`${colors.brightYellow}#${colors.reset}`);
			}
		} else if (i < 13) {
			// Only render positions before the catch line (0-12)
			if (board[i] !== undefined) {
				console.log(`${colors.cyan}${board[i]!.generated}${colors.reset}`);
			} else {
				console.log('');
			}
		}
		// Skip positions after the catch line (14-15) to eliminate spacing
	}

	// Show progress with typed part and remaining part
	// FR-003: Use shuffled level order
	const actualLevelIndex = shuffledLevelIndices[currentLevelIndex];
	const fullTarget = levels[actualLevelIndex].target;
	const remaining = fullTarget.substring(typedProgress.length);
	console.log(`\n${colors.bright}${colors.brightGreen}[${typedProgress}]${colors.brightYellow}${remaining}${colors.reset}`);

	// Show current performance stats
	console.log(`${colors.brightYellow}Villur: ${colors.brightRed}${errorCount}${colors.reset}  ${colors.brightYellow}Missir: ${colors.brightRed}${missedLetters}${colors.reset}`);

	// Show feedback from last action
	if (lastFeedback) {
		console.log(lastFeedback);
	}
	}, 400);
};

process.stdin.on('keypress', (ch: string, key: Key) => {
	// Handle Ctrl+C to quit
	if (key && key.ctrl && key.name === 'c') {
		if (gameInterval) clearInterval(gameInterval);
		console.log('\n\nHætti í leik...\n');
		process.exit(0);
	}

	// If waiting for level choice, handle y/n input
	if (isWaitingForLevelChoice) {
		if (ch === 'y' || ch === 'Y') {
			// Check if there's a next level
			if (currentLevelIndex + 1 < levels.length) {
				initializeLevel(currentLevelIndex + 1);
				console.clear();
				console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
				console.log(`${colors.bright}Stig ${currentLevelIndex + 1}/${levels.length}${colors.reset}`);
				console.log(`${colors.bright}Markmiðsorð: ${colors.brightYellow}${targetLeft}${colors.reset}\n`);
				console.log(`${colors.brightGreen}Leikur byrjar...${colors.reset}\n`);
				startGameLoop();
			} else {
				// All levels completed!
				console.clear();
				console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
				console.log(`\n${colors.bright}${colors.brightMagenta}🎊 TIL HAMINGJU! 🎊${colors.reset}`);
				console.log(`${colors.brightGreen}Þú hefur klárað öll ${levels.length} stigin!${colors.reset}\n`);
				setTimeout(() => process.exit(0), 2000);
			}
		} else if (ch === 'n' || ch === 'N') {
			console.log(`\n${colors.brightCyan}Takk fyrir að spila!${colors.reset}\n`);
			setTimeout(() => process.exit(0), 1000);
		}
		return;
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
	// FR-003: Use shuffled level order
	const actualLevelIndex = shuffledLevelIndices[currentLevelIndex];
	const fullTarget = levels[actualLevelIndex].target;
	const nextExpectedChar = fullTarget[typedProgress.length];

	// Check if there's a letter at the selection line (position 13)
	if (board[13] !== undefined && board[13].generated) {
		const letterAtSelection = board[13].generated;

		// Check if pressed key matches the letter at selection AND it's the next expected character
		if (pickedChar.toLowerCase() === letterAtSelection.toLowerCase() && letterAtSelection.toLowerCase() === nextExpectedChar.toLowerCase()) {
			// Success! Caught the right letter
			board[13].success = true;
			typedProgress += letterAtSelection;
			lastFeedback = `${colors.brightGreen}✓ Náðir '${letterAtSelection}'! Frábært!${colors.reset}`;

			// FR-001 & FR-002: Regenerate bag after each successful catch
			// This updates probabilities for the NEXT letter and removes letters no longer needed
			bagOfChars = generateBagOfChars(typedProgress, fullTarget);

			// Play success sound with increasing pitch
			const successSoundIndex = Math.min(catchCount, 29); // Cap at 29 (we have 30 sounds: 0-29)
			playGameSound(`success${successSoundIndex}`);
			catchCount++;

			// Check if word is complete
			if (typedProgress === fullTarget) {
				if (gameInterval) clearInterval(gameInterval);
				console.clear();
				console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
				console.log(`\n${colors.bright}${colors.brightMagenta}🎉 TIL HAMINGJU! Þú kláraðir orðið: ${colors.brightYellow}${fullTarget}${colors.reset}\n`);
				console.log(`${colors.bright}Stig ${currentLevelIndex + 1}/${levels.length} lokið!${colors.reset}\n`);

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

				// Ask if user wants to continue to next level
				if (currentLevelIndex + 1 < levels.length) {
					console.log(`${colors.bright}${colors.brightYellow}Viltu halda áfram í næsta stig? (y/n)${colors.reset}`);
					isWaitingForLevelChoice = true;
				} else {
					// Last level completed
					console.log(`${colors.bright}${colors.brightMagenta}🎊 Þú hefur klárað öll stigin! 🎊${colors.reset}\n`);
					setTimeout(() => process.exit(0), 2000);
				}
			}
		} else if (pickedChar.toLowerCase() === letterAtSelection.toLowerCase()) {
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

// Initialize the first level and start the game
initializeLevel(0);

// Initial display
console.clear();
console.log(`${colors.bright}${colors.brightCyan}=== ÍSLENSKUR STAFA-KAPPAKSTUR ===${colors.reset}\n`);
console.log(`${colors.bright}Stig 1/${levels.length}${colors.reset}`);
console.log(`${colors.bright}Markmiðsorð: ${colors.brightYellow}${targetLeft}${colors.reset}`);
console.log(`\n${colors.cyan}Stjórnun:${colors.reset}`);
console.log(`  ${colors.green}- Stafir birtast sjálfkrafa á 0.4 sekúndu fresti${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á stafatakka til að velja þá${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á F1 til að kveikja/slökkva á hljóði${colors.reset}`);
console.log(`  ${colors.green}- Ýttu á Ctrl+C til að hætta${colors.reset}\n`);
console.log(`${colors.magenta}--- Borð ---${colors.reset}`);
for (let i = 0; i < board.length; i++) {
	if (i === 13) {
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

// Start the game loop
startGameLoop();
