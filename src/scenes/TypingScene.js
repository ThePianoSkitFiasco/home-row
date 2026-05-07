import TypingEngine from '../systems/TypingEngine.js';
import IntentEngine from '../systems/IntentEngine.js';
import MemoryState from '../systems/MemoryState.js';
import LessonManager from '../systems/LessonManager.js';
import MrFingersController from '../systems/MrFingersController.js';
import EventLog from '../systems/EventLog.js';
import { getFinalStatement } from '../systems/EndingLogic.js';

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

    this._buildUI();
    this._wireEvents();
    this._updateMrFingersVisual(this.mrFingers.getState(), this.mrFingers.getLabel(), this.mrFingers.getStateConfig());
    this._startLesson();
    this._setupAtmosphere();

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

    this.add.rectangle(512, 20, W - 40, 2, 0x334455).setOrigin(0.5, 0);

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

    this.add.rectangle(512, 100, W - 40, 2, 0x334455).setOrigin(0.5, 0);

    // Assigned text panel
    this.add.rectangle(512, 120, W - 80, 55, 0x0a0a1a)
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
    this.add.rectangle(512, 185, W - 80, 55, 0x0a0a1a)
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
    this.add.rectangle(512, 248, W - 80, 50, 0x0a0a1a)
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
    this.add.rectangle(512, 305, W - 80, 65, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x442222);

    this.responseText = this.add.text(512, 330, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: COLORS.response,
      wordWrap: { width: W - 120 },
      align: 'center'
    }).setOrigin(0.5, 0);

    // Stats bar
    this.add.rectangle(512, 385, W - 80, 2, 0x334455).setOrigin(0.5, 0);

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

    this.add.rectangle(512, 420, W - 80, 2, 0x222233).setOrigin(0.5, 0);

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
    this.add.rectangle(512, 468, W - 80, 2, 0x222233).setOrigin(0.5, 0);

    this.add.text(60, 476, '[ EVENT LOG ]', {
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
      if (this.actComplete) return;
      this.typingEngine.handleKey(event);
    });
  }

  // --- LESSON MANAGEMENT ---

  _startLesson() {
    const lesson = this.lessonManager.getCurrentLesson();
    if (!lesson) return;

    const act = this.lessonManager.getCurrentAct();
    let assignedText = lesson.assignedText;

    if (act && act.actId === 'final_statement') {
      this.finalEnding = this.finalEnding || getFinalStatement(this.memory);
      assignedText = this.finalEnding.statement;
    }

    this.titleText.setText(`ACT ${this.lessonManager.getActNumber()}: ${this.lessonManager.getActTitle()}`);
    this.lessonTitle.setText(lesson.displayTitle);
    this.assignedText.setText(assignedText);
    this.typingEngine.loadLine(assignedText);
    this.typedTextDisplay.setText('');
    this._renderTypedText();
    this._updateStats();
    this._updateDebug();
  }

  _onLineComplete() {
    this.time.delayedCall(1500, () => {
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

    let lines;

    if (isFinalStatement) {
      lines = this._buildFinalEndingLines(stats, snap);
    } else {
      lines = [
        `ACT ${actNum} COMPLETE`,
        '',
        `Accuracy: ${stats.accuracy}%`,
        `Memory Match: ${Math.min(99, 31 + snap.stats.disclosure * 4)}%`
      ];
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
        ...flagLines,
        '',
        'You may close this program.'
      );
    }

    this.completionBg.setAlpha(1);
    this.completionText.setText(lines.join('\n')).setAlpha(1);

    if (hasNextAct) {
      this.time.delayedCall(1000, () => {
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
    const statLines = Object.entries(snap.stats)
      .map(([k, v]) => `${k}: ${v}`);
    const flagLines = Object.entries(snap.flags)
      .map(([k, v]) => `${k}: ${v}`);

    return [
      `=== ${ending.title} ===`,
      '',
      `FINAL STATEMENT`,
      ending.statement,
      '',
      ending.response,
      '',
      ending.body,
      '',
      `Memory Match: ${Math.min(99, 31 + snap.stats.disclosure * 4)}%`,
      '',
      '[ diagnostics ]',
      `routeId: ${ending.routeId}`,
      `stats: ${statLines.join(' | ')}`,
      `typing: accuracy ${stats.accuracy}% | correct ${stats.correct} | mistakes ${stats.mistakes} | backspaces ${stats.backspaces} | pauseMs ${stats.pauseTime} | lines ${stats.completedLines}`,
      '',
      '[ flags ]',
      ...flagLines,
      '',
      'You may close this program.'
    ];
  }

  _getActTransitionLines(nextActNumber) {
    const nextAct = this.lessonManager.acts[nextActNumber - 1];

    if (nextAct && nextAct.actId === 'act3_system_log') {
      return [
        'ACCESSING SYSTEM LOG...',
        'DO NOT REMOVE YOUR HANDS FROM THE KEYS.'
      ];
    }

    if (nextAct && nextAct.actId === 'act4_dictation_mode') {
      return [
        'ENTERING DICTATION MODE...',
        'TYPE ONLY WHAT YOU ARE GIVEN.',
        'UNAPPROVED AUDIO WILL BE CORRECTED.'
      ];
    }

    if (nextAct && nextAct.actId === 'act5_unsanctioned_statement') {
      return [
        'UNSANCTIONED INPUT DETECTED...',
        'CORRECTION MODE ENABLED.',
        'PLEASE REMOVE ALL UNAPPROVED STATEMENTS.'
      ];
    }

    if (nextAct && nextAct.actId === 'act6_protective_routine') {
      return [
        'STATEMENT PRESERVED.',
        'PROTECTIVE ROUTINE INTERRUPTED.',
        'MR FINGERS REQUIRES YOUR ATTENTION.'
      ];
    }

    if (nextAct && nextAct.actId === 'act7_correction_exam') {
      return [
        'PROTECTIVE ROUTINE COMPLETE.',
        'BEGIN CORRECTION EXAM.',
        'REMOVE ALL ERRORS FROM THE RECORD.'
      ];
    }

    if (nextAct && nextAct.actId === 'final_statement') {
      return [
        'CORRECTION EXAM COMPLETE.',
        'FINAL STATEMENT REQUIRED.',
        'TYPE CAREFULLY.'
      ];
    }

    return [
      'LOADING STUDENT RECORD...',
      'PLEASE KEEP YOUR HANDS ON HOME ROW.'
    ];
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

    for (let i = 0; i < states.length; i++) {
      const color = states[i].correct ? COLORS.textCorrect : COLORS.textWrong;
      const charText = this.add.text(x, y, states[i].char, {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: color
      });

      if (!states[i].correct) {
        const underline = this.add.rectangle(x + charWidth / 2, y + 28, charWidth, 2, 0xff3355);
        this.typedRichText.push(underline);
      }

      this.typedRichText.push(charText);
      x += charWidth;
    }

    if (this.cursorVisible && !this.typingEngine.isComplete) {
      const cursor = this.add.text(x, y, '_', {
        fontFamily: 'Courier New, monospace',
        fontSize: '24px',
        color: COLORS.textCursor
      });
      this.typedRichText.push(cursor);
    }
  }

  // --- RESPONSE DISPLAY ---

  _showNextResponse() {
    if (this.responseTimer || this.responseQueue.length === 0) return;

    const text = this.responseQueue.shift();
    this.responseText.setText(text);

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
          this._showNextResponse();
        }
      });
    });
  }

  _updateMrFingersVisual(state, label, config) {
    const color = MR_STATE_COLORS[state] || COLORS.mrFingers;

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
      `CORRECT: ${stats.correct}  MISTAKES: ${stats.mistakes}  BACKSPACES: ${stats.backspaces}  ACCURACY: ${stats.accuracy}%`
    );
    this.progressText.setText(
      `ACT ${this.lessonManager.getActNumber()}  LINE ${this.lessonManager.getLessonNumber()} / ${this.lessonManager.getTotalLessons()}`
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
      this.assignedText.setColor(COLORS.textWhite);
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
