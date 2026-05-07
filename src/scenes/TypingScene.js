import TypingEngine from '../systems/TypingEngine.js';
import IntentEngine from '../systems/IntentEngine.js';
import MemoryState from '../systems/MemoryState.js';
import LessonManager from '../systems/LessonManager.js';
import MrFingersController from '../systems/MrFingersController.js';
import EventLog from '../systems/EventLog.js';

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

export default class TypingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingScene' });
  }

  preload() {
    this.load.json('lessons_act1', 'src/data/lessons.act1.json');
    this.load.json('lessons_act2', 'src/data/lessons.act2.json');
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
      this.cache.json.get('lessons_act2')
    ]);
    this.intentEngine.loadIntents(this.cache.json.get('intents'));

    this.responseQueue = [];
    this.responseTimer = null;
    this.actComplete = false;
    this.cursorVisible = true;
    this._disclosureShaken = {};

    this._buildUI();
    this._wireEvents();
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
    this.add.rectangle(512, 252, W - 80, 42, 0x0a0a1a)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x223344);

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
    this.completionBg = this.add.rectangle(512, 280, 640, 320, 0x0a0a1a)
      .setStrokeStyle(2, 0x00ff88)
      .setAlpha(0)
      .setDepth(10);
    this.completionText = this.add.text(512, 280, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: COLORS.textGreen,
      align: 'center',
      wordWrap: { width: 580 }
    }).setOrigin(0.5).setAlpha(0).setDepth(11);
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

    this.mrFingers.onStateChange = (state, label) => {
      this.mrFingersText.setText(label);
      this.mrFingersText.setColor(MR_STATE_COLORS[state] || COLORS.mrFingers);
      this.tweens.add({
        targets: this.mrFingersText,
        alpha: { from: 0.3, to: 1 },
        duration: 300
      });
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

    this.titleText.setText(`ACT ${this.lessonManager.getActNumber()}: ${this.lessonManager.getActTitle()}`);
    this.lessonTitle.setText(lesson.displayTitle);
    this.assignedText.setText(lesson.assignedText);
    this.typingEngine.loadLine(lesson.assignedText);
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

    const lines = [
      `ACT ${actNum} COMPLETE`,
      '',
      `Accuracy: ${stats.accuracy}%`,
      `Memory Match: ${Math.min(99, 31 + snap.stats.disclosure * 4)}%`
    ];

    if (hasNextAct) {
      lines.push(
        '',
        'LOADING STUDENT RECORD...',
        'PLEASE KEEP YOUR HANDS ON HOME ROW.',
        '',
        '[ Press any key to continue ]'
      );
    } else {
      lines.push(
        '',
        `Mistakes: ${stats.mistakes}`,
        `Backspaces: ${stats.backspaces}`,
        `Lines completed: ${stats.completedLines}`,
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
    const lines = Object.entries(snap.stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  |  ');
    this.debugStats.setText(lines);
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
