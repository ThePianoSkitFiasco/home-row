const SCRIPT_LINES = [
  'SESSION LOG — READING FILE...',
  '',
  'FOUND: SESSION.LOG',
  '',
  '──────────────────────────────────────',
  '',
  'DATE: [REDACTED]',
  'ROOM: 14B',
  'SUPERVISOR: CALDER, J.',
  '',
  '──────────────────────────────────────',
  '',
  'WORKSTATION 01  [ACTIVE]',
  '  SESSION: 14:17 — 15:43',
  '',
  'WORKSTATION 02  [ACTIVE]',
  '  SESSION: 14:32 — 14:47',
  '',
  '──────────────────────────────────────',
  '',
  'EVENT LOG',
  '',
  '14:17:00    WS01    SESSION START',
  '14:32:09    WS01    INPUT: NORMAL',
  '14:32:44    WS01    INPUT: REDUCED',
  '14:33:11    WS01    INPUT: RESUMED',
  '14:47:00    WS02    SESSION END',
  '14:47:03    WS01    INPUT: SPIKE',
  '',
  '──────────────────────────────────────',
  '',
  'RECORDS RETAINED.',
  'NO INCIDENT FLAGGED.',
  'LOG FILE: CLOSED.'
];

const COLORS = {
  bg:         0x000000,
  headerBg:   0x110000,
  separator:  0x550000,
  text:       '#cc2200',
  textBright: '#ff3322',
  textDim:    '#661100',
  textHeader: '#aa1a00',
  prompt:     '#ff3322'
};

export default class SessionLogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SessionLogScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'TypingScene';
    this.visibleLines = [];
    this.currentLineIndex = 0;
    this.currentLineText = '';
    this.currentCharIndex = 0;
    this.sequenceComplete = false;
    this.cursorVisible = true;
    this.typingTimer = null;
    this.advanceTimer = null;
    this.flickerTimer = null;
    this.promptBlinkTimer = null;
    this.textTop = 52;
    this.textBottom = 0;
    this.lineHeight = 24;
    this.maxVisibleLines = SCRIPT_LINES.length;
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this._stopGlobalSoundByKey('mr_fingers_music');
    this._buildUi();
    this._bindInput();
    this._startEffects();
    this._showNextLine();
  }

  _buildUi() {
    const W = this.scale.width;
    const H = this.scale.height;
    const PAD = 48;
    const HEADER_H = 32;
    const FOOTER_H = 50;

    this.add.rectangle(W / 2, H / 2, W, H, COLORS.bg);

    this.add.rectangle(W / 2, HEADER_H / 2, W, HEADER_H, COLORS.headerBg);
    this.add.text(PAD, HEADER_H / 2, 'HOME ROW  [SESSION ARCHIVE]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: COLORS.textHeader
    }).setOrigin(0, 0.5);
    this.add.text(W - PAD, HEADER_H / 2, 'READ-ONLY  //  LOG ACCESS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: COLORS.textDim
    }).setOrigin(1, 0.5);

    this.add.rectangle(W / 2, HEADER_H,     W, 1, COLORS.separator);
    this.add.rectangle(W / 2, H - FOOTER_H, W, 1, COLORS.separator);

    this.textTop    = HEADER_H + 16;
    this.textBottom = H - FOOTER_H - 8;
    this.lineHeight = 26;
    this.maxVisibleLines = Math.max(1, Math.floor((this.textBottom - this.textTop) / this.lineHeight));

    this.bodyText = this.add.text(PAD, this.textTop, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: COLORS.text,
      lineSpacing: 8,
      wordWrap: { width: W - PAD * 2 }
    });

    this.promptText = this.add.text(PAD, H - FOOTER_H + 14, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.prompt
    });

    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(W / 2, y, W, 1, 0xff0000).setAlpha(0.025);
    }

    this.flickerOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000).setAlpha(0.01);
  }

  _bindInput() {
    this.input.keyboard.on('keydown', (event) => {
      if (!this.sequenceComplete) return;
      if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
        if (event.preventDefault) event.preventDefault();
        this._finish();
      }
    });

    this.input.on('pointerdown', () => {
      if (this.sequenceComplete) this._finish();
    });
  }

  _startEffects() {
    this.promptBlinkTimer = this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this._renderText();
        this._renderPrompt();
      }
    });

    this.flickerTimer = this.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        this.flickerOverlay.setAlpha(Phaser.Math.FloatBetween(0.005, 0.02));
        this.cameras.main.setAlpha(Phaser.Math.FloatBetween(0.988, 1));
      }
    });
  }

  _showNextLine() {
    if (this.currentLineIndex >= SCRIPT_LINES.length) {
      this.sequenceComplete = true;
      this.currentLineText = '';
      this._renderText();
      this._renderPrompt();
      return;
    }

    const nextLine = SCRIPT_LINES[this.currentLineIndex];
    if (!nextLine) {
      this.visibleLines.push('');
      this.currentLineIndex += 1;
      this._renderText();
      this.advanceTimer = this.time.delayedCall(180, () => this._showNextLine());
      return;
    }

    this.currentLineText = '';
    this.currentCharIndex = 0;
    this._renderText();
    this.typingTimer = this.time.addEvent({
      delay: 22,
      loop: true,
      callback: () => this._typeCharacter(nextLine)
    });
  }

  _typeCharacter(targetLine) {
    if (this.currentCharIndex >= targetLine.length) {
      this.typingTimer.remove(false);
      this.typingTimer = null;
      this.visibleLines.push(targetLine);
      this.currentLineText = '';
      this.currentLineIndex += 1;
      this._renderText();

      // Pause longer on the horror lines
      const line = targetLine.trim();
      const pauseMs = (line === 'NO INCIDENT FLAGGED.' || line === '14:32:44    WS01    INPUT: REDUCED') ? 600 : 200;
      this.advanceTimer = this.time.delayedCall(pauseMs, () => this._showNextLine());
      return;
    }

    this.currentLineText += targetLine[this.currentCharIndex];
    this.currentCharIndex += 1;
    this._playTerminalTick();
    this._renderText();
  }

  _renderText() {
    const lines = this.visibleLines.slice();
    if (!this.sequenceComplete) {
      const cursor = this.cursorVisible ? '█' : '';
      lines.push(`${this.currentLineText}${cursor}`);
    }
    this.bodyText.setText(lines.slice(-this.maxVisibleLines).join('\n'));
  }

  _renderPrompt() {
    if (!this.sequenceComplete) {
      this.promptText.setText('');
      return;
    }
    const cursor = this.cursorVisible ? ' █' : '';
    this.promptText.setText(`PRESS ENTER / SPACE / CLICK TO CONTINUE${cursor}`);
  }

  _playTerminalTick() {
    if (!this.sound || !this.cache || !this.cache.audio) return;
    const exists = this.cache.audio.exists
      ? this.cache.audio.exists('typing_click')
      : this.cache.audio.has && this.cache.audio.has('typing_click');
    if (!exists) return;
    try {
      this.sound.play('typing_click', { volume: 0.06 });
    } catch (error) {
      // Ignore missing/locked audio.
    }
  }

  _getActiveSoundsByKey(key) {
    if (!this.sound || typeof this.sound.getAll !== 'function') return [];
    return this.sound.getAll().filter((sound) => sound && sound.key === key);
  }

  _stopGlobalSoundByKey(key) {
    this._getActiveSoundsByKey(key).forEach((sound) => {
      try {
        sound.stop();
        sound.destroy();
      } catch (error) {
        // Ignore cleanup issues during interlude handoff.
      }
    });
  }

  _finish() {
    if (!this.sequenceComplete) return;
    this._cleanupTimers();

    try {
      this.scene.wake(this.returnScene);
      const targetScene = this.scene.get(this.returnScene);
      if (targetScene) {
        targetScene.events.emit('session-log-complete');
      }
    } catch (error) {
      console.warn('[SessionLogScene] Could not return to TypingScene:', error);
      try { this.scene.wake(this.returnScene); } catch (_) {}
    }

    this.scene.stop();
  }

  _cleanupTimers() {
    if (this.typingTimer)     { this.typingTimer.remove(false);     this.typingTimer = null; }
    if (this.advanceTimer)    { this.advanceTimer.remove(false);    this.advanceTimer = null; }
    if (this.flickerTimer)    { this.flickerTimer.remove(false);    this.flickerTimer = null; }
    if (this.promptBlinkTimer){ this.promptBlinkTimer.remove(false); this.promptBlinkTimer = null; }
    this.cameras.main.setAlpha(1);
  }
}
