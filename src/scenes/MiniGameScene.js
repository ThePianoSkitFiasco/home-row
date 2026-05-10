// MiniGameScene — interstitial mini-games that appear between main lessons.
// Routes by config.type. Supports: 'catch_falling_keys', 'keep_lights_on', 'correct_the_record'.
// Future types: 'do_not_let_the_door_close',
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
  overlay:     0x000000,
  lightOn:     0xf0e060,
  lightOff:    0x333328
};

export default class MiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MiniGameScene' });
  }

  init(data) {
    this.config   = data.config   || {};
    this.actTheme = data.actTheme || null;
    this.gameType = this.config.type || 'catch_falling_keys';

    // Shared game state
    this.timeLeft      = (this.config.duration || 30);
    this.gameOver      = false;
    this._introObjects = [];
    this._keyHandler   = null;
    this._timerEvent   = null;
    this._lightTimer   = null;

    // ── CFK state ────────────────────────────────────────────────────────────
    this.caught       = 0;
    this.missed       = 0;
    this.activeLetter = null;

    // Corrupted variant — missed letters accumulate at the bottom and may spell
    // hidden words before the system suppresses them.
    this.isCorrupted     = this.config.variant === 'corrupted';
    this.isKTLOCorrupted = (this.gameType === 'keep_lights_on' && this.config.variant === 'corrupted');
    this._missedBuffer = [];   // chars that have collected at the bottom
    this._missedTexts  = [];   // matching Phaser text objects
    this._hiddenWords  = this.config.hiddenWords || ['she', 'no', 'door'];

    // Letter pool from config, default to home-row keys
    const raw = (this.config.letterPool || 'asdfjkl').split('').filter(Boolean);
    this.letterPool = raw.length > 0 ? raw : ['a','s','d','f','j','k','l'];

    // Fall speed in px/s — gentle for the early variant
    // TODO corrupted: higher speed or irregular timing
    this.fallSpeed = this.config.fallSpeed || 90;

    // ── KTLO state ───────────────────────────────────────────────────────────
    this.wordsCompleted = 0;
    this.blackouts      = 0;
    this.lightLevel     = 5;
    this.currentWord    = '';
    this.typedInput     = '';
    const defaultWordPool = this.isKTLOCorrupted
      ? ['door', 'behind', 'quiet', 'listen', 'stay', 'screen', 'chair', 'wrong']
      : ['lamp', 'desk', 'chair', 'board', 'paper', 'pencil', 'screen', 'class'];
    this._wordPool      = this.config.wordPool || defaultWordPool;
    // UI object refs — assigned in _buildKTLOHUD
    this._lightRects    = [];
    this._ktloLightOn   = PAL.lightOn;
    this._ktloLightOff  = PAL.lightOff;
    this._bgOverlay     = null;
    this._wordText      = null;
    this._inputText     = null;
    this._ktloScoreText     = null;
    this._ktloBlackoutText  = null;

    // ── CTR state ────────────────────────────────────────────────────────────
    this._ctrRecords      = this.config.records || [];
    this._ctrIndex        = 0;
    this._ctrTyped        = '';
    this._ctrCompleted    = 0;
    // UI refs — assigned in _buildCTRHUD
    this._ctrLabelText    = null;
    this._ctrOriginalText = null;
    this._ctrTargetText   = null;
    this._ctrInputText    = null;
    this._ctrStampText    = null;
    this._ctrProgressText = null;
  }

  create() {
    try {
      this._buildChrome(1024, 768);
      if (this.gameType === 'catch_falling_keys') {
        this._buildCFKHUD(1024, 768);
      } else if (this.gameType === 'keep_lights_on') {
        this._buildKTLOHUD(1024, 768);
      } else if (this.gameType === 'correct_the_record') {
        this._buildCTRHUD(1024, 768);
      }
      this._showIntro();
    } catch (e) {
      console.error('[MiniGameScene] create() failed:', e);
      this.time.delayedCall(100, this._complete, [], this);
    }
  }

  update(time, delta) {
    if (this.gameOver) return;
    // Only CFK requires per-frame letter-position updates; KTLO is timer-driven
    if (this.gameType !== 'catch_falling_keys' || !this.activeLetter) return;

    this.activeLetter.y += this.fallSpeed * (delta / 1000);

    if (this.activeLetter.y > 700) {
      this._missLetter();
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  _buildChrome(W, H) {
    // Background
    this.add.rectangle(W / 2, H / 2, W, H, PAL.bg);

    // Title bar — 80px tall to fit title + subtitle
    this.add.rectangle(W / 2, 40, W, 80, PAL.titleBar);

    const titles = this._getGameTitles();
    this.add.text(W / 2, 20, titles.title, {
      fontFamily: FONT,
      fontSize:   '21px',
      color:      PAL.titleText,
      fontStyle:  'bold'
    }).setOrigin(0.5, 0.5);

    this.add.text(W / 2, 52, titles.subtitle, {
      fontFamily: FONT,
      fontSize:   '13px',
      color:      PAL.titleSub
    }).setOrigin(0.5, 0.5);

    // Timer — shared, hidden until game starts
    this.timerText = this.add.text(W - 18, 10, `TIME: ${this.timeLeft}s`, {
      fontFamily: FONT,
      fontSize:   '16px',
      color:      PAL.timerNorm
    }).setOrigin(1, 0).setAlpha(0);
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
    this.timerText.setAlpha(1);
    this._bindInput();
    this._timerEvent = this.time.addEvent({
      delay:         1000,
      callback:      this._tick,
      callbackScope: this,
      loop:          true
    });

    if (this.gameType === 'catch_falling_keys') {
      this._startCatchFallingKeys();
    } else if (this.gameType === 'keep_lights_on') {
      this._startKeepLightsOn();
    } else if (this.gameType === 'correct_the_record') {
      this._startCorrectTheRecord();
    } else {
      console.warn(`[MiniGameScene] Unknown game type: ${this.gameType}`);
      this._endGame();
    }
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  _bindInput() {
    if (this.gameType === 'keep_lights_on') {
      this._keyHandler = this._ktloOnKey.bind(this);
    } else if (this.gameType === 'correct_the_record') {
      this._keyHandler = this._ctrOnKey.bind(this);
    } else {
      this._keyHandler = this._cfkOnKey.bind(this);
    }
    this.input.keyboard.on('keydown', this._keyHandler);
  }

  _cfkOnKey(event) {
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

    if (this.isCorrupted) {
      this._accumulateMissed(missed.letterChar);
    }

    this.time.delayedCall(220, this._spawnLetter, [], this);
  }

  // ─── Corrupted variant — hidden word accumulation ───────────────────────────

  _accumulateMissed(char) {
    // Letters collect left-to-right in a dim strip below the boundary line.
    const x = 20 + this._missedBuffer.length * 26;
    const t = this.add.text(x, 730, char, {
      fontFamily: FONT,
      fontSize:   '20px',
      color:      '#999988',
      fontStyle:  'bold'
    }).setOrigin(0, 0.5);

    this._missedBuffer.push(char.toLowerCase());
    this._missedTexts.push(t);

    // Check if the accumulated string ends with any hidden word
    const bufStr = this._missedBuffer.join('');
    for (const word of this._hiddenWords) {
      if (bufStr.endsWith(word)) {
        this._revealAndSuppressWord(word.length);
        break;
      }
    }
  }

  _revealAndSuppressWord(wordLen) {
    // Brief reveal: the last N letters turn red — the word surfaces.
    const targets = this._missedTexts.slice(-wordLen);
    targets.forEach(t => t.setColor('#cc0000').setFontSize('22px'));

    // After 900ms the system "corrects" them — they fade and are erased.
    this.time.delayedCall(900, () => {
      targets.forEach(t => {
        this.tweens.add({
          targets:    t,
          alpha:      0,
          duration:   350,
          onComplete: () => t.destroy()
        });
      });

      // Remove from buffer and text list so accumulation can continue fresh
      const start = this._missedBuffer.length - wordLen;
      this._missedBuffer.splice(start, wordLen);
      this._missedTexts.splice(start, wordLen);
    });
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

  _getCFKGrade() {
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

    if (this._lightTimer) {
      this._lightTimer.remove(false);
      this._lightTimer = null;
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

  _showCFKResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getCFKGrade();

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

  // ─── Routing ─────────────────────────────────────────────────────────────────

  _getGameTitles() {
    if (this.gameType === 'keep_lights_on') {
      return {
        title:    'BONUS DRILL: KEEP THE LIGHTS ON',
        subtitle: 'Type each word to restore the classroom lights.'
      };
    }
    if (this.gameType === 'correct_the_record') {
      return {
        title:    'BONUS DRILL: CORRECT THE RECORD',
        subtitle: 'Type the corrected sentence exactly.'
      };
    }
    return {
      title:    'BONUS DRILL: FALLING KEYS',
      subtitle: 'Improve your home row reflexes!'
    };
  }

  _showResults() {
    if (this.gameType === 'keep_lights_on') {
      this._showKTLOResults();
    } else if (this.gameType === 'correct_the_record') {
      this._showCTRResults();
    } else {
      this._showCFKResults();
    }
  }

  // ─── CFK HUD ─────────────────────────────────────────────────────────────────

  _buildCFKHUD(W, H) {
    this.add.rectangle(W / 2, 714, W, 2, PAL.boundary);

    this.hintText = this.add.text(W / 2, 730, 'Type the falling letter to catch it!', {
      fontFamily: FONT,
      fontSize:   '14px',
      color:      PAL.hint
    }).setOrigin(0.5, 0).setAlpha(0);

    this.scoreText = this.add.text(W / 2, 758, 'Caught: 0     Missed: 0', {
      fontFamily: FONT,
      fontSize:   '19px',
      color:      PAL.score
    }).setOrigin(0.5, 1).setAlpha(0);
  }

  _startCatchFallingKeys() {
    this.hintText.setAlpha(1);
    this.scoreText.setAlpha(1);
    this._spawnLetter();
  }

  // ─── KTLO HUD ────────────────────────────────────────────────────────────────

  _buildKTLOHUD(W, H) {
    // Dark overlay — alpha varies with lightLevel to dim the room
    this._bgOverlay = this.add.rectangle(W / 2, 400, W, 640, 0x000000).setAlpha(0);

    // Corrupted variant uses cold fluorescent palette instead of warm classroom yellow
    this._ktloLightOn  = this.isKTLOCorrupted ? 0xd0e8ff : PAL.lightOn;
    this._ktloLightOff = this.isKTLOCorrupted ? 0x1a1a22 : PAL.lightOff;
    const strokeColor  = this.isKTLOCorrupted ? 0x2244aa : 0x888800;

    // 5 lights across the upper game area
    const lightW = 130, lightH = 46, lightGap = 18;
    const totalW = 5 * lightW + 4 * lightGap;
    const lx0    = (W - totalW) / 2 + lightW / 2;
    for (let i = 0; i < 5; i++) {
      const rect = this.add.rectangle(lx0 + i * (lightW + lightGap), 125, lightW, lightH, this._ktloLightOn)
        .setStrokeStyle(2, strokeColor);
      this._lightRects.push(rect);
    }

    this.add.text(W / 2, 272, 'TYPE THIS WORD:', {
      fontFamily: FONT,
      fontSize:   '15px',
      color:      '#445566'
    }).setOrigin(0.5);

    this._wordText = this.add.text(W / 2, 334, '', {
      fontFamily: FONT,
      fontSize:   '52px',
      color:      '#003399',
      fontStyle:  'bold'
    }).setOrigin(0.5).setAlpha(0);

    this._inputText = this.add.text(W / 2, 422, '', {
      fontFamily: FONT,
      fontSize:   '30px',
      color:      '#006600'
    }).setOrigin(0.5).setAlpha(0);

    this._ktloScoreText = this.add.text(W / 2 - 90, 528, 'Words: 0', {
      fontFamily: FONT,
      fontSize:   '18px',
      color:      PAL.score
    }).setOrigin(0.5).setAlpha(0);

    this._ktloBlackoutText = this.add.text(W / 2 + 110, 528, 'Blackouts: 0', {
      fontFamily: FONT,
      fontSize:   '18px',
      color:      '#cc3300'
    }).setOrigin(0.5).setAlpha(0);
  }

  _startKeepLightsOn() {
    this._wordText.setAlpha(1);
    this._inputText.setAlpha(1);
    this._ktloScoreText.setAlpha(1);
    this._ktloBlackoutText.setAlpha(1);
    this._spawnKTLOWord();

    // One light drains per interval; configurable for harder variants
    const drainMs = this.config.lightDrainMs || (this.isKTLOCorrupted ? 3500 : 6000);
    this._lightTimer = this.time.addEvent({
      delay:         drainMs,
      callback:      this._drainLight,
      callbackScope: this,
      loop:          true
    });
  }

  // ─── KTLO — word lifecycle ────────────────────────────────────────────────────

  _spawnKTLOWord() {
    this.currentWord = this._wordPool[Phaser.Math.Between(0, this._wordPool.length - 1)];
    this.typedInput  = '';
    this._wordText.setText(this.currentWord).setColor('#003399');
    this._inputText.setText('> _').setColor('#006600');
  }

  _ktloOnKey(event) {
    if (this.gameOver) return;
    const key = event.key;
    if (key.length !== 1) return;   // ignore Backspace, Enter, arrows, etc.

    const expected = this.currentWord[this.typedInput.length];
    if (key.toLowerCase() === expected) {
      this.typedInput += key.toLowerCase();
      this._inputText.setText(`> ${this.typedInput}_`);
      if (this.typedInput === this.currentWord) {
        this._ktloCompleteWord();
      }
    } else {
      this._inputText.setColor('#cc0000');
      this.time.delayedCall(140, () => {
        if (!this.gameOver) this._inputText.setColor('#006600');
      });
      if (this.isKTLOCorrupted) {
        this.cameras.main.shake(120, 0.004);
      }
    }
  }

  _ktloCompleteWord() {
    this.wordsCompleted++;
    this._ktloScoreText.setText(`Words: ${this.wordsCompleted}`);

    this.lightLevel = Math.min(5, this.lightLevel + 1);
    this._updateKTLOLights();

    // Brief green flash on word, then next word
    this._wordText.setColor('#006600');
    this.time.delayedCall(220, () => {
      if (!this.gameOver) this._spawnKTLOWord();
    });
  }

  // ─── KTLO — lights ───────────────────────────────────────────────────────────

  _drainLight() {
    if (this.gameOver) return;
    this.lightLevel = Math.max(0, this.lightLevel - 1);
    this._updateKTLOLights();
    if (this.lightLevel === 0) this._ktloBlackout();
  }

  _ktloBlackout() {
    this.blackouts++;
    this._ktloBlackoutText.setText(`Blackouts: ${this.blackouts}`);

    // Dramatic dark moment — hide the word so the player feels the blackout
    this._bgOverlay.setAlpha(0.88);
    this._wordText.setAlpha(0);
    this._inputText.setAlpha(0);

    if (this.isKTLOCorrupted) {
      this._ktloShowBlackoutReveal();
    }

    this.time.delayedCall(700, () => {
      if (!this.gameOver) {
        this.lightLevel = 2;
        this._updateKTLOLights();
        this._wordText.setAlpha(1);
        this._inputText.setAlpha(1);
      }
    });
  }

  _ktloShowBlackoutReveal() {
    const W = 1024;
    const H = 768;
    // TODO: tie reveal choice to act progress / MemoryState for narrative weight
    // TODO: write revealed detail to MemoryState so story can reference it later
    const reveals = [
      'SECOND WORKSTATION ACTIVE',
      'DOOR: OPEN',
      'FACE FORWARD',
      'DO NOT TURN AROUND'
    ];
    const msg = reveals[Phaser.Math.Between(0, reveals.length - 1)];

    const revealText = this.add.text(W / 2, H / 2, msg, {
      fontFamily: FONT,
      fontSize:   '28px',
      color:      '#ffffff',
      fontStyle:  'bold'
    }).setOrigin(0.5).setDepth(10);

    // Flash for ~200ms, then replace with system correction line
    this.time.delayedCall(200, () => {
      revealText.destroy();
      if (this.gameOver) return;

      const corrText = this.add.text(W / 2, H / 2, 'DISPLAY ERROR CORRECTED', {
        fontFamily: FONT,
        fontSize:   '16px',
        color:      '#aaaaaa'
      }).setOrigin(0.5).setDepth(10);

      // Fade out before the 700ms blackout ends
      this.time.delayedCall(300, () => {
        this.tweens.add({
          targets:    corrText,
          alpha:      0,
          duration:   180,
          onComplete: () => corrText.destroy()
        });
      });
    });
  }

  _updateKTLOLights() {
    this._lightRects.forEach((rect, i) => {
      rect.setFillStyle(i < this.lightLevel ? this._ktloLightOn : this._ktloLightOff);
    });
    this._bgOverlay.setAlpha((1 - this.lightLevel / 5) * 0.62);
  }

  // ─── KTLO — results ──────────────────────────────────────────────────────────

  _getKTLOGrade() {
    if (this.blackouts === 0) return { label: '★  GOLD STAR  ★', color: PAL.gold   };
    if (this.blackouts <= 1)  return { label: 'GOOD WORK',      color: PAL.caught  };
    return                     { label: 'NEEDS PRACTICE',   color: PAL.missed  };
  }

  _showKTLOResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getKTLOGrade();

    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);
    this.add.rectangle(W / 2, H / 2, 460, 310, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 118, 'DRILL COMPLETE', {
      fontFamily: FONT, fontSize: '23px', color: '#003399', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 62, grade.label, {
      fontFamily: FONT, fontSize: '28px', color: grade.color, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 6,
      `${this.wordsCompleted} Word${this.wordsCompleted !== 1 ? 's' : ''} Completed`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.caught
    }).setOrigin(0.5);

    const blackoutColor = this.blackouts > 0 ? PAL.missed : PAL.caught;
    this.add.text(W / 2, H / 2 + 36,
      `${this.blackouts} Blackout${this.blackouts !== 1 ? 's' : ''}`, {
        fontFamily: FONT, fontSize: '20px', color: blackoutColor
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: write KTLO result to MemoryState (blackouts → disclosure+, word count → obedience+)

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── CTR HUD ─────────────────────────────────────────────────────────────────

  _buildCTRHUD(W, H) {
    // Institutional document form panel — pale, slightly off-white
    this.add.rectangle(W / 2, 430, 700, 420, 0xf4f0e8)
      .setStrokeStyle(2, 0x99887a);

    // Static form labels — always visible, give the form its official character
    this.add.text(182, 278, 'ORIGINAL RECORD:', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa'
    });
    this.add.rectangle(W / 2, 333, 640, 1, 0xccbbaa);
    this.add.text(182, 354, 'CORRECTED ENTRY:', {
      fontFamily: FONT, fontSize: '11px', color: '#445566'
    });

    // Dynamic content — hidden until _startCorrectTheRecord()
    this._ctrLabelText = this.add.text(W / 2, 248, '', {
      fontFamily: FONT, fontSize: '13px', color: '#888877', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this._ctrOriginalText = this.add.text(W / 2, 306, '', {
      fontFamily: FONT, fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(0.5).setAlpha(0);

    this._ctrTargetText = this.add.text(W / 2, 384, '', {
      fontFamily: FONT, fontSize: '22px', color: '#003399', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this._ctrInputText = this.add.text(W / 2, 448, '> _', {
      fontFamily: FONT, fontSize: '26px', color: '#006600'
    }).setOrigin(0.5).setAlpha(0);

    // Stamp — briefly replaces input line when a record is completed
    this._ctrStampText = this.add.text(W / 2, 448, 'RECORD CORRECTED', {
      fontFamily: FONT, fontSize: '26px', color: '#cc0000', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this._ctrProgressText = this.add.text(W / 2, 556, `Records Corrected: 0 / ${this._ctrRecords.length}`, {
      fontFamily: FONT, fontSize: '16px', color: PAL.score
    }).setOrigin(0.5).setAlpha(0);
  }

  _startCorrectTheRecord() {
    this._ctrLabelText.setAlpha(1);
    this._ctrOriginalText.setAlpha(1);
    this._ctrTargetText.setAlpha(1);
    this._ctrInputText.setAlpha(1);
    this._ctrProgressText.setAlpha(1);
    this._spawnCTRRecord();
  }

  // ─── CTR — record lifecycle ───────────────────────────────────────────────────

  _spawnCTRRecord() {
    const record = this._ctrRecords[this._ctrIndex];
    if (!record) { this._endGame(); return; }

    this._ctrTyped = '';
    this._ctrLabelText.setText(record.label);
    this._ctrOriginalText.setText(record.displayedText);
    this._ctrTargetText.setText(record.targetText);
    this._ctrInputText.setText('> _').setColor('#006600').setAlpha(1);
    this._ctrStampText.setAlpha(0);
  }

  _ctrOnKey(event) {
    if (this.gameOver) return;
    const key = event.key;

    if (key === 'Backspace') {
      event.preventDefault();
      if (this._ctrTyped.length > 0) {
        this._ctrTyped = this._ctrTyped.slice(0, -1);
        this._ctrUpdateInput();
      }
      return;
    }

    if (key.length !== 1) return;

    const record   = this._ctrRecords[this._ctrIndex];
    const target   = record ? record.targetText : '';
    const pos      = this._ctrTyped.length;
    if (!target || pos >= target.length) return;

    const expected = target[pos];
    if (key.toUpperCase() === expected.toUpperCase()) {
      this._ctrTyped += expected;  // append the canonical character from the target
      this._ctrUpdateInput();
      if (this._ctrTyped === target) {
        this._ctrCompleteRecord();
      }
    } else {
      // Wrong key — brief red flash, no structural penalty in middle variant
      this._ctrInputText.setColor('#cc0000');
      this.time.delayedCall(140, () => {
        if (!this.gameOver) this._ctrInputText.setColor('#006600');
      });
      // TODO corrupted/finale: wrong correction triggers narrative consequence
      // TODO MemoryState: accumulate wrong-correction count → disclosure axis
    }
  }

  _ctrUpdateInput() {
    const record = this._ctrRecords[this._ctrIndex];
    const cursor = this._ctrTyped.length < (record ? record.targetText.length : 0) ? '_' : '';
    this._ctrInputText.setText(`> ${this._ctrTyped}${cursor}`);
  }

  _ctrCompleteRecord() {
    this._ctrCompleted++;
    this._ctrProgressText.setText(`Records Corrected: ${this._ctrCompleted} / ${this._ctrRecords.length}`);
    this._showCTRStamp(() => {
      this._ctrIndex++;
      if (this._ctrIndex >= this._ctrRecords.length) {
        this._endGame();
      } else {
        this._spawnCTRRecord();
      }
    });
  }

  _showCTRStamp(onComplete) {
    this._ctrInputText.setAlpha(0);
    this._ctrStampText.setAlpha(1);

    this.time.delayedCall(1000, () => {
      this._ctrStampText.setAlpha(0);
      if (onComplete && !this.gameOver) onComplete();
    });
  }

  // ─── CTR — grade / results ────────────────────────────────────────────────────

  _getCTRGrade() {
    const total = this._ctrRecords.length;
    if (this._ctrCompleted >= total) return { label: 'PERFECT FORM',  color: PAL.caught };
    if (this._ctrCompleted >= 1)     return { label: 'ACCEPTABLE',    color: PAL.gold   };
    return                            { label: 'INCOMPLETE',      color: PAL.missed };
  }

  _showCTRResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getCTRGrade();

    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);
    this.add.rectangle(W / 2, H / 2, 460, 310, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 118, 'DRILL COMPLETE', {
      fontFamily: FONT, fontSize: '23px', color: '#003399', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 62, grade.label, {
      fontFamily: FONT, fontSize: '28px', color: grade.color, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 6,
      `${this._ctrCompleted} / ${this._ctrRecords.length} Records Corrected`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.score
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: write CTR result to MemoryState (completed vs incomplete → narrative consequence)
    // TODO: corrupted/finale variant — player can accept or reject each correction individually
    // TODO: tie record labels to act progress for narrative coherence
    // TODO: official statement editing reappears in Act 8 finale
    // TODO: visual document corruption and line-replacement animation for later variant

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Return to TypingScene ───────────────────────────────────────────────────

  _complete() {
    let result;
    if (this.gameType === 'keep_lights_on') {
      result = { wordsCompleted: this.wordsCompleted, blackouts: this.blackouts };
    } else if (this.gameType === 'correct_the_record') {
      result = { completed: this._ctrCompleted, total: this._ctrRecords.length };
    } else {
      result = { caught: this.caught, missed: this.missed };
    }

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
