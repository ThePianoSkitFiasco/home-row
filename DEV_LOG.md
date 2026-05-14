# HOME ROW — Dev Log

---

## 2026-05-14 — Mr Fingers chirp audio

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

**Mr Fingers chirp sound during Teacher Time**
- `mrfingers_chirp.wav` loaded in `TeacherTimeScene.preload()`.
- Plays as a recursive `delayedCall` loop while Mr Fingers' speaking animation is active.
- Each chirp fires at a random interval (110–280ms), with random pitch detune (−200 to +180 cents) and random volume (0.13–0.22). No two hits are the same.
- Loop starts with `_startSpeakingAnimation()` and stops cleanly via `_stopMrFingersChirp()` when: choices appear, reply ends, or scene finishes.
- Calder is unaffected — he already has his own voice sting and the chirp never starts for him.

### Files changed

| File | What changed |
|------|-------------|
| `src/scenes/TeacherTimeScene.js` | `MR_FINGERS_CHIRP_AUDIO` constant, preload, `_chirpActive`/`_chirpTimer` state, `_startMrFingersChirp()`, `_stopMrFingersChirp()`, `_scheduleNextChirp()`, `_playMrFingersChirp()` |

### Checks run

- `node --check` passed on `TeacherTimeScene.js`.
- Committed `c3abde0` and pushed to `origin/main`.

---

## 2026-05-14 — Immediate error feedback mechanics

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

Six new mechanics that respond to player error in real time — not as ending flags, but as immediate atmospheric feedback felt in the moment of playing.

**Camera shake + red flash on every mistake**
Every incorrect keypress triggers a small camera shake (`55ms, 0.0018 intensity`) and a 60ms dark red screen flash. Tactile and immediate — the game flinches when you do.

**Assigned text character glitch (act 4+)**
In act 4 and later, each mistake randomly swaps two characters in the displayed lesson text for 80ms, then restores it. The text briefly looks wrong. Not readable as anything — just wrong for a moment.

**Mr Fingers streak interjections**
Three cold inline responses triggered by consecutive errors (no backspace between them):
- Streak 3: `"Again."` / `"You know this."` / `"That is not the lesson."`
- Streak 5: `"That is not a word."` / `"That is not anything."` / `"Your hands know better than this."`
- Streak 8: `"I am watching your progress."` / `"You will complete the lesson."`

Each threshold fires once per streak. Streak resets to 0 on any correct key or backspace.

**Backspace-to-empty response**
If the player backspaces their entire progress back to an empty field, Mr Fingers responds once per lesson:
`"You cannot erase what you already typed."` / `"The record does not go back."` / `"Backspace does not reach that far."`

**Lesson reset at 15 errors**
If the player accumulates 15 mistakes in a single lesson (nonsense typing, repeated failures, deliberate non-compliance), the lesson hard-resets:
- Response panel: `"Let us begin again."`
- 2.2s pause, then `typingEngine.loadLine()` restarts the lesson from scratch.
- Only fires once per lesson. Error counters reset but `_lessonResetDone` stays true.

### Files changed

| File | What changed |
|------|-------------|
| `src/scenes/TypingScene.js` | State vars `_errorStreak`, `_lessonErrorCount`, `_lessonResetDone`, `_deletionEmptyFired`; onEvent branches for mistake/typed/deleted; new methods `_onMistake()`, `_maybeGlitchAssignedText()`, `_onDeletedToEmpty()`, `_doLessonReset()` |

### Checks run

- `node --check` passed on `TypingScene.js`.
- `grep -R "DEV TEST INPUT"` returned no matches.
- Committed `d358687` and pushed to `origin/main`.

---

## 2026-05-14 — SessionLogScene interlude

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

**`SessionLogScene` — DOS terminal interlude between Acts 3 and 4**
- New Phaser scene, styled identically to HostFoundScene: black/red palette (`#000000` bg, `#cc2200` text, `#661100` dim), typewriter animation at 22ms/char, cursor blink, scanlines, flicker overlay.
- Shows a session log (`SESSION.LOG`) from Room 14B, supervised by CALDER, J.
- Event log includes `14:32:44    WS01    INPUT: REDUCED` — a direct timestamp of the moment the player stopped typing when something happened.
- `NO INCIDENT FLAGGED.` prints with an extra-long pause. The computer logged everything and found nothing worth reporting.
- Triggered after Act 3 completes, before Act 4 begins. Returns to TypingScene via `scene-log-complete` event + `scene.wake()`.
- Header: `HOME ROW  [SESSION ARCHIVE]` / `READ-ONLY  //  LOG ACCESS`.

### Files changed

| File | What changed |
|------|-------------|
| `src/scenes/SessionLogScene.js` | New — DOS terminal session log interlude |
| `src/main.js` | Import + register `SessionLogScene` in scene array |
| `src/scenes/TypingScene.js` | `sessionLogInterludeSeen` flag, `_shouldLaunchSessionLogInterlude()`, `_launchSessionLogInterlude()`, check added to `_advanceToNextAct()` |

### Checks run

- `node --check` passed on `main.js`, `TypingScene.js`, `SessionLogScene.js`.
- `grep -R "DEV TEST INPUT"` returned no matches.
- Committed `449f152` and pushed to `origin/main`.

---

## 2026-05-14 — Active horror mechanics session

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

Three new lesson-level gameplay mechanics that make the horror felt through the hands, not just read on screen.

**`systemErase` — the record deletes itself**
After a truth line completes and holds, the typed text backspaces itself character by character before the screen clears. Implemented by popping `typingEngine.typedChars` on a timer during `holdMs`. Two placements:
- `act4_heard_her_no` ("you heard her say no") — audio memory recovered, record removes it.
- `act6_corrected_loud_parts` ("i did not give them your name") — Emily's protection typed by the player, then redacted.

**`textMorphFlash` — the text briefly shows the suppressed version**
After the assigned text reveals, it flips to an alternate string for ~200ms then snaps back. Visual only, no engine interaction. Two placements:
- `act5_emily_name` ("he said your name") → briefly shows "he said your name out loud". The missing weight.
- `act7_emily_absent` ("good children do not invent stories") → briefly shows "good children do not forget". "Invent" is the lie; the morph shows it.

**`systemAutoType` — the lesson completes itself**
If the player pauses 8 seconds mid-line, the system starts typing the remaining characters at 85ms/char. Any real keypress cancels it and returns control. One placement:
- `act7_errors_corrected` ("you will complete the lesson") — obedience is not optional.

### Files changed

| File | What changed |
|------|-------------|
| `src/data/lessons.act4.json` | `systemErase` on `act4_heard_her_no` |
| `src/data/lessons.act5.json` | `textMorphFlash` on `act5_emily_name` |
| `src/data/lessons.act6.json` | `systemErase` on `act6_corrected_loud_parts` |
| `src/data/lessons.act7.json` | `textMorphFlash` on `act7_emily_absent`, `systemAutoType` on `act7_errors_corrected` |
| `src/scenes/TypingScene.js` | `_doSystemAutoType()`, `_cancelAutoType()`, `systemErase` in `_onLineComplete()`, `textMorphFlash` + `systemAutoType` scheduling in `_startLesson()`, cancel on real keypress in `_handleInputEvent()` |

### Checks run

- `node --check` passed on `TypingScene.js`, `main.js`.
- `grep -R "DEV TEST INPUT"` returned no matches.
- All JSON files validated.
- Committed `317b5ac` and pushed to `origin/main`.

---

## 2026-05-14 — Story improvements session

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

**Calder-bleed seeding (Acts 1–3)**
- Act 1 Teacher Time: reply to "THAT WAS EASY" now ends with `"Eyes on the screen."` — Calder's controlling phrase introduced as cheery tutor advice.
- Act 2 Teacher Time: added `"Eyes on your own screen."` (the word "own" is the tell) and `"Move on."` in the dismissive reply — Calder voice without filter.
- Act 3 Teacher Time: replaced generic rules with `"There was only one active session that day."` and `"Both workstations are on the log."` — the computer remembered everything.
- Act 3 intents: workstation-two response is now `"SECOND USER DETECTED. SESSION: RETAINED."` and teacher override is `"TEACHER OVERRIDE: LOGGED."` — bureaucratic log-entry register.

**Memory stutter (Act 5, Lesson 35)**
- `act5_not_a_lesson` now has `stutterFlash: "your hands remember"` and `stutterFlashMs: 320`.
- When the lesson loads, the screen briefly shows `"your hands remember"` (the Act 1 closing phrase) for 320ms, then snaps to `"..."` and reveals `"your fingers stopped"` as normal.
- Nothing is said. The screen is just briefly wrong.
- Implemented via new `stutterFlash`/`stutterFlashMs` flags in `_startLesson()`.

**Act 5 → Act 6 transition beat**
- Act 5 Teacher Time lines changed to: `"That was not a lesson." / "I do not know where that came from." / "Let us return to the lesson."`
- Act 6 then begins — and it IS a lesson. Emily's sworn testimony, formatted as lesson drills. Mr Fingers' claimed ignorance makes that worse.

**Name field mechanic (Act 6, Lesson 49)**
- `act6_have_to_type` (`"second child: unnamed"`) now has `nameField: true`.
- Before typing starts, the screen shows `"SECOND CHILD: ____"` for 8 seconds.
- Any keypress is rejected: `"INVALID INPUT."` (debounced, 1.6s cooldown).
- After 8 seconds: `"The field remains blank. That is acceptable."` — then the real lesson appears.
- Implemented via new `_doNameFieldMechanic()` in `TypingScene.js`.

**Witness ending silence (FinalWitnessScene)**
- After the player finishes the final correction exercise, the screen goes blank before the ending card.
- Witness route: 4.5 seconds of silence. All other routes: 1.8 seconds.
- The `_showSummary()` method now computes the ending first, checks the route, then delays.

### Files changed

| File | What changed |
|------|-------------|
| `src/data/lessons.act1.json` | Teacher Time: seed "Eyes on the screen." in reply |
| `src/data/lessons.act2.json` | Teacher Time: "Eyes on your own screen." + "Move on." |
| `src/data/lessons.act3.json` | Teacher Time: session log horror lines |
| `src/data/lessons.act5.json` | stutterFlash on lesson 35, Teacher Time transition beat |
| `src/data/lessons.act6.json` | nameField mechanic on lesson 49 |
| `src/data/intents.json` | Act 3 response strings updated to log-entry register |
| `src/scenes/TypingScene.js` | stutterFlash + nameField handling in `_startLesson()`, new `_doNameFieldMechanic()` |
| `src/scenes/FinalWitnessScene.js` | Witness ending silence in `_showSummary()` |

### Checks run

- `node --check` passed on `TypingScene.js`, `FinalWitnessScene.js`, `main.js`.
- `grep -R "DEV TEST INPUT"` returned no matches.
- All JSON files validated.
- Committed `c5e72f7` and pushed to `origin/main`.

---

## 2026-05-14 — Session wrap-up

> **STATUS: STOP. No new features until playtest.**
> Next work should be Phase 4 route playtest only. See `HOME_ROW_REMAINING_TODO.md`.

### What was built this session

**No Signal interlude (`NoSignalScene`)**
- New dedicated Phaser scene inserted before the Host Found MS-DOS terminal.
- Shows `mrfingers_nosignal1.png` fullscreen during the disconnection sound.
- Randomly flashes `mrfingers_nosignal2.png` (the creepy variant) for 80–180ms bursts.
- When sound finishes, transitions into `HostFoundScene`.
- Had to be a separate scene (not a launched parallel scene) because Phaser `scene.launch()` does not reliably run `preload()`.

**Host Found terminal redesign**
- Stripped all no-signal code from `HostFoundScene` — it now owns only the MS-DOS text sequence.
- Color scheme changed from blue to black and red.
- Layout fixed: header bar (32px), separator lines, text area, footer prompt — no more overlap.
- Removed decorative inner panel boxes. Clean terminal aesthetic.

**Mr Calder sprite animation**
- Replaced static Calder sprite with timed pose cycling (idle ↔ cry ↔ pointText depending on mood).
- Random POV interject (`pointPov`) fires every 10–18 seconds during neutral/corrective moods.
- Four moods: `neutral`, `corrective`, `hostile`, `witness`.

**Self-talk / internal fracture thread**
- 5 new intent entries added to `intents.json`.
- Teacher Time reply arrays extended in acts 3, 4, 6, 7 with internal-voice fragments.

**Boot scene dev skip**
- `?dev=1` in URL now auto-skips the boot screen after 50ms (no keypress required).

**OverlayManager scaffold**
- `src/systems/OverlayManager.js` created.
- `src/data/overlays/dev_test_overlay.json` created as starter recipe.

### Files changed

| File | What changed |
|------|-------------|
| `src/scenes/NoSignalScene.js` | New — test card interlude scene |
| `src/scenes/HostFoundScene.js` | Black/red terminal redesign, nosignal code removed |
| `src/scenes/TypingScene.js` | Launches NoSignalScene, Calder animation, self-talk intents |
| `src/scenes/BootScene.js` | Auto-skip with `?dev=1` |
| `src/main.js` | NoSignalScene registered in scene array |
| `src/data/intents.json` | 5 new intent entries, 3 extended responses |
| `src/data/lessons.act*.json` | Teacher Time reply extensions (acts 3, 4, 6, 7) |
| `src/systems/OverlayManager.js` | New — overlay scaffold |
| `src/data/overlays/dev_test_overlay.json` | New — starter overlay recipe |

### Checks run

- `node --check` passed on `main.js`, `TypingScene.js`, `HostFoundScene.js`, `NoSignalScene.js`.
- `grep -R "DEV TEST INPUT"` returned no matches.
- Game tested via `http://127.0.0.1:8123/index.html?dev=1&act=act6_protective_routine`.

---

_Previous sessions: see git log._
