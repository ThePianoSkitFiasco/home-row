const THEMES = {
  early: {
    bg: 0xf4e6bd,
    panel: 0xfff7df,
    panelSoft: 0xfcf5de,
    border: 0x7f765f,
    titleBar: 0x245fa8,
    titleBorder: 0x123f72,
    titleText: '#fff7c4',
    text: '#202838',
    textMuted: '#4c5872',
    footer: '#1c4c92',
    overlayAlpha: 0
  },
  terminal: {
    bg: 0x050805,
    panel: 0x081008,
    panelSoft: 0x0b1609,
    border: 0x3d7228,
    titleBar: 0x061006,
    titleBorder: 0x3d7228,
    titleText: '#d5ffb8',
    text: '#d5ffb8',
    textMuted: '#6fbf45',
    footer: '#ff7a45',
    overlayAlpha: 0.18
  }
};
const MR_SPEAKING_FRAMES = [
  {
    key: 'teacher_mr_speak_1',
    path: 'assets/sprites/mr_fingers/mrfingers_speaks1.png'
  },
  {
    key: 'teacher_mr_speak_2',
    path: 'assets/sprites/mr_fingers/mrfingers_speaks2.png'
  },
  {
    key: 'teacher_mr_speak_3',
    path: 'assets/sprites/mr_fingers/mrfingers_speaks3.png'
  }
];

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
    this.speakingFrameSequence = [1, 2, 1, 3];
    this.speakingFrameIndex = 0;
    this.speakingTimer = null;
  }

  preload() {
    MR_SPEAKING_FRAMES.forEach((frame) => {
      if (!this.textures.exists(frame.key)) {
        this.load.image(frame.key, frame.path);
      }
    });
  }

  create() {
    this.theme = this._getTheme();
    this.cameras.main.setBackgroundColor(this.theme.bg);
    this._buildUi();
    this.input.keyboard.on('keydown', (event) => this._handleKey(event));
    this.input.on('pointerdown', () => this._advance());
    this._renderCurrentLine();
  }

  _buildUi() {
    const theme = this.theme;

    this.add.rectangle(512, 384, 1024, 768, theme.bg);
    for (let x = 0; x <= 1024; x += 32) {
      this.add.rectangle(x, 384, 1, 768, theme.border).setAlpha(0.07);
    }
    for (let y = 0; y <= 768; y += 24) {
      this.add.rectangle(512, y, 1024, 1, theme.border).setAlpha(0.07);
    }
    this.add.rectangle(512, 384, 1024, 768, 0x000000).setAlpha(theme.overlayAlpha);

    this.titleBar = this.add.rectangle(512, 52, 760, 54, theme.titleBar)
      .setStrokeStyle(2, theme.titleBorder, 1);

    this.titleText = this.add.text(512, 42, 'TEACHER TIME', {
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: theme.titleText,
      align: 'center'
    }).setOrigin(0.5, 0);

    this.mrSprite = this.add.image(512, 330, 'teacher_mr_speak_1')
      .setOrigin(0.5)
      .setScale(0.42);

    this.dialoguePanel = this.add.rectangle(512, 626, 900, 174, theme.panel)
      .setStrokeStyle(3, theme.border, 0.95);

    this.speakerText = this.add.text(96, 558, `${this.speaker}:`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: theme.textMuted
    });
    this.lineText = this.add.text(96, 596, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '25px',
      color: theme.text,
      wordWrap: { width: 832 },
      lineSpacing: 8
    });
    this.choiceText = this.add.text(96, 592, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: theme.text,
      wordWrap: { width: 832 },
      lineSpacing: 8
    });
    this.footerText = this.add.text(928, 704, 'PRESS SPACE TO CONTINUE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: theme.footer,
      align: 'right'
    }).setOrigin(1, 0);
  }

  _getTheme() {
    const variant = this.teacherTime.theme || this.teacherTime.variant || 'terminal';
    if (variant === 'early' || variant === 'friendly') {
      return THEMES.early;
    }
    return THEMES.terminal;
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
    this.choiceText.setVisible(false);
    this.lineText.setVisible(true);
    this.lineText.setText(`"${line}"`);
    this.footerText.setText('PRESS SPACE TO CONTINUE');
    this._startSpeakingAnimation();
  }

  _showChoices() {
    this.mode = 'choices';
    this.lineText.setText('');
    this.lineText.setVisible(false);
    this.choiceText.setText(this.choices.map((choice) => {
      return `[${choice.key}] ${choice.label}`;
    }).join('\n'));
    this.choiceText.setVisible(true);
    this.footerText.setText('PRESS 1-3 TO ANSWER');
    this._stopSpeakingAnimation();
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
    this.footerText.setColor(this.theme.text);
    this.cameras.main.shake(80, 0.002);
    this.time.delayedCall(120, () => {
      if (this.footerText && this.footerText.active) {
        this.footerText.setColor(this.theme.footer);
      }
    });
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    this._stopSpeakingAnimation();

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

  _startSpeakingAnimation() {
    if (this.speakingTimer) return;

    this.speakingFrameIndex = 0;
    this._setSpeakingFrame(this.speakingFrameSequence[this.speakingFrameIndex]);
    this.speakingTimer = this.time.addEvent({
      delay: 170,
      loop: true,
      callback: () => {
        this.speakingFrameIndex = (this.speakingFrameIndex + 1) % this.speakingFrameSequence.length;
        this._setSpeakingFrame(this.speakingFrameSequence[this.speakingFrameIndex]);
      }
    });
  }

  _stopSpeakingAnimation() {
    if (this.speakingTimer) {
      this.speakingTimer.remove(false);
      this.speakingTimer = null;
    }
    this._setSpeakingFrame(1);
  }

  _setSpeakingFrame(frameNumber) {
    if (!this.mrSprite) return;
    const key = `teacher_mr_speak_${frameNumber}`;
    if (this.textures.exists(key)) {
      this.mrSprite.setTexture(key);
    }
  }
}
