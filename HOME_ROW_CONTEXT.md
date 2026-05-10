# HOME ROW — Project Context

## Current State

**HOME ROW** is a slow-burn retro typing tutor horror project. The intended player experience no longer begins as a haunted terminal. It should begin as a convincing 1990s children's typing tutor or school computer program, then gradually become unsettling and finally accusatory.

Current project reality:

- The narrative skeleton across Acts 1-8 still exists.
- Acts 1-7 lesson content has been restructured toward a slower reveal.
- The typing tutor disguise layer is implemented in the main systems.
- Overt player-facing act labels have been removed in favor of neutral lesson/tutor language.
- Scoring, WPM, accuracy, grades, stars, and report-card framing exist.
- Pacing beats such as `revealDelayMs`, `holdMs`, and `lingerResponse` exist in lesson data and scene flow.
- Debug-only diagnostics still exist, but should remain hidden in normal play.
- A separate friendly tutor UI mockup scene exists for the new early-game aesthetic direction, while the main narrative runtime logic remains centered in `TypingScene.js`.

Core direction:

- Start as a believable retro typing tutor / teaching tool.
- Make typing feel like a lesson first, not just copying ominous text.
- Use WPM, accuracy, grades, stars, report cards, and friendly lesson labels.
- Hide overt act/chapter framing from the player.
- Let horror leak in through odd lesson text, Mr Fingers responses, correction language, pauses, deletions, and gradual UI degradation.
- Make the major switch into horror feel earned.
- Keep the existing narrative structure, but disguise it inside lesson progression.

## Core Concept

HOME ROW is about complicity, memory, and coercion expressed through typing drills.

Years ago, Emily Vale disappeared after being kept behind in a school computer room by Mr. Calder. The player was another child in the room. They did not cause the harm, but they were present, heard enough, and kept typing. The program replays that buried event as educational software: lessons, drills, records, corrections, report cards, and final judgement.

The horror should emerge gradually from inside the teaching tool. The player should feel that their hands are participating before they fully understand what they are participating in.

Supernatural explanation remains intentionally ambiguous. HOME ROW may be a haunted program, a repression machine, Emily's persistence inside the software, the player's damaged memory, or some overlap of all four.

## Slow-Burn Act Structure

Internal act IDs still exist for logic, data, and endings. They should not be exposed directly in normal player-facing UI.

### Act 1

Player-facing feel: normal home-row typing practice.

Implemented lesson arc:

- `asdf jkl; asdf jkl;`
- `dad sad lad fall ask`
- `a lad had a flask`
- `jill had a salad`
- `ask dad as fast as you can`
- `class bell desk hall`
- `good hands stay on home row`
- `your hands remember`

Purpose:

- establish a believable tutor opening
- teach hand position and rhythm
- allow only the final line to become subtly wrong

### Act 2

Player-facing feel: school/admin/data-entry practice.

Implemented lesson arc:

- `school desk class bell`
- `office form record file`
- `name date class status`
- `present absent late excused`
- `emily vale`
- `status absent`
- `absence authorised`
- `she was not absent`

Purpose:

- begin with plausible school and office vocabulary
- introduce Emily's name in a clerical context
- end with the first explicit contradiction

### Act 3

Player-facing feel: computer-skills / system practice.

Implemented lesson arc:

- `file save print copy`
- `user name login time`
- `session start session end`
- `screen focus maintained`
- `workstation one active`
- `workstation two active`
- `teacher override accepted`
- `typing pattern match found`

Purpose:

- shift from classroom practice to computer procedure
- reveal second-workstation evidence
- make system language begin functioning as testimony

### Act 4

Player-facing feel: dictation / listening practice.

Implemented lesson arc:

- `listen and type`
- `the room is quiet`
- `the bell has gone`
- `the classroom is quiet`
- `mr calder says keep typing`
- `emily says please wait`
- `do not turn around`
- `you heard her say no`

Purpose:

- keep the lesson format plausible at first
- let room memory and voice memory leak through
- make the player type sensory evidence rather than just read it

### Act 5

Player-facing feel: correction practice invaded by Emily.

Implemented lesson arc:

- `correct the sentence`
- `bad input must be fixed`
- `this is not a lesson`
- `my name is emily vale`
- `i was kept behind`
- `mr calder locked the door`
- `please do not correct me`
- `please record what happened`

Purpose:

- shift from ordinary correction practice into direct software invasion
- make Emily feel active, interrupted, and resistant to correction
- avoid framing this act as a static formal testimony dump

### Act 6

Player-facing feel: behaviour / correction routine.

Implemented lesson arc:

- `quiet hands make fewer errors`
- `good children finish the exercise`
- `memory makes errors`
- `i kept the lesson running`
- `i corrected the loud parts`
- `i was trying to help you forget`
- `you were so good that day`
- `but you have to type`

Purpose:

- recast Mr Fingers as a coercive tutor routine
- move from discipline language into repression language
- keep ambiguity around whether this is software, teacher logic, or both

### Act 7

Player-facing feel: final typing / correction test.

Current implementation is close to target, but not text-identical. Current lesson arc:

- `final accuracy review`
- `errors must be corrected`
- `records must be completed`
- `emily vale was absent`
- `the classroom was supervised`
- `no distress was reported`
- `the second user heard nothing`
- `the second user kept typing`

Target direction:

- final accuracy test
- correct the record
- emily vale was absent
- the classroom was supervised
- no distress was reported
- the second user heard nothing
- the second user kept typing
- records must be completed

Purpose:

- turn correction/testing language into official denial
- pressure the player toward complicity and record completion

### Act 8

Player-facing feel: final typing test / self-judgement.

Implemented direction:

- uses the runtime-selected final statement from `EndingLogic`
- strips the experience down to the statement, response, and route-specific prose

Purpose:

- make the player's final typing act feel like self-judgement
- preserve route logic based on hidden stats and flags

## Typing Tutor Disguise Layer

Implemented tutor-facing systems include:

- `src/systems/ScoringSystem.js`
- WPM tracking
- accuracy tracking
- grades from `A+` to `F`
- star ratings and Gold Star feedback
- report card generation
- player-facing lesson labels
- player-facing lesson progress such as `Lesson X of 57`
- neutral typing tutor labels instead of visible act names

Player-facing UI should **not** show:

- `ACT 1`
- `ACT 2`
- `STUDENT RECORD`
- `SYSTEM LOG`
- `UNSANCTIONED STATEMENT`
- `PROTECTIVE ROUTINE`
- `CORRECTION EXAM`

Internal act IDs and internal titles may still exist in code and data.

Current player-facing framing should prefer:

- `HOME ROW`
- lesson labels from `playerLabel`
- section names from `playerSection`
- neutral progress and report-card language
- tutor mode stamps such as `PRACTICE`, `DRILL`, `DICTATION`, `REVIEW`, `TEST`, `FINAL TEST`

## UI / Aesthetic Direction

HOME ROW should not visually start as a horror terminal.

Desired progression:

### 1. Early Game

- friendly 1990s typing tutor
- Windows 95 / school lab / edutainment feel
- light grey or cream backgrounds
- blue educational accents
- white or paper-like panels
- dark readable text
- friendly Mr Fingers labels
- neutral response panel hidden or subtle when empty

### 2. Middle Game

- cooler data-entry / system-practice look
- subtle grid or system feeling may begin
- still readable and still plausibly educational

### 3. Later Game

- darker backgrounds
- stronger green / amber / red emphasis
- corruption, flicker, and more prominent response panel
- Mr Fingers becomes more coercive
- Emily breaks the lesson format

### 4. Final Game

- stripped-down final typing test
- minimal UI noise
- self-judgement tone

Milestone status:

- `UI-A` is effectively in place as the current direction: the boot screen and early tutor presentation are friendlier than the original haunted-terminal framing.
- `UI-B` is **not fully implemented across Acts 1-8** and remains the next/current visual milestone: build a full gradient from friendly tutor to corrupted final test across the whole game.

## Mr Fingers Direction

Mr Fingers should not read as a horror watcher from frame one.

Current direction:

- Early: cheesy, friendly typing tutor mascot
- Middle: corrective teacher voice
- Later: coercive authority, possibly echoing Calder's logic
- Final: ambiguous protector / repressor / witness pressure

Keep the ambiguity:

- Do not explicitly confirm Mr Fingers is Mr. Calder.
- He may echo Calder's logic.
- He may be software, repression, a ghost-container, a coercive routine, or some overlap.

## Emily Direction

Emily should feel like a ghost in the machine, not a static document.

Current direction:

- she should feel active and present
- she should fight the lesson and correction format
- Mr Fingers and system language should try to suppress or correct her
- Act 5 should feel like software invasion, not merely witness statement playback

## Gameplay / Agency Direction

The design goal is not open-world freedom. The goal is agency through complicity.

Player agency should come through:

- typing
- hesitation and pausing
- deletion and backspacing
- preserving or correcting loaded phrases
- continuing despite discomfort
- eventually typing the final self-judgement statement

The player should feel that their hands are part of the horror.

## Current Tuning Systems

Implemented / confirmed:

- generic mistake / deletion / pause stat noise is capped per lesson in `IntentEngine`
- story-specific lesson intents remain uncapped unless authored otherwise
- key lessons use pacing beats:
  - `revealDelayMs`
  - `holdMs`
  - `lingerResponse`
- act transitions have longer breathing room
- debug / play mode toggle exists
- stats, flags, event logs, and Memory Match are hidden from normal play and shown only in debug mode
- Memory Match and diagnostics should remain hidden or clearly secondary in player-facing mode

## Current File Structure Notes

Key files:

- `src/systems/ScoringSystem.js` — typing tutor grades, WPM, accuracy, stars, report cards
- `src/systems/EndingLogic.js` — final statement route selection and body prose
- `src/systems/IntentEngine.js` — intent matching and generic stat caps
- `src/scenes/TypingScene.js` — main narrative UI, lesson flow, pacing beats, visual themes, report cards, debug toggle
- `src/data/lessons.act1.json` through `src/data/lessons.act7.json` — lesson data with `playerLabel`, `drillType`, `playerSection`, and pacing fields
- `src/data/lessons.final.json` — runtime-selected final statement placeholder
- `src/data/intents.json` — story and Mr Fingers response triggers

Additional note:

- `src/scenes/TypingTutorScene.js` currently exists as a coded friendly tutor UI mockup / aesthetic prototype for the new early-game presentation. Treat it as a useful reference for the disguise layer and future corruption targets, not as a replacement for the main narrative scene architecture.

## System Notes

### TypingEngine

Tracks:

- assigned text
- typed characters
- correctness
- mistakes
- backspaces
- `previousTyped`
- pauses
- total pause time
- completed lines
- lesson-local WPM source timing

Events emitted:

- `typed`
- `mistake`
- `deleted`
- `pause`
- `line_complete`

### IntentEngine

Handles:

- typed-pattern matching
- deletion-pattern matching using `previousTyped`
- pause thresholds
- once-only intents
- stat effects
- flag effects
- response text
- Mr Fingers state triggers
- generic per-lesson caps for mistake/deletion/pause noise

### LessonManager

Supports:

- current act and lesson tracking
- global lesson count for player-facing progress
- ordered act progression through the internal 1-8 structure

### EndingLogic

Preserve:

- runtime-selected final statement route logic
- route-specific prose
- the connection between hidden stats/flags and final judgement tone

## Do Not Break

Do not:

- restore overt act/chapter labels in player-facing UI
- make the opening dark green/black terminal horror again
- reveal Emily / Calder / absence contradictions too early
- show stats / flags / event log in normal play
- remove the scoring / report card layer
- remove WPM / accuracy / grades / stars
- remove generic intent caps
- remove pacing beats
- remove `previousTyped` deletion handling
- remove final statement route logic
- rewrite `TypingScene` from scratch
- add fake desktop / save / audio before the typing tutor disguise is solid

Preserve:

- typing tutor disguise
- slow-burn reveal
- internal Acts 1-8 progression
- final statement system
- Mr Fingers state system
- Emily ghost-in-machine direction
- debug toggle
- validation-clean JS and JSON

## Next Suggested Milestone

### UI-B: Visual Gradient

Current next milestone:

- make Act 1 friendly
- make Act 2 formal but clean
- make Act 3 transitional
- make Act 4 feel like atmospheric leakage
- make Act 5 visibly corrupted / Emily-invaded
- make Act 6 coercive
- make Act 7 clinical final test
- make Act 8 stripped down

After UI-B, the next pass should be a full playtest + pacing / reachability pass:

- play a complete run
- verify the slow-burn actually lands
- verify endings are still reachable after the restructure
- verify scoring still feels fun rather than ornamental
- check whether lessons are still too long
- check whether the early UI really passes as a typing tutor
- check whether Act 5 feels like Emily is present
- check whether Act 8 feels self-judging

## Agent Workflow Rules

- The canonical active folder is `/Users/jamesmurphy/Desktop/Home Row`.
- The duplicate folder `/Users/jamesmurphy/Desktop/Home Row Codex - OLD DO NOT USE` is archived and must not be edited.
- Always start by running:

```sh
pwd
git status --short --branch
git pull --ff-only
```

- Use the local server from the active folder:

```sh
python3 -m http.server 8123
```

- Test using:

```text
http://127.0.0.1:8123/index.html
```

- Never test from `file://`.
- Never use or edit `homerow-intent-lab-1.html` as the runtime game unless explicitly asked.
- The friendly Win95 typing tutor shell is the canonical runtime UI.
- Preserve these across all acts:
  - coloured bottom buttons: Practice, Repeat, Next, Help, Quit
  - keyboard lower middle
  - left progress panel
  - centre lesson panel
  - right Mr Fingers panel
  - bottom status bar
- Act 5+ terminal degradation should be layered inside the friendly shell, not replace it.
- `DEV TEST INPUT` must not appear in runtime UI.
- Before pushing, run:

```sh
grep -R "DEV TEST INPUT" -n src
node --check src/main.js
node --check src/scenes/TypingScene.js
node --check src/scenes/TypingTutorScene.js
```

- If `grep` returns no matches, that is expected and good.
- If `origin/main` has newer commits, rebase carefully and preserve:
  - upstream story/theme/degradation logic
  - friendly tutor shell
  - no debug/dev-test panels
- Do not blindly choose either local or remote during conflicts.
- Commit small, focused changes with clear messages.
- Push only after checks pass.

Important current commits:

- `26b81fe` Restore friendly typing tutor layout across all acts
- `0f9d6f9` Add local setup notes for active project folder
- `8063196` Ignore macOS desktop metadata
