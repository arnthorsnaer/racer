# Implementation Plan: Eliminate Demo Code Duplication via `orchestrateGame()`

## Problem Statement

The racer codebase has significant duplication between `index.ts` (main game, 282 lines) and `demo.ts` (demo mode, 214 lines). Approximately 120-150 lines (24-30%) are duplicated game logic including:
- Word initialization (100% duplicate)
- Input processing (95% duplicate)
- Game loop structure (80% duplicate)
- Rendering patterns (70% duplicate)
- Configuration constants (100% duplicate)

## Solution: Single Orchestrator with Dependency Injection

Create a `orchestrateGame()` function that contains all shared game logic. Both `index.ts` and `demo.ts` become thin configuration wrappers (~30-40 lines each) that inject their specific adapters.

**Expected result:**
- Zero duplication
- ~226 lines of code saved
- Single source of truth for game logic
- Easy to add new game modes
- Highly testable architecture

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Entry Points (Thin Wrappers - 30-40 lines each)       │
│  ├─ index.ts (creates adapters, calls orchestrateGame) │
│  └─ demo.ts (creates adapters, calls orchestrateGame)  │
└─────────────────────────────────────────────────────────┘
                    ↓ calls
┌─────────────────────────────────────────────────────────┐
│  Orchestrator (Game Logic - ~200 lines)                │
│  └─ src/core/game-orchestrator.ts                      │
│     - Contains ALL game loop logic                     │
│     - State management                                 │
│     - Word lifecycle                                   │
│     - Event coordination                               │
└─────────────────────────────────────────────────────────┘
                    ↓ uses
┌─────────────────────────────────────────────────────────┐
│  Adapters (I/O Abstraction - new files)                │
│  ├─ src/adapters/keyboard-input.ts                     │
│  ├─ src/adapters/auto-type-input.ts                    │
│  ├─ src/adapters/terminal-renderer.ts                  │
│  ├─ src/adapters/console-renderer.ts                   │
│  └─ src/adapters/noop-sound.ts                         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Create Interfaces and Config (30 min)

#### 1.1 Create `src/config/game.ts`
Extract all configuration constants from both `index.ts` and `demo.ts`:

```typescript
export const GAME_CONFIG = {
  FRAME_WIDTH: 50,
  GAME_TICK_INTERVAL: 600,
  AUTO_TYPE_INTERVAL: 250,
  DEMO_DURATION: 18000,
  DEMO_TICK_INTERVAL: 500,
  STARTING_WORD_LENGTH: 3,
} as const;
```

#### 1.2 Create `src/core/game-orchestrator.ts` - Interfaces Only
Define the core interfaces:

```typescript
/**
 * Input source abstraction - handles user input or automated input
 */
export interface InputSource {
  /**
   * Register callback for input events
   * For keyboard: fires on keypress
   * For auto-type: fires automatically when conditions are met
   */
  onInput(callback: (ch: string) => void): void;

  /**
   * Cleanup input listeners
   */
  cleanup(): void;
}

/**
 * Renderer abstraction - handles display output
 */
export interface Renderer {
  /**
   * Clear the display
   */
  clear(): void;

  /**
   * Render lines to display
   */
  render(lines: string[]): void;

  /**
   * Get current terminal dimensions
   */
  getDimensions(): { width: number; height: number };
}

/**
 * Sound player abstraction - handles audio output
 */
export interface SoundPlayer {
  /**
   * Play a sound by name
   */
  play(soundName: string): void;
}

/**
 * Configuration options for game orchestration
 */
export interface GameOptions {
  // Required dependencies
  inputSource: InputSource;
  renderer: Renderer;
  soundPlayer: SoundPlayer;

  // Optional configuration
  tickInterval?: number;           // Default: 600ms
  duration?: number;                // Default: undefined (infinite)
  adaptiveDifficulty?: boolean;     // Default: true
  showCompletionScreens?: boolean;  // Default: true
  showProgressionScreens?: boolean; // Default: true
}

/**
 * Controller for managing game lifecycle
 */
export interface GameController {
  /**
   * Stop the game and cleanup resources
   */
  stop(): void;

  /**
   * Get current game state (for testing/debugging)
   */
  getState(): GameState;
}
```

---

### Phase 2: Implement Adapters (45 min)

#### 2.1 Create `src/adapters/keyboard-input.ts`
```typescript
import { InputSource } from '../core/game-orchestrator';
import { input } from './input-adapter';

export function createKeyboardInput(): InputSource {
  return {
    onInput(callback: (ch: string) => void): void {
      input.onKeypress(callback);
    },

    cleanup(): void {
      input.cleanup();
    }
  };
}
```

#### 2.2 Create `src/adapters/auto-type-input.ts`
This is the most complex adapter - it needs to implement the auto-typing logic from `demo.ts`.

**Key logic to migrate:**
- Extract the `autoType()` function from `demo.ts` (lines 100-132)
- The interval-based automatic typing
- The logic that checks if letter at catch line matches next expected char

```typescript
import { InputSource } from '../core/game-orchestrator';
import { GameState } from '../core/game-logic';

interface AutoTypeOptions {
  interval: number; // milliseconds between auto-type checks
  catchLinePosition: number;
}

export function createAutoTypeInput(options: AutoTypeOptions): InputSource {
  const { interval, catchLinePosition } = options;
  let intervalId: NodeJS.Timeout | null = null;
  let callback: ((ch: string) => void) | null = null;
  let gameStateAccessor: (() => { gameState: GameState; currentTarget: string }) | null = null;

  return {
    onInput(cb: (ch: string) => void): void {
      callback = cb;

      // Start auto-typing interval
      intervalId = setInterval(() => {
        if (!callback || !gameStateAccessor) return;

        const { gameState, currentTarget } = gameStateAccessor();
        const nextExpectedChar = currentTarget[gameState.typedProgress.length];
        const itemAtCatchLine = gameState.board[catchLinePosition];

        if (itemAtCatchLine?.generated && nextExpectedChar !== undefined) {
          const letterAtCatch = itemAtCatchLine.generated;

          if (letterAtCatch.toLowerCase() === nextExpectedChar.toLowerCase()) {
            callback(letterAtCatch);
          }
        }
      }, interval);
    },

    cleanup(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      callback = null;
    },

    // Extension method to provide game state access
    setStateAccessor(accessor: () => { gameState: GameState; currentTarget: string }): void {
      gameStateAccessor = accessor;
    }
  };
}
```

**Note:** The auto-type adapter needs access to game state to check the catch line. This can be handled by:
- Option A: Pass state accessor callback (shown above)
- Option B: Have orchestrator pass state to onInput callback signature
- Option C: Use event-based approach

Choose the cleanest approach during implementation.

#### 2.3 Create `src/adapters/terminal-renderer.ts`
```typescript
import { Renderer } from '../core/game-orchestrator';
import { terminal } from './terminal-adapter';

export function createTerminalRenderer(): Renderer {
  return {
    clear(): void {
      terminal.clear();
    },

    render(lines: string[]): void {
      lines.forEach(line => terminal.log(line));
    },

    getDimensions(): { width: number; height: number } {
      return terminal.getDimensions();
    }
  };
}
```

#### 2.4 Create `src/adapters/console-renderer.ts`
```typescript
import { Renderer } from '../core/game-orchestrator';

interface ConsoleRendererOptions {
  width?: number;
  height?: number;
}

export function createConsoleRenderer(options: ConsoleRendererOptions = {}): Renderer {
  const { width = 80, height = 24 } = options;

  return {
    clear(): void {
      console.clear();
    },

    render(lines: string[]): void {
      lines.forEach(line => console.log(line));
    },

    getDimensions(): { width: number; height: number } {
      return { width, height };
    }
  };
}
```

#### 2.5 Create `src/adapters/real-sound.ts`
```typescript
import { SoundPlayer } from '../core/game-orchestrator';
import { sound } from './sound-adapter';

export function createRealSound(): SoundPlayer {
  return {
    play(soundName: string): void {
      sound.play(soundName);
    }
  };
}
```

#### 2.6 Create `src/adapters/noop-sound.ts`
```typescript
import { SoundPlayer } from '../core/game-orchestrator';

export function createNoopSound(): SoundPlayer {
  return {
    play(_soundName: string): void {
      // Do nothing - silent mode
    }
  };
}
```

---

### Phase 3: Implement Core Orchestrator (90 min)

#### 3.1 Create `src/core/game-orchestrator.ts` - Main Function

**Strategy:** Extract ALL game logic from `index.ts` and make it configurable.

**Key sections to migrate:**

1. **Word pool initialization** (lines 64-66 from index.ts)
2. **State initialization** (lines 68-76 from index.ts)
3. **initializeWord function** (lines 81-100 from index.ts)
4. **renderScreen function** (lines 105-111 from index.ts)
5. **startGameLoop / gameTick** (lines 116-147 from index.ts)
6. **handleKeypress logic** (lines 212-229 from index.ts)
7. **Word completion handling** (lines 232-265 from index.ts)

```typescript
import { GameState, createInitialGameState, updateBoardWithNewChar, processKeypress } from './game-logic';
import { DifficultyState, createInitialDifficultyState, updateDifficultyState } from './adaptive-difficulty';
import { WordsByLength, organizeWordsByLength, filterSingleWords, selectWordAtLength, getMaxWordLength } from './word-pool';
import { generateBagOfChars } from './word-generation';
import { buildGameScreen, buildCompletionScreen } from '../presentation/formatters';
import { renderWithFrame } from '../presentation/frame';
import { calculateScore, getLevelFromWordLength } from './adaptive-scoring';
import { calculateStats, generateFeedback } from './score-calculator';
import { getTickSound } from './game-logic';
import { CATCH_LINE_POSITION } from './game-logic';
import { STARTING_WORD_LENGTH } from './word-pool';
import words from '../data/words.json';
import colors from '../presentation/colors';
import { GAME_CONFIG } from '../config/game';

export function orchestrateGame(options: GameOptions): GameController {
  // 1. Extract options with defaults
  const {
    inputSource,
    renderer,
    soundPlayer,
    tickInterval = GAME_CONFIG.GAME_TICK_INTERVAL,
    duration,
    adaptiveDifficulty = true,
    showCompletionScreens = true,
    showProgressionScreens = true,
  } = options;

  // 2. Initialize word pool (same for both modes)
  const singleWordLevels = filterSingleWords(words);
  const wordsByLength: WordsByLength = organizeWordsByLength(singleWordLevels);
  const maxWordLength = getMaxWordLength(wordsByLength);

  // 3. Initialize game state
  let difficultyState: DifficultyState = adaptiveDifficulty
    ? createInitialDifficultyState(STARTING_WORD_LENGTH, maxWordLength)
    : createInitialDifficultyState(STARTING_WORD_LENGTH, STARTING_WORD_LENGTH); // Fixed difficulty

  let gameState: GameState = createInitialGameState();
  let bagOfChars: string[] = [];
  let currentTarget: string = '';
  let lastFeedback: string = '';
  let progressionMessage: string = '';
  let gameInterval: NodeJS.Timeout | null = null;
  let isWaitingForContinue = false;

  // 4. Define internal functions

  /**
   * Initialize a new word and reset state
   */
  const initializeWord = (): void => {
    const selectedWord = selectWordAtLength(
      wordsByLength,
      difficultyState.currentWordLength,
      difficultyState.usedWords
    );

    if (!selectedWord) {
      currentTarget = 'error';
      console.error('No word found for length:', difficultyState.currentWordLength);
      return;
    }

    currentTarget = selectedWord;
    gameState = createInitialGameState();
    bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
    lastFeedback = '';
    isWaitingForContinue = false;
  };

  /**
   * Render the current game state
   */
  const renderGame = (): void => {
    const dimensions = renderer.getDimensions();
    const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
    const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

    const lines = buildGameScreen(
      gameState,
      currentTarget,
      currentLevel,
      difficultyState.completedWords,
      currentScore,
      lastFeedback,
      CATCH_LINE_POSITION
    );

    const output = renderWithFrame(
      lines,
      GAME_CONFIG.FRAME_WIDTH,
      dimensions.width,
      dimensions.height
    );

    renderer.clear();
    renderer.render(output);
  };

  /**
   * Game tick - generate new character and update board
   */
  const gameTick = (): void => {
    if (isWaitingForContinue) return;

    // Generate new character
    const generatedChar = bagOfChars[Math.floor(Math.random() * bagOfChars.length)];

    // Update board with new character
    gameState = updateBoardWithNewChar(gameState, generatedChar, currentTarget);

    // Play tick sound
    const tickSound = getTickSound(gameState.tickCount);
    soundPlayer.play(tickSound);

    // Render game screen
    renderGame();
  };

  /**
   * Handle user input (keyboard or automated)
   */
  const handleInput = (ch: string): void => {
    if (isWaitingForContinue) {
      // Handle continue prompt (y/n)
      if (ch.toLowerCase() === 'y') {
        initializeWord();
        startGameLoop();
      } else if (ch.toLowerCase() === 'n') {
        stop();
        process.exit(0);
      }
      return;
    }

    // Process keypress through game logic
    const result = processKeypress(ch, gameState, currentTarget);
    gameState = result.newState;

    // Update feedback with colors
    lastFeedback = result.feedbackType === 'success'
      ? `${colors.limeGreen}${result.feedback}${colors.reset}`
      : `${colors.hotPink}${result.feedback}${colors.reset}`;

    // Play sound if needed
    if (result.shouldPlaySound) {
      soundPlayer.play(result.shouldPlaySound);
    }

    // Update bag of chars on success
    if (result.feedbackType === 'success') {
      bagOfChars = generateBagOfChars(gameState.typedProgress, currentTarget);
    }

    // Handle word completion
    if (result.isLevelComplete) {
      if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
      }

      if (showCompletionScreens) {
        // Calculate stats and update difficulty
        const stats = calculateStats(gameState.errorCount, gameState.missedLetters);
        const feedback = generateFeedback(stats);

        const updateResult = updateDifficultyState(difficultyState, currentTarget, stats);
        difficultyState = updateResult.newState;
        progressionMessage = showProgressionScreens ? updateResult.progression.message : '';

        const currentLevel = getLevelFromWordLength(difficultyState.currentWordLength);
        const currentScore = calculateScore(currentLevel, difficultyState.completedWords);

        // Show completion screen
        const lines = buildCompletionScreen(
          currentTarget,
          currentLevel,
          difficultyState.completedWords,
          currentScore,
          stats,
          feedback,
          progressionMessage
        );

        const dimensions = renderer.getDimensions();
        const output = renderWithFrame(
          lines,
          GAME_CONFIG.FRAME_WIDTH,
          dimensions.width,
          dimensions.height
        );

        renderer.clear();
        renderer.render(output);

        soundPlayer.play('victory');
        isWaitingForContinue = true;
      } else {
        // Demo mode: just continue to next word
        if (!adaptiveDifficulty) {
          // For demo, keep same difficulty
          difficultyState.completedWords++;
        }
        lastFeedback = `${colors.limeGreen}★★★ Orð lokið! "${currentTarget}" ★★★${colors.reset}`;

        setTimeout(() => {
          initializeWord();
          startGameLoop();
        }, 1000);
      }
    }

    // Render after input processing
    if (!result.isLevelComplete) {
      renderGame();
    }
  };

  /**
   * Start the game loop
   */
  const startGameLoop = (): void => {
    if (gameInterval) {
      clearInterval(gameInterval);
    }

    gameInterval = setInterval(gameTick, tickInterval);
  };

  // 5. Initialize first word
  initializeWord();

  // 6. Start game loop
  startGameLoop();

  // 7. Setup input handling
  inputSource.onInput(handleInput);

  // 8. Optional: auto-stop after duration (for demo mode)
  if (duration) {
    setTimeout(() => {
      stop();
    }, duration);
  }

  // 9. Return controller for external control
  const stop = (): void => {
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    inputSource.cleanup();
  };

  return {
    stop,
    getState: () => gameState
  };
}
```

**Important Notes:**
1. The `isWaitingForContinue` logic should only activate when `showCompletionScreens` is true
2. For demo mode (when `showCompletionScreens` is false), automatically continue to next word
3. The auto-type input adapter needs special handling - see section 2.2 notes

---

### Phase 4: Update Entry Points (30 min)

#### 4.1 Update `index.ts`
Replace all game logic with orchestrator call:

```typescript
#!/usr/bin/env node
import { orchestrateGame } from './src/core/game-orchestrator';
import { createKeyboardInput } from './src/adapters/keyboard-input';
import { createTerminalRenderer } from './src/adapters/terminal-renderer';
import { createRealSound } from './src/adapters/real-sound';

// Create adapters
const inputSource = createKeyboardInput();
const renderer = createTerminalRenderer();
const soundPlayer = createRealSound();

// Start game
const game = orchestrateGame({
  inputSource,
  renderer,
  soundPlayer,
  adaptiveDifficulty: true,
  showCompletionScreens: true,
  showProgressionScreens: true,
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  game.stop();
  process.exit(0);
});
```

**What to remove:**
- Lines 64-265 (all game logic)
- Keep imports only for creating adapters

#### 4.2 Update `demo.ts`
Replace all game logic with orchestrator call:

```typescript
#!/usr/bin/env node
import { orchestrateGame } from './src/core/game-orchestrator';
import { createAutoTypeInput } from './src/adapters/auto-type-input';
import { createConsoleRenderer } from './src/adapters/console-renderer';
import { createNoopSound } from './src/adapters/noop-sound';
import { GAME_CONFIG } from './src/config/game';
import { CATCH_LINE_POSITION } from './src/core/game-logic';

// Create adapters
const inputSource = createAutoTypeInput({
  interval: GAME_CONFIG.AUTO_TYPE_INTERVAL,
  catchLinePosition: CATCH_LINE_POSITION,
});
const renderer = createConsoleRenderer({ width: 80, height: 24 });
const soundPlayer = createNoopSound();

// Start demo
const demo = orchestrateGame({
  inputSource,
  renderer,
  soundPlayer,
  tickInterval: GAME_CONFIG.DEMO_TICK_INTERVAL,
  duration: GAME_CONFIG.DEMO_DURATION,
  adaptiveDifficulty: false,
  showCompletionScreens: false,
  showProgressionScreens: false,
});

// Demo stops automatically after 18 seconds
```

**What to remove:**
- Lines 45-210 (all game logic)
- Keep only adapter setup and orchestrator call

---

### Phase 5: Handle Auto-Type State Access Challenge (30 min)

The auto-type adapter needs access to game state to determine when to type. There are several approaches:

#### Option A: Extended Callback Signature (Recommended)
Modify the InputSource interface to pass game state:

```typescript
export interface InputSource {
  onInput(callback: (ch: string, gameState?: GameState, target?: string) => void): void;
  cleanup(): void;
}
```

Then in orchestrator:
```typescript
inputSource.onInput((ch, state, target) => {
  // Auto-type adapter provides its own ch
  // Keyboard adapter ignores state/target params
  handleInput(ch);
});
```

#### Option B: State Accessor Method
Add a method to auto-type adapter:

```typescript
// In orchestrator, after creating input source
if ('setStateAccessor' in inputSource) {
  inputSource.setStateAccessor(() => ({
    gameState,
    currentTarget
  }));
}
```

#### Option C: Move Auto-Type Logic to Orchestrator
Keep auto-type checking inside orchestrator as a separate interval:

```typescript
if (isAutoPlayMode) {
  setInterval(() => {
    const nextExpectedChar = currentTarget[gameState.typedProgress.length];
    const itemAtCatchLine = gameState.board[CATCH_LINE_POSITION];

    if (itemAtCatchLine?.generated && nextExpectedChar !== undefined) {
      const letterAtCatch = itemAtCatchLine.generated;
      if (letterAtCatch.toLowerCase() === nextExpectedChar.toLowerCase()) {
        handleInput(letterAtCatch);
      }
    }
  }, AUTO_TYPE_INTERVAL);
}
```

**Choose the approach that feels cleanest during implementation.**

---

## Testing Strategy

### Manual Testing Checklist

After implementation, test both modes:

#### Main Game (`npm start`)
- [ ] Game starts and displays correctly
- [ ] Keyboard input works
- [ ] Letters fall correctly
- [ ] Sounds play
- [ ] Scoring works
- [ ] Difficulty progression works
- [ ] Word completion shows stats
- [ ] Can continue to next word (press 'y')
- [ ] Can quit (press 'n' or Ctrl+C)

#### Demo Mode (`npm run demo`)
- [ ] Demo starts automatically
- [ ] Auto-typing works correctly
- [ ] Letters fall at correct speed
- [ ] No sounds play
- [ ] Words complete automatically
- [ ] Demo runs for 18 seconds
- [ ] Demo exits cleanly

### Automated Tests (Optional but Recommended)

Create `src/core/game-orchestrator.test.ts`:

```typescript
import { orchestrateGame } from './game-orchestrator';
import { InputSource, Renderer, SoundPlayer } from './game-orchestrator';

describe('orchestrateGame', () => {
  it('should initialize and start game', () => {
    const mockInput: InputSource = {
      onInput: jest.fn(),
      cleanup: jest.fn(),
    };
    const mockRenderer: Renderer = {
      clear: jest.fn(),
      render: jest.fn(),
      getDimensions: () => ({ width: 80, height: 24 }),
    };
    const mockSound: SoundPlayer = {
      play: jest.fn(),
    };

    const controller = orchestrateGame({
      inputSource: mockInput,
      renderer: mockRenderer,
      soundPlayer: mockSound,
    });

    expect(mockInput.onInput).toHaveBeenCalled();
    expect(mockRenderer.render).toHaveBeenCalled();

    controller.stop();
    expect(mockInput.cleanup).toHaveBeenCalled();
  });
});
```

---

## Migration Strategy

### Recommended Order:

1. **Create config file first** - Get constants out of the way
2. **Create interfaces** - Define contracts before implementation
3. **Create simple adapters** - Terminal, console, sound (easy wins)
4. **Create orchestrator skeleton** - Just structure, no logic yet
5. **Migrate game logic piece by piece** - Copy from index.ts, test each piece
6. **Create auto-type adapter** - Most complex, do last
7. **Update index.ts** - Should work immediately
8. **Update demo.ts** - May need auto-type debugging
9. **Test thoroughly** - Both modes
10. **Delete old code** - Clean up duplicated logic from old files

### Incremental Testing

After each major step, you should be able to:
- Step 4: Compile successfully
- Step 6: Run main game (`npm start`)
- Step 8: Run demo (`npm run demo`)

---

## Expected Results

### Before
```
index.ts: 282 lines (all game logic)
demo.ts:  214 lines (duplicate game logic)
──────────────────────────────────────
Total:    496 lines
Duplication: 120-150 lines (24-30%)
```

### After
```
game-orchestrator.ts: ~200 lines (single game logic)
keyboard-input.ts:     ~15 lines
auto-type-input.ts:    ~40 lines
terminal-renderer.ts:  ~15 lines
console-renderer.ts:   ~15 lines
real-sound.ts:         ~10 lines
noop-sound.ts:         ~8 lines
game.ts:               ~10 lines
index.ts:              ~30 lines (thin wrapper)
demo.ts:               ~25 lines (thin wrapper)
──────────────────────────────────────
Total:    ~368 lines
Duplication: 0 lines (0%)
```

**Savings: 128 lines, 100% duplication eliminated**

---

## Troubleshooting

### Common Issues

**Issue 1: Auto-type not working**
- Check that auto-type adapter is receiving game state correctly
- Verify CATCH_LINE_POSITION is correct
- Add debug logging to see when auto-type tries to fire

**Issue 2: Sounds not playing**
- Verify sound adapter is being passed correctly
- Check that sound.play() is being called with right sound names
- For demo, verify noop sound adapter is used

**Issue 3: Rendering looks wrong**
- Check that renderer.getDimensions() returns correct values
- Verify FRAME_WIDTH is imported from config
- Test both terminal and console renderers separately

**Issue 4: Game loop not starting**
- Check that setInterval is being called with correct interval
- Verify gameTick is being executed
- Add logging to confirm initialization completed

---

## Success Criteria

Implementation is complete when:

1. ✅ Zero duplication between index.ts and demo.ts
2. ✅ Main game works identically to before
3. ✅ Demo mode works identically to before
4. ✅ Both files are under 50 lines each
5. ✅ All game logic is in orchestrator
6. ✅ Adapters are simple and focused
7. ✅ Code is more maintainable and testable
8. ✅ Easy to add new game modes in future

---

## Future Enhancements

Once this refactoring is complete, you can easily add:

1. **Practice Mode** - Slower speed, hints enabled
2. **Tutorial Mode** - Step-by-step instructions
3. **Replay Mode** - Watch recorded gameplay
4. **Testing Mode** - Inject mock adapters for automated tests
5. **Custom Modes** - User-defined configurations

All by just calling `orchestrateGame()` with different options!

---

## Questions to Consider During Implementation

1. Should auto-type logic live in adapter or orchestrator?
2. How to handle state access for auto-type?
3. Should completion screens be configurable per-word or per-game?
4. Should we add pause/resume functionality to GameController?
5. Should we expose more game state through getState()?

Make pragmatic decisions based on what's cleanest in practice.

---

## Prompt to Execute This Plan

**Quick start command:**
```
Implement the orchestrateGame refactoring as described in IMPLEMENTATION_PLAN.md.
Follow the phases in order, test after each phase, and ensure both index.ts and
demo.ts work correctly. The goal is zero duplication while maintaining all existing
functionality.
```

**Detailed command:**
```
Refactor the racer codebase to eliminate duplication between index.ts and demo.ts
by creating a single orchestrateGame() function. Follow the implementation plan in
IMPLEMENTATION_PLAN.md:

1. Create src/config/game.ts with all config constants
2. Define interfaces in src/core/game-orchestrator.ts (InputSource, Renderer, SoundPlayer, GameOptions, GameController)
3. Create adapters in src/adapters/:
   - keyboard-input.ts (wraps existing input-adapter)
   - auto-type-input.ts (extracts auto-type logic from demo.ts)
   - terminal-renderer.ts (wraps terminal-adapter)
   - console-renderer.ts (for demo)
   - real-sound.ts (wraps sound-adapter)
   - noop-sound.ts (for demo)
4. Implement orchestrateGame() by migrating ALL game logic from index.ts
5. Reduce index.ts to ~30 line wrapper that creates adapters and calls orchestrateGame
6. Reduce demo.ts to ~25 line wrapper that creates demo adapters and calls orchestrateGame

Test main game and demo mode after implementation. Expected result: zero duplication,
both modes work identically to before.
```
