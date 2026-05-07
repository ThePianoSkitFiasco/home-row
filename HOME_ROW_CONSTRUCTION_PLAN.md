# HOME ROW Construction Plan

## Foundations

HOME ROW currently has three foundations:

1. **Story / context skeleton**  
   The canon structure, acts, characters, endings, motifs, phrases, and emotional logic.

2. **Intent Lab tool**  
   A working design/prototyping tool for detecting typed text, deletions, pauses, lesson tags, intent effects, and exportable JSON.

3. **Mr Fingers animation trigger concept**  
   Mr Fingers can react to player behaviour: obedience, mistakes, deletion, pauses, refusal, memory surfacing, and emotional escalation.

The construction plan should make the typing system the spine of the game, not attach the horror later as decorative cursed wallpaper.

---

## Build Philosophy

### Minimum viable game loop first

Before acts, endings, files, desktop UI, or advanced corruption, the core loop must work:

> Player sees assigned sentence → types → system evaluates behaviour → intent triggers → Mr Fingers reacts → hidden stats change → next lesson appears.

That is the central machine.

Everything else grows from that.

---

## Suggested Project Structure

```txt
home-row/
  index.html
  src/
    main.js
    scenes/
      BootScene.js
      DesktopScene.js
      TypingScene.js
      LessonCompleteScene.js
      EndingScene.js
    systems/
      TypingEngine.js
      IntentEngine.js
      MemoryState.js
      LessonManager.js
      MrFingersController.js
      SaveSystem.js
    data/
      lessons.act1.json
      lessons.act2.json
      lessons.act3.json
      intents.json
      storyFlags.json
      endings.json
    ui/
      TerminalWindow.js
      TypingPanel.js
      MrFingersView.js
      GlitchText.js
    assets/
      images/
      sprites/
      audio/
      fonts/
```

No massive framework. No god file. No 3,000-line `MainScene.js`, because civilisation has already endured enough.

---

# Phase 1: Core Typing Prototype

## Goal

Make one playable scene where the player types lesson sentences and the game reacts.

## Build

### `TypingScene`

Shows:

- Old typing tutor interface
- Assigned sentence
- Player input field / typed text display
- Accuracy / progress
- Mr Fingers placeholder sprite or state display
- Optional hidden/debug stat panel for development

### `TypingEngine`

Tracks:

- Current lesson text
- Correct characters
- Wrong characters
- Backspaces / deletions
- Pauses
- Completion
- Words typed
- Forced mismatch / corruption moments

## First Test Lessons

```txt
asdf jkl; asdf jkl;
good fingers stay where they belong
i will not interrupt
```

## Output of Phase 1

A working ugly-but-functional typing screen.

---

# Phase 2: Intent Engine Integration

## Goal

Use the Intent Lab export inside the actual Phaser game.

The Intent Lab becomes the authoring tool. Phaser becomes the runtime.

## Build

### `IntentEngine.js`

Loads:

```txt
src/data/intents.json
```

Responds to events:

- `typed`
- `deleted`
- `pause`
- `pause_before`
- `lesson_complete`
- `mistake`
- `perfect_line`

Checks:

- Active lesson tag
- Pattern match
- Once-only triggers
- Effects on hidden stats
- Response text
- Mr Fingers animation trigger
- Flags

## Example Intent Runtime Shape

```json
{
  "id": "denial_deleted_absent",
  "lesson": "act2_emily_record",
  "eventType": "deleted",
  "matchMode": "contains",
  "patterns": ["not absent", "she was not absent"],
  "effects": {
    "suppression": 2,
    "disclosure": -1
  },
  "response": "Errors are not evidence.",
  "mrTrigger": "corrective_smile",
  "once": true
}
```

## Output of Phase 2

Typing actions now affect story stats and trigger Mr Fingers reactions.

---

# Phase 3: Mr Fingers Controller

## Goal

Centralise all mascot reactions.

## Build

### `MrFingersController.js`

Receives trigger names:

```js
mrFingers.play("idle");
mrFingers.play("encouraging");
mrFingers.play("corrective_smile");
mrFingers.play("glitch_warning");
mrFingers.play("angry");
mrFingers.play("emily_bleedthrough");
mrFingers.play("protector");
mrFingers.play("witness");
```

## Suggested Starting Animation States

| State | Use |
|---|---|
| `idle` | Normal typing tutor |
| `encourage` | Correct typing |
| `mistake_notice` | Small error |
| `corrective_smile` | Player deletes truth |
| `glitch_warning` | Hidden text appears |
| `angry` | Player resists too much |
| `emily_bleedthrough` | Act 6 statement |
| `protector` | Act 7 break |
| `witness` | Best ending / acceptance |

## Output of Phase 3

Mr Fingers becomes the emotional UI.

---

# Phase 4: Lesson Manager + Act Structure

## Goal

Move from one typing drill to a sequence of authored lessons.

## Build

### `lessons.act1.json`

```json
{
  "actId": "act1_home_row",
  "title": "HOME ROW",
  "lessons": [
    {
      "id": "act1_basic_keys",
      "displayTitle": "Lesson 1: Home Row",
      "assignedText": "asdf jkl; asdf jkl;",
      "hiddenText": ["HELP", "DOOR", "SHE"],
      "requiredToAdvance": "complete"
    },
    {
      "id": "act1_good_fingers",
      "displayTitle": "Lesson 2: Good Fingers",
      "assignedText": "good fingers stay where they belong",
      "hiddenText": ["KEEP TYPING"],
      "requiredToAdvance": "complete"
    }
  ]
}
```

### `LessonManager.js`

Handles:

- Current act
- Current lesson
- Progression rules
- Hidden inserts
- Locked / unlocked lessons
- Returning to desktop between major acts

## Output of Phase 4

A playable Act 1 prototype.

---

# Phase 5: Memory State + Flags

## Goal

Track the player’s behaviour as meaning.

## Build

### `MemoryState.js`

Tracks hidden stats:

```json
{
  "obedience": 0,
  "disclosure": 0,
  "suppression": 0,
  "refusal": 0,
  "witnessAcceptance": 0
}
```

Tracks flags:

```json
{
  "typedHiddenHelp": false,
  "deletedNotAbsent": false,
  "pausedBeforeTurnAround": false,
  "completedLessonBeforeReveal": false,
  "acceptedEmilyStatement": false
}
```

## Behaviour Mapping

| Player behaviour | Stat effect |
|---|---|
| Perfect typing | Obedience + |
| Repeated mistakes on hidden words | Disclosure + |
| Backspacing truth phrases | Suppression + |
| Pausing before commands | Refusal + |
| Preserving Emily’s words | Witness Acceptance + |

## Output of Phase 5

The game can later judge endings through behavioural history rather than simplistic morality.

---

# Phase 6: Desktop / File Shell

## Goal

Add the fake retro computer wrapper.

This should come after the typing loop works. Otherwise the project risks becoming a fake OS with no actual game inside, the classic indie dev sinkhole.

## Build

### `DesktopScene`

Initial available icon:

- `HOME_ROW.EXE`

Later unlocks:

- `README.TXT`
- `LESSONS/`
- `STUDENT_RECORDS/`
- `RECOVERY.LOG`
- `CORRECTION_EXAM.EXE`

## Output of Phase 6

The player moves between typing lessons and recovered files.

---

# Phase 7: Story Acts

## Suggested Build Order

### Act 1: Home Row / First Corruption

- Simple drills
- Hidden words through errors
- Mr Fingers still mostly cheerful

### Act 2: Emily Record

- Official profile
- `ABSENT` / `NOT ABSENT` contradiction
- First clear Emily Vale reveal

### Act 3: Behaviour Sentences

- `I WILL NOT INTERRUPT`
- `GOOD CHILDREN FINISH THE EXERCISE`
- Player learns they completed this before

### Act 4: System Log

- Second workstation
- Typing pattern match
- Player was present

### Act 5: Dictation Mode

- “You heard...”
- “You kept typing...”
- “Do not turn around”

### Act 6: Emily Statement

- Player must correct, preserve, delete, rewrite, or refuse

### Act 7: Mr Fingers Break

- “I was trying to help you forget”
- Mascot / protector / repression ambiguity

### Act 8: Correction Exam

- Edit official statements
- Decide what becomes record

### Finale

- Final sentence generated from stats and flags

---

# Phase 8: Ending System

## Endings

| Ending | Likely requirements |
|---|---|
| Gold Star | High obedience, low disclosure |
| Error Report | Some truth surfaced, but incomplete |
| Backspace | High suppression |
| Mascot | High refusal, low witness acceptance |
| Witness Statement | High disclosure + witness acceptance, moderate suppression allowed |

## Best Final Line

```txt
I WAS A CHILD AND I WAS THERE.
```

This should feel earned, not handed out like a haunted participation sticker.

---

# Recommended First Milestone

## Milestone 1: “The Lesson Remembers”

Build only this:

1. Boot into typing scene.
2. Type 3 lesson lines.
3. Track mistakes, deletions, and pauses.
4. Load intent JSON.
5. Trigger Mr Fingers reactions.
6. Show hidden stat changes in debug mode.
7. End with one corruption line:

```txt
YOU COMPLETED THIS LESSON BEFORE.
```

This is the vertical slice.

Not the whole game. Not the desktop. Not endings. Just the haunted typing loop functioning.

---

# First Codex / Claude Build Prompt

```txt
We are beginning construction of HOME ROW, a cursed retro typing tutor horror game.

Build Milestone 1 only: “The Lesson Remembers.”

Use plain Phaser 3 with a simple modular structure. Do not overbuild the whole game.

Core goal:
Create a playable TypingScene where the player is shown assigned typing sentences, types them into an input area, and the game tracks accuracy, mistakes, deletions/backspaces, pauses, and lesson completion.

Project structure:
- index.html
- src/main.js
- src/scenes/BootScene.js
- src/scenes/TypingScene.js
- src/systems/TypingEngine.js
- src/systems/IntentEngine.js
- src/systems/MemoryState.js
- src/systems/LessonManager.js
- src/systems/MrFingersController.js
- src/data/lessons.act1.json
- src/data/intents.json

TypingScene requirements:
- 1024x768 canvas.
- Retro 1990s typing tutor style.
- Display current assigned sentence.
- Capture keyboard input.
- Show typed text.
- Highlight or mark incorrect characters simply.
- Advance to next lesson line when complete.
- Track:
  - correct characters
  - mistakes
  - backspaces/deletions
  - pause duration
  - completed lines

MemoryState:
Track hidden stats:
- obedience
- disclosure
- suppression
- refusal
- witnessAcceptance

IntentEngine:
Load src/data/intents.json.
Support event types:
- typed
- deleted
- pause
- lesson_complete
- mistake

Each intent may include:
- id
- lesson
- eventType
- matchMode: contains or exact
- patterns
- effects
- response
- mrTrigger
- once

When an intent fires:
- apply effects to MemoryState
- show response text in the UI
- call MrFingersController with mrTrigger
- prevent once:true intents from firing again

MrFingersController:
For now, use placeholder text/state changes rather than real sprites.
Supported states:
- idle
- encourage
- mistake_notice
- corrective_smile
- glitch_warning
- angry
- emily_bleedthrough
- protector
- witness

Lessons:
Create a small Act 1 lesson JSON with three lines:
1. "asdf jkl; asdf jkl;"
2. "good fingers stay where they belong"
3. "i will not interrupt"

Add at least one hidden/corruption response:
After the third line completes, show:
"YOU COMPLETED THIS LESSON BEFORE."

Keep code clean, commented, and modular.
Do not implement desktop scene, endings, save system, audio, or full story acts yet.
```

---

# Immediate Next Step

Start with **Milestone 1: The Lesson Remembers**.

That gives the project its core engine:

- Typing as obedience
- Deletion as suppression
- Mistakes as memory leak
- Pauses as resistance
- Mr Fingers as reaction system

Once that works, the rest becomes content and escalation rather than a swamp with fonts.
