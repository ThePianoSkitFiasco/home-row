# HOME ROW — Remaining To-Do

> ## ⛔ STOP — DO NOT START NEW FEATURES
>
> **Last session completed:** Phases A–D patch — swear word intents + audio, Act 7 lesson ID rename, EndingLogic route content, act lesson text updates.
> **Repo is clean and pushed (`f8bbf0e`).**
>
> **Next step is PLAYTEST ONLY — Phase 4 (see below).**
> Do not write new code until all ending routes have been manually tested and reported.
> See `DEV_LOG.md` for full session summary.

---

## 1. Current Canon Lock

Locked canon summary:

- HOME ROW existed. This session does not.
- The current play session is a psychological memory reconstruction using the real typing tutor as a safe container.
- Emily Vale survived.
- Emily gave a partial statement and left the second child unnamed.
- The player is the lost witness.
- Mr Fingers is a ferocious repression mechanism built from internalised Calder authority.
- Mr Fingers protects by controlling, correcting, shaming, threatening, and rewarding obedience.
- The best ending is not destroying Mr Fingers but rewriting him.

## 2. Phase 4 — Playtest Ending Route Reachability

This is the next major priority.

### 4.1 Obedience / Complete the Course

Goal:
Verify the obedience route can still be reached.

Test behaviour:
- Type obediently.
- Avoid pauses on truth lines.
- Delete or avoid `not` in `she was not absent` if that is part of current route design.
- Avoid curiosity and refusal behaviour.

Expected route:
Complete the Course / certificate / second child unnamed.

Check:
- obedience reaches threshold.
- witness route does not override it too easily.
- ending feels like obedience, not accidental failure.

### 4.2 Witness / Rewrite the Mascot

Goal:
Verify best ending is reachable.

Test behaviour:
- Complete major truth lines.
- Preserve Emily statement.
- Accept witness-framing lines.
- Do not suppress key evidence.

Expected route:
`HOME ROW: REWRITTEN` / second child named / Mr Fingers altered.

Check:
- `typingPatternMatched` fires.
- `heardHerSayNo` fires.
- `emilyStatementPreserved` fires.
- `witnessAcceptance` reaches threshold.
- final route feels earned.

### 4.3 Destroy the Mascot

Goal:
Verify refusal/destruction route is reachable.

Test behaviour:
- Pause on `do not turn around.`
- Backspace or refuse Act 7 authority lines.
- Choose `DESTROY THE MASCOT`.

Expected route:
Program terminated / buffer removed / second child still unnamed.

Check:
- refusal reaches threshold.
- disclosure reaches threshold.
- route does not accidentally become Rewrite.

### 4.4 Gold Star / Suppression

Goal:
Verify suppression route remains possible.

Test behaviour:
- Delete or correct truth lines aggressively.
- Obey Mr Fingers.
- Avoid witness acceptance.

Expected route:
Gold Star / mask stays on / Emily remains partial.

Check:
- suppression can overtake disclosure.
- route does not feel like a bug.

### 4.5 Incomplete Statement

Goal:
Verify fallback still exists.

Test behaviour:
- Mixed play.
- Moderate truth engagement.
- Avoid strong refusal, obedience, or witness commitment.

Expected route:
Incomplete statement / unresolved ending.

Check:
- fallback is reachable without feeling random.

## 3. Phase 5 — Route Balancing

Only after playtesting.

Tasks:
- Inspect actual stat values at ending.
- Add debug summary if needed.
- Adjust thresholds only if routes are impossible or too easy.
- Do not rebalance by guesswork.
- Preserve witness ending as difficult but fair.
- Preserve obedience route as reachable but emotionally hollow.

Potential files:
- `src/systems/EndingLogic.js`
- `src/data/intents.json`

Risk:
High. Route logic affects the whole game. Make one small threshold change at a time.

## 4. Phase 6 — Visual Degradation Overlay Pass

The UI should remain the Act 1–3 tutor layout throughout. Later horror should be added as overlays and effects, not total UI replacement.

Goals:
- Act 1–3: clean friendly tutor.
- Act 4: tiny flickers, slight wrongness.
- Act 5: dirt, dimming, subtle red and brown marks.
- Act 6: record-stain overlays, darker Mr Fingers panel.
- Act 7: heavier corruption, mascot hostility, controlled flicker.
- Finale: route-specific visual treatment.

Rules:
- Do not return to full green terminal as Act 5 default.
- Do not change layout.
- Use overlays on top of the base UI.
- Keep typing readable.

Possible effects:
- CRT grime layer.
- light desaturation.
- red and brown speckles.
- panel edge darkening.
- keyboard key staining.
- Mr Fingers panel flicker.
- brief text corruption.
- rare scanline jumps.

Legacy terminal mode:
Keep it reserved for rare late-game and system-rupture use or debug, not normal Act 5.

Potential files:
- `src/scenes/TypingScene.js`
- possibly new helper: `src/systems/VisualDegradation.js`

Risk:
Medium. Visual cleanup and toggle bugs are likely. Keep changes small.

## 5. Phase 7 — Mr Fingers Sprite/Animation Integration

Current direction:
Mr Fingers should descend gradually:

1. Tutor Mask
- cheerful, safe, 90s typing tutor

2. Too Attentive
- still smiling, but watchful

3. Correction / Warning
- authoritarian, controlling, stern

4. Mask Slipping
- frightening, angry, coercive

5. Rewrite/Witness State
- altered, less performative, points away from screen

Tasks:
- Finalise sprite filenames.
- Ensure all states are `512x512` transparent PNGs.
- Keep consistent alignment.
- Wire state changes to the existing `mrTrigger` and state system.
- Avoid jitter.
- Preserve `2500ms / 500ms` blink loops where relevant.

Potential files:
- `assets/sprites/mr_fingers/`
- `src/scenes/TypingScene.js`
- any `MrFingersController` file if active

Risk:
Medium. Asset names and state mappings can drift.

## 6. Phase 8 — Teacher Time Expansion / Refinement

Teacher Time should be the main Mr Fingers character arc.

Already improved:
- Act 1–7 dialogue has been strengthened.

Remaining work:
- Confirm Teacher Time actually triggers after intended acts.
- If it only appears after Act 1, wire later acts carefully.
- Keep visuals consistent for now.
- Do not switch variants to terminal or degraded yet.
- Add route-sensitive or performance-sensitive variants only after basic triggers work.

Desired progression:
- After Act 1: friendly mask.
- After Act 2: Emily minimised as data.
- After Act 3: Calder-like rules.
- After Act 4: defensive protection.
- After Act 5: angry that player listened.
- After Act 6: claims he kept player alive and unnamed.
- After Act 7: admits function.
- Before finale: complete / destroy / rewrite choice pressure.

Potential files:
- `src/data/lessons.act*.json`
- `src/scenes/TeacherTimeScene.js`
- `src/scenes/TypingScene.js` only if the hook is missing

Risk:
Medium. Scene flow changes can break pacing.

## 7. Phase 9 — Final Act / Rewrite the Mascot Polish

Goals:
- Make the final choice feel like rewriting, not simply choosing an ending.
- Strengthen the `Rewrite Mr Fingers` route.
- Clarify that destroying the mascot removes the buffer but does not heal.
- Clarify that completing the course leaves the player unnamed.
- Make the best ending land on:
  - `EMILY VALE WAS THERE.`
  - `I WAS THERE.`
  - `WE WERE CHILDREN.`
  - `I KEPT TYPING.`
  - `I AM TYPING NOW.`

Possible additions:
- Route-specific Mr Fingers final sprite.
- Final status card:
  - `HOME ROW: REWRITTEN`
  - `EMILY VALE: RECORDED`
  - `SECOND CHILD: NAMED`
  - `MASCOT STATUS: ALTERED`
  - `LESSON STATUS: CONTINUING`

Potential files:
- `src/data/lessons.final.json`
- `src/systems/EndingLogic.js`
- final scene files if present

Risk:
Medium-high. Ending emotional clarity matters more than extra effects.

## 8. Phase 10 — Audio / Sound Escalation Pass

Current audio exists:
- background music
- typing click
- level clear

Remaining sound design:
- progressively degrade typing click.
- add subtle room tone and computer lab hum.
- introduce distant classroom and door sounds late.
- reduce cheerful music or corrupt it later.
- make the audio-memory act feel different without literal jump scares.

Rules:
- Sound should support memory reconstruction.
- Avoid cheap horror stingers.
- Keep typing feedback satisfying.
- Do not overwhelm player input.

Potential files:
- `src/scenes/TypingScene.js`
- `assets/audio/`

Risk:
Medium. Browser audio restrictions and looping bugs are annoying.

## 9. Phase 11 — Documentation Cleanup

Tasks:
- Keep `HOME_ROW_CONTEXT.md` aligned with the implemented game.
- Maintain this file as the active to-do plan.
- Archive the old proposal if needed.
- Document the current act structure.
- Document Mr Fingers voice rules.
- Document Emily voice rules.
- Document route conditions after playtest.

Potential files:
- `HOME_ROW_CONTEXT.md`
- `HOME_ROW_REMAINING_TODO.md`
- `README.md` if appropriate

Risk:
Low.

## 10. Explicitly Deferred / Do Not Do Yet

- Do not rebalance ending routes before playtesting.
- Do not reintroduce green terminal as default Act 5 mode.
- Do not make Emily ghostly.
- Do not make Mr Fingers gentle or therapeutic.
- Do not change route thresholds by guesswork.
- Do not overhaul `TypingScene` unless necessary.
- Do not add new scenes until current flow is tested.
- Do not rename internal `mrTrigger` labels until sprite and state mapping is stable.
- Do not change Teacher Time visual variant until base triggering is verified.

## 11. Recommended Next Immediate Step

Next task should be:
Phase 4 route playtest and ending reachability report.

Deliverable:
- a table of route conditions.
- actual playtest notes.
- which flags and stats were reached.
- which ending fired.
- whether it felt intentional.
