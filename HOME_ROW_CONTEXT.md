# HOME ROW — Project Context

## Current State

**HOME ROW** is now a playable narrative prototype of a cursed retro typing tutor horror game.

The current build includes:

- Acts 1-8 implemented
- Full typing loop
- Intent-driven story reactions
- Memory stats and story flags
- Mr Fingers state/reaction system
- Mr Fingers sprite integration with safe text fallback
- Act-specific visual themes
- Final statement selection
- Route-specific ending prose
- Syntax checks passing
- JSON data parsing cleanly

The core loop is:

```text
Player sees assigned sentence
Player types character by character
TypingEngine emits behaviour events
IntentEngine evaluates events
MemoryState stats and flags change
Mr Fingers reacts
Next lesson or act appears
Final statement is selected from accumulated memory state
```

## Core Concept

HOME ROW is a cursed 1990s typing tutor built around a grounded traumatic event with ambiguous supernatural preservation.

Years ago, Emily Vale disappeared after being kept behind in the school computer lab by Mr. Calder. The player was another child in the room. They did not harm Emily, but they were present, heard something, and were told to keep typing and not turn around.

The program reveals the truth through typing drills, official records, system logs, sensory memory, Emily's preserved statement, Mr Fingers' protective/repressive behaviour, and a final statement typed by the player.

The supernatural layer remains ambiguous. HOME ROW may be a haunted archive, Emily's preserved testimony, the player's suppressed memory, or all of these at once.

## Implemented Act Structure

### Act 1: HOME ROW

Theme: friendly typing tutor becoming wrong.

Purpose: establishes typing obedience, hidden words, and first corruption.

### Act 2: STUDENT RECORD

Theme: school admin/database form.

Purpose: introduces Emily Vale through official records and contradiction.

### Act 3: SYSTEM LOG

Theme: machine log / forensic record.

Purpose: reveals second workstation and typing pattern match.

### Act 4: DICTATION MODE

Theme: recovered sensory memory.

Purpose: reveals Calder's command, Emily's voice, "do not turn around," and "you heard her say no."

### Act 5: UNSANCTIONED STATEMENT

Theme: Emily's testimony breaking through.

Purpose: Emily names herself, describes being kept behind, asks not to be corrected, and asks for the event to be recorded.

### Act 6: PROTECTIVE ROUTINE

Theme: Mr Fingers / repression / protection.

Purpose: Mr Fingers breaks character and admits he was trying to help the player forget.

### Act 7: CORRECTION EXAM

Theme: official false-record challenge.

Purpose: confronts denial statements and prepares the final statement.

### Act 8: FINAL STATEMENT

Theme: stripped-down testimony.

Purpose: selected final line is generated from MemoryState stats and flags, then typed by the player.

## Current File And Data Structure

### Scenes

- `src/scenes/BootScene.js`  
  Boot/title screen. Starts the typing scene on keypress.

- `src/scenes/TypingScene.js`  
  Main game scene. Owns Phaser UI, act loading, lesson display, typing input wiring, visual themes, Mr Fingers presentation, transitions, final statement runtime assignment, and ending screen presentation.

### Systems

- `src/systems/TypingEngine.js`  
  Tracks typed characters, correctness, mistakes, deletions/backspaces, `previousTyped`, pauses, line completion, and emitted typing events.

- `src/systems/IntentEngine.js`  
  Loads `intents.json`, matches `typed`, `deleted`, `pause`, `mistake`, and `lesson_complete` events, applies stat effects, sets flags, emits responses, and triggers Mr Fingers states.

- `src/systems/MemoryState.js`  
  Tracks hidden stats and story flags.

- `src/systems/LessonManager.js`  
  Loads multiple acts in order and tracks current act/lesson progression.

- `src/systems/MrFingersController.js`  
  Maps Mr Fingers states to labels, sprite keys, and reaction hints.

- `src/systems/EventLog.js`  
  Keeps a compact debug/event log of fired typing events, intents, stat changes, and flag changes.

- `src/systems/EndingLogic.js`  
  Selects final statement route from MemoryState stats and flags.

### Data

- `src/data/lessons.act1.json`  
  Act 1: HOME ROW.

- `src/data/lessons.act2.json`  
  Act 2: STUDENT RECORD.

- `src/data/lessons.act3.json`  
  Act 3: SYSTEM LOG.

- `src/data/lessons.act4.json`  
  Act 4: DICTATION MODE.

- `src/data/lessons.act5.json`  
  Act 5: UNSANCTIONED STATEMENT.

- `src/data/lessons.act6.json`  
  Act 6: PROTECTIVE ROUTINE.

- `src/data/lessons.act7.json`  
  Act 7: CORRECTION EXAM.

- `src/data/lessons.final.json`  
  Act 8: FINAL STATEMENT placeholder lesson. TypingScene replaces the placeholder assigned text at runtime using EndingLogic.

- `src/data/intents.json`  
  All story reactions, stat effects, flag updates, Mr Fingers triggers, and final statement completion intents.

## Core Systems

### TypingEngine

TypingEngine is framework-independent. It tracks:

- assigned text
- typed characters
- per-character correctness
- mistake count
- backspace/deletion count
- `previousTyped` for deletion intent checks
- pauses
- total pause time
- completed lines
- accuracy

It emits events consumed by TypingScene and IntentEngine:

- `typed`
- `mistake`
- `deleted`
- `pause`
- `line_complete`

### IntentEngine

IntentEngine loads `src/data/intents.json` and evaluates events against active lesson id.

It supports:

- typed pattern matching
- deletion pattern matching using `previousTyped`
- pause thresholds via `minPauseMs` / `pauseThreshold`
- mistake reactions
- lesson completion reactions
- once-only intents
- stat effects
- flag effects
- response text
- Mr Fingers state triggers

### MemoryState

MemoryState tracks hidden stats:

- `obedience`
- `disclosure`
- `suppression`
- `refusal`
- `witnessAcceptance`

MemoryState also tracks story flags across Acts 2-7 and final statement selection. Important flags include:

- `typingPatternMatched`
- `heardHerSayNo`
- `emilyStatementPreserved`
- `keptTypingStatementAccepted`
- `recordCompletionStarted`
- `doNotTurnAroundRevealed`
- `playerImplicationStarted`

It also contains many act-specific flags for Emily's record, system log reveals, dictation memory, unsanctioned statement progress, Mr Fingers' protective routine, and correction exam state.

### LessonManager

LessonManager loads all acts in order and exposes:

- current act
- current lesson
- act number
- lesson number
- total acts
- total lessons in current act
- act/lesson advancement

Current act order:

1. HOME ROW
2. STUDENT RECORD
3. SYSTEM LOG
4. DICTATION MODE
5. UNSANCTIONED STATEMENT
6. PROTECTIVE ROUTINE
7. CORRECTION EXAM
8. FINAL STATEMENT

### MrFingersController

MrFingersController maps each state to:

- `id`
- `label`
- `spriteKey`
- reaction hints

Current states:

- `idle`
- `encourage`
- `mistake_notice`
- `corrective_smile`
- `glitch_warning`
- `angry`
- `emily_bleedthrough`
- `protector`
- `witness`

Expected Mr Fingers sprite path:

```text
assets/sprites/mr_fingers/
```

Expected filenames:

- `mr_idle.png`
- `mr_encourage.png`
- `mr_mistake_notice.png`
- `mr_corrective_smile.png`
- `mr_glitch_warning.png`
- `mr_angry.png`
- `mr_emily_bleedthrough.png`
- `mr_protector.png`
- `mr_witness.png`

If these assets are missing, gameplay should not break. TypingScene falls back to text/glyph presentation while preserving the readable Mr Fingers state label.

### EndingLogic

EndingLogic selects a final statement route from MemoryState stats and flags.

Routes:

| routeId | Title | Statement |
|---|---|---|
| `witness_statement` | WITNESS STATEMENT | `I WAS A CHILD AND I WAS THERE` |
| `audio_memory` | AUDIO MEMORY | `I HEARD HER SAY NO` |
| `completed_exercise` | COMPLETED EXERCISE | `I KEPT TYPING` |
| `sightline_error` | SIGHTLINE ERROR | `I SHOULD HAVE TURNED AROUND` |
| `gold_star` | GOLD STAR | `I DID NOT SEE ANYTHING` |
| `incomplete_statement` | INCOMPLETE STATEMENT | `I KEPT TYPING` |

Each route returns:

- `routeId`
- `title`
- `statement`
- `response`
- `body`

The final route is selected when Act 8 starts. The player must type the selected statement using the same TypingEngine loop. Completing the final statement shows an authored ending screen with route title, final statement, response, body prose, Memory Match, stats, and flags.

## Visual Theme System

TypingScene has act-specific visual themes. Each theme defines:

- primary color
- accent color
- warning/glitch color
- panel label
- visible mode stamp
- subtle background grid/overlay styling

Panel labels: all acts now use `TYPE:` as the panel label to maintain the typing tutor disguise.

Mode stamps:

| Act | Mode Stamp |
|---|---|
| Act 1 | `PRACTICE` |
| Act 2 | `PRACTICE` |
| Act 3 | `DRILL` |
| Act 4 | `DICTATION` |
| Act 5 | `PRACTICE` |
| Act 6 | `REVIEW` |
| Act 7 | `TEST` |
| Act 8 | `FINAL TEST` |

The theme is applied to:

- main title/header text
- progress text
- panel borders
- assigned sentence panel label
- response/narrative text accent
- mode stamp
- transition overlay color
- subtle background grid/overlay

The visual pass is intentionally restrained. Correct characters, mistakes, debug text, and event logs must remain readable.

## Current Development Rules

### Do Not Break

Do not:

- rewrite TypingScene from scratch
- remove existing act progression
- remove `previousTyped` deletion handling
- remove final statement route logic
- remove Mr Fingers fallback behaviour
- remove debug/event log tools
- add new story acts before tuning/playtest
- implement desktop/save/audio unless explicitly requested

Preserve:

- Acts 1-8 progression
- intent firing
- stats/flags
- final statement selection
- route-specific ending body text
- visual themes
- Mr Fingers state mapping
- syntax-valid JS and clean JSON

## Typing Tutor Disguise Layer (Milestone 14)

Player-facing labels have been replaced. The player now sees:

- Title: always `HOME ROW` (not `ACT X: TITLE`)
- Lesson names: `Lesson 1: Home Row Keys` through `Final Typing Test` (from `playerLabel` fields in lesson JSON)
- Progress: `Lesson 12 of 57` (continuous count, not `ACT 2 LINE 4 / 8`)
- Mode stamps: `PRACTICE` / `DRILL` / `DICTATION` / `REVIEW` / `TEST` / `FINAL TEST`
- Panel label: `TYPE:` for all acts
- Section transitions: neutral text like `Next section: Data Entry Practice`
- Completion screen: Progress Report with WPM, accuracy, grade, star rating, Mr Fingers comment

New systems:

- `src/systems/ScoringSystem.js` — calculates WPM, accuracy grade (A+ through F), star rating (1-3 or Gold Star), and Mr Fingers grade comment
- `TypingEngine` now tracks WPM via `lessonStartTime`
- `LessonManager` now has `getGlobalLessonNumber()` and `getGlobalTotalLessons()`

Internal act IDs, lesson IDs, intents, flags, stats, and ending logic are unchanged.

Each lesson JSON now includes `playerLabel`, `drillType`, and each act includes `playerSection`. Original `displayTitle` and `title` fields are preserved for internal use.

## Next Suggested Milestone

### Milestone 14 Steps 5-8: Game Feel + Drill Expansion

Focus:

- add report card screen between sections (Step 5)
- expand Act 1 with real typing drills — key combos, word clusters, short phrases (Step 6)
- add streak/reward visuals and satisfying correct-typing feedback (Step 7)
- add subtle wrongness to later section transitions (Step 8)
