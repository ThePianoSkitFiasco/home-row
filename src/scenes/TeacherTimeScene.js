const CRT = {
  bg: 0x050805,
  panel: 0x081008,
  panelSoft: 0x0b1609,
  border: 0x3d7228,
  phosphor: '#d5ffb8',
  phosphorDim: '#6fbf45',
  warning: '#ff7a45'
};

export default class TeacherTimeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TeacherTimeScene' });
  }

  init(data) {
    this.teacherTime = data.teacherTime || {};
    this.returnScene = data.returnScene || 'TypingScene';
    this.speaker = this.teacherTime.speaker || 'MR FINGERS';
    this.lines = Array.isArray(this.teacherTime.lines) ? this.teacherTime.lines : [];
    this.choices = Array.isArray(this.teacherTime.choices) ? this.teacherTime.choices : [];
    this.replyLines = [];
    this.lineIndex = 0;
    this.mode = 'lines';
    this.done = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(CRT.bg);
    this._buildUi();
    this.input.keyboard.on('keydown', (event) => this._handleKey(event));
    this.input.on('pointerdown', () => this._advance());
    this._renderCurrentLine();
  }

  _buildUi() {
    this.add.rectangle(512, 384, 1024, 768, CRT.bg);
    for (let x = 0; x <= 1024; x += 32) {
      this.add.rectangle(x, 384, 1, 768, CRT.border).setAlpha(0.07);
    }
    for (let y = 0; y <= 768; y += 24) {
      this.add.rectangle(512, y, 1024, 1, CRT.border).setAlpha(0.07);
    }
    this.add.rectangle(512, 384, 1024, 768, 0x000000).setAlpha(0.18);

    this.titleText = this.add.text(512, 42, 'TEACHER TIME', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: CRT.phosphor,
      align: 'center'
    }).setOrigin(0.5, 0);

    this.dialoguePanel = this.add.rectangle(390, 340, 620, 410, CRT.panel)
      .setStrokeStyle(2, CRT.border, 0.9);
    this.portraitPanel = this.add.rectangle(810, 340, 260, 410, CRT.panelSoft)
      .setStrokeStyle(1, CRT.border, 0.75);
    this.add.text(810, 160, 'MR FINGERS AREA', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: CRT.phosphorDim,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add.text(810, 218, 'PORTRAIT\nRESERVED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: CRT.phosphor,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0);

    this.speakerText = this.add.text(112, 155, `${this.speaker}:`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: CRT.phosphorDim
    });
    this.lineText = this.add.text(112, 212, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: CRT.phosphor,
      wordWrap: { width: 560 },
      lineSpacing: 8
    });
    this.choiceText = this.add.text(112, 370, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: CRT.phosphor,
      wordWrap: { width: 560 },
      lineSpacing: 8
    });
    this.footerText = this.add.text(512, 704, 'PRESS SPACE TO CONTINUE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: CRT.warning,
      align: 'center'
    }).setOrigin(0.5, 0);
  }

  _handleKey(event) {
    if (this.done) return;

    if (this.mode === 'choices') {
      this._handleChoice(event.key);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      if (event.preventDefault) event.preventDefault();
      this._advance();
    }
  }

  _advance() {
    if (this.done || this.mode === 'choices') return;

    this.lineIndex++;
    const activeLines = this.mode === 'reply' ? this.replyLines : this.lines;
    if (this.lineIndex < activeLines.length) {
      this._renderCurrentLine();
      return;
    }

    if (this.mode === 'lines' && this.choices.length > 0) {
      this._showChoices();
      return;
    }

    this._finish();
  }

  _renderCurrentLine() {
    const activeLines = this.mode === 'reply' ? this.replyLines : this.lines;
    const line = activeLines[this.lineIndex] || '';
    this.choiceText.setText('');
    this.lineText.setText(`"${line}"`);
    this.footerText.setText('PRESS SPACE TO CONTINUE');
  }

  _showChoices() {
    this.mode = 'choices';
    this.lineText.setText('"What would you like to say?"');
    this.choiceText.setText(this.choices.map((choice) => {
      return `[${choice.key}] ${choice.label}`;
    }).join('\n'));
    this.footerText.setText('PRESS 1-3 TO ANSWER');
  }

  _handleChoice(key) {
    const choice = this.choices.find((entry) => entry && entry.key === key);
    if (!choice) {
      this._flashChoicePrompt();
      return;
    }

    // TODO: store teacher choices/tags in MemoryState.
    this.replyLines = Array.isArray(choice.reply) ? choice.reply : [];
    this.mode = 'reply';
    this.lineIndex = 0;
    if (this.replyLines.length === 0) {
      this._finish();
      return;
    }
    this._renderCurrentLine();
  }

  _flashChoicePrompt() {
    this.footerText.setColor(CRT.phosphor);
    this.cameras.main.shake(80, 0.002);
    this.time.delayedCall(120, () => {
      if (this.footerText && this.footerText.active) {
        this.footerText.setColor(CRT.warning);
      }
    });
  }

  _finish() {
    if (this.done) return;
    this.done = true;

    // TODO: add performance-aware lines based on accuracy/deletions/pauses.
    // TODO: integrate Mr Fingers portrait/state changes.
    // TODO: add late-act corrupted Teacher Time variants.
    // TODO: react to mini-game results when those are routed into this scene.
    try {
      this.scene.wake(this.returnScene);
      const targetScene = this.scene.get(this.returnScene);
      if (targetScene) {
        targetScene.events.emit('teacher-time-complete', {
          id: this.teacherTime.id || null
        });
      }
    } catch (error) {
      console.warn('[TeacherTimeScene] Could not return to TypingScene:', error);
      try { this.scene.wake(this.returnScene); } catch (_) {}
    }

    this.scene.stop();
  }
}
