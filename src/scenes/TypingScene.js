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
    primary: '#66e8ff',
    accent: '#d8eeee',
    warning: '#ff3355',
    panelLabel: 'TYPE:',
    modeStamp: 'PRACTICE',
    bg: '#12232a',
    gridAlpha: 0.1,
    overlayAlpha: 0.04
  },
  act3_system_log: {
    primary: '#7dff9a',
    accent: '#aeb8b8',
    warning: '#ffff55',
    panelLabel: 'TYPE:',
    modeStamp: 'DRILL',
    bg: '#111f18',
    gridAlpha: 0.12,
    overlayAlpha: 0.03
  },
  act4_dictation_mode: {
    primary: '#7bbf79',
    accent: '#ffbf66',
    warning: '#ff44aa',
    panelLabel: 'TYPE:',
    modeStamp: 'DICTATION',
    bg: '#191a24',
    gridAlpha: 0.06,
    overlayAlpha: 0.05
  },
  act5_unsanctioned_statement: {
    primary: '#e6ffee',
    accent: '#ff66cc',
    warning: '#ff3344',
    panelLabel: 'TYPE:',
    modeStamp: 'PRACTICE',
    bg: '#211625',
    gridAlpha: 0.08,
    overlayAlpha: 0.06
  },
  act6_protective_routine: {
    primary: '#c8e36b',
    accent: '#ddd06a',
    warning: '#ff6633',
    panelLabel: 'TYPE:',
    modeStamp: 'REVIEW',
    bg: '#222212',
    gridAlpha: 0.09,
    overlayAlpha: 0.05
  },
  act7_correction_exam: {
    primary: '#e8fff0',
    accent: '#ff5555',
    warning: '#ff2222',
    panelLabel: 'TYPE:',
    modeStamp: 'TEST',
    bg: '#201818',
    gridAlpha: 0.07,
    overlayAlpha: 0.04
  },
  final_statement: {
    primary: '#eef8ee',
    accent: '#f0c878',
    warning: '#aa3333',
    panelLabel: 'TYPE:',
    modeStamp: 'FINAL TEST',
    bg: '#111513',
    gridAlpha: 0.035,
    overlayAlpha: 0.02
  }
};

const DEFAULT_ACT_THEME = ACT_THEMES.act1_home_row;

function hexToNumber(hex) {
  return Phaser.Display.Color.HexStringToColor(hex).color;
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
  }

  // --- UI CONSTRUCTION ---

  _buildUI() {
    const W = 1024;

    this.themeGridLines = [];
    for (let y = 24; y < 744; y += 32) {
      const line = this.add.rectangle(512, y, W - 60, 1, 0x00ff88)
        .setOrigin(0.5, 0)
        .setAlpha(0.05);
      this.themeGridLines.push(line);
    }

    this.themeOverlay = this.add.rectangle(512, 384, W, 768, 0x00ff88)
      .setAlpha(0.03)
      .setDepth(-1);

    this.headerTopLine = this.add.rectangle(512, 20, W - 40, 2, 0x334455).setOrigin(0.5, 0);

    this.titleText = this.add.text(512, 35, 'HOME ROW', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: COLORS.textGreen
    }).setOrigin(0.5, 0);

    this.lessonTitle = this.add.text(512, 72, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: COLORS.textDim
    }).setOrigin(0.5, 0);

    this.modeStampText = this.add.text(W - 60, 40, 'LESSON MODE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: COLORS.textDim
    }).setOrigin(1, 0);

    this.headerBottomLine = this.add.rectangle(512, 100, W - 40, 2, 0x334455).setOrigin(0.5, 0);

    // Assigned text panel
    this.assignedPanel = this.add.rectangle(512, 120, W - 80, 55, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x334455);

    this.assignedLabel = this.add.text(60, 126, 'TYPE:', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.textDim
    });

    this.assignedText = this.add.text(512, 145, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: COLORS.textWhite
    }).setOrigin(0.5, 0);

    // Typed text area
    this.typedPanel = this.add.rectangle(512, 185, W - 80, 55, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x334455);

    this.inputLabel = this.add.text(60, 191, 'INPUT:', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.textDim
    });

    this.typedTextDisplay = this.add.text(120, 210, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: COLORS.textCorrect
    });

    // Mr. Fingers area
    this.mrFingersPanel = this.add.rectangle(512, 248, W - 80, 50, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x223344);

    this.mrFingersPortraitFrame = this.add.rectangle(88, 273, 44, 42, 0x050510)
      .setStrokeStyle(1, 0x335544);

    this.mrFingersSprite = null;

    this.mrFingersFallbackText = this.add.text(88, 263, 'MR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.mrFingers,
      align: 'center'
    }).setOrigin(0.5, 0);

    this.mrFingersText = this.add.text(512, 268, this.mrFingers.getLabel(), {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: COLORS.mrFingers
    }).setOrigin(0.5, 0);

    // Response / narrative area
    this.responsePanel = this.add.rectangle(512, 305, W - 80, 65, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x442222)
      .setAlpha(0);

    this.responseText = this.add.text(512, 330, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: COLORS.response,
      wordWrap: { width: W - 120 },
      align: 'center'
    }).setOrigin(0.5, 0);

    // Stats bar
    this.statsDivider = this.add.rectangle(512, 385, W - 80, 2, 0x334455).setOrigin(0.5, 0);

    this.statsText = this.add.text(60, 396, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.statLabel
    });

    this.progressText = this.add.text(W - 60, 396, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.statLabel
    }).setOrigin(1, 0);

    // --- DEBUG PANEL ---

    this.debugDivider = this.add.rectangle(512, 420, W - 80, 2, 0x222233).setOrigin(0.5, 0);

    this.debugLabel = this.add.text(60, 430, '[ HIDDEN MEMORY STATE ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#333355'
    });

    this.debugStats = this.add.text(60, 446, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: COLORS.statValue
    });

    // Event log
    this.eventDivider = this.add.rectangle(512, 468, W - 80, 2, 0x222233).setOrigin(0.5, 0);

    this.eventLogLabel = this.add.text(60, 476, '[ EVENT LOG ]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#333355'
    });

    this.eventLogTexts = [];
    for (let i = 0; i < 10; i++) {
      const t = this.add.text(70, 494 + i * 15, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#556677'
      });
      this.eventLogTexts.push(t);
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

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '`') {
        this.debugVisible = !this.debugVisible;
        this._setDebugVisible(this.debugVisible);
        return;
      }
      if (this.actComplete || this.inputLocked) return;
      this.typingEngine.handleKey(event);
    });
  }

  // --- LESSON MANAGEMENT ---

  _startLesson() {
    const lesson = this.lessonManager.getCurrentLesson();
    if (!lesson) return;

    this.intentEngine.resetLessonCaps();

    const act = this.lessonManager.getCurrentAct();
    const theme = this._getThemeForAct(act);
    let assignedText = lesson.assignedText;

    if (act && act.actId === 'final_statement') {
      this.finalEnding = this.finalEnding || getFinalStatement(this.memory);
      assignedText = this.finalEnding.statement;
    }

    this._applyActTheme(theme);
    this.titleText.setText('HOME ROW');
    this.lessonTitle.setText(lesson.playerLabel || lesson.displayTitle);
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
        this.input.keyboard.once('keydown', () => {
          this.completionBg.setAlpha(0);
          this.completionText.setAlpha(0);
          this.lessonManager.advanceAct();
          this.actComplete = false;
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

    this.headerTopLine.setFillStyle(panelBorder);
    this.headerBottomLine.setFillStyle(panelBorder);
    this.statsDivider.setFillStyle(panelBorder);
    this.debugDivider.setFillStyle(accent).setAlpha(0.35);
    this.eventDivider.setFillStyle(accent).setAlpha(0.35);

    [
      this.assignedPanel,
      this.typedPanel,
      this.mrFingersPanel
    ].forEach(panel => {
      panel.setFillStyle(panelBg);
      panel.setStrokeStyle(1, panelBorder);
    });
    this.responsePanel.setFillStyle(panelBg);
    this.responsePanel.setStrokeStyle(1, responseBorder);

    this.titleText.setColor(theme.primary);
    this.lessonTitle.setColor(theme.accent);
    this.modeStampText.setText(theme.modeStamp).setColor(theme.accent);
    this.assignedLabel.setText(theme.panelLabel).setColor(theme.accent);
    this.inputLabel.setColor(theme.accent);
    this.assignedText.setColor(theme.assignedColor || theme.accent);
    this.responseText.setColor(theme.responseColor || theme.warning);
    this.statsText.setColor(theme.statsColor || theme.accent);
    this.progressText.setColor(theme.primary);
    this.debugStats.setColor(theme.primary);

    this.mrFingersText.setColor(theme.mrColor || COLORS.mrFingers);
    this.mrFingersFallbackText.setColor(theme.mrColor || COLORS.mrFingers);
    this.mrFingersPortraitFrame.setFillStyle(theme.light ? panelBg : 0x050510);
    this.mrFingersPortraitFrame.setStrokeStyle(1, panelBorder);

    this._updateResponsePanelVisibility();
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
      this.completionBg.setFillStyle(hexToNumber(COLORS.panel));
      this.completionBg.setStrokeStyle(2, hexToNumber(theme.warning));
      this.completionText.setColor(theme.primary);
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

    let x = 120;
    const y = 210;
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
    this.mrFingersText.setColor(color);
    this.mrFingersFallbackText.setColor(color);
    this.mrFingersPortraitFrame.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color);

    const spriteKey = config && config.spriteKey;
    const hasSprite = spriteKey &&
      !this.missingMrFingersSprites.has(spriteKey) &&
      this.textures.exists(spriteKey);

    if (hasSprite) {
      if (!this.mrFingersSprite) {
        this.mrFingersSprite = this.add.image(88, 273, spriteKey);
      }
      this.mrFingersSprite
        .setTexture(spriteKey)
        .setDisplaySize(38, 38)
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
        if (target.setX && target.input === undefined) target.setX(88);
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

  // --- STATS AND DEBUG ---

  _updateStats() {
    const stats = this.typingEngine.getStats();
    this.statsText.setText(
      `WPM: ${stats.wpm}  ACCURACY: ${stats.accuracy}%  CORRECT: ${stats.correct}  MISTAKES: ${stats.mistakes}`
    );
    this.progressText.setText(
      `Lesson ${this.lessonManager.getGlobalLessonNumber()} of ${this.lessonManager.getGlobalTotalLessons()}`
    );
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
      this.assignedText.setColor(theme.accent);
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
      this.assignedText.setColor((this.currentTheme && this.currentTheme.accent) || COLORS.textWhite);
    });

    const suppression = this.memory.getStat('suppression');
    if (suppression > 4 && Math.random() > 0.5) {
      this.mrFingersText.setAlpha(0.3);
      this.time.delayedCall(duration + 50, () => {
        this.mrFingersText.setAlpha(1);
      });
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
