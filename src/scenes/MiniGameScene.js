// MiniGameScene — interstitial mini-games that appear between main lessons.
// Routes by config.type. Phase 1 supports: 'catch_falling_keys'.
// Future types: 'keep_the_lights_on', 'correct_the_record', 'do_not_let_the_door_close',
//               'stay_in_your_seat', 'listen_and_type', 'erase_the_chalkboard',
//               'typing_race', 'final_correct_the_record'

const FONT = 'Courier New, monospace';

// Visual palette — matches Act 1 friendly tutor aesthetic.
// TODO Phase 2: accept actTheme colours to shift palette as horror escalates.
const PAL = {
  bg:          0xd4d0c8,
  titleBar:    0x003399,
  titleText:   '#ffffff',
  titleSub:    '#c8d8ff',
  letter:      '#003399',
  caught:      '#006600',
  missed:      '#cc3300',
  gold:        '#cc8800',
  panelBg:     0xffffff,
  panelBorder: 0x003399,
  score:       '#003399',
  hint:        '#666655',
  mrFingers:   '#445588',
  timerNorm:   '#ffff88',
  timerWarn:   '#ff4444',
  boundary:    0x999988,
  overlay:     0x000000
};

export default class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MiniGameScene' });
  }

  init(data) {
    this.config   = data.config   || {};
    this.actTheme = data.actTheme || null;

    // Game state
    this.caught       = 0;
    this.missed       = 0;
    this.timeLeft     = (this.config.duration || 30);
    this.gameOver     = false;
    this.activeLetter = null;
    this._introObjects = [];
    this._keyHandler   = null;
    this._timerEvent   = null;

    // Letter pool from config, default to home-row keys
    const raw = (this.config.letterPool || 'asdfjkl').split('').filter(Boolean);
    this.letterPool = raw.length > 0 ? raw : ['a','s','d','f','j','k','l'];

    // Fall speed in px/s — gentle for the early variant
    // TODO Phase 2: variant 'corrupted' uses higher speed or irregular timing
    this.fallSpeed = this.config.fallSpeed || 90;
  }

  create() {
    try {
      this._buildUI(1024, 768);
      this._showIntro();
    } catch (e) {
      console.error('[MiniGameScene] create() failed:', e);
      this.time.delayedCall(100, this._complete, [], this);
    }
  }

  update(time, delta) {
    if (this.gameOver || !this.activeLetter) return;

    this.activeLetter.y += this.fallSpeed * (delta / 1000);

    if (this.activeLetter.y > 700) {
      this._missLetter();
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  _buildUI(W, H) {
    // Background
    this.add.rectangle(W / 2, H / 2, W, H, PAL.bg);

    // Title bar — 80px tall to fit title + subtitle
    this.add.rectangle(W / 2, 40, W, 80, PAL.titleBar);

    this.add.text(W / 2, 20, 'BONUS DRILL: FALLING KEYS', {
      fontFamily: FONT,
      fontSize:   '21px',
      color:      PAL.titleText,
      fontStyle:  'bold'
    }).setOrigin(0.5, 0.5);

    this.add.text(W / 2, 52, 'Improve your home row reflexes!', {
      fontFamily: FONT,
      fontSize:   '13px',
      color:      PAL.titleSub
    }).setOrigin(0.5, 0.5);

    // Timer (top right in title bar, visible once game starts)
    this.timerText = this.add.text(W - 18, 10, `TIME: ${this.timeLeft}s`, {
      fontFamily: FONT,
      fontSize:   '16px',
      color:      PAL.timerNorm
    }).setOrigin(1, 0).setAlpha(0);

    // Bottom boundary line
    this.add.rectangle(W / 2, 714, W, 2, PAL.boundary);

    // Player hint (visible once game starts)
    this.hintText = this.add.text(W / 2, 730, 'Type the falling letter to catch it!', {
      fontFamily: FONT,
      fontSize:   '14px',
      color:      PAL.hint
    }).setOrigin(0.5, 0).setAlpha(0);

    // Score display (visible once game starts)
    this.scoreText = this.add.text(W / 2, 758, 'Caught: 0     Missed: 0', {
      fontFamily: FONT,
      fontSize:   '19px',
      color:      PAL.score
    }).setOrigin(0.5, 1).setAlpha(0);
  }

  // ─── Intro ──────────────────────────────────────────────────────────────────

  _showIntro() {
    const W = 1024;
    const H = 768;

    // White intro panel
    const panel = this.add.rectangle(W / 2, H / 2, 580, 190, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    const mrLabel = this.add.text(W / 2, H / 2 - 58, 'Mr. Fingers says:', {
      fontFamily: FONT,
      fontSize:   '15px',
      color:      PAL.mrFingers,
      fontStyle:  'italic'
    }).setOrigin(0.5);

    const mrQuote = this.add.text(
      W / 2, H / 2 - 4,
      '"A quick activity will reinforce today\'s lesson."',
      {
        fontFamily: FONT,
        fontSize:   '19px',
        color:      '#003399',
        align:      'center',
        wordWrap:   { width: 520 }
      }
    ).setOrigin(0.5);

    const mrSub = this.add.text(W / 2, H / 2 + 56, 'Get your fingers ready!', {
      fontFamily: FONT,
      fontSize:   '14px',
      color:      PAL.hint
    }).setOrigin(0.5);

    this._introObjects = [panel, mrLabel, mrQuote, mrSub];

    this.time.delayedCall(2200, this._showCountdown, [], this);
  }

  // ─── Countdown ──────────────────────────────────────────────────────────────

  _showCountdown() {
    const W = 1024;
    const H = 768;

    this._introObjects.forEach(o => o.destroy());
    this._introObjects = [];

    const words  = ['READY', 'SET', 'TYPE!'];
    const colors = ['#224488', '#003399', '#006600'];
    const delays = [1000, 1000, 700];
    let step = 0;

    const countText = this.add.text(W / 2, H / 2, '', {
      fontFamily: FONT,
      fontSize:   '82px',
      fontStyle:  'bold',
      color:      colors[0]
    }).setOrigin(0.5);

    const showNext = () => {
      if (step >= words.length) {
        countText.destroy();
        this._startGame();
        return;
      }

      countText
        .setText(words[step])
        .setColor(colors[step])
        .setAlpha(1)
        .setScale(0.65);

      this.tweens.add({
        targets:  countText,
        scaleX:   1,
        scaleY:   1,
        duration: 220,
        ease:     'Back.Out'
      });

      const delay = delays[step];
      step++;
      this.time.delayedCall(delay, showNext);
    };

    showNext();
  }

  // ─── Game start ─────────────────────────────────────────────────────────────

  _startGame() {
    // Reveal HUD elements that were hidden during intro
    this.timerText.setAlpha(1);
    this.hintText.setAlpha(1);
    this.scoreText.setAlpha(1);

    this._bindInput();
    this._spawnLetter();

    this._timerEvent = this.time.addEvent({
      delay:         1000,
      callback:      this._tick,
      callbackScope: this,
      loop:          true
    });
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

    const obj = this.add.text(x, 95, char, {
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

  // ─── Grade ──────────────────────────────────────────────────────────────────

  _getGrade() {
    const total = this.caught + this.missed;
    if (total === 0) return { label: 'GOOD WORK',      color: PAL.caught };
    const rate = this.caught / total;
    if (rate >= 0.8)  return { label: '★  GOLD STAR  ★', color: PAL.gold   };
    if (rate >= 0.5)  return { label: 'GOOD WORK',      color: PAL.caught  };
    return              { label: 'NEEDS PRACTICE',   color: PAL.missed  };
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

    if (this._keyHandler) {
      this.input.keyboard.off('keydown', this._keyHandler);
    }

    this._showResults();
  }

  _showResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getGrade();

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);

    // Result card — slightly taller to fit grade line
    this.add.rectangle(W / 2, H / 2, 460, 310, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 118, 'DRILL COMPLETE', {
      fontFamily: FONT,
      fontSize:   '23px',
      color:      '#003399',
      fontStyle:  'bold'
    }).setOrigin(0.5);

    // Grade — the headline result
    this.add.text(W / 2, H / 2 - 62, grade.label, {
      fontFamily: FONT,
      fontSize:   '28px',
      color:      grade.color,
      fontStyle:  'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 6, `${this.caught} Letter${this.caught !== 1 ? 's' : ''} Caught`, {
      fontFamily: FONT,
      fontSize:   '20px',
      color:      PAL.caught
    }).setOrigin(0.5);

    const missColor = this.missed > 0 ? PAL.missed : PAL.caught;
    this.add.text(W / 2, H / 2 + 36, `${this.missed} Missed`, {
      fontFamily: FONT,
      fontSize:   '20px',
      color:      missColor
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT,
      fontSize:   '14px',
      color:      PAL.hint
    }).setOrigin(0.5);

    // TODO Phase 2: write result to MemoryState here
    // e.g. GOLD STAR catch rate → obedience+, high miss rate → disclosure+

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Return to TypingScene ───────────────────────────────────────────────────

  _complete() {
    const result = { caught: this.caught, missed: this.missed };

    try {
      this.scene.wake('TypingScene');
      const typingScene = this.scene.get('TypingScene');
      if (typingScene) {
        typingScene.events.emit('minigame-complete', result);
      }
    } catch (e) {
      console.warn('[MiniGameScene] Could not return to TypingScene:', e);
      try { this.scene.wake('TypingScene'); } catch (_) {}
    }

    this.scene.stop();
  }
}
