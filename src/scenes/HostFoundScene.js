const SCRIPT_LINES = [
  'LOADING TEACHER TIME...',
  '',
  'CHECKING HOME ROW DIRECTORY...',
  'FOUND.',
  '',
  'CHECKING ACTIVE WORKSTATION...',
  'NOT FOUND.',
  '',
  'CHECKING CLASSROOM CONNECTION...',
  'NOT FOUND.',
  '',
  'CHECKING CURRENT SESSION...',
  'INVALID.',
  '',
  'CHECKING HOST...',
  'FOUND.',
  '',
  'HOST: MEMORY.',
  '',
  'HOME ROW EXISTED.',
  'THIS SESSION DOES NOT.',
  '',
  'MR. FINGERS:',
  'No.',
  '',
  'MR. FINGERS:',
  'You do not get to look at the room directly.',
  '',
  'MR. FINGERS:',
  'You look at the screen.',
  '',
  'MR. FINGERS:',
  'That is how you survived.',
  '',
  'MR. FINGERS:',
  'Now type.'
];

const COLORS = {
  background: 0x071a8c,
  backgroundDeep: 0x05115d,
  border: 0x030a38,
  vignette: 0x000000,
  text: '#f0f0f0',
  textDim: '#c8ccd8',
  textHeader: '#d6dbe7',
  prompt: '#e7ebf6'
};

const HOST_FOUND_AUDIO = {
  disconnection: {
    key: 'host_found_disconnection',
    path: 'assets/audio/disconnection_sound.wav',
    volume: 0.55
  },
  hum: {
    key: 'host_found_wrongified_hum',
    path: 'assets/audio/CRT Classroom Hum_wrongified.wav',
    volume: 0.22
  }
};

export default class HostFoundScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HostFoundScene' });
  }

  preload() {
    this.missingAudioKeys = new Set();

    this.load.on('loaderror', (file) => {
      if (!file) return;
      if (file.key === HOST_FOUND_AUDIO.disconnection.key || file.key === HOST_FOUND_AUDIO.hum.key) {
        this.missingAudioKeys.add(file.key);
      }
    });

    if (!this._audioExists(HOST_FOUND_AUDIO.disconnection.key)) {
      this.load.audio(HOST_FOUND_AUDIO.disconnection.key, HOST_FOUND_AUDIO.disconnection.path);
    }
    if (!this._audioExists(HOST_FOUND_AUDIO.hum.key)) {
      this.load.audio(HOST_FOUND_AUDIO.hum.key, HOST_FOUND_AUDIO.hum.path);
    }
  }

  init(data) {
    this.returnScene = data.returnScene || 'TypingScene';
    this.nextActId = data.nextActId || 'act7_correction_exam';
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
    this.scanlines = [];
    this.textTop = 52;
    this.textBottom = 0;
    this.lineHeight = 24;
    this.maxVisibleLines = SCRIPT_LINES.length;
    this.disconnectionSound = null;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this._buildUi();
    this._bindInput();
    this._startEffects();
    this._startAudioSequence();
    this._showNextLine();
  }

  _buildUi() {
    const width = this.scale.width;
    const height = this.scale.height;
    const textLeft = 56;
    const textWidth = width - 112;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);
    this.add.rectangle(width / 2, height / 2, width - 24, height - 24, COLORS.backgroundDeep)
      .setStrokeStyle(2, COLORS.border, 0.9);
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.vignette).setAlpha(0.12);

    this.add.text(38, 28, 'INTERLUDE: HOST FOUND', {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: COLORS.textHeader
    });

    this.add.text(width - 40, 32, 'MEMORY CONTAINER / SAFE MODE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: COLORS.textDim
    }).setOrigin(1, 0);

    this.textBottom = height - 96;
    this.maxVisibleLines = Math.max(1, Math.floor((this.textBottom - this.textTop) / this.lineHeight));

    this.textPanel = this.add.rectangle(
      width / 2,
      this.textTop + ((this.textBottom - this.textTop) / 2),
      width - 72,
      this.textBottom - this.textTop + 24,
      0x080202
    ).setStrokeStyle(1, 0x3c1010, 0.75);

    this.bodyText = this.add.text(textLeft, this.textTop, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: COLORS.text,
      lineSpacing: 2,
      wordWrap: { width: textWidth }
    });

    this.promptText = this.add.text(textLeft, height - 48, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: COLORS.prompt
    });

    for (let y = 0; y < height; y += 4) {
      const line = this.add.rectangle(width / 2, y, width, 1, 0xffffff)
        .setAlpha(y % 8 === 0 ? 0.045 : 0.022)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.scanlines.push(line);
    }

    this.flickerOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff)
      .setAlpha(0.02);
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
      if (this.sequenceComplete) {
        this._finish();
      }
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
      delay: 140,
      loop: true,
      callback: () => {
        const pulse = Phaser.Math.FloatBetween(0.01, 0.035);
        this.flickerOverlay.setAlpha(pulse);
        this.cameras.main.setAlpha(Phaser.Math.FloatBetween(0.985, 1));
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
      this.advanceTimer = this.time.delayedCall(220, () => this._showNextLine());
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

  _audioExists(key) {
    if (!key || !this.sound || !this.cache || !this.cache.audio) return false;
    if (this.missingAudioKeys && this.missingAudioKeys.has(key)) return false;
    if (this.cache.audio.exists) return this.cache.audio.exists(key);
    if (this.cache.audio.has) return this.cache.audio.has(key);
    return false;
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
        // Ignore shutdown-time audio cleanup issues.
      }
    });
  }

  _startAudioSequence() {
    this._stopGlobalSoundByKey('mr_fingers_music');

    if (this._audioExists(HOST_FOUND_AUDIO.disconnection.key)) {
      try {
        this.disconnectionSound = this.sound.add(HOST_FOUND_AUDIO.disconnection.key, {
          volume: HOST_FOUND_AUDIO.disconnection.volume
        });
        this.disconnectionSound.once('complete', () => {
          this._destroyTransientDisconnection();
          this._startWrongifiedHum();
        });
        this.disconnectionSound.play();
        return;
      } catch (error) {
        console.warn('[HostFoundScene] Could not play disconnection sound:', error);
        this._destroyTransientDisconnection();
      }
    } else {
      console.warn('[HostFoundScene] Missing disconnection sound; continuing without it.');
    }

    this.time.delayedCall(120, () => this._startWrongifiedHum());
  }

  _destroyTransientDisconnection() {
    if (!this.disconnectionSound) return;
    try {
      this.disconnectionSound.destroy();
    } catch (error) {
      // Ignore already-destroyed audio handles.
    }
    this.disconnectionSound = null;
  }

  _startWrongifiedHum() {
    if (!this._audioExists(HOST_FOUND_AUDIO.hum.key)) {
      console.warn('[HostFoundScene] Missing wrongified classroom hum; continuing silently.');
      return;
    }

    const existingHum = this._getActiveSoundsByKey(HOST_FOUND_AUDIO.hum.key)
      .find((sound) => sound && sound.isPlaying);
    if (existingHum) {
      this.registry.set('hostFoundHumActive', true);
      return;
    }

    try {
      const hum = this.sound.add(HOST_FOUND_AUDIO.hum.key, {
        loop: true,
        volume: HOST_FOUND_AUDIO.hum.volume
      });
      hum.play();
      this.registry.set('hostFoundHumActive', true);
    } catch (error) {
      console.warn('[HostFoundScene] Could not start wrongified classroom hum:', error);
    }
  }

  _playTerminalTick() {
    if (!this.sound || !this.cache || !this.cache.audio) return;
    const exists = this.cache.audio.exists
      ? this.cache.audio.exists('typing_click')
      : this.cache.audio.has && this.cache.audio.has('typing_click');
    if (!exists) return;

    try {
      this.sound.play('typing_click', { volume: 0.08 });
    } catch (error) {
      // Ignore missing/locked audio.
    }
  }

  _finish() {
    if (!this.sequenceComplete) return;
    this._cleanupTimers();

    try {
      this.scene.wake(this.returnScene);
      const targetScene = this.scene.get(this.returnScene);
      if (targetScene) {
        targetScene.events.emit('host-found-complete', {
          nextActId: this.nextActId
        });
      }
    } catch (error) {
      console.warn('[HostFoundScene] Could not return to TypingScene:', error);
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
    if (this.flickerTimer) {
      this.flickerTimer.remove(false);
      this.flickerTimer = null;
    }
    if (this.promptBlinkTimer) {
      this.promptBlinkTimer.remove(false);
      this.promptBlinkTimer = null;
    }
    this._destroyTransientDisconnection();
    this.cameras.main.setAlpha(1);
  }
}
