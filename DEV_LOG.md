# HOME ROW — Dev Log

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
