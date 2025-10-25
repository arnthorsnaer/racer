# Racer

An interactive terminal-based typing racer game for learning and practicing the Icelandic alphabet.

## Description

Racer is a typing game that helps you practice typing Icelandic words and phrases. The game displays falling letters on a terminal board, challenging you to type the correct characters to match target Icelandic words.

## Features

- Full support for the Icelandic alphabet including special characters (á, ð, é, í, ó, ú, ý, þ, æ, ö)
- Interactive terminal gameplay using keyboard input
- Multiple difficulty levels with progressively challenging words and phrases
- Real-time character matching and feedback

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

Start the game:
```bash
npm start
```

## How to Play

1. When you run the game, press `Enter` to generate falling letters
2. The target word/phrase is displayed at the bottom
3. Type the correct characters as they appear on the board
4. The game tracks which letters you need to complete the target word

## Levels

The game includes multiple levels with Icelandic words and phrases:
- Level 1: Single words (e.g., "Húsgagn")
- Level 2: Names (e.g., "Brjánn")
- Level 3: Phrases (e.g., "Brjánn er hress")

## Technical Details

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js
- **Dependencies**:
  - `keypress` - for interactive keyboard input handling

## Icelandic Alphabet

The game uses the complete Icelandic alphabet:
a, á, b, d, ð, e, é, f, g, h, i, í, j, k, l, m, n, o, ó, p, r, s, t, u, ú, v, x, y, ý, þ, æ, ö

## Development

This project uses modern JavaScript with ES modules. The main entry point is `test.js`, which handles the game logic and keyboard interactions.

## Requirements

- Node.js (version that supports ES modules)
- Terminal with support for Icelandic characters
