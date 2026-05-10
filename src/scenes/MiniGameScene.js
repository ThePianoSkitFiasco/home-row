// MiniGameScene — interstitial mini-games that appear between main lessons.
// Routes by config.type. Phase 1 supports: 'catch_falling_keys'.
// Future types: 'keep_the_lights_on', 'correct_the_record', 'do_not_let_the_door_close',
//               'stay_in_your_seat', 'listen_and_type', 'erase_the_chalkboard',
//               'typing_race', 'final_correct_the_record'

const FONT = 'Courier New, monospace';

// Visual palette — matches Act 1 friendly tutor aesthetic.
// TODO Phase 2: accept actTheme colours to shift palette as horror escalates.
const PAL = {
  bg:         0xd4d0c8,
  titleBar:   0x003399,
  titleText:  '#ffffff',
  letter:     '#003399',
  letterMiss: '#999988',
  caught:     '#006600',
  missed:     '#cc3300',
  panelBg:    0xffffff,
  panelBorder:0x003399,
  score:      '#003399',
  hint:       '#666655',
  timerNorm:  '#ffff88',
  timerWarn:  '#ff4444',
  boundary:   0x999988,
  overlay:    0x000000
};

export default class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MiniGameScene' });
  }

  init(data) {
    this.config    = data.config    || {};
    this.actTheme  = data.actTheme  || null;

    // Game state
    this.caught      = 0;
    this.missed      = 0;
    this.timeLeft    = (this.config.duration || 30);
    this.gameOver    = false;
    this.activeLetter = null;

    // Letter pool from config, default to home-row keys
    const raw  = (this.config.letterPool || 'asdfjkl').split('').filter(Boolean);
    this.letterPool = raw.length > 0 ? raw : ['a','s','d','f','j','k','l'];

    // Fall speed in px/s — gentle for the early variant
    // TODO Phase 2: variant 'corrupted' uses higher speed or irregular timing
    this.fallSpeed = this.config.fallSpeed || 90;
  }

  create() {
    const W = 1024;
    const H = 768;

    try {
      this._buildUI(W, H);
      this._bindInput();
      this._spawnLetter();
      this._timerEvent = this.time.addEvent({
        delay: 1000,
        callback: this._tick,
        callbackScope: this,
        loop: true
      });
    } catch (e) {
      console.error('[MiniGameScene] create() failed:', e);
      // Return player to TypingScene rather than leaving them stuck
      this.time.delayedCall(100, this._complete, [], this);
    }
  }

  update(time, delta) {
    if (this.gameOver || !this.activeLetter) return;

    this.activeLetter.y += this.fallSpeed * (delta / 1000);

    // Letter reached bottom boundary — treat as missed
    if (this.activeLetter.y > 700) {
      this._missLetter();
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  _buildUI(W, H) {
    // Background
    this.add.rectangle(W / 2, H / 2, W, H, PAL.bg);

    // Title bar
    this.add.rectangle(W / 2, 30, W, 60, PAL.titleBar);
    this.add.text(W / 2, 30, 'CATCH THE FALLING KEYS', {
      fontFamily: FONT,
      fontSize: '22px',
      color: PAL.titleText,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Timer (top right in title bar)
    this.timerText = this.add.text(W - 18, 14, `TIME: ${this.timeLeft}s`, {
      fontFamily: FONT,
      fontSize: '17px',
      color: PAL.timerNorm
    }).setOrigin(1, 0);

    // Bottom boundary line
    this.add.rectangle(W / 2, 714, W, 2, PAL.boundary);

    // Player hint
    this.add.text(W / 2, 735, 'Type the falling letter to catch it!', {
      fontFamily: FONT,
      fontSize: '14px',
      color: PAL.hint
    }).setOrigin(0.5, 0);

    // Score display
    this.scoreText = this.add.text(W / 2, 758, 'Caught: 0     Missed: 0', {
      fontFamily: FONT,
      fontSize: '19px',
      color: PAL.score
    }).setOrigin(0.5, 1);
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  _bindInput() {
    this._keyHandler = this._onKey.bind(this);
    this.input.keyboard.on('keydown', this._keyHandler);
  }

  _onKey(event) {
    if (this.gameOver || !this.activeLetter) return;

    const pressed = event.key.toLowerCase();
    if (pressed === this.activeLetter.letterChar) {
      this._catchLetter();
    }
    // Wrong key: no penalty in Phase 1.
    // TODO Phase 2: wrong key could nudge a missed-word accumulator
  }

  // ─── Letter lifecycle ────────────────────────────────────────────────────────

  _spawnLetter() {
    if (this.gameOver) return;

    if (this.activeLetter) {
      this.activeLetter.destroy();
      this.activeLetter = null;
    }

    const char = this.letterPool[Phaser.Math.Between(0, this.letterPool.length - 1)];
    const x    = Phaser.Math.Between(80, 944);

    const obj = this.add.text(x, 90, char, {
      fontFamily: FONT,
      fontSize:   '58px',
      color:      PAL.letter,
      fontStyle:  'bold'
    }).setOrigin(0.5);

    obj.letterChar = char;
    this.activeLetter = obj;

    // TODO Phase 2: 'corrupted' variant — track missed letters; after 3 misses
    // of a shared set, briefly flash a hidden word (SHE, NO, DOOR) at the bottom
    // TODO Phase 2: story-specific letter pools per act (e.g. 'emily' for Act 3+)
  }

  _catchLetter() {
    this.caught++;
    const caught = this.activeLetter;
    this.activeLetter = null;

    // Brief scale-up + fade on catch
    this.tweens.add({
      targets:  caught,
      alpha:    0,
      scaleX:   1.6,
      scaleY:   1.6,
      y:        caught.y - 30,
      duration: 160,
      ease:     'Power1',
      onComplete: () => caught.destroy()
    });

    this._updateScore();
    this.time.delayedCall(100, this._spawnLetter, [], this);
  }

  _missLetter() {
    if (!this.activeLetter) return;
    this.missed++;

    // Fade to dim before destroying
    const missed = this.activeLetter;
    this.activeLetter = null;

    this.tweens.add({
      targets:  missed,
      alpha:    0,
      duration: 120,
      onComplete: () => missed.destroy()
    });

    this._updateScore();

    // TODO Phase 2: accumulate missed.letterChar into hidden word buffer here
    // TODO Phase 2: if buffer spells SHE/NO/DOOR, flash at bottom for 800ms

    this.time.delayedCall(220, this._spawnLetter, [], this);
  }

  _updateScore() {
    this.scoreText.setText(`Caught: ${this.caught}     Missed: ${this.missed}`);
  }

  // ─── Timer ──────────────────────────────────────────────────────────────────

  _tick() {
    if (this.gameOver) return;

    this.timeLeft = Math.max(0, this.timeLeft - 1);
    this.timerText.setText(`TIME: ${this.timeLeft}s`);

    if (this.timeLeft <= 5) {
      this.timerText.setColor(PAL.timerWarn);
    }
    if (this.timeLeft <= 0) {
      this._endGame();
    }
  }

  // ─── End state ───────────────────────────────────────────────────────────────

  _endGame() {
    if (this.gameOver) return;
    this.gameOver = true;

    if (this._timerEvent) {
      this._timerEvent.remove(false);
      this._timerEvent = null;
    }

    if (this.activeLetter) {
      this.activeLetter.destroy();
      this.activeLetter = null;
    }

    this.input.keyboard.off('keydown', this._keyHandler);

    this._showResults();
  }

  _showResults() {
    const W = 1024;
    const H = 768;

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);

    // Result card
    this.add.rectangle(W / 2, H / 2, 440, 280, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 95, 'DRILL COMPLETE', {
      fontFamily: FONT,
      fontSize:   '24px',
      color:      '#003399',
      fontStyle:  'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 38, `${this.caught} Letter${this.caught !== 1 ? 's' : ''} Caught`, {
      fontFamily: FONT,
      fontSize:   '21px',
      color:      PAL.caught
    }).setOrigin(0.5);

    const missColor = this.missed > 0 ? PAL.missed : PAL.caught;
    this.add.text(W / 2, H / 2 + 16, `${this.missed} Missed`, {
      fontFamily: FONT,
      fontSize:   '21px',
      color:      missColor
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 82, 'Returning to lessons...', {
      fontFamily: FONT,
      fontSize:   '14px',
      color:      PAL.hint
    }).setOrigin(0.5);

    // TODO Phase 2: write result to MemoryState here
    // e.g. high catch rate → obedience+, high miss rate → disclosure+ (didn't suppress)

    // Return to TypingScene after player has time to read the result
    this.time.delayedCall(2500, this._complete, [], this);
  }

  // ─── Return to TypingScene ───────────────────────────────────────────────────

  _complete() {
    const result = { caught: this.caught, missed: this.missed };

    try {
      // Wake TypingScene first so _advanceToNextAct() runs on a live scene
      this.scene.wake('TypingScene');
      const typingScene = this.scene.get('TypingScene');
      if (typingScene) {
        typingScene.events.emit('minigame-complete', result);
      }
    } catch (e) {
      console.warn('[MiniGameScene] Could not return to TypingScene:', e);
      // Defensive: attempt wake even on error so player is never permanently trapped
      try { this.scene.wake('TypingScene'); } catch (_) {}
    }

    this.scene.stop();
  }
}
