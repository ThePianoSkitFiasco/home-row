// Visual prototype/reference only. The real authored runtime lives in TypingScene.
const PALETTE = {
  background: 0xf4e6bd,
  panel: 0xfff7df,
  panelShadow: 0xd2c29d,
  titleBlue: 0x245fa8,
  titleBlueDark: 0x123f72,
  border: 0x7f765f,
  text: '#202838',
  textMuted: '#4c5872',
  softBlueLine: 0xb4c9ea,
  keyFace: 0xf7efd9,
  keyShadow: 0xc1b38f,
  keyActive: 0xf5d85a,
  keyHome: 0xf2cf3a,
  green: 0x55a85f,
  redOrange: 0xb94a3b,
  purple: 0x8b65b8,
  gold: 0xe1bb34,
  sky: 0x71b4e6,
  footer: '#1c4c92',
  footerCreep: '#4a4d56'
};

const PROMPTS = [
  'A lad asks Sal to add a sash.',
  'Dad asks all lads.',
  'Sal adds a salad.',
  'A sad lad falls.'
];

const LESSONS = [
  { id: '01', label: 'Getting Started', state: 'done' },
  { id: '02', label: 'Keyboard Tour', state: 'done' },
  { id: '03', label: 'Home Keys', state: 'current' },
  { id: '04', label: 'E and I', state: 'locked' },
  { id: '05', label: 'Review', state: 'locked' }
];

const KEY_LAYOUT = [
  [
    { label: '`', w: 44, value: '`' },
    { label: '1', w: 48, value: '1' },
    { label: '2', w: 48, value: '2' },
    { label: '3', w: 48, value: '3' },
    { label: '4', w: 48, value: '4' },
    { label: '5', w: 48, value: '5' },
    { label: '6', w: 48, value: '6' },
    { label: '7', w: 48, value: '7' },
    { label: '8', w: 48, value: '8' },
    { label: '9', w: 48, value: '9' },
    { label: '0', w: 48, value: '0' },
    { label: '-', w: 42, value: '-' },
    { label: '=', w: 42, value: '=' },
    { label: 'Bksp', w: 102, value: 'backspace', sm: true }
  ],
  [
    { label: 'Tab', w: 64, value: 'tab', sm: true },
    { label: 'Q', w: 46, value: 'q' },
    { label: 'W', w: 46, value: 'w' },
    { label: 'E', w: 46, value: 'e' },
    { label: 'R', w: 46, value: 'r' },
    { label: 'T', w: 46, value: 't' },
    { label: 'Y', w: 46, value: 'y' },
    { label: 'U', w: 46, value: 'u' },
    { label: 'I', w: 46, value: 'i' },
    { label: 'O', w: 46, value: 'o' },
    { label: 'P', w: 46, value: 'p' },
    { label: '[', w: 42, value: '[' },
    { label: ']', w: 42, value: ']' },
    { label: '\\', w: 60, value: '\\' }
  ],
  [
    { label: 'Caps', w: 78, value: 'caps', sm: true },
    { label: 'A', w: 46, value: 'a' },
    { label: 'S', w: 46, value: 's' },
    { label: 'D', w: 46, value: 'd' },
    { label: 'F', w: 46, value: 'f' },
    { label: 'G', w: 46, value: 'g' },
    { label: 'H', w: 46, value: 'h' },
    { label: 'J', w: 46, value: 'j' },
    { label: 'K', w: 46, value: 'k' },
    { label: 'L', w: 46, value: 'l' },
    { label: ';', w: 46, value: ';' },
    { label: "'", w: 42, value: "'" },
    { label: 'Enter', w: 96, value: 'enter', sm: true }
  ],
  [
    { label: 'Shift', w: 108, value: 'shift', sm: true },
    { label: 'Z', w: 46, value: 'z' },
    { label: 'X', w: 46, value: 'x' },
    { label: 'C', w: 46, value: 'c' },
    { label: 'V', w: 46, value: 'v' },
    { label: 'B', w: 46, value: 'b' },
    { label: 'N', w: 46, value: 'n' },
    { label: 'M', w: 46, value: 'm' },
    { label: ',', w: 46, value: ',' },
    { label: '.', w: 46, value: '.' },
    { label: '/', w: 46, value: '/' },
    { label: 'Shift', w: 128, value: 'shift', sm: true }
  ],
  [
    { label: 'Ctrl', w: 64, value: 'ctrl', sm: true },
    { label: 'Win', w: 48, value: 'win', sm: true },
    { label: 'Alt', w: 56, value: 'alt', sm: true },
    { label: '', w: 340, value: ' ' },
    { label: 'Alt', w: 56, value: 'alt', sm: true },
    { label: 'Win', w: 48, value: 'win', sm: true },
    { label: 'Ctrl', w: 64, value: 'ctrl', sm: true }
  ]
];

const HOME_ROW_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);

const SIDE_X = 8, SIDE_W = 186;
const MAIN_X = 200, MAIN_W = 528;
const MASC_X = 734, MASC_W = 282;
const COL_Y = 42, COL_H = 384;
const KB_Y = 432, KB_H = 198;
const BTN_Y = 636, BTN_H = 46;
const FOOT_Y = 690, FOOT_H = 22;
const KEY_H = 34, KEY_GAP = 4, ROW_STEP = KEY_H + KEY_GAP;

function padTime(v) { return String(v).padStart(2, '0'); }

function formatClock(sec) {
  return `${padTime(Math.floor(sec / 3600))}:${padTime(Math.floor((sec % 3600) / 60))}:${padTime(Math.floor(sec % 60))}`;
}

function normalizeKey(key) {
  if (!key) return null;
  if (key === ' ') return ' ';
  if (key.length === 1) return key.toLowerCase();
  const map = { backspace: 'backspace', tab: 'tab', capslock: 'caps', enter: 'enter', shift: 'shift', control: 'ctrl', alt: 'alt', meta: 'win' };
  return map[key.toLowerCase()] || null;
}

export default class TypingTutorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingTutorScene' });
  }

  create() {
    this.promptIndex = 0;
    this.typedText = '';
    this.activeKeyValue = null;
    this.sessionStartTime = this.time.now;
    this.totalTypedChars = 0;
    this.keyboardKeys = new Map();
    this.buttons = [];
    this.promptChars = [];

    this.cameras.main.setBackgroundColor(PALETTE.background);

    this.createTitleBar();
    this.createSidebar();
    this.createLessonArea();
    this.createMascotPanel();
    this.createKeyboard();
    this.createButtons();
    this.createFooter();

    this.refreshPrompt();
    this.updateAccuracy();
    this.updateTimer();
    this.updateKeyboardHighlights();

    this.input.keyboard.on('keydown', (e) => this.handleKeyDown(e));
    this.input.keyboard.on('keyup', () => {
      this.activeKeyValue = null;
      this.updateKeyboardHighlights();
    });

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updateTimer() });
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      if (this.inputCursor) this.inputCursor.visible = !this.inputCursor.visible;
    }});
  }

  // ── Panel / Button / Key primitives ──────────────────

  createPanel(x, y, w, h, opts = {}) {
    const fill = opts.fill ?? PALETTE.panel;
    const stroke = opts.stroke ?? PALETTE.border;
    const shadow = opts.shadow !== false;

    if (shadow) {
      this.add.rectangle(x + w / 2 + 3, y + h / 2 + 3, w, h, PALETTE.panelShadow).setOrigin(0.5);
    }
    return this.add.rectangle(x + w / 2, y + h / 2, w, h, fill).setStrokeStyle(2, stroke).setOrigin(0.5);
  }

  createButton(x, y, w, h, cfg) {
    this.add.rectangle(x + w / 2 + 3, y + h / 2 + 3, w, h, 0x6d634d).setAlpha(0.3);
    const body = this.add.rectangle(x + w / 2, y + h / 2, w, h, cfg.color)
      .setStrokeStyle(2, PALETTE.border).setInteractive({ useHandCursor: true });
    const shine = this.add.rectangle(x + w / 2, y + 5, w - 8, 2, 0xffffff).setAlpha(0.4);
    const label = this.add.text(x + w / 2, y + h / 2, cfg.label, {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '15px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    body.on('pointerdown', () => {
      body.y += 2; label.y += 2; shine.y += 2;
      cfg.handler();
    });
    body.on('pointerup', () => { body.y -= 2; label.y -= 2; shine.y -= 2; });
    body.on('pointerout', () => {
      body.y = y + h / 2; label.y = y + h / 2; shine.y = y + 5;
    });
    return { body, label };
  }

  createKey(x, y, w, h, def) {
    this.add.rectangle(x + w / 2 + 2, y + h / 2 + 2, w, h, PALETTE.keyShadow).setOrigin(0.5);
    const face = this.add.rectangle(x + w / 2, y + h / 2, w, h, PALETTE.keyFace)
      .setStrokeStyle(1, PALETTE.border).setOrigin(0.5);
    const fontSize = def.sm ? '12px' : '18px';
    const label = this.add.text(x + w / 2, y + h / 2, def.label, {
      fontFamily: 'Verdana, sans-serif', fontSize, color: PALETTE.text
    }).setOrigin(0.5);
    const entry = { face, label, value: def.value };
    this.keyboardKeys.set(def.value, entry);
    return entry;
  }

  // ── Title bar ────────────────────────────────────────

  createTitleBar() {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.titleBlueDark, 1);
    g.fillRect(0, 0, 1024, 36);
    g.fillStyle(PALETTE.titleBlue, 1);
    g.fillRect(0, 0, 1024, 32);
    g.fillStyle(0x5f8fd1, 1);
    g.fillRect(4, 4, 1016, 2);

    this.add.text(40, 8, 'HOME ROW — Typing Tutor for Kids!', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px', fontStyle: 'bold', color: '#fff7c4'
    });
    this.add.text(12, 6, '✋', { fontSize: '20px' });

    ['_', '□', '×'].forEach((lbl, i) => {
      const bx = 952 + i * 26;
      this.createPanel(bx, 6, 22, 22, { fill: 0xf8eecb, shadow: false });
      this.add.text(bx + 11, 7, lbl, {
        fontFamily: 'Verdana, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#1e2430'
      }).setOrigin(0.5, 0);
    });
  }

  // ── Sidebar ──────────────────────────────────────────

  createSidebar() {
    const x = SIDE_X, y = COL_Y, w = SIDE_W;
    this.createPanel(x, y, w, COL_H);

    let cy = y + 10;
    this.add.text(x + w / 2, cy, 'My Progress', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px', fontStyle: 'bold', color: '#234d96'
    }).setOrigin(0.5, 0);
    cy += 28;

    this.createPanel(x + 8, cy, w - 16, 170, { fill: 0xfcf5de, shadow: false });
    const sp = x + 8;

    this.add.text(sp + 14, cy + 8, 'WPM', this.labelStyle());
    this.wpmText = this.add.text(sp + 14, cy + 26, '0', this.valueStyle('#2f8d47'));
    this.add.rectangle(x + w / 2, cy + 56, w - 32, 1, 0xd4cab1);

    this.add.text(sp + 14, cy + 64, 'Accuracy', this.labelStyle());
    this.accuracyText = this.add.text(sp + 14, cy + 82, '100%', this.valueStyle('#264fbc'));
    this.add.rectangle(x + w / 2, cy + 112, w - 32, 1, 0xd4cab1);

    this.add.text(sp + 14, cy + 120, 'Stars', this.labelStyle());
    this.starsText = this.add.text(sp + 14, cy + 138, '★★☆', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '28px', color: '#f1bf25'
    });
    cy += 178;

    this.createPanel(x + 8, cy, w - 16, 70, { fill: 0xfcf5de, shadow: false });
    this.add.text(x + w / 2, cy + 6, 'Lesson Progress', this.labelStyle()).setOrigin(0.5, 0);
    this.progressBarBack = this.add.rectangle(x + w / 2, cy + 36, w - 40, 14, 0xf1e9d0)
      .setStrokeStyle(1, 0xb2a684);
    this.progressBarFill = this.add.rectangle(x + 20, cy + 36, 0, 14, 0x74bf4c)
      .setOrigin(0, 0.5);
    this.progressBarFill.setDepth(this.progressBarBack.depth + 1);
    this.progressBarMaxW = w - 40;
    this.progressLabel = this.add.text(x + w / 2, cy + 50, '0 / 4', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: PALETTE.text
    }).setOrigin(0.5, 0);
    cy += 78;

    this.createPanel(x + 8, cy, w - 16, 114, { fill: 0xfcf5de, shadow: false });
    this.add.text(x + w / 2, cy + 6, 'Lessons', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#2d58aa'
    }).setOrigin(0.5, 0);

    this.lessonLabels = [];
    LESSONS.forEach((lesson, i) => {
      const ry = cy + 28 + i * 17;
      const cur = lesson.state === 'current';
      if (cur) {
        this.add.rectangle(x + w / 2, ry + 7, w - 24, 16, PALETTE.titleBlue);
      }
      const txt = this.add.text(x + 16, ry, `${lesson.id}  ${lesson.label}`, {
        fontFamily: 'Verdana, sans-serif', fontSize: '11px',
        color: cur ? '#ffffff' : '#22252e'
      });
      const mark = lesson.state === 'done' ? '✓' : cur ? '▸' : '—';
      this.add.text(x + w - 18, ry, mark, {
        fontFamily: 'Verdana, sans-serif', fontSize: '12px',
        color: lesson.state === 'done' ? '#299b3b' : cur ? '#ffe07a' : '#999'
      }).setOrigin(0.5, 0);
      this.lessonLabels.push(txt);
    });
  }

  // ── Lesson area ──────────────────────────────────────

  createLessonArea() {
    const x = MAIN_X, y = COL_Y, w = MAIN_W;
    this.createPanel(x, y, w, COL_H);

    let cy = y + 10;
    this.createPanel(x + 10, cy, w - 20, 44, { fill: PALETTE.titleBlue, stroke: PALETTE.titleBlueDark, shadow: false });
    this.add.text(x + 24, cy + 6, '★', { fontSize: '26px', color: '#f2cb2f' });
    this.add.text(x + w - 24, cy + 6, '★', { fontSize: '26px', color: '#f2cb2f' }).setOrigin(1, 0);
    this.lessonTitleText = this.add.text(x + w / 2, cy + 10, 'Lesson 03: Home Keys', {
      fontFamily: 'Comic Sans MS, Trebuchet MS, sans-serif',
      fontSize: '22px', fontStyle: 'bold', color: '#fff7c4'
    }).setOrigin(0.5, 0);
    cy += 54;

    this.createPanel(x + 10, cy, w - 20, 36, { fill: 0xfcf5de, shadow: false });
    this.add.text(x + 22, cy + 7, '🔊', { fontSize: '18px' });
    this.instructionText = this.add.text(x + 48, cy + 9, 'Place your fingers on A S D F and J K L ;.', {
      fontFamily: 'Verdana, sans-serif', fontSize: '14px', color: PALETTE.text
    });
    cy += 46;

    this.add.text(x + 16, cy, 'Type the sentence:', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', fontStyle: 'bold', color: PALETTE.textMuted
    });
    cy += 18;

    this.createPanel(x + 10, cy, w - 20, 72, { fill: 0xfcf8ee, shadow: false });
    const lineG = this.add.graphics();
    lineG.lineStyle(1, PALETTE.softBlueLine, 0.5);
    lineG.lineBetween(x + 20, cy + 36, x + w - 20, cy + 36);
    lineG.lineBetween(x + 20, cy + 60, x + w - 20, cy + 60);

    this.promptBaseX = x + 22;
    this.promptBaseY = cy + 10;
    cy += 82;

    this.add.text(x + 16, cy, 'Your typing:', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', fontStyle: 'bold', color: PALETTE.textMuted
    });
    cy += 18;

    this.createPanel(x + 10, cy, w - 20, 38, { fill: 0xfffbf0, shadow: false });
    this.typedInputText = this.add.text(x + 20, cy + 8, '', {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: '#1c2840'
    });
    this.inputCursor = this.add.text(x + 20, cy + 8, '|', {
      fontFamily: 'Courier New, monospace', fontSize: '20px', color: '#2b5fa8'
    });
    cy += 48;

    this.statusText = this.add.text(x + 16, cy, 'Follow the prompt and type carefully.', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: PALETTE.textMuted
    });
  }

  // ── Mascot panel ─────────────────────────────────────

  createMascotPanel() {
    const x = MASC_X, y = COL_Y, w = MASC_W;
    this.createPanel(x, y, w, COL_H, { fill: 0xfff7df });

    let cy = y + 10;
    this.createPanel(x + 12, cy, w - 24, 32, { fill: PALETTE.titleBlue, stroke: PALETTE.titleBlueDark, shadow: false });
    this.mascotNameplate = this.add.text(x + w / 2, cy + 6, 'Mr. Fingers', {
      fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5, 0);
    cy += 42;

    this.createPanel(x + 16, cy, w - 32, 200, { fill: 0xfff4d8, shadow: false });
    const cx = x + w / 2;
    const faceY = cy + 30;

    this.add.text(cx, cy + 6, 'Mascot Placeholder', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#8a6f42', align: 'center'
    }).setOrigin(0.5, 0);

    const face = this.add.graphics();
    face.fillStyle(0xf2d0a4, 1);
    face.lineStyle(2, 0x7f765f, 1);
    face.fillRoundedRect(cx - 44, faceY, 88, 76, 24);
    face.strokeRoundedRect(cx - 44, faceY, 88, 76, 24);
    face.fillStyle(0x2e2f32, 1);
    face.fillCircle(cx - 14, faceY + 32, 4);
    face.fillCircle(cx + 14, faceY + 32, 4);
    face.lineStyle(3, 0x9d693f, 1);
    face.strokePoints([
      new Phaser.Geom.Point(cx - 16, faceY + 54),
      new Phaser.Geom.Point(cx, faceY + 62),
      new Phaser.Geom.Point(cx + 16, faceY + 54)
    ], false, false);

    const fingerG = this.add.graphics();
    fingerG.fillStyle(0xf2d0a4, 0.9);
    [-20, -10, 0, 10, 20].forEach(dx => {
      fingerG.fillRoundedRect(cx + dx - 4, faceY + 72, 8, 24, 3);
    });

    cy += 160;
    this.createPanel(x + 20, cy, w - 40, 36, { fill: 0xf8f0d4, shadow: false });
    this.mascotStatusText = this.add.text(cx, cy + 8, 'Keep your hands on home row!', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: '#3f4e6b',
      align: 'center', wordWrap: { width: w - 60 }
    }).setOrigin(0.5, 0);

    cy += 46;
    this.mascotTip = this.add.text(cx, cy, 'TIP: Left hand on A S D F\nRight hand on J K L ;', {
      fontFamily: 'Verdana, sans-serif', fontSize: '11px', color: '#7a7262',
      align: 'center', lineSpacing: 2
    }).setOrigin(0.5, 0);
  }

  // ── Keyboard ─────────────────────────────────────────

  createKeyboard() {
    const kbX = 8, kbW = 1008;
    this.createPanel(kbX, KB_Y, kbW, KB_H, { fill: 0xe5dcc6 });

    const center = kbX + kbW / 2;
    let rowY = KB_Y + 8;

    KEY_LAYOUT.forEach(row => {
      let rowW = 0;
      row.forEach(k => { rowW += k.w + KEY_GAP; });
      rowW -= KEY_GAP;

      let kx = center - rowW / 2;
      row.forEach(def => {
        this.createKey(kx, rowY, def.w, KEY_H, def);
        kx += def.w + KEY_GAP;
      });
      rowY += ROW_STEP;
    });
  }

  // ── Buttons ──────────────────────────────────────────

  createButtons() {
    const btnW = 108, gap = 12;
    const defs = [
      { label: 'Practice', color: PALETTE.green, handler: () => this.setFooterMessage('Keep practicing the home keys.') },
      { label: 'Repeat', color: PALETTE.sky, handler: () => this.repeatPrompt() },
      { label: 'Next', color: PALETTE.gold, handler: () => this.nextPrompt(true) },
      { label: 'Help', color: PALETTE.purple, handler: () => this.setFooterMessage('Rest your fingers on A S D F and J K L ;.') },
      { label: 'Quit', color: PALETTE.redOrange, handler: () => this.setFooterMessage('Please finish the lesson before quitting.') }
    ];
    const totalW = defs.length * btnW + (defs.length - 1) * gap;
    let bx = (1024 - totalW) / 2;
    defs.forEach(d => {
      const btn = this.createButton(bx, BTN_Y, btnW, BTN_H, d);
      this.buttons.push(btn);
      bx += btnW + gap;
    });
  }

  // ── Footer ───────────────────────────────────────────

  createFooter() {
    const g = this.add.graphics();
    g.fillStyle(0xe0d8c4, 1);
    g.fillRect(0, FOOT_Y, 1024, FOOT_H);
    g.lineStyle(1, PALETTE.border, 0.3);
    g.lineBetween(0, FOOT_Y, 1024, FOOT_Y);

    this.footerLeftText = this.add.text(12, FOOT_Y + 4, 'WELCOME BACK!', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: PALETTE.footer
    });
    this.footerCenterText = this.add.text(512, FOOT_Y + 4, 'Good children finish the exercise.', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: PALETTE.footerCreep
    }).setOrigin(0.5, 0);
    this.footerRightText = this.add.text(1012, FOOT_Y + 4, 'Time: 00:00:00', {
      fontFamily: 'Verdana, sans-serif', fontSize: '12px', color: PALETTE.footer
    }).setOrigin(1, 0);
  }

  // ── Prompt management ────────────────────────────────

  refreshPrompt() {
    this.promptChars.forEach(c => c.destroy());
    this.promptChars = [];

    const prompt = this.getCurrentPrompt();
    const charW = 15.6;

    for (let i = 0; i < prompt.length; i++) {
      const ch = this.add.text(this.promptBaseX + i * charW, this.promptBaseY, prompt[i], {
        fontFamily: 'Courier New, monospace', fontSize: '24px', fontStyle: 'bold', color: '#888888'
      });
      this.promptChars.push(ch);
    }

    this.typedText = '';
    this.renderTypedInput();
    this.updatePromptColors();
    this.updateLessonProgress();
    this.updateAccuracy();
  }

  updatePromptColors() {
    const prompt = this.getCurrentPrompt();
    for (let i = 0; i < this.promptChars.length; i++) {
      if (i < this.typedText.length) {
        const correct = this.typedText[i] === prompt[i];
        this.promptChars[i].setColor(correct ? '#2d7a3a' : '#b94a3b');
      } else if (i === this.typedText.length) {
        this.promptChars[i].setColor('#245fa8');
      } else {
        this.promptChars[i].setColor('#555555');
      }
    }
  }

  renderTypedInput() {
    this.typedInputText.setText(this.typedText);
    this.inputCursor.x = this.typedInputText.x + this.typedInputText.width + 2;
  }

  getCurrentPrompt() {
    return PROMPTS[this.promptIndex];
  }

  // ── Keyboard input ───────────────────────────────────

  handleKeyDown(event) {
    this.activeKeyValue = normalizeKey(event.key);
    this.updateKeyboardHighlights();

    if (event.key === 'Backspace') {
      this.typedText = this.typedText.slice(0, -1);
      this.renderTypedInput();
      this.updatePromptColors();
      this.updateAccuracy();
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab' || event.key === 'Escape') return;
    if (event.key.length !== 1) return;

    const idx = this.typedText.length;
    if (idx >= this.getCurrentPrompt().length) return;

    this.typedText += event.key;
    this.totalTypedChars++;
    this.renderTypedInput();
    this.updatePromptColors();
    this.updateAccuracy();

    if (this.typedText.length >= this.getCurrentPrompt().length) {
      this.onPromptComplete();
    }
  }

  onPromptComplete() {
    const perfect = this.typedText === this.getCurrentPrompt();
    this.statusText.setText(perfect ? 'Perfect! Great job!' : 'Good effort! Moving on...');
    this.mascotStatusText.setText(perfect ? 'Wonderful typing!' : 'Practice makes perfect!');

    this.time.delayedCall(1200, () => {
      this.nextPrompt(false);
    });
  }

  nextPrompt(fromButton) {
    if (this.promptIndex < PROMPTS.length - 1) {
      this.promptIndex++;
      this.statusText.setText(fromButton ? 'Skipping ahead.' : 'Next sentence ready.');
      this.refreshPrompt();
      return;
    }

    this.promptIndex = 0;
    this.statusText.setText(fromButton ? 'Restarting lesson.' : 'Lesson complete! Well done!');
    this.starsText.setText('★★★');
    this.mascotStatusText.setText('Wonderful work, typist!');
    this.setFooterMessage('Lesson complete. You may continue.');
    this.refreshPrompt();
  }

  repeatPrompt() {
    this.typedText = '';
    this.renderTypedInput();
    this.updatePromptColors();
    this.updateAccuracy();
    this.statusText.setText('Repeating the current sentence.');
    this.mascotStatusText.setText('Let us try that line once more.');
  }

  // ── Stats ────────────────────────────────────────────

  updateAccuracy() {
    const prompt = this.getCurrentPrompt();
    if (!this.typedText.length) {
      this.accuracyText.setText('100%');
      this.wpmText.setText('0');
      return;
    }

    let correct = 0;
    for (let i = 0; i < this.typedText.length; i++) {
      if (this.typedText[i] === prompt[i]) correct++;
    }
    const acc = Math.round((correct / this.typedText.length) * 100);
    this.accuracyText.setText(`${acc}%`);

    const elapsed = Math.max((this.time.now - this.sessionStartTime) / 60000, 1 / 60);
    this.wpmText.setText(String(Math.max(0, Math.round((this.totalTypedChars / 5) / elapsed))));

    if (acc === 100 && this.typedText.length > 0) {
      this.mascotStatusText.setText('Perfect! Keep going!');
    } else if (acc >= 80) {
      this.mascotStatusText.setText('Nice work. Stay steady.');
    } else {
      this.mascotStatusText.setText('Try the home keys again.');
    }
  }

  updateLessonProgress() {
    const frac = this.promptIndex / PROMPTS.length;
    this.progressBarFill.width = Math.round(frac * this.progressBarMaxW);
    this.progressLabel.setText(`${this.promptIndex} / ${PROMPTS.length}`);
  }

  updateKeyboardHighlights() {
    this.keyboardKeys.forEach((kv, val) => {
      let color = PALETTE.keyFace;
      if (HOME_ROW_KEYS.has(val)) color = PALETTE.keyHome;
      if (this.activeKeyValue && val === this.activeKeyValue) color = PALETTE.keyActive;
      if (val === ' ' && this.activeKeyValue === ' ') color = PALETTE.keyActive;
      kv.face.fillColor = color;
    });
  }

  updateTimer() {
    const sec = Math.floor((this.time.now - this.sessionStartTime) / 1000);
    this.footerRightText.setText(`Time: ${formatClock(sec)}`);
  }

  setFooterMessage(msg) {
    this.footerCenterText.setText(msg);
  }

  // ── Style helpers ────────────────────────────────────

  labelStyle() {
    return { fontFamily: 'Verdana, sans-serif', fontSize: '14px', fontStyle: 'bold', color: PALETTE.text };
  }

  valueStyle(color) {
    return { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '24px', fontStyle: 'bold', color };
  }
}
