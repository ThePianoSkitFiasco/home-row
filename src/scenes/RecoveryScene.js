const SCRIPT_LINES = [
  'LESSON COMPLETE.',
  '',
  'PREPARING NEXT SECTION...',
  '',
  '...',
  '',
  '...',
  '',
  '',
  'SECTION READY.',
  '',
  '',
  'MR. FINGERS:',
  '"Good."',
  '',
  '"That is behind you now."',
  '',
  '"The next section is listening practice."',
  '',
  '"Type what you hear."',
  '',
  '',
  '"Type what you hear."'
];

const SLOW_LINES = new Set([
  'PREPARING NEXT SECTION...',
  '"Type what you hear."'
]);

const COLORS = {
  bg:         0x1a1a0e,
  headerBg:   0x0d0d07,
  separator:  0x3d3a1a,
  text:       '#c8c090',
  textDim:    '#6b6840',
  textHeader: '#a09870',
  prompt:     '#c8c090'
};

export default class RecoveryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RecoveryScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'TypingScene';
    this.visibleLines = [];
    this.currentLineIndex = 0;
    this.currentLineText = '';
    this.currentCharIndex = 0;
    this.sequenceComplete = false;
    this.cursorVisible = true;
    this._firstTypeWheardDone = false;
    this.typingTimer = null;
    this.advanceTimer = null;
    this.promptBlinkTimer = null;
    this.textTop = 52;
    this.textBottom = 0;
    this.lineHeight = 24;
    this.maxVisibleLines = SCRIPT_LINES.length;
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1a0e');
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

    this.add.text(PAD, HEADER_H / 2, 'HOME ROW  [SECTION RECOVERY]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: COLORS.textHeader
    }).setOrigin(0, 0.5);

    this.add.text(W - PAD, HEADER_H / 2, 'PREPARING NEXT SECTION', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: COLORS.textDim
    }).setOrigin(1, 0.5);

    this.add.rectangle(W / 2, HEADER_H, W, 1, COLORS.separator);
    this.add.rectangle(W / 2, H - FOOTER_H, W, 1, COLORS.separator);

    this.textTop = HEADER_H + 16;
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
      delay: 26,
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

      let pauseMs = 220;

      if (targetLine === 'PREPARING NEXT SECTION...') {
        pauseMs = 1200;
      } else if (targetLine === '"Type what you hear."') {
        if (!this._firstTypeWheardDone) {
          this._firstTypeWheardDone = true;
          pauseMs = 2000;
        } else {
          // slip — the loop is visible
          this.cameras.main.flash(160, 255, 255, 255, false);
          this.cameras.main.shake(120, 0.002);
          pauseMs = 600;
        }
      }

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
    } catch (_) {}
  }

  _finish() {
    if (!this.sequenceComplete) return;
    this._cleanupTimers();

    try {
      this.scene.wake(this.returnScene);
      const targetScene = this.scene.get(this.returnScene);
      if (targetScene) {
        targetScene.events.emit('recovery-complete');
      }
    } catch (error) {
      console.warn('[RecoveryScene] Could not return to TypingScene:', error);
      try { this.scene.wake(this.returnScene); } catch (_) {}
    }

    this.scene.stop();
  }

  _cleanupTimers() {
    if (this.typingTimer) {
      this.typingTimer.remove(false);
      this.typingTimer = null;
    }
    if (this.advanceTimer) {
      this.advanceTimer.remove(false);
      this.advanceTimer = null;
    }
    if (this.promptBlinkTimer) {
      this.promptBlinkTimer.remove(false);
      this.promptBlinkTimer = null;
    }
  }
}
