// MiniGameScene — interstitial mini-games that appear between main lessons.
// Routes by config.type. Supports: 'catch_falling_keys', 'keep_lights_on', 'correct_the_record',
//                                   'door_close', 'stay_in_your_seat',
//                                   'listen_and_type', 'erase_chalkboard'.
// Future types: 'typing_race', 'final_correct_the_record'

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
    this.timeLeft      = this.config.duration || (['listen_and_type', 'erase_chalkboard'].includes(this.gameType) ? 40 : 30);
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

    // ── Door state ────────────────────────────────────────────────────────────
    this._doorOpen        = 100;  // 0–100: percentage of door open
    const defaultPhrases  = [
      'KEEP THE DOOR OPEN',
      'DO NOT LET IT CLOSE',
      'STAY AT YOUR DESK',
      'FACE THE SCREEN',
      'FINISH THE EXERCISE'
    ];
    this._doorPhrases     = this.config.phrases || defaultPhrases;
    this._doorPhraseIndex = 0;
    this._doorTyped       = '';
    this._doorCompleted   = 0;
    this._doorClosures    = 0;
    this._doorDrainTimer  = null;
    // UI refs — assigned in _buildDoorHUD
    this._doorGraphics    = null;
    this._doorPhraseText  = null;
    this._doorInputText   = null;
    this._doorScoreText   = null;
    this._doorClosureText = null;
    this._doorStatusText  = null;

    // ── Seat state ────────────────────────────────────────────────────────────
    this._turnAmount           = 20;   // 0–100: proximity to turning around
    this._seatLookedBackActive = false; // re-entry guard for _seatLookedBack
    const defaultSeatPhrases   = [
      'FACE THE SCREEN',
      'KEEP YOUR HANDS STILL',
      'FINISH THE EXERCISE',
      'DO NOT TURN AROUND',
      'GOOD CHILDREN STAY FOCUSED'
    ];
    this._seatPhrases     = this.config.phrases || defaultSeatPhrases;
    this._seatPhraseIndex = 0;
    this._seatTyped       = '';
    this._seatCompleted   = 0;
    this._seatLookbacks   = 0;
    this._seatDriftTimer  = null;
    // UI refs — assigned in _buildSeatHUD
    this._seatGraphics    = null;
    this._seatMeterLabel  = null;
    this._seatPhraseText  = null;
    this._seatInputText   = null;
    this._seatScoreText   = null;
    this._seatLookText    = null;

    // ── Listen state ─────────────────────────────────────────────────────────
    const defaultListenPrompts = [
      { displayedText: 'THE CLASSROOM WAS QUIET',    heardText: 'SHE SAID NO' },
      { displayedText: 'I DID NOT NOTICE ANYTHING',  heardText: 'I KEPT TYPING' },
      { displayedText: 'THE LESSON CONTINUED',       heardText: 'DO NOT TURN AROUND' }
    ];
    this._listenPrompts      = this.config.prompts || defaultListenPrompts;
    this._listenIndex        = 0;
    this._listenTyped        = '';
    this._listenCompleted    = 0;
    this._listenLocked       = false;
    this._listenFlickerMs    = 0;
    this._listenAdvanceTimer = null;
    // UI refs — assigned in _buildListenHUD
    this._listenDisplayedText = null;
    this._listenHeardText     = null;
    this._listenInputText     = null;
    this._listenHeardStamp    = null;
    this._listenProgressText  = null;

    // ── Chalkboard state ─────────────────────────────────────────────────────
    const defaultChalkLayers = [
      { visibleText: 'SHE WAS ABSENT',              hiddenText: 'SHE WAS NOT ABSENT', eraseWord: 'ERASE' },
      { visibleText: 'THE CLASSROOM WAS QUIET',     hiddenText: 'I HEARD HER',        eraseWord: 'WIPE' },
      { visibleText: 'THE CHILD STAYED FOCUSED',    hiddenText: 'DO NOT TURN AROUND', eraseWord: 'CORRECT' }
    ];
    this._chalkLayers      = this.config.layers || defaultChalkLayers;
    this._chalkIndex       = 0;
    this._chalkTyped       = '';
    this._chalkCompleted   = 0;
    this._chalkLocked      = false;
    this._chalkRevealTimer = null;
    // UI refs — assigned in _buildChalkHUD
    this._chalkBoard       = null;
    this._chalkVisibleText = null;
    this._chalkHiddenText  = null;
    this._chalkCommandText = null;
    this._chalkInputText   = null;
    this._chalkStatusText  = null;
    this._chalkProgressText = null;
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
      } else if (this.gameType === 'door_close') {
        this._buildDoorHUD(1024, 768);
      } else if (this.gameType === 'stay_in_your_seat') {
        this._buildSeatHUD(1024, 768);
      } else if (this.gameType === 'listen_and_type') {
        this._buildListenHUD(1024, 768);
      } else if (this.gameType === 'erase_chalkboard') {
        this._buildChalkHUD(1024, 768);
      }
      this._showIntro();
    } catch (e) {
      console.error('[MiniGameScene] create() failed:', e);
      this.time.delayedCall(100, this._complete, [], this);
    }
  }

  update(time, delta) {
    if (this.gameOver) return;
    if (this.gameType === 'listen_and_type') {
      this._updateHeardFlicker(delta);
      return;
    }
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
    } else if (this.gameType === 'door_close') {
      this._startDoorClose();
    } else if (this.gameType === 'stay_in_your_seat') {
      this._startStayInYourSeat();
    } else if (this.gameType === 'listen_and_type') {
      this._startListenAndType();
    } else if (this.gameType === 'erase_chalkboard') {
      this._startEraseChalkboard();
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
    } else if (this.gameType === 'door_close') {
      this._keyHandler = this._doorOnKey.bind(this);
    } else if (this.gameType === 'stay_in_your_seat') {
      this._keyHandler = this._seatOnKey.bind(this);
    } else if (this.gameType === 'listen_and_type') {
      this._keyHandler = this._listenOnKey.bind(this);
    } else if (this.gameType === 'erase_chalkboard') {
      this._keyHandler = this._chalkOnKey.bind(this);
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

    if (this._doorDrainTimer) {
      this._doorDrainTimer.remove(false);
      this._doorDrainTimer = null;
    }

    if (this._seatDriftTimer) {
      this._seatDriftTimer.remove(false);
      this._seatDriftTimer = null;
    }

    if (this._listenAdvanceTimer) {
      this._listenAdvanceTimer.remove(false);
      this._listenAdvanceTimer = null;
    }

    if (this._chalkRevealTimer) {
      this._chalkRevealTimer.remove(false);
      this._chalkRevealTimer = null;
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
    if (this.gameType === 'door_close') {
      return {
        title:    'BONUS DRILL: DO NOT LET THE DOOR CLOSE',
        subtitle: 'Type each phrase to keep the classroom door open.'
      };
    }
    if (this.gameType === 'stay_in_your_seat') {
      return {
        title:    'BONUS DRILL: STAY IN YOUR SEAT',
        subtitle: 'Type each phrase to stay focused on the screen.'
      };
    }
    if (this.gameType === 'listen_and_type') {
      return {
        title:    'BONUS DRILL: LISTEN AND TYPE',
        subtitle: 'Type what you hear, not what you see.'
      };
    }
    if (this.gameType === 'erase_chalkboard') {
      return {
        title:    'BONUS DRILL: ERASE THE CHALKBOARD',
        subtitle: 'Type each command to clean the board.'
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
    } else if (this.gameType === 'door_close') {
      this._showDoorResults();
    } else if (this.gameType === 'stay_in_your_seat') {
      this._showSeatResults();
    } else if (this.gameType === 'listen_and_type') {
      this._showListenResults();
    } else if (this.gameType === 'erase_chalkboard') {
      this._showChalkResults();
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

  // ─── Door HUD ─────────────────────────────────────────────────────────────────

  _buildDoorHUD(W, H) {
    // Door graphic — drawn by _updateDoorVisual(), initialised here
    this._doorGraphics = this.add.graphics();
    this._updateDoorVisual();

    // "DOOR" label above the graphic
    this.add.text(145, 126, 'DOOR', {
      fontFamily: FONT, fontSize: '13px', color: PAL.hint
    }).setOrigin(0.5);

    // Open percentage below the graphic
    this._doorStatusText = this.add.text(145, 636, 'OPEN: 100%', {
      fontFamily: FONT, fontSize: '12px', color: '#006600'
    }).setOrigin(0.5);

    // Phrase area — right of door graphic
    this.add.text(625, 260, 'TYPE THIS PHRASE:', {
      fontFamily: FONT, fontSize: '13px', color: '#445566'
    }).setOrigin(0.5);

    this._doorPhraseText = this.add.text(625, 330, '', {
      fontFamily: FONT, fontSize: '22px', color: '#003399', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 680 }
    }).setOrigin(0.5).setAlpha(0);

    this._doorInputText = this.add.text(625, 420, '> _', {
      fontFamily: FONT, fontSize: '22px', color: '#006600'
    }).setOrigin(0.5).setAlpha(0);

    this._doorScoreText = this.add.text(480, 530, 'Phrases: 0', {
      fontFamily: FONT, fontSize: '16px', color: PAL.score
    }).setOrigin(0.5).setAlpha(0);

    this._doorClosureText = this.add.text(740, 530, 'Closures: 0', {
      fontFamily: FONT, fontSize: '16px', color: '#cc3300'
    }).setOrigin(0.5).setAlpha(0);
  }

  _startDoorClose() {
    this._doorPhraseText.setAlpha(1);
    this._doorInputText.setAlpha(1);
    this._doorScoreText.setAlpha(1);
    this._doorClosureText.setAlpha(1);
    this._spawnDoorPhrase();

    const drainMs = this.config.drainIntervalMs || 2500;
    this._doorDrainTimer = this.time.addEvent({
      delay:         drainMs,
      callback:      this._doorDrain,
      callbackScope: this,
      loop:          true
    });
  }

  // ─── Door — phrase lifecycle ──────────────────────────────────────────────────

  _spawnDoorPhrase() {
    const phrase = this._doorPhrases[this._doorPhraseIndex % this._doorPhrases.length];
    this._doorTyped = '';
    this._doorPhraseText.setText(phrase).setColor('#003399');
    this._doorInputText.setText('> _').setColor('#006600').setAlpha(1);
    // TODO: act-based phrase selection tied to MemoryState / story progress
  }

  _doorOnKey(event) {
    if (this.gameOver) return;
    const key = event.key;

    if (key === 'Backspace') {
      event.preventDefault();
      if (this._doorTyped.length > 0) {
        this._doorTyped = this._doorTyped.slice(0, -1);
        this._doorUpdateInput();
      }
      return;
    }

    if (key.length !== 1) return;

    const target = this._doorPhrases[this._doorPhraseIndex % this._doorPhrases.length];
    const pos    = this._doorTyped.length;
    if (pos >= target.length) return;

    const expected = target[pos];
    if (key.toUpperCase() === expected.toUpperCase()) {
      this._doorTyped += expected;
      this._doorUpdateInput();
      if (this._doorTyped === target) {
        this._doorCompletePhrase();
      }
    } else {
      // Wrong key — brief red flash, no structural penalty in middle variant
      this._doorInputText.setColor('#cc0000');
      this.time.delayedCall(140, () => {
        if (!this.gameOver) this._doorInputText.setColor('#006600');
      });
      // TODO corrupted: wrong key accelerates door drain
      // TODO MemoryState: accumulate wrong-key count → disclosure axis
    }
  }

  _doorUpdateInput() {
    const target = this._doorPhrases[this._doorPhraseIndex % this._doorPhrases.length];
    const cursor = this._doorTyped.length < target.length ? '_' : '';
    this._doorInputText.setText(`> ${this._doorTyped}${cursor}`);
  }

  _doorCompletePhrase() {
    this._doorCompleted++;
    this._doorPhraseIndex++;
    this._doorScoreText.setText(`Phrases: ${this._doorCompleted}`);

    this._doorOpen = Math.min(100, this._doorOpen + 30);
    this._updateDoorVisual();

    // Brief green confirmation, then next phrase
    this._doorPhraseText.setColor('#006600');
    this.time.delayedCall(300, () => {
      if (!this.gameOver) this._spawnDoorPhrase();
    });
  }

  // ─── Door — drain / closure ───────────────────────────────────────────────────

  _doorDrain() {
    if (this.gameOver) return;
    const amount = this.config.drainAmount || 8;
    this._doorOpen = Math.max(0, this._doorOpen - amount);
    this._updateDoorVisual();
    if (this._doorOpen <= 0) this._doorClosed();
  }

  _doorClosed() {
    this._doorClosures++;
    this._doorClosureText.setText(`Closures: ${this._doorClosures}`);

    // Brief DOOR CLOSED state — hide input so the moment lands
    this._doorPhraseText.setText('DOOR CLOSED').setColor('#cc0000');
    this._doorInputText.setAlpha(0);

    this.time.delayedCall(800, () => {
      if (!this.gameOver) {
        this._doorOpen = 55;
        this._updateDoorVisual();
        this._spawnDoorPhrase();
        this._doorInputText.setAlpha(1);
      }
    });
  }

  _updateDoorVisual() {
    const doorX = 50, doorY = 140, doorW = 190, doorH = 480;
    const openPx = Math.floor(doorW * Math.max(0, this._doorOpen) / 100);

    this._doorGraphics.clear();

    // Light visible through the gap (left side of frame = open side)
    this._doorGraphics.fillStyle(0xddd0b8);
    this._doorGraphics.fillRect(doorX, doorY, openPx, doorH);

    // Door panel — swings closed from the right
    this._doorGraphics.fillStyle(0x7a5c44);
    this._doorGraphics.fillRect(doorX + openPx, doorY, doorW - openPx, doorH);

    // Frame drawn over both fills
    this._doorGraphics.lineStyle(3, 0x443322);
    this._doorGraphics.strokeRect(doorX, doorY, doorW, doorH);

    // Status text
    if (this._doorStatusText) {
      const pct = Math.max(0, Math.round(this._doorOpen));
      const col = pct > 30 ? '#006600' : pct > 10 ? '#cc8800' : '#cc0000';
      this._doorStatusText.setText(`OPEN: ${pct}%`).setColor(col);
    }
  }

  // ─── Door — grade / results ───────────────────────────────────────────────────

  _getDoorGrade() {
    if (this._doorClosures === 0) return { label: 'DOOR HELD OPEN', color: PAL.caught };
    if (this._doorClosures <= 1)  return { label: 'MOSTLY OPEN',    color: PAL.gold   };
    return                         { label: 'DOOR CLOSED',      color: PAL.missed };
  }

  _showDoorResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getDoorGrade();

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
      `${this._doorCompleted} Phrase${this._doorCompleted !== 1 ? 's' : ''} Completed`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.score
    }).setOrigin(0.5);

    const closureColor = this._doorClosures > 0 ? PAL.missed : PAL.caught;
    this.add.text(W / 2, H / 2 + 36,
      `${this._doorClosures} Closure${this._doorClosures !== 1 ? 's' : ''}`, {
        fontFamily: FONT, fontSize: '20px', color: closureColor
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: write Door result to MemoryState (closures → disclosure+, phrases → obedience+)
    // TODO: corrupted variant — prompts shift to KEEP THE DOOR CLOSED / DO NOT INTERRUPT / GOOD CHILDREN WAIT
    // TODO: optional resistance mechanic — player can choose to ignore the system prompt
    // TODO: act-based phrase selection tied to story progress
    // TODO: visual shadow cast behind door for atmosphere
    // TODO: audio cue for door handle / hinge during audio pass

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Seat HUD ─────────────────────────────────────────────────────────────────

  _buildSeatHUD(W, H) {
    // Graphics object redrawn every frame via _updateSeatVisual
    this._seatGraphics = this.add.graphics();
    this._updateSeatVisual();

    // Static labels
    this.add.text(145, 128, 'WORKSTATION', {
      fontFamily: FONT, fontSize: '12px', color: PAL.hint
    }).setOrigin(0.5);

    // TURNING meter label — updated in _updateSeatVisual
    this._seatMeterLabel = this.add.text(145, 589, 'TURNING: 20%', {
      fontFamily: FONT, fontSize: '11px', color: '#cc8800'
    }).setOrigin(0.5);

    // Phrase area (right side)
    this.add.text(635, 260, 'TYPE THIS PHRASE:', {
      fontFamily: FONT, fontSize: '13px', color: '#445566'
    }).setOrigin(0.5);

    this._seatPhraseText = this.add.text(635, 330, '', {
      fontFamily: FONT, fontSize: '22px', color: '#003399', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 680 }
    }).setOrigin(0.5).setAlpha(0);

    this._seatInputText = this.add.text(635, 420, '> _', {
      fontFamily: FONT, fontSize: '22px', color: '#006600'
    }).setOrigin(0.5).setAlpha(0);

    this._seatScoreText = this.add.text(490, 530, 'Phrases: 0', {
      fontFamily: FONT, fontSize: '16px', color: PAL.score
    }).setOrigin(0.5).setAlpha(0);

    this._seatLookText = this.add.text(760, 530, 'Looked Back: 0', {
      fontFamily: FONT, fontSize: '16px', color: '#cc3300'
    }).setOrigin(0.5).setAlpha(0);
  }

  _startStayInYourSeat() {
    this._seatPhraseText.setAlpha(1);
    this._seatInputText.setAlpha(1);
    this._seatScoreText.setAlpha(1);
    this._seatLookText.setAlpha(1);
    this._spawnSeatPhrase();

    const driftMs = this.config.driftIntervalMs || 2000;
    this._seatDriftTimer = this.time.addEvent({
      delay:         driftMs,
      callback:      this._seatDrift,
      callbackScope: this,
      loop:          true
    });
  }

  // ─── Seat — phrase lifecycle ──────────────────────────────────────────────────

  _spawnSeatPhrase() {
    const phrase = this._seatPhrases[this._seatPhraseIndex % this._seatPhrases.length];
    this._seatTyped = '';
    this._seatPhraseText.setText(phrase).setColor('#003399');
    this._seatInputText.setText('> _').setColor('#006600').setAlpha(1);
    // TODO: act-based phrase selection tied to MemoryState / story progress
  }

  _seatOnKey(event) {
    if (this.gameOver) return;
    const key = event.key;

    if (key === 'Backspace') {
      event.preventDefault();
      if (this._seatTyped.length > 0) {
        this._seatTyped = this._seatTyped.slice(0, -1);
        this._seatUpdateInput();
      }
      return;
    }

    if (key.length !== 1) return;

    const target = this._seatPhrases[this._seatPhraseIndex % this._seatPhrases.length];
    const pos    = this._seatTyped.length;
    if (pos >= target.length) return;

    const expected = target[pos];
    if (key.toUpperCase() === expected.toUpperCase()) {
      this._seatTyped += expected;
      this._seatUpdateInput();
      if (this._seatTyped === target) {
        this._seatCompletePhrase();
      }
    } else {
      // Wrong key — red flash + small turn increase
      this._seatInputText.setColor('#cc0000');
      this.time.delayedCall(140, () => {
        if (!this.gameOver) this._seatInputText.setColor('#006600');
      });
      this._turnAmount = Math.min(100, this._turnAmount + 8);
      this._updateSeatVisual();
      if (this._turnAmount >= 100) this._seatLookedBack();
      // TODO corrupted: wrong key accelerates turn more aggressively
      // TODO MemoryState: accumulate wrong-key count → disclosure axis
    }
  }

  _seatUpdateInput() {
    const target = this._seatPhrases[this._seatPhraseIndex % this._seatPhrases.length];
    const cursor = this._seatTyped.length < target.length ? '_' : '';
    this._seatInputText.setText(`> ${this._seatTyped}${cursor}`);
  }

  _seatCompletePhrase() {
    this._seatCompleted++;
    this._seatPhraseIndex++;
    this._seatScoreText.setText(`Phrases: ${this._seatCompleted}`);

    this._turnAmount = Math.max(0, this._turnAmount - 30);
    this._updateSeatVisual();

    this._seatPhraseText.setColor('#006600');
    this.time.delayedCall(300, () => {
      if (!this.gameOver) this._spawnSeatPhrase();
    });
  }

  // ─── Seat — drift / lookback ──────────────────────────────────────────────────

  _seatDrift() {
    if (this.gameOver) return;
    const amount = this.config.driftAmount || 9;
    this._turnAmount = Math.min(100, this._turnAmount + amount);
    this._updateSeatVisual();
    if (this._turnAmount >= 100) this._seatLookedBack();
  }

  _seatLookedBack() {
    if (this._seatLookedBackActive) return;  // prevent re-entry during reset delay
    this._seatLookedBackActive = true;
    this._seatLookbacks++;
    this._seatLookText.setText(`Looked Back: ${this._seatLookbacks}`);

    this._seatPhraseText.setText('LOOKED BACK').setColor('#cc0000');
    this._seatInputText.setAlpha(0);
    this.cameras.main.shake(200, 0.006);

    // TODO corrupted: one-frame glimpse of figure near door during the shake
    // TODO corrupted: child nearly turns despite correct typing

    this.time.delayedCall(800, () => {
      this._seatLookedBackActive = false;
      if (!this.gameOver) {
        this._turnAmount = 55;
        this._updateSeatVisual();
        this._spawnSeatPhrase();
        this._seatInputText.setAlpha(1);
      }
    });
  }

  _updateSeatVisual() {
    const gfx  = this._seatGraphics;
    const turn = Math.max(0, Math.min(100, this._turnAmount));
    gfx.clear();

    // ── Desk ──────────────────────────────────────────────────────────────────
    gfx.fillStyle(0xb08060);
    gfx.fillRect(30, 545, 240, 28);
    gfx.lineStyle(2, 0x7a5840);
    gfx.strokeRect(30, 545, 240, 28);

    // ── Monitor ───────────────────────────────────────────────────────────────
    gfx.fillStyle(0x222233);
    gfx.fillRect(70, 405, 110, 82);
    gfx.lineStyle(2, 0x111122);
    gfx.strokeRect(70, 405, 110, 82);

    // Screen glow dims as child turns away
    const glowAlpha = Math.max(0.25, 1 - (turn / 100) * 0.75);
    gfx.fillStyle(0x3355aa, glowAlpha);
    gfx.fillRect(78, 412, 94, 68);

    // ── Monitor stand ─────────────────────────────────────────────────────────
    gfx.fillStyle(0x555566);
    gfx.fillRect(113, 487, 24, 58);

    // ── Body ──────────────────────────────────────────────────────────────────
    gfx.fillStyle(0x4466aa);
    gfx.fillRect(132, 395, 26, 150);

    // ── Head — shifts right as turn increases ──────────────────────────────────
    const headX = 145 + Math.round(turn * 0.28);
    const headY = 370;
    gfx.fillStyle(0xc8a882);
    gfx.fillRect(headX - 14, headY - 14, 28, 28);
    gfx.lineStyle(1, 0x9a7a62);
    gfx.strokeRect(headX - 14, headY - 14, 28, 28);

    // Nose line — rotates from LEFT (facing screen) to RIGHT (facing door)
    const angle = Math.PI * (1 - turn / 100);
    const noseX = headX + Math.cos(angle) * 18;
    const noseY = headY + Math.sin(angle) * 8;
    gfx.lineStyle(3, 0x443322);
    gfx.lineBetween(headX, headY, Math.round(noseX), Math.round(noseY));

    // ── Turn meter ─────────────────────────────────────────────────────────────
    const mX = 30, mY = 602, mW = 240, mH = 14;
    gfx.fillStyle(0xbbbbaa);
    gfx.fillRect(mX, mY, mW, mH);

    const fillW   = Math.floor(mW * turn / 100);
    const fillCol = turn < 40 ? 0x006600 : turn < 70 ? 0xcc8800 : 0xcc0000;
    gfx.fillStyle(fillCol);
    gfx.fillRect(mX, mY, fillW, mH);

    gfx.lineStyle(2, 0x888877);
    gfx.strokeRect(mX, mY, mW, mH);

    // Update meter label text object
    if (this._seatMeterLabel) {
      const col = turn < 40 ? '#006600' : turn < 70 ? '#cc8800' : '#cc0000';
      this._seatMeterLabel.setText(`TURNING: ${Math.round(turn)}%`).setColor(col);
    }
  }

  // ─── Seat — grade / results ───────────────────────────────────────────────────

  _getSeatGrade() {
    if (this._seatLookbacks === 0) return { label: 'FOCUSED',        color: PAL.caught };
    if (this._seatLookbacks <= 1)  return { label: 'MOSTLY FOCUSED', color: PAL.gold   };
    return                          { label: 'DISTRACTED',       color: PAL.missed };
  }

  _showSeatResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getSeatGrade();

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
      `${this._seatCompleted} Phrase${this._seatCompleted !== 1 ? 's' : ''} Completed`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.score
    }).setOrigin(0.5);

    const lookColor = this._seatLookbacks > 0 ? PAL.missed : PAL.caught;
    this.add.text(W / 2, H / 2 + 36,
      `${this._seatLookbacks} Looked Back`, {
        fontFamily: FONT, fontSize: '20px', color: lookColor
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: write Seat result to MemoryState (lookbacks → disclosure+, phrases → obedience+)
    // TODO: corrupted variant — child turns despite correct typing; one-frame glimpse near door
    // TODO: visual shadow cast behind the child
    // TODO: act-based phrase selection tied to story progress
    // TODO: optional resistance mechanic — looking back becomes desirable late game

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Listen HUD ─────────────────────────────────────────────────────────────

  _buildListenHUD(W, H) {
    this.add.rectangle(W / 2, 410, 720, 430, 0xf7f7f3)
      .setStrokeStyle(2, 0x9a9a88);

    this.add.text(W / 2, 168, 'OFFICIAL TEXT:', {
      fontFamily: FONT, fontSize: '12px', color: '#777766'
    }).setOrigin(0.5);

    this._listenDisplayedText = this.add.text(W / 2, 220, '', {
      fontFamily: FONT, fontSize: '24px', color: '#003399', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 650 }
    }).setOrigin(0.5).setAlpha(0);

    this.add.rectangle(W / 2, 292, 640, 1, 0xc8c8b8);

    this.add.text(W / 2, 334, 'HEARD:', {
      fontFamily: FONT, fontSize: '12px', color: '#777766'
    }).setOrigin(0.5);

    this._listenHeardText = this.add.text(W / 2, 390, '', {
      fontFamily: FONT, fontSize: '28px', color: '#334455', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 650 }
    }).setOrigin(0.5).setAlpha(0);

    this._listenInputText = this.add.text(W / 2, 490, '> _', {
      fontFamily: FONT, fontSize: '24px', color: '#006600',
      align: 'center', wordWrap: { width: 650 }
    }).setOrigin(0.5).setAlpha(0);

    this._listenHeardStamp = this.add.text(W / 2, 490, 'HEARD', {
      fontFamily: FONT, fontSize: '30px', color: '#006600', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    this._listenProgressText = this.add.text(W / 2, 588, `Heard: 0 / ${this._listenPrompts.length}`, {
      fontFamily: FONT, fontSize: '16px', color: PAL.score
    }).setOrigin(0.5).setAlpha(0);
  }

  _startListenAndType() {
    this._listenDisplayedText.setAlpha(1);
    this._listenHeardText.setAlpha(1);
    this._listenInputText.setAlpha(1);
    this._listenProgressText.setAlpha(1);
    this._spawnListenPrompt();
  }

  // ─── Listen — prompt lifecycle ──────────────────────────────────────────────

  _spawnListenPrompt() {
    const prompt = this._listenPrompts[this._listenIndex];
    if (!prompt) { this._endGame(); return; }

    this._listenTyped = '';
    this._listenLocked = false;
    this._listenDisplayedText
      .setText(prompt.displayedText)
      .setColor('#003399')
      .setAlpha(1)
      .setX(512);
    this._listenHeardText
      .setText(prompt.heardText)
      .setColor('#334455')
      .setAlpha(0.72)
      .setScale(1)
      .setX(512);
    this._listenInputText.setText('> _').setColor('#006600').setAlpha(1).setX(512);
    this._listenHeardStamp.setAlpha(0);
  }

  _listenOnKey(event) {
    if (this.gameOver || this._listenLocked) return;
    const key = event.key;

    if (key === 'Backspace') {
      event.preventDefault();
      if (this._listenTyped.length > 0) {
        this._listenTyped = this._listenTyped.slice(0, -1);
        this._listenUpdateInput();
      }
      return;
    }

    if (key.length !== 1) return;

    const prompt = this._listenPrompts[this._listenIndex];
    const target = prompt ? prompt.heardText : '';
    const pos    = this._listenTyped.length;
    if (!target || pos >= target.length) return;

    const expected = target[pos];
    if (key.toUpperCase() === expected.toUpperCase()) {
      this._listenTyped += expected;
      this._listenUpdateInput();
      if (this._listenTyped === target) {
        this._listenCompletePrompt();
      }
    } else {
      this._listenInputText.setColor('#cc0000');
      this.cameras.main.shake(90, 0.003);
      this.tweens.add({
        targets: this._listenInputText,
        x:       512 + Phaser.Math.Between(-8, 8),
        yoyo:    true,
        repeat:  2,
        duration: 32,
        onComplete: () => {
          if (!this.gameOver) this._listenInputText.setX(512).setColor('#006600');
        }
      });
      // TODO: option to type official text instead of heard text
    }
  }

  _listenUpdateInput() {
    const prompt = this._listenPrompts[this._listenIndex];
    const target = prompt ? prompt.heardText : '';
    const cursor = this._listenTyped.length < target.length ? '_' : '';
    this._listenInputText.setText(`> ${this._listenTyped}${cursor}`);
  }

  _listenCompletePrompt() {
    this._listenLocked = true;
    this._listenCompleted++;
    this._listenProgressText.setText(`Heard: ${this._listenCompleted} / ${this._listenPrompts.length}`);
    this._listenInputText.setAlpha(0);
    this._listenHeardStamp.setAlpha(1);
    this._listenHeardText.setColor('#006600').setAlpha(1).setScale(1);

    this._listenAdvanceTimer = this.time.delayedCall(650, () => {
      this._listenAdvanceTimer = null;
      if (this.gameOver) return;
      this._listenIndex++;
      if (this._listenIndex >= this._listenPrompts.length) {
        this._endGame();
      } else {
        this._spawnListenPrompt();
      }
    });
  }

  _updateHeardFlicker(delta) {
    if (!this._listenHeardText || this._listenLocked) return;
    this._listenFlickerMs += delta;
    if (this._listenFlickerMs < 90) return;
    this._listenFlickerMs = 0;

    const alpha = Phaser.Math.FloatBetween(0.48, 0.86);
    const xJitter = Phaser.Math.Between(-2, 2);
    const color = Phaser.Math.Between(0, 4) === 0 ? '#557070' : '#334455';
    this._listenHeardText
      .setAlpha(alpha)
      .setColor(color)
      .setX(512 + xJitter);
  }

  // ─── Listen — grade / results ───────────────────────────────────────────────

  _getListenGrade() {
    const total = this._listenPrompts.length;
    if (this._listenCompleted >= total) return { label: 'ALL SIGNALS HEARD', color: PAL.caught };
    if (this._listenCompleted >= 1)     return { label: 'PARTIAL SIGNAL',    color: PAL.gold   };
    return                               { label: 'NOT HEARD',         color: PAL.missed };
  }

  _showListenResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getListenGrade();

    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);
    this.add.rectangle(W / 2, H / 2, 500, 310, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 118, 'DRILL COMPLETE', {
      fontFamily: FONT, fontSize: '23px', color: '#003399', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 62, grade.label, {
      fontFamily: FONT, fontSize: '27px', color: grade.color, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 6,
      `${this._listenCompleted} / ${this._listenPrompts.length} Prompt${this._listenPrompts.length !== 1 ? 's' : ''} Heard`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.score
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: real muffled audio pass
    // TODO: corrupted variant where displayedText tries to overwrite heardText
    // TODO: option to type official text instead of heard text
    // TODO: MemoryState writes
    // TODO: final witness statement connection

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Chalkboard HUD ────────────────────────────────────────────────────────

  _buildChalkHUD(W, H) {
    this.add.rectangle(W / 2, 378, 760, 420, 0x6b5136)
      .setStrokeStyle(3, 0x3c2b1d);
    this._chalkBoard = this.add.rectangle(W / 2, 378, 710, 365, 0x13261d)
      .setStrokeStyle(2, 0xd8c790);

    this.add.text(W / 2, 148, 'CHALKBOARD:', {
      fontFamily: FONT, fontSize: '12px', color: '#d8d8c8'
    }).setOrigin(0.5);

    this._chalkHiddenText = this.add.text(W / 2, 342, '', {
      fontFamily: FONT, fontSize: '32px', color: '#ffb0a0', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 640 }
    }).setOrigin(0.5).setAlpha(0);

    this._chalkVisibleText = this.add.text(W / 2, 300, '', {
      fontFamily: FONT, fontSize: '32px', color: '#e7ead8', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 640 }
    }).setOrigin(0.5).setAlpha(0);

    this._chalkStatusText = this.add.text(W / 2, 438, '', {
      fontFamily: FONT, fontSize: '18px', color: '#d8d8c8', fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this._chalkCommandText = this.add.text(W / 2, 555, 'CLEANING COMMAND:', {
      fontFamily: FONT, fontSize: '17px', color: '#445566'
    }).setOrigin(0.5).setAlpha(0);

    this._chalkInputText = this.add.text(W / 2, 608, '> _', {
      fontFamily: FONT, fontSize: '24px', color: '#006600',
      align: 'center', wordWrap: { width: 650 }
    }).setOrigin(0.5).setAlpha(0);

    this._chalkProgressText = this.add.text(W / 2, 690, `Layers Erased: 0 / ${this._chalkLayers.length}`, {
      fontFamily: FONT, fontSize: '16px', color: PAL.score
    }).setOrigin(0.5).setAlpha(0);
  }

  _startEraseChalkboard() {
    this._chalkVisibleText.setAlpha(1);
    this._chalkCommandText.setAlpha(1);
    this._chalkInputText.setAlpha(1);
    this._chalkProgressText.setAlpha(1);
    this._spawnChalkLayer();
  }

  // ─── Chalkboard — layer lifecycle ──────────────────────────────────────────

  _spawnChalkLayer() {
    const layer = this._chalkLayers[this._chalkIndex];
    if (!layer) { this._endGame(); return; }

    this._chalkTyped = '';
    this._chalkLocked = false;
    this._chalkVisibleText
      .setText(layer.visibleText)
      .setColor('#e7ead8')
      .setAlpha(1)
      .setX(512)
      .setY(300);
    this._chalkHiddenText
      .setText(layer.hiddenText)
      .setColor('#ffb0a0')
      .setAlpha(0)
      .setX(512)
      .setY(342);
    this._chalkCommandText.setText(`CLEANING COMMAND: ${layer.eraseWord}`);
    this._chalkInputText.setText('> _').setColor('#006600').setAlpha(1).setX(512);
    this._chalkStatusText.setText('').setAlpha(0);
  }

  _chalkOnKey(event) {
    if (this.gameOver || this._chalkLocked) return;
    const key = event.key;

    if (key === 'Backspace') {
      event.preventDefault();
      if (this._chalkTyped.length > 0) {
        this._chalkTyped = this._chalkTyped.slice(0, -1);
        this._chalkUpdateInput();
      }
      return;
    }

    if (key.length !== 1) return;

    const layer  = this._chalkLayers[this._chalkIndex];
    const target = layer ? layer.eraseWord : '';
    const pos    = this._chalkTyped.length;
    if (!target || pos >= target.length) return;

    const expected = target[pos];
    if (key.toUpperCase() === expected.toUpperCase()) {
      this._chalkTyped += expected;
      this._chalkUpdateInput();
      if (this._chalkTyped === target) {
        this._chalkCompleteLayer();
      }
    } else {
      this._chalkInputText.setColor('#cc0000');
      this.cameras.main.shake(100, 0.0035);
      this.tweens.add({
        targets: this._chalkInputText,
        x:       512 + Phaser.Math.Between(-9, 9),
        yoyo:    true,
        repeat:  2,
        duration: 34,
        onComplete: () => {
          if (!this.gameOver) this._chalkInputText.setX(512).setColor('#006600');
        }
      });
    }
  }

  _chalkUpdateInput() {
    const layer  = this._chalkLayers[this._chalkIndex];
    const target = layer ? layer.eraseWord : '';
    const cursor = this._chalkTyped.length < target.length ? '_' : '';
    this._chalkInputText.setText(`> ${this._chalkTyped}${cursor}`);
  }

  _chalkCompleteLayer() {
    this._chalkLocked = true;
    this._chalkCompleted++;
    this._chalkProgressText.setText(`Layers Erased: ${this._chalkCompleted} / ${this._chalkLayers.length}`);
    this._chalkInputText.setAlpha(0);

    this._scatterChalkDust();
    this.tweens.add({
      targets:  this._chalkVisibleText,
      alpha:    0,
      y:        286,
      duration: 360,
      ease:     'Sine.In',
      onComplete: () => {
        if (!this.gameOver) this._chalkRevealHidden();
      }
    });
  }

  _chalkRevealHidden() {
    this._chalkHiddenText.setAlpha(1).setColor('#ffb0a0');
    this._chalkStatusText.setText('TEXT UNDER BOARD SURFACED').setColor('#ffb0a0').setAlpha(1);

    this._chalkRevealTimer = this.time.delayedCall(1050, () => {
      this._chalkRevealTimer = null;
      if (this.gameOver) return;

      this._chalkStatusText.setText('DISPLAY ERROR CORRECTED').setColor('#d8d8c8').setAlpha(1);
      this.tweens.add({
        targets:  this._chalkHiddenText,
        alpha:    0.18,
        duration: 260,
        ease:     'Sine.Out'
      });

      this._chalkRevealTimer = this.time.delayedCall(520, () => {
        this._chalkRevealTimer = null;
        if (this.gameOver) return;
        this._chalkIndex++;
        if (this._chalkIndex >= this._chalkLayers.length) {
          this._endGame();
        } else {
          this._spawnChalkLayer();
        }
      });
    });
  }

  _scatterChalkDust() {
    for (let i = 0; i < 14; i++) {
      const dust = this.add.circle(
        Phaser.Math.Between(250, 774),
        Phaser.Math.Between(266, 340),
        Phaser.Math.Between(2, 5),
        0xe7ead8
      ).setAlpha(0.42);

      this.tweens.add({
        targets:    dust,
        x:          dust.x + Phaser.Math.Between(-25, 25),
        y:          dust.y + Phaser.Math.Between(28, 70),
        alpha:      0,
        duration:   Phaser.Math.Between(420, 760),
        onComplete: () => dust.destroy()
      });
    }
  }

  // ─── Chalkboard — grade / results ──────────────────────────────────────────

  _getChalkGrade() {
    const total = this._chalkLayers.length;
    if (this._chalkCompleted >= total) return { label: 'BOARD CLEANED',      color: PAL.caught };
    if (this._chalkCompleted >= 1)     return { label: 'PARTIAL CLEANING',   color: PAL.gold   };
    return                              { label: 'BOARD UNCLEAN',      color: PAL.missed };
  }

  _showChalkResults() {
    const W = 1024;
    const H = 768;
    const grade = this._getChalkGrade();

    this.add.rectangle(W / 2, H / 2, W, H, PAL.overlay).setAlpha(0.45);
    this.add.rectangle(W / 2, H / 2, 500, 310, PAL.panelBg)
      .setStrokeStyle(3, PAL.panelBorder);

    this.add.text(W / 2, H / 2 - 118, 'DRILL COMPLETE', {
      fontFamily: FONT, fontSize: '23px', color: '#003399', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 62, grade.label, {
      fontFamily: FONT, fontSize: '27px', color: grade.color, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 6,
      `${this._chalkCompleted} / ${this._chalkLayers.length} Layer${this._chalkLayers.length !== 1 ? 's' : ''} Erased`, {
        fontFamily: FONT, fontSize: '20px', color: PAL.score
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 108, 'Returning to lessons...', {
      fontFamily: FONT, fontSize: '14px', color: PAL.hint
    }).setOrigin(0.5);

    // TODO: MemoryState writes based on erased layers and hidden text exposure
    // TODO: corrupted/finale variant where player can refuse to erase
    // TODO: chalk dust/audio pass
    // TODO: act-based hidden text selection
    // TODO: line replacement animation
    // TODO: connection to final witness statement

    this.time.delayedCall(2800, this._complete, [], this);
  }

  // ─── Return to TypingScene ───────────────────────────────────────────────────

  _complete() {
    let result;
    if (this.gameType === 'keep_lights_on') {
      result = { wordsCompleted: this.wordsCompleted, blackouts: this.blackouts };
    } else if (this.gameType === 'correct_the_record') {
      result = { completed: this._ctrCompleted, total: this._ctrRecords.length };
    } else if (this.gameType === 'door_close') {
      result = { phrases: this._doorCompleted, closures: this._doorClosures };
    } else if (this.gameType === 'stay_in_your_seat') {
      result = { phrases: this._seatCompleted, lookbacks: this._seatLookbacks };
    } else if (this.gameType === 'listen_and_type') {
      result = { completed: this._listenCompleted, total: this._listenPrompts.length };
    } else if (this.gameType === 'erase_chalkboard') {
      result = { erased: this._chalkCompleted, total: this._chalkLayers.length };
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
