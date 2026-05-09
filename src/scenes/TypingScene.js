import TypingEngine from '../systems/TypingEngine.js';
import IntentEngine from '../systems/IntentEngine.js';
import MemoryState from '../systems/MemoryState.js';
import LessonManager from '../systems/LessonManager.js';
import MrFingersController from '../systems/MrFingersController.js';
import EventLog from '../systems/EventLog.js';
import { getFinalStatement } from '../systems/EndingLogic.js';
import ScoringSystem from '../systems/ScoringSystem.js';

const COLORS = {
  bg: '#1a1a2e',
  panel: '#0a0a1a',
  border: '#334455',
  textGreen: '#00ff88',
  textDim: '#336644',
  textCorrect: '#00ff88',
  textWrong: '#ff3355',
  textCursor: '#00ff88',
  textWhite: '#ccddcc',
  textYellow: '#ffcc00',
  textGold: '#ffaa00',
  mrFingers: '#55ffaa',
  response: '#ff8844',
  statLabel: '#668877',
  statValue: '#00ff88'
};

const COLORS_LIGHT = {
  bg: '#d4d0c8',
  panel: '#ffffff',
  border: '#808080',
  textCorrect: '#006600',
  textWrong: '#cc0000',
  textCursor: '#003399',
  textWhite: '#000000',
  mrFingers: '#003399',
  response: '#cc0000',
  statLabel: '#333333',
  statValue: '#003399'
};

const MR_STATE_COLORS = {
  idle: COLORS.mrFingers,
  encourage: COLORS.mrFingers,
  mistake_notice: '#ffaa44',
  corrective_smile: '#ffcc00',
  glitch_warning: '#ff6644',
  angry: '#ff3333',
  emily_bleedthrough: '#ff44ff',
  protector: '#4488ff',
  witness: '#ffffff'
};

const GLITCH_COLORS = ['#ff0044', '#ff3300', '#cc00ff', '#ffffff', '#ffff00'];
const MR_FINGERS_SPRITE_PATH = 'assets/sprites/mr_fingers/';
const SHOW_DEV_TOUCH_CONTROLS = true;
const TUTOR_PALETTE = {
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
  footerBlue: '#1c4c92',
  footerMuted: '#4a4d56'
};
const KEY_LAYOUT = [
  [
    { label: '`', w: 28, value: '`' },
    { label: '1', w: 30, value: '1' },
    { label: '2', w: 30, value: '2' },
    { label: '3', w: 30, value: '3' },
    { label: '4', w: 30, value: '4' },
    { label: '5', w: 30, value: '5' },
    { label: '6', w: 30, value: '6' },
    { label: '7', w: 30, value: '7' },
    { label: '8', w: 30, value: '8' },
    { label: '9', w: 30, value: '9' },
    { label: '0', w: 30, value: '0' },
    { label: '-', w: 28, value: '-' },
    { label: '=', w: 28, value: '=' },
    { label: 'Bksp', w: 64, value: 'backspace', sm: true }
  ],
  [
    { label: 'Tab', w: 44, value: 'tab', sm: true },
    { label: 'Q', w: 29, value: 'q' },
    { label: 'W', w: 29, value: 'w' },
    { label: 'E', w: 29, value: 'e' },
    { label: 'R', w: 29, value: 'r' },
    { label: 'T', w: 29, value: 't' },
    { label: 'Y', w: 29, value: 'y' },
    { label: 'U', w: 29, value: 'u' },
    { label: 'I', w: 29, value: 'i' },
    { label: 'O', w: 29, value: 'o' },
    { label: 'P', w: 29, value: 'p' },
    { label: '[', w: 28, value: '[' },
    { label: ']', w: 28, value: ']' },
    { label: '\\', w: 44, value: '\\' }
  ],
  [
    { label: 'Caps', w: 54, value: 'caps', sm: true },
    { label: 'A', w: 29, value: 'a' },
    { label: 'S', w: 29, value: 's' },
    { label: 'D', w: 29, value: 'd' },
    { label: 'F', w: 29, value: 'f' },
    { label: 'G', w: 29, value: 'g' },
    { label: 'H', w: 29, value: 'h' },
    { label: 'J', w: 29, value: 'j' },
    { label: 'K', w: 29, value: 'k' },
    { label: 'L', w: 29, value: 'l' },
    { label: ';', w: 29, value: ';' },
    { label: "'", w: 28, value: "'" },
    { label: 'Enter', w: 60, value: 'enter', sm: true }
  ],
  [
    { label: 'Shift', w: 70, value: 'shift', sm: true },
    { label: 'Z', w: 29, value: 'z' },
    { label: 'X', w: 29, value: 'x' },
    { label: 'C', w: 29, value: 'c' },
    { label: 'V', w: 29, value: 'v' },
    { label: 'B', w: 29, value: 'b' },
    { label: 'N', w: 29, value: 'n' },
    { label: 'M', w: 29, value: 'm' },
    { label: ',', w: 29, value: ',' },
    { label: '.', w: 29, value: '.' },
    { label: '/', w: 29, value: '/' },
    { label: 'Shift', w: 83, value: 'shift', sm: true }
  ],
  [
    { label: 'Ctrl', w: 44, value: 'ctrl', sm: true },
    { label: 'Win', w: 36, value: 'win', sm: true },
    { label: 'Alt', w: 40, value: 'alt', sm: true },
    { label: '', w: 202, value: ' ' },
    { label: 'Alt', w: 40, value: 'alt', sm: true },
    { label: 'Win', w: 36, value: 'win', sm: true },
    { label: 'Ctrl', w: 44, value: 'ctrl', sm: true }
  ]
];
const HOME_ROW_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);

const ACT_THEMES = {
  act1_home_row: {
    primary: '#003399',
    accent: '#000080',
    warning: '#cc6600',
    panelLabel: 'TYPE:',
    modeStamp: 'PRACTICE',
    bg: '#d4d0c8',
    gridAlpha: 0,
    overlayAlpha: 0,
    light: true,
    panelBg: '#ffffff',
    panelBorder: '#808080',
    textCorrect: '#006600',
    textWrong: '#cc0000',
    textCursor: '#003399',
    assignedColor: '#000000',
    statsColor: '#333333',
    mrColor: '#003399',
    responseColor: '#cc3300',
    responseBorder: '#999999'
  },
  act2_student_record: {
    primary: '#224488',
    accent: '#335599',
    warning: '#cc6600',
    panelLabel: 'TYPE:',
    modeStamp: 'PRACTICE',
    bg: '#c8ccd0',
    gridAlpha: 0,
    overlayAlpha: 0,
    light: true,
    panelBg: '#f0f0f0',
    panelBorder: '#888888',
    textCorrect: '#006600',
    textWrong: '#cc0000',
    textCursor: '#224488',
    assignedColor: '#111111',
    statsColor: '#444444',
    mrColor: '#224488',
    responseColor: '#cc3300',
    responseBorder: '#aaaaaa'
  },
  act3_system_log: {
    primary: '#336644',
    accent: '#557755',
    warning: '#bb6600',
    panelLabel: 'TYPE:',
    modeStamp: 'DRILL',
    bg: '#b8beb8',
    gridAlpha: 0.04,
    overlayAlpha: 0.02,
    light: true,
    panelBg: '#e8eee8',
    panelBorder: '#778877',
    textCorrect: '#006600',
    textWrong: '#cc0000',
    textCursor: '#336644',
    assignedColor: '#1a1a1a',
    statsColor: '#445544',
    mrColor: '#336644',
    responseColor: '#994400',
    responseBorder: '#889988'
  },
  act4_dictation_mode: {
    primary: '#558855',
    accent: '#aa8844',
    warning: '#cc4466',
    panelLabel: 'TYPE:',
    modeStamp: 'DICTATION',
    bg: '#4a4a40',
    gridAlpha: 0.06,
    overlayAlpha: 0.03,
    panelBg: '#2a2a24',
    panelBorder: '#5a5a4a',
    textCorrect: '#66bb66',
    textWrong: '#dd4444',
    textCursor: '#88aa66',
    assignedColor: '#ccccaa',
    statsColor: '#999977',
    mrColor: '#88aa66',
    responseColor: '#dd8844',
    responseBorder: '#665544'
  },
  act5_unsanctioned_statement: {
    primary: '#aaddbb',
    accent: '#dd88bb',
    warning: '#ee3355',
    panelLabel: 'TYPE:',
    modeStamp: 'PRACTICE',
    bg: '#2a2030',
    gridAlpha: 0.07,
    overlayAlpha: 0.04,
    panelBg: '#1a1520',
    panelBorder: '#554466',
    textCorrect: '#88ddaa',
    textWrong: '#ff4466',
    textCursor: '#aaddbb',
    assignedColor: '#ddccdd',
    statsColor: '#887799',
    mrColor: '#88bbaa',
    responseColor: '#ff6688',
    responseBorder: '#664455'
  },
  act6_protective_routine: {
    primary: '#aacc55',
    accent: '#ccbb44',
    warning: '#ee5533',
    panelLabel: 'TYPE:',
    modeStamp: 'REVIEW',
    bg: '#1e1e14',
    gridAlpha: 0.08,
    overlayAlpha: 0.04,
    panelBg: '#141410',
    panelBorder: '#4a4a30',
    textCorrect: '#99cc44',
    textWrong: '#ff4433',
    textCursor: '#aacc55',
    assignedColor: '#cccc99',
    statsColor: '#888866',
    mrColor: '#aacc55',
    responseColor: '#ee7733',
    responseBorder: '#554422'
  },
  act7_correction_exam: {
    primary: '#dddddd',
    accent: '#ee5555',
    warning: '#ff2222',
    panelLabel: 'TYPE:',
    modeStamp: 'TEST',
    bg: '#1a1414',
    gridAlpha: 0.04,
    overlayAlpha: 0.02,
    panelBg: '#0e0a0a',
    panelBorder: '#553333',
    textCorrect: '#cccccc',
    textWrong: '#ff3333',
    textCursor: '#dddddd',
    assignedColor: '#eeeeee',
    statsColor: '#888888',
    mrColor: '#aaaaaa',
    responseColor: '#ff4444',
    responseBorder: '#663333'
  },
  final_statement: {
    primary: '#cccccc',
    accent: '#999999',
    warning: '#884444',
    panelLabel: 'TYPE:',
    modeStamp: 'FINAL TEST',
    bg: '#0e0e0e',
    gridAlpha: 0,
    overlayAlpha: 0,
    panelBg: '#080808',
    panelBorder: '#333333',
    textCorrect: '#aaaaaa',
    textWrong: '#884444',
    textCursor: '#cccccc',
    assignedColor: '#cccccc',
    statsColor: '#666666',
    mrColor: '#888888',
    responseColor: '#aa6666',
    responseBorder: '#444444'
  }
};

const DEFAULT_ACT_THEME = ACT_THEMES.act1_home_row;

function hexToNumber(hex) {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

function normalizeKey(key) {
  if (!key) return null;
  if (key === ' ') return ' ';
  if (key.length === 1) return key.toLowerCase();
  const map = {
    backspace: 'backspace',
    tab: 'tab',
    capslock: 'caps',
    enter: 'enter',
    shift: 'shift',
    control: 'ctrl',
    alt: 'alt',
    meta: 'win'
  };
  return map[key.toLowerCase()] || null;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default class TypingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingScene' });
  }

  preload() {
    this.missingMrFingersSprites = new Set();
    const mrFingersForPreload = new MrFingersController();
    const spriteKeys = new Set(mrFingersForPreload.getStates().map(state => state.spriteKey));

    this.load.on('loaderror', (file) => {
      if (file && spriteKeys.has(file.key)) {
        this.missingMrFingersSprites.add(file.key);
      }
    });

    for (const spriteKey of spriteKeys) {
      this.load.image(spriteKey, `${MR_FINGERS_SPRITE_PATH}${spriteKey}.png`);
    }

    this.load.json('lessons_act1', 'src/data/lessons.act1.json');
    this.load.json('lessons_act2', 'src/data/lessons.act2.json');
    this.load.json('lessons_act3', 'src/data/lessons.act3.json');
    this.load.json('lessons_act4', 'src/data/lessons.act4.json');
    this.load.json('lessons_act5', 'src/data/lessons.act5.json');
    this.load.json('lessons_act6', 'src/data/lessons.act6.json');
    this.load.json('lessons_act7', 'src/data/lessons.act7.json');
    this.load.json('lessons_final', 'src/data/lessons.final.json');
    this.load.json('intents', 'src/data/intents.json');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.memory = new MemoryState();
    this.mrFingers = new MrFingersController();
    this.typingEngine = new TypingEngine();
    this.intentEngine = new IntentEngine(this.memory, this.mrFingers);
    this.lessonManager = new LessonManager();
    this.eventLog = new EventLog(10);

    this.lessonManager.loadActs([
      this.cache.json.get('lessons_act1'),
      this.cache.json.get('lessons_act2'),
      this.cache.json.get('lessons_act3'),
      this.cache.json.get('lessons_act4'),
      this.cache.json.get('lessons_act5'),
      this.cache.json.get('lessons_act6'),
      this.cache.json.get('lessons_act7'),
      this.cache.json.get('lessons_final')
    ]);
    this.intentEngine.loadIntents(this.cache.json.get('intents'));

    this.responseQueue = [];
    this.responseTimer = null;
    this.actComplete = false;
    this.cursorVisible = true;
    this._disclosureShaken = {};
    this.finalEnding = null;
    this.debugVisible = false;
    this.inputLocked = false;
    this.activeKeyValue = null;
    this.keyboardKeys = new Map();
    this.typedRichText = [];
    this.sessionStartTime = Date.now();
    this.pendingContinueHandler = null;
    this.continueEnabled = false;

    this._buildUI();
    this._wireEvents();
    this._updateMrFingersVisual(this.mrFingers.getState(), this.mrFingers.getLabel(), this.mrFingers.getStateConfig());
    this._startLesson();
    this._setupAtmosphere();
    this._setDebugVisible(this.debugVisible);

    this.time.addEvent({
      delay: 530,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this._renderTypedText();
      }
    });
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this._updateFooterClock()
    });
  }

  // --- UI CONSTRUCTION ---

  _createPanel(x, y, w, h, opts = {}) {
    const fill = opts.fill ?? TUTOR_PALETTE.panel;
    const stroke = opts.stroke ?? TUTOR_PALETTE.border;
    const shadow = opts.shadow !== false;

    if (shadow) {
      this.add.rectangle(x + w / 2 + 3, y + h / 2 + 3, w, h, TUTOR_PALETTE.panelShadow).setOrigin(0.5);
    }

    return this.add.rectangle(x + w / 2, y + h / 2, w, h, fill)
      .setStrokeStyle(opts.lineWidth ?? 2, stroke)
      .setOrigin(0.5);
  }

  _createKeyboardKey(x, y, w, h, def) {
    this.add.rectangle(x + w / 2 + 2, y + h / 2 + 2, w, h, TUTOR_PALETTE.keyShadow).setOrigin(0.5);
    const face = this.add.rectangle(x + w / 2, y + h / 2, w, h, TUTOR_PALETTE.keyFace)
      .setStrokeStyle(1, TUTOR_PALETTE.border)
      .setOrigin(0.5);
    const label = this.add.text(x + w / 2, y + h / 2, def.label, {
      fontFamily: 'Verdana, sans-serif',
      fontSize: def.sm ? '10px' : '14px',
      color: TUTOR_PALETTE.text
    }).setOrigin(0.5);
    this.keyboardKeys.set(def.value, { face, label });
  }

  _buildUI() {
    const W = 1024;
    const sideX = 8;
    const sideW = 186;
    const mainX = 202;
    const mainW = 524;
    const mascotX = 734;
    const mascotW = 282;
    const topY = 42;
    const columnH = 386;

    this.add.rectangle(512, 384, 1024, 768, TUTOR_PALETTE.background).setDepth(-5);

    this.themeGridLines = [];
    for (let y = 56; y < 680; y += 30) {
      const line = this.add.rectangle(512, y, W - 70, 1, TUTOR_PALETTE.softBlueLine)
        .setOrigin(0.5, 0)
        .setAlpha(0.06)
        .setDepth(-3);
      this.themeGridLines.push(line);
    }

    this.themeOverlay = this.add.rectangle(512, 384, W, 768, TUTOR_PALETTE.titleBlue)
      .setAlpha(0.02)
      .setDepth(-4);

    this.titleBarShadow = this.add.rectangle(512, 18, W - 6, 32, TUTOR_PALETTE.titleBlueDark)
      .setAlpha(0.35)
      .setOrigin(0.5, 0)
      .setDepth(-2);
    this.titleBar = this.add.rectangle(512, 0, W, 32, TUTOR_PALETTE.titleBlue)
      .setOrigin(0.5, 0)
      .setDepth(-1);
    this.titleBarHighlight = this.add.rectangle(512, 4, W - 8, 2, 0x5f8fd1).setOrigin(0.5, 0);

    this.titleText = this.add.text(40, 8, 'HOME ROW — Friendly Typing Tutor', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fff7c4'
    });

    this.lessonTitle = this.add.text(512, 42, '', {
      fontFamily: 'Comic Sans MS, Trebuchet MS, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#234d96'
    }).setOrigin(0.5, 0);

    this.modeStampText = this.add.text(984, 42, 'PRACTICE', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#325fa2'
    }).setOrigin(1, 0);

    ['_', '□', '×'].forEach((label, index) => {
      const bx = 952 + index * 24;
      this._createPanel(bx, 6, 20, 20, { fill: 0xf8eecb, shadow: false, lineWidth: 1 });
      this.add.text(bx + 10, 7, label, {
        fontFamily: 'Verdana, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#1e2430'
      }).setOrigin(0.5, 0);
    });

    this.statsPanel = this._createPanel(sideX, topY, sideW, columnH);
    this.add.text(sideX + sideW / 2, topY + 10, 'Progress Report', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#234d96'
    }).setOrigin(0.5, 0);

    this._createPanel(sideX + 8, topY + 42, sideW - 16, 168, { fill: 0xfcf5de, shadow: false, lineWidth: 1 });
    this.add.text(sideX + 20, topY + 52, 'WPM', this._labelStyle());
    this.wpmValueText = this.add.text(sideX + 20, topY + 72, '0', this._valueStyle('#2f8d47'));
    this.add.text(sideX + 20, topY + 108, 'Accuracy', this._labelStyle());
    this.accuracyValueText = this.add.text(sideX + 20, topY + 128, '100%', this._valueStyle('#264fbc'));
    this.add.text(sideX + 20, topY + 164, 'Grade', this._labelStyle());
    this.gradeValueText = this.add.text(sideX + 20, topY + 184, 'A+', this._valueStyle('#8b65b8'));

    this._createPanel(sideX + 8, topY + 218, sideW - 16, 72, { fill: 0xfcf5de, shadow: false, lineWidth: 1 });
    this.add.text(sideX + sideW / 2, topY + 226, 'Stars', this._labelStyle()).setOrigin(0.5, 0);
    this.starsValueText = this.add.text(sideX + sideW / 2, topY + 248, '★★★', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '28px',
      color: '#f1bf25'
    }).setOrigin(0.5, 0);

    this._createPanel(sideX + 8, topY + 298, sideW - 16, 82, { fill: 0xfcf5de, shadow: false, lineWidth: 1 });
    this.add.text(sideX + sideW / 2, topY + 306, 'Lesson Progress', this._labelStyle()).setOrigin(0.5, 0);
    this.progressBarBack = this.add.rectangle(sideX + sideW / 2, topY + 336, sideW - 40, 14, 0xf1e9d0)
      .setStrokeStyle(1, 0xb2a684);
    this.progressBarFill = this.add.rectangle(sideX + 20, topY + 336, 0, 14, 0x74bf4c).setOrigin(0, 0.5);
    this.progressBarMaxW = sideW - 40;
    this.progressText = this.add.text(sideX + sideW / 2, topY + 350, '', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: TUTOR_PALETTE.text
    }).setOrigin(0.5, 0);
    this.reportCommentText = this.add.text(sideX + 18, topY + 366, 'Keep your hands on home row.', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '11px',
      color: TUTOR_PALETTE.textMuted,
      wordWrap: { width: sideW - 36 }
    });

    this.lessonPanel = this._createPanel(mainX, topY, mainW, columnH);
    this.lessonHeader = this._createPanel(mainX + 10, topY + 10, mainW - 20, 44, {
      fill: TUTOR_PALETTE.titleBlue,
      stroke: TUTOR_PALETTE.titleBlueDark,
      shadow: false,
      lineWidth: 1
    });
    this.add.text(mainX + 24, topY + 16, '★', { fontSize: '24px', color: '#f2cb2f' });
    this.add.text(mainX + mainW - 24, topY + 16, '★', { fontSize: '24px', color: '#f2cb2f' }).setOrigin(1, 0);
    this.sectionText = this.add.text(mainX + mainW / 2, topY + 19, '', {
      fontFamily: 'Comic Sans MS, Trebuchet MS, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#fff7c4'
    }).setOrigin(0.5, 0);

    this.instructionPanel = this._createPanel(mainX + 10, topY + 64, mainW - 20, 36, {
      fill: 0xfcf5de,
      shadow: false,
      lineWidth: 1
    });
    this.instructionText = this.add.text(mainX + 20, topY + 74, '', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '14px',
      color: TUTOR_PALETTE.text
    });

    this.add.text(mainX + 16, topY + 112, 'Type the sentence:', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: TUTOR_PALETTE.textMuted
    });
    this.assignedPanel = this._createPanel(mainX + 10, topY + 130, mainW - 20, 84, {
      fill: 0xfcf8ee,
      shadow: false,
      lineWidth: 1
    });
    this.assignedLabel = this.add.text(mainX + 22, topY + 140, 'Target Text', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#325fa2'
    });
    this.assignedText = this.add.text(mainX + 22, topY + 166, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: '#1f2a3f',
      wordWrap: { width: mainW - 52 }
    });

    this.add.text(mainX + 16, topY + 226, 'Your typing:', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: TUTOR_PALETTE.textMuted
    });
    this.typedPanel = this._createPanel(mainX + 10, topY + 244, mainW - 20, 66, {
      fill: 0xfffbf0,
      shadow: false,
      lineWidth: 1
    });
    this.inputLabel = this.add.text(mainX + 22, topY + 254, 'Student Input', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#325fa2'
    });
    this.typedBaseX = mainX + 22;
    this.typedBaseY = topY + 278;
    this.typedTextDisplay = this.add.text(this.typedBaseX, this.typedBaseY, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: '#1f2a3f'
    });

    this.responsePanel = this._createPanel(mainX + 10, topY + 320, mainW - 20, 56, {
      fill: 0xfff3d9,
      shadow: false,
      lineWidth: 1
    }).setAlpha(0);
    this.responseText = this.add.text(mainX + mainW / 2, topY + 337, '', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '18px',
      color: '#b94a3b',
      wordWrap: { width: mainW - 50 },
      align: 'center'
    }).setOrigin(0.5, 0);

    this.mrFingersPanel = this._createPanel(mascotX, topY, mascotW, columnH, { fill: 0xfff7df });
    this._createPanel(mascotX + 12, topY + 10, mascotW - 24, 32, {
      fill: TUTOR_PALETTE.titleBlue,
      stroke: TUTOR_PALETTE.titleBlueDark,
      shadow: false,
      lineWidth: 1
    });
    this.add.text(mascotX + mascotW / 2, topY + 16, 'Mr. Fingers', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this._createPanel(mascotX + 16, topY + 50, mascotW - 32, 192, {
      fill: 0xfff4d8,
      shadow: false,
      lineWidth: 1
    });
    this.mrPortraitCenterX = mascotX + mascotW / 2;
    this.mrPortraitCenterY = topY + 146;
    this.mrFingersPortraitFrame = this.add.rectangle(this.mrPortraitCenterX, this.mrPortraitCenterY, 120, 116, 0xf6dfb4)
      .setStrokeStyle(2, 0x7f765f);
    this.mrFingersSprite = null;
    this.mrFingersFallbackText = this.add.text(this.mrPortraitCenterX, this.mrPortraitCenterY - 18, 'MR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: '#325fa2',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.mrFingersText = this.add.text(mascotX + mascotW / 2, topY + 255, this.mrFingers.getLabel(), {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '15px',
      color: '#3f4e6b',
      wordWrap: { width: mascotW - 56 },
      align: 'center'
    }).setOrigin(0.5, 0);
    this.mascotTipText = this.add.text(mascotX + mascotW / 2, topY + 302, 'TIP: Rest your fingers on A S D F and J K L ;', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: '#7a7262',
      wordWrap: { width: mascotW - 48 },
      align: 'center'
    }).setOrigin(0.5, 0);
    this.statusText = this.add.text(mascotX + mascotW / 2, topY + 342, 'Follow the prompt and type carefully.', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: '#4c5872',
      wordWrap: { width: mascotW - 48 },
      align: 'center'
    }).setOrigin(0.5, 0);

    this.keyboardPanel = this._createPanel(8, 442, 1008, 168, { fill: 0xe5dcc6 });
    this.add.text(22, 450, 'Finger Guide', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#234d96'
    });
    let rowY = 476;
    KEY_LAYOUT.forEach((row) => {
      let rowWidth = 0;
      row.forEach((key) => { rowWidth += key.w + 4; });
      rowWidth -= 4;
      let x = 512 - rowWidth / 2;
      row.forEach((def) => {
        this._createKeyboardKey(x, rowY, def.w, 22, def);
        x += def.w + 4;
      });
      rowY += 26;
    });

    this.debugPanel = this._createPanel(8, 614, 1008, 72, { fill: 0xf3eddc, shadow: false });
    this.debugDivider = this.add.rectangle(30, 624, 964, 1, 0xb9b29f).setOrigin(0, 0.5);
    this.debugLabel = this.add.text(20, 630, '[ HIDDEN MEMORY STATE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#333355'
    });
    this.debugStats = this.add.text(20, 646, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: COLORS.statValue,
      wordWrap: { width: 500 }
    });
    this.eventDivider = this.add.rectangle(516, 624, 1, 50, 0xb9b29f).setOrigin(0.5, 0);
    this.eventLogLabel = this.add.text(536, 630, '[ EVENT LOG ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#333355'
    });
    this.eventLogTexts = [];
    for (let i = 0; i < 3; i++) {
      const t = this.add.text(536, 646 + i * 12, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#556677'
      });
      this.eventLogTexts.push(t);
    }

    this.footerBar = this.add.rectangle(512, 690, 1024, 22, 0xe0d8c4).setOrigin(0.5, 0);
    this.footerTopLine = this.add.rectangle(512, 690, 1024, 1, 0xb8ad93).setOrigin(0.5, 0);
    this.statsText = this.add.text(12, 694, 'WELCOME BACK!', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: TUTOR_PALETTE.footerBlue
    });
    this.footerHintText = this.add.text(512, 694, 'Good typing grows with practice.', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: TUTOR_PALETTE.footerMuted
    }).setOrigin(0.5, 0);
    this.footerClockText = this.add.text(1012, 694, 'Time: 00:00:00', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      color: TUTOR_PALETTE.footerBlue
    }).setOrigin(1, 0);

    if (SHOW_DEV_TOUCH_CONTROLS) {
      this._buildDevTouchControls();
    }

    // Completion overlay (hidden initially)
    this.completionBg = this.add.rectangle(512, 360, 760, 500, 0x0a0a1a)
      .setStrokeStyle(2, 0x00ff88)
      .setAlpha(0)
      .setDepth(10);
    this.completionText = this.add.text(512, 145, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.textGreen,
      align: 'center',
      wordWrap: { width: 690 }
    }).setOrigin(0.5, 0).setAlpha(0).setDepth(11);
  }

  // --- EVENT WIRING ---

  _wireEvents() {
    this.typingEngine.onEvent = (eventType, data) => {
      const lesson = this.lessonManager.getCurrentLesson();
      if (!lesson) return;

      const firedIntents = this.intentEngine.processEvent(eventType, data, lesson.id);

      let completionIntents = [];
      if (eventType === 'line_complete') {
        completionIntents = this.intentEngine.processEvent('lesson_complete', data, lesson.id);
      }

      if (eventType === 'line_complete') {
        this.eventLog.logTypingEvent('lesson_complete', data, [...firedIntents, ...completionIntents]);
      } else {
        this.eventLog.logTypingEvent(eventType, data, firedIntents);
      }

      this._renderTypedText();
      this._updateStats();
      this._updateDebug();
      this._updateEventLog();
      this._checkAtmosphereEscalation();

      if (eventType === 'line_complete') {
        this._onLineComplete();
      }
    };

    this.mrFingers.onStateChange = (state, label, config) => {
      this._updateMrFingersVisual(state, label, config);
    };

    this.intentEngine.onResponse = (text, trigger) => {
      if (!text) return;
      this.responseQueue.push(text);
      this._showNextResponse();
    };

    this.input.keyboard.on('keydown', (event) => this._handleInputEvent(event));

    this.input.keyboard.on('keyup', () => {
      this.activeKeyValue = null;
      this._updateKeyboardHighlights();
    });
  }

  // --- LESSON MANAGEMENT ---

  _startLesson() {
    const lesson = this.lessonManager.getCurrentLesson();
    if (!lesson) return;
    this._clearContinueHandler();

    this.intentEngine.resetLessonCaps();

    const act = this.lessonManager.getCurrentAct();
    const theme = this._getThemeForAct(act);
    let assignedText = lesson.assignedText;

    if (act && act.actId === 'final_statement') {
      this.finalEnding = this.finalEnding || getFinalStatement(this.memory);
      assignedText = this.finalEnding.statement;
    }

    this._applyActTheme(theme);
    this.titleText.setText('HOME ROW — Friendly Typing Tutor');
    this.lessonTitle.setText(lesson.playerLabel || lesson.displayTitle);
    this.sectionText.setText(act.playerSection || 'Typing Practice');
    this.instructionText.setText(this._getInstructionText(lesson));
    this.mascotTipText.setText(this._getTipText(lesson));
    this.statusText.setText('Follow the prompt and type carefully.');
    this.typingEngine.loadLine(assignedText);
    this.typedTextDisplay.setText('');
    this._renderTypedText();
    this._updateStats();
    this._updateDebug();

    if (lesson.revealDelayMs) {
      this.inputLocked = true;
      this.assignedText.setText('...');
      this.time.delayedCall(lesson.revealDelayMs, () => {
        this.assignedText.setText(assignedText);
        this._flickerOnReveal();
        this.inputLocked = false;
      });
    } else {
      this.assignedText.setText(assignedText);
    }
  }

  _onLineComplete() {
    const lesson = this.lessonManager.getCurrentLesson();
    const holdMs = (lesson && lesson.holdMs) || 1500;

    this.inputLocked = true;

    if (lesson && lesson.lingerResponse) {
      if (this.responseTimer) {
        this.responseTimer.remove(false);
        this.responseTimer = null;
      }
      this.tweens.killTweensOf(this.responseText);
      this.responseText.setAlpha(1);
    }

    this.time.delayedCall(holdMs, () => {
      this.inputLocked = false;

      if (lesson && lesson.lingerResponse) {
        this.tweens.add({
          targets: this.responseText,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            this.responseTimer = null;
            this._updateResponsePanelVisibility();
            this._showNextResponse();
          }
        });
      }

      const next = this.lessonManager.advance();
      if (next) {
        this._startLesson();
        this.mrFingers.setState('idle');
      } else {
        this._showActComplete();
      }
    });
  }

  _showActComplete() {
    this.actComplete = true;
    const stats = this.typingEngine.getStats();
    const snap = this.memory.getSnapshot();
    const actNum = this.lessonManager.getActNumber();
    const hasNextAct = actNum < this.lessonManager.getTotalActs();
    const act = this.lessonManager.getCurrentAct();
    const isFinalStatement = act && act.actId === 'final_statement';
    const overlayTheme = hasNextAct
      ? this._getThemeForAct(this.lessonManager.acts[actNum])
      : this._getThemeForAct(act);

    let lines;

    if (isFinalStatement) {
      lines = this._buildFinalEndingLines(stats, snap);
    } else {
      const report = ScoringSystem.formatReportCard(stats);
      lines = [...report.lines];
    }

    if (!isFinalStatement && hasNextAct) {
      const transitionLines = this._getActTransitionLines(actNum + 1);
      lines.push(
        '',
        ...transitionLines,
        '',
        '[ Press any key to continue ]'
      );
    } else if (!isFinalStatement) {
      if (this.debugVisible) {
        const statLines = Object.entries(snap.stats)
          .map(([k, v]) => `${k}: ${v}`);
        const flagLines = Object.entries(snap.flags)
          .map(([k, v]) => `${k}: ${v}`);
        lines.push(
          '',
          'FINAL STATS',
          ...statLines,
          `typingAccuracy: ${stats.accuracy}%`,
          `typingCorrect: ${stats.correct}`,
          `typingMistakes: ${stats.mistakes}`,
          `typingBackspaces: ${stats.backspaces}`,
          `typingPauseMs: ${stats.pauseTime}`,
          `typingLinesCompleted: ${stats.completedLines}`,
          '',
          'FINAL FLAGS',
          ...flagLines
        );
      }
      lines.push('', 'You may close this program.');
    }

    this._applyCompletionTheme(overlayTheme);
    this.completionBg.setAlpha(1);
    this.completionText.setText(lines.join('\n')).setAlpha(1);

    if (hasNextAct) {
      this.time.delayedCall(3000, () => {
        this._armContinueHandler(() => {
          this.completionBg.setAlpha(0);
          this.completionText.setAlpha(0);
          this.lessonManager.advanceAct();
          this.actComplete = false;
          this._clearContinueHandler();
          this._startLesson();
          this.mrFingers.setState('idle');
        });
      });
    }
  }

  _buildFinalEndingLines(stats, snap) {
    const ending = this.finalEnding || getFinalStatement(this.memory);

    const lines = [
      `=== ${ending.title} ===`,
      '',
      `FINAL STATEMENT`,
      ending.statement,
      '',
      ending.response,
      '',
      ending.body
    ];

    if (this.debugVisible) {
      lines.push('', `Memory Match: ${Math.min(99, 31 + snap.stats.disclosure * 4)}%`);
      const statLines = Object.entries(snap.stats)
        .map(([k, v]) => `${k}: ${v}`);
      const flagLines = Object.entries(snap.flags)
        .map(([k, v]) => `${k}: ${v}`);
      lines.push(
        '',
        '[ diagnostics ]',
        `routeId: ${ending.routeId}`,
        `stats: ${statLines.join(' | ')}`,
        `typing: accuracy ${stats.accuracy}% | correct ${stats.correct} | mistakes ${stats.mistakes} | backspaces ${stats.backspaces} | pauseMs ${stats.pauseTime} | lines ${stats.completedLines}`,
        '',
        '[ flags ]',
        ...flagLines
      );
    }

    lines.push('', 'You may close this program.');
    return lines;
  }

  _getActTransitionLines(nextActNumber) {
    const nextAct = this.lessonManager.acts[nextActNumber - 1];
    const section = nextAct && nextAct.playerSection;

    if (section) {
      return [
        `Next section: ${section}`,
        'Loading exercises...'
      ];
    }

    return [
      'Loading next lesson...',
      'Keep your hands on home row.'
    ];
  }

  _getThemeForAct(act) {
    if (!act) return DEFAULT_ACT_THEME;
    return ACT_THEMES[act.actId] || DEFAULT_ACT_THEME;
  }

  _applyActTheme(theme) {
    this.currentTheme = theme;
    const primary = hexToNumber(theme.primary);
    const accent = hexToNumber(theme.accent);
    const warning = hexToNumber(theme.warning);
    const panelBg = theme.panelBg ? hexToNumber(theme.panelBg) : hexToNumber(COLORS.panel);
    const panelBorder = theme.panelBorder ? hexToNumber(theme.panelBorder) : primary;
    const responseBorder = theme.responseBorder ? hexToNumber(theme.responseBorder) : warning;

    this.cameras.main.setBackgroundColor(theme.bg);
    this.themeOverlay.setFillStyle(primary).setAlpha(theme.overlayAlpha);

    this.themeGridLines.forEach((line, index) => {
      const useAccent = index % 4 === 0;
      line
        .setFillStyle(useAccent ? accent : primary)
        .setAlpha(useAccent ? theme.gridAlpha * 0.75 : theme.gridAlpha);
    });

    this.debugDivider.setFillStyle(accent).setAlpha(0.35);
    this.eventDivider.setFillStyle(accent).setAlpha(0.35);

    [
      this.statsPanel,
      this.lessonPanel,
      this.mrFingersPanel,
      this.keyboardPanel,
      this.debugPanel,
      this.assignedPanel,
      this.typedPanel,
      this.responsePanel
    ].forEach(panel => {
      panel.setFillStyle(panelBg);
      panel.setStrokeStyle(1, panelBorder);
    });
    this.responsePanel.setStrokeStyle(1, responseBorder);
    this.lessonHeader.setFillStyle(primary);
    this.lessonHeader.setStrokeStyle(1, accent);
    this.instructionPanel.setFillStyle(theme.light ? 0xfcf5de : panelBg).setStrokeStyle(1, panelBorder);
    this.titleBar.setFillStyle(primary);
    this.titleBarShadow.setFillStyle(accent);
    this.footerBar.setFillStyle(theme.light ? 0xe0d8c4 : panelBg);
    this.footerTopLine.setFillStyle(panelBorder);

    this.titleText.setColor(theme.light ? '#fff7c4' : '#ffffff');
    this.lessonTitle.setColor(theme.light ? '#234d96' : theme.primary);
    this.modeStampText.setText(theme.modeStamp).setColor(theme.light ? '#325fa2' : theme.accent);
    this.sectionText.setColor(theme.light ? '#fff7c4' : '#ffffff');
    this.assignedLabel.setText('Target Text').setColor(theme.light ? '#325fa2' : theme.accent);
    this.inputLabel.setColor(theme.light ? '#325fa2' : theme.accent);
    this.assignedText.setColor(theme.assignedColor || theme.accent);
    this.instructionText.setColor(theme.light ? TUTOR_PALETTE.text : theme.assignedColor || theme.primary);
    this.responseText.setColor(theme.responseColor || theme.warning);
    this.statsText.setColor(theme.statsColor || theme.accent);
    this.progressText.setColor(theme.light ? TUTOR_PALETTE.text : theme.assignedColor || theme.primary);
    this.debugStats.setColor(theme.primary);
    this.reportCommentText.setColor(theme.light ? TUTOR_PALETTE.textMuted : theme.assignedColor || theme.primary);
    this.footerHintText.setColor(theme.light ? TUTOR_PALETTE.footerMuted : theme.assignedColor || theme.primary);
    this.statusText.setColor(theme.light ? '#4c5872' : theme.assignedColor || theme.primary);
    this.mascotTipText.setColor(theme.light ? '#7a7262' : theme.assignedColor || theme.primary);

    this.mrFingersText.setColor(theme.mrColor || COLORS.mrFingers);
    this.mrFingersFallbackText.setColor(theme.mrColor || COLORS.mrFingers);
    this.mrFingersPortraitFrame.setFillStyle(theme.light ? 0xf6dfb4 : panelBg);
    this.mrFingersPortraitFrame.setStrokeStyle(2, panelBorder);

    this._updateResponsePanelVisibility();
    this._updateKeyboardHighlights();
  }

  _updateResponsePanelVisibility() {
    const hasResponse = this.responseText && this.responseText.text && this.responseText.text.length > 0;
    const alpha = hasResponse ? 1 : 0;
    this.responsePanel.setAlpha(alpha);
  }

  _applyCompletionTheme(theme) {
    if (theme.light) {
      this.completionBg.setFillStyle(hexToNumber('#ffffff'));
      this.completionBg.setStrokeStyle(2, hexToNumber(theme.primary));
      this.completionText.setColor('#000000');
    } else {
      const bg = theme.panelBg ? hexToNumber(theme.panelBg) : hexToNumber(COLORS.panel);
      this.completionBg.setFillStyle(bg);
      this.completionBg.setStrokeStyle(2, hexToNumber(theme.warning));
      this.completionText.setColor(theme.assignedColor || theme.primary);
    }
  }

  // --- TYPED TEXT RENDERING ---

  _renderTypedText() {
    const states = this.typingEngine.getCharStates();

    this.typedTextDisplay.setText('');

    if (this.typedRichText) {
      this.typedRichText.forEach(t => t.destroy());
    }
    this.typedRichText = [];

    let x = this.typedBaseX;
    const y = this.typedBaseY;
    const charWidth = 14.4;

    const theme = this.currentTheme || DEFAULT_ACT_THEME;
    const correctColor = theme.textCorrect || COLORS.textCorrect;
    const wrongColor = theme.textWrong || COLORS.textWrong;
    const cursorColor = theme.textCursor || COLORS.textCursor;
    const wrongUnderline = hexToNumber(wrongColor);

    for (let i = 0; i < states.length; i++) {
      const color = states[i].correct ? correctColor : wrongColor;
      const charText = this.add.text(x, y, states[i].char, {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: color
      });

      if (!states[i].correct) {
        const underline = this.add.rectangle(x + charWidth / 2, y + 28, charWidth, 2, wrongUnderline);
        this.typedRichText.push(underline);
      }

      this.typedRichText.push(charText);
      x += charWidth;
    }

    if (this.cursorVisible && !this.typingEngine.isComplete) {
      const cursor = this.add.text(x, y, '_', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: cursorColor
      });
      this.typedRichText.push(cursor);
    }
  }

  // --- RESPONSE DISPLAY ---

  _showNextResponse() {
    if (this.responseTimer || this.responseQueue.length === 0) return;

    const text = this.responseQueue.shift();
    this.responseText.setText(text);
    this.responsePanel.setAlpha(1);

    this.tweens.add({
      targets: this.responseText,
      alpha: { from: 0, to: 1 },
      duration: 400
    });

    this.responseTimer = this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: this.responseText,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.responseTimer = null;
          this._updateResponsePanelVisibility();
          this._showNextResponse();
        }
      });
    });
  }

  _updateMrFingersVisual(state, label, config) {
    const theme = this.currentTheme || DEFAULT_ACT_THEME;
    const themeBase = theme.mrColor || COLORS.mrFingers;
    const defaultColor = (state === 'idle' || state === 'encourage' || state === 'mistake_notice')
      ? themeBase
      : (MR_STATE_COLORS[state] || COLORS.mrFingers);
    const color = theme.light ? themeBase : defaultColor;

    this.mrFingersText.setText(label);
    this.statusText.setText(label);
    this.mrFingersText.setColor(color);
    this.mrFingersFallbackText.setColor(color);
    this.mrFingersPortraitFrame.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color);

    const spriteKey = config && config.spriteKey;
    const hasSprite = spriteKey &&
      !this.missingMrFingersSprites.has(spriteKey) &&
      this.textures.exists(spriteKey);

    if (hasSprite) {
      if (!this.mrFingersSprite) {
        this.mrFingersSprite = this.add.image(this.mrPortraitCenterX, this.mrPortraitCenterY, spriteKey);
      }
      this.mrFingersSprite
        .setTexture(spriteKey)
        .setPosition(this.mrPortraitCenterX, this.mrPortraitCenterY)
        .setDisplaySize(92, 92)
        .setAlpha(1)
        .setVisible(true);
      this.mrFingersFallbackText.setVisible(false);
    } else {
      if (this.mrFingersSprite) {
        this.mrFingersSprite.setVisible(false);
      }
      this.mrFingersFallbackText.setText(this._getMrFingersFallbackGlyph(state)).setVisible(true);
    }

    this.tweens.add({
      targets: this.mrFingersText,
      alpha: { from: 0.3, to: 1 },
      duration: 300
    });

    this._playMrFingersReaction(state, config);
  }

  _getMrFingersFallbackGlyph(state) {
    const glyphs = {
      idle: 'MR',
      encourage: 'OK',
      mistake_notice: '!',
      corrective_smile: ':)',
      glitch_warning: '??',
      angry: '!!',
      emily_bleedthrough: 'E?',
      protector: '[]',
      witness: '<>'
    };
    return glyphs[state] || 'MR';
  }

  _playMrFingersReaction(state, config) {
    const targets = [this.mrFingersSprite, this.mrFingersFallbackText, this.mrFingersPortraitFrame]
      .filter(target => target && target.visible !== false);

    this.tweens.killTweensOf(targets);

    if (state === 'witness' || (config && config.calm)) {
      targets.forEach(target => {
        if (target.setAlpha) target.setAlpha(1);
        if (target.setX && target.input === undefined) target.setX(this.mrPortraitCenterX);
      });
      return;
    }

    if (state === 'angry' || (config && config.hardFlash)) {
      this.cameras.main.shake(80, 0.002);
      this.tweens.add({
        targets,
        alpha: { from: 0.25, to: 1 },
        x: '+=2',
        yoyo: true,
        duration: 45,
        repeat: 2
      });
      return;
    }

    if (state === 'glitch_warning' || state === 'emily_bleedthrough' || (config && config.flicker)) {
      this.tweens.add({
        targets,
        alpha: { from: 0.2, to: 1 },
        duration: 60,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          targets.forEach(target => {
            if (target.setAlpha) target.setAlpha(1);
          });
        }
      });
    }
  }

  _buildDevTouchControls() {
    const x = 748;
    const y = 438;
    const w = 268;
    const h = 172;

    this.devTouchPanel = this._createPanel(x, y, w, h, { fill: 0xf4efe0, shadow: false, lineWidth: 1 });
    this.devTouchPanel.setDepth(20);
    this.devTouchLabel = this.add.text(x + 12, y + 10, 'DEV TEST INPUT', {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#7b2f2f'
    }).setDepth(21);

    const buttons = [
      { label: 'TYPE NEXT', x: x + 12, y: y + 34, w: 116, h: 30, handler: () => this._simulateTypeNext() },
      { label: 'TYPE WORD', x: x + 140, y: y + 34, w: 116, h: 30, handler: () => this._simulateTypeWord() },
      { label: 'COMPLETE LINE', x: x + 12, y: y + 72, w: 244, h: 30, handler: () => this._simulateCompleteCurrentLine() },
      { label: 'BACKSPACE', x: x + 12, y: y + 110, w: 116, h: 30, handler: () => this._simulateBackspace() },
      { label: 'CONTINUE', x: x + 140, y: y + 110, w: 116, h: 30, handler: () => this._simulateContinuePress() },
      { label: 'DEBUG', x: x + 12, y: y + 144, w: 244, h: 20, handler: () => this._toggleDebug() }
    ];

    this.devTouchButtons = buttons.map((cfg) => this._createDevTouchButton(cfg));
  }

  _createDevTouchButton(cfg) {
    const body = this.add.rectangle(cfg.x + cfg.w / 2, cfg.y + cfg.h / 2, cfg.w, cfg.h, 0xe8dcc0)
      .setStrokeStyle(1, 0x7f765f)
      .setInteractive({ useHandCursor: true })
      .setDepth(21);
    const label = this.add.text(cfg.x + cfg.w / 2, cfg.y + cfg.h / 2, cfg.label, {
      fontFamily: 'Verdana, sans-serif',
      fontSize: cfg.h <= 22 ? '11px' : '12px',
      fontStyle: 'bold',
      color: '#20304a'
    }).setOrigin(0.5).setDepth(22);

    body.on('pointerdown', () => {
      body.y += 1;
      label.y += 1;
    });
    body.on('pointerup', () => {
      body.y -= 1;
      label.y -= 1;
      cfg.handler();
    });
    body.on('pointerout', () => {
      body.y = cfg.y + cfg.h / 2;
      label.y = cfg.y + cfg.h / 2;
    });

    return { body, label };
  }

  _handleInputEvent(event) {
    this.activeKeyValue = normalizeKey(event.key);
    this._updateKeyboardHighlights();

    if (event.key === '`') {
      this._toggleDebug();
      return;
    }

    if (this._triggerContinueIfAvailable()) {
      return;
    }

    if (this.actComplete || this.inputLocked) return;
    this.typingEngine.handleKey(event);
  }

  _toggleDebug() {
    this.debugVisible = !this.debugVisible;
    this._setDebugVisible(this.debugVisible);
  }

  _armContinueHandler(handler) {
    this.pendingContinueHandler = handler;
    this.continueEnabled = true;
  }

  _clearContinueHandler() {
    this.pendingContinueHandler = null;
    this.continueEnabled = false;
  }

  _triggerContinueIfAvailable() {
    if (!this.continueEnabled || !this.pendingContinueHandler) return false;
    const handler = this.pendingContinueHandler;
    this._clearContinueHandler();
    handler();
    return true;
  }

  _simulateCharacterInput(char) {
    if (!char || this.actComplete || this.inputLocked) return;
    this._handleInputEvent({ key: char });
    this._releaseSimulatedKey();
  }

  _simulateBackspace() {
    if (this.actComplete || this.inputLocked) return;
    this._handleInputEvent({ key: 'Backspace' });
    this._releaseSimulatedKey();
  }

  _simulateTypeNext() {
    const nextChar = this._getNextExpectedCharacter();
    if (!nextChar) return;
    this._simulateCharacterInput(nextChar);
  }

  _simulateTypeWord() {
    if (this.actComplete || this.inputLocked) return;
    let nextChar = this._getNextExpectedCharacter();
    while (nextChar) {
      this._simulateCharacterInput(nextChar);
      if (nextChar === ' ' || this.typingEngine.isComplete || this.actComplete || this.inputLocked) {
        break;
      }
      nextChar = this._getNextExpectedCharacter();
    }
  }

  _simulateCompleteCurrentLine() {
    if (this.actComplete || this.inputLocked) return;
    let nextChar = this._getNextExpectedCharacter();
    while (nextChar) {
      this._simulateCharacterInput(nextChar);
      if (this.typingEngine.isComplete || this.actComplete || this.inputLocked) {
        break;
      }
      nextChar = this._getNextExpectedCharacter();
    }
  }

  _simulateContinuePress() {
    this._triggerContinueIfAvailable();
    this._releaseSimulatedKey();
  }

  _getNextExpectedCharacter() {
    if (!this.typingEngine || this.typingEngine.isComplete) return null;
    const typedLength = this.typingEngine.typedChars.length;
    return this.typingEngine.assignedText[typedLength] ?? null;
  }

  _releaseSimulatedKey() {
    this.activeKeyValue = null;
    this._updateKeyboardHighlights();
  }

  // --- STATS AND DEBUG ---

  _updateStats() {
    const stats = this.typingEngine.getStats();
    const score = ScoringSystem.evaluate(stats);
    const current = this.lessonManager.getGlobalLessonNumber();
    const total = this.lessonManager.getGlobalTotalLessons();
    const progressRatio = total > 0 ? current / total : 0;

    this.wpmValueText.setText(String(stats.wpm));
    this.accuracyValueText.setText(`${stats.accuracy}%`);
    this.gradeValueText.setText(score.grade);
    this.starsValueText.setText(`${'★'.repeat(score.stars)}${'☆'.repeat(3 - score.stars)}`);
    this.progressBarFill.width = Math.max(0, this.progressBarMaxW * progressRatio);
    this.progressText.setText(`Lesson ${current} of ${total}`);
    this.reportCommentText.setText(score.comment);
    this.statsText.setText(`WPM ${stats.wpm}  Accuracy ${stats.accuracy}%  Grade ${score.grade}  Mistakes ${stats.mistakes}`);
    this.footerHintText.setText(score.goldStar ? 'Gold Star work today!' : score.comment);
  }

  _updateDebug() {
    const snap = this.memory.getSnapshot();
    const statLines = Object.entries(snap.stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  |  ');
    const activeFlags = Object.entries(snap.flags)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ');
    this.debugStats.setText(`${statLines}\nFLAGS: ${activeFlags || 'none'}`);
  }

  _updateEventLog() {
    const entries = this.eventLog.getEntries();
    for (let i = 0; i < this.eventLogTexts.length; i++) {
      if (i < entries.length) {
        this.eventLogTexts[i].setText(entries[i]);
        const recency = entries.length - i;
        const alpha = Math.max(0.35, recency / entries.length);
        this.eventLogTexts[i].setAlpha(alpha);
      } else {
        this.eventLogTexts[i].setText('');
      }
    }
  }

  _setDebugVisible(visible) {
    const elements = [
      this.debugPanel,
      this.debugDivider,
      this.debugLabel,
      this.debugStats,
      this.eventDivider,
      this.eventLogLabel,
      ...this.eventLogTexts
    ];
    for (const el of elements) {
      if (el) el.setVisible(visible);
    }
  }

  _flickerOnReveal() {
    const theme = this.currentTheme;
    if (!theme) return;
    const glitchColor = Phaser.Utils.Array.GetRandom(GLITCH_COLORS);
    this.assignedText.setColor(glitchColor);
    this.time.delayedCall(120, () => {
      this.assignedText.setColor(theme.assignedColor || theme.accent);
    });
  }

  // --- ATMOSPHERE ESCALATION ---

  _setupAtmosphere() {
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this._atmosphereTick()
    });
  }

  _atmosphereTick() {
    if (this.actComplete) return;
    const disclosure = this.memory.getStat('disclosure');

    if (disclosure < 3) return;

    const probability = Math.min(0.7, (disclosure - 2) * 0.09);
    if (Math.random() > probability) return;

    this._flickerAssignedText();
  }

  _flickerAssignedText() {
    const color = Phaser.Utils.Array.GetRandom(GLITCH_COLORS);
    this.assignedText.setColor(color);

    const duration = 60 + Math.random() * 140;
    this.time.delayedCall(duration, () => {
      const theme = this.currentTheme;
      this.assignedText.setColor((theme && (theme.assignedColor || theme.accent)) || COLORS.textWhite);
    });

    const suppression = this.memory.getStat('suppression');
    if (suppression > 4 && Math.random() > 0.5) {
      this.mrFingersText.setAlpha(0.3);
      this.time.delayedCall(duration + 50, () => {
        this.mrFingersText.setAlpha(1);
      });
    }
  }

  _labelStyle() {
    return {
      fontFamily: 'Verdana, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: TUTOR_PALETTE.textMuted
    };
  }

  _valueStyle(color) {
    return {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color
    };
  }

  _getInstructionText(lesson) {
    const map = {
      keys: 'Find each key slowly and keep your fingers in position.',
      words: 'Type each word carefully and keep a gentle rhythm.',
      phrase: 'Read the full phrase first, then type it smoothly.',
      sentence: 'Use neat spacing and steady hand movement.',
      speed: 'Stay accurate first. Speed comes naturally.',
      review: 'This is a review exercise. Watch the full line.',
      correction: 'Correct every detail as if it were a school worksheet.',
      accuracy: 'Accuracy matters here. Take your time.',
      test: 'Treat this like a quiet classroom test.',
      final: 'Finish the line exactly as shown.'
    };
    return map[lesson.drillType] || 'Follow the prompt and type carefully.';
  }

  _getTipText(lesson) {
    if (lesson.drillType === 'speed') {
      return 'TIP: Relax your shoulders. Smooth typing beats rushed typing.';
    }
    if (lesson.drillType === 'final' || lesson.drillType === 'test') {
      return 'TIP: Read the whole line before you begin typing.';
    }
    return 'TIP: Rest your fingers on A S D F and J K L ;';
  }

  _updateFooterClock() {
    this.footerClockText.setText(`Time: ${formatDuration(Date.now() - this.sessionStartTime)}`);
  }

  _updateKeyboardHighlights() {
    for (const [value, entry] of this.keyboardKeys.entries()) {
      let fill = TUTOR_PALETTE.keyFace;
      if (HOME_ROW_KEYS.has(value)) {
        fill = TUTOR_PALETTE.keyHome;
      }
      if (this.activeKeyValue && value === this.activeKeyValue) {
        fill = TUTOR_PALETTE.keyActive;
      }
      entry.face.setFillStyle(fill);
    }
  }

  _checkAtmosphereEscalation() {
    const disclosure = this.memory.getStat('disclosure');

    const thresholds = [5, 8, 12];
    for (const t of thresholds) {
      if (disclosure >= t && !this._disclosureShaken[t]) {
        this._disclosureShaken[t] = true;
        const intensity = 0.003 + (t / 1000);
        this.cameras.main.shake(150 + t * 15, intensity);
      }
    }
  }
}
