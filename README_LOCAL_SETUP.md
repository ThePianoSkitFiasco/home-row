# HOME ROW Local Setup

This is the active HOME ROW project folder.

Always work from:

```sh
/Users/jamesmurphy/Desktop/Home Row
```

Run locally with:

```sh
python3 -m http.server 8123
```

Open:

```text
http://127.0.0.1:8123/index.html
```

## Dev Test URLs

Start the local server from the project root:

```bash
python3 -m http.server 8123
```

Normal start:

```text
http://127.0.0.1:8123/index.html
```

Jump to the final witness statement:

```text
http://127.0.0.1:8123/index.html?dev=1&act=final_statement
```

Jump to Act 7:

```text
http://127.0.0.1:8123/index.html?dev=1&act=act7
```

Jump to a specific lesson by lesson id:

```text
http://127.0.0.1:8123/index.html?dev=1&lesson=LESSON_ID
```

Do not use:

```sh
/Users/jamesmurphy/Desktop/Home Row Codex - OLD DO NOT USE
```

Current stable commit: `26b81fe`

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
