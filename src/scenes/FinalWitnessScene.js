import { getFinalStatement } from '../systems/EndingLogic.js';

const CRT = {
  bg:         0x000000,
  headerBg:   0x110000,
  panel:      0x0d0000,
  panelSoft:  0x080000,
  border:     0x550000,
  phosphor:   '#cc2200',
  phosphorDim:'#661100',
  warning:    '#ff3322'
};

const ACTIONS = {
  1: 'preserve',
  2: 'correct',
  3: 'delete',
  4: 'refuse'
};

const LABELS = {
  preserve: 'PRESERVE',
  correct: 'CORRECT',
  delete: 'DELETE',
  refuse: 'REFUSE'
};

const STAMPS = {
  preserve: 'PRESERVED',
  correct: 'CORRECTED',
  delete: 'DELETED',
  refuse: 'UNSANCTIONED'
};

export default class FinalWitnessScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalWitnessScene' });
  }

  init(data) {
    this.config = data.witnessStatement || {};
    this.debugEnabled = !!data.debugEnabled;
    this.devMode = !!data.devMode;
    this.records = Array.isArray(this.config.records) ? this.config.records : [];
    this.index = 0;
    this.mode = 'choice';
    this.choice = null;
    this.typed = '';
    this.target = '';
    this.inputLocked = false;
    this.selections = [];
    this.counts = { preserve: 0, correct: 0, delete: 0, refuse: 0 };
    this.combinedEnding = null;
    const rawSnapshot = this._normalizeSnapshot(data.memorySnapshot);
    this.memorySnapshot = this._applyDebugSnapshot(rawSnapshot);
    this.runEnding = this._evaluateRunEnding(this.memorySnapshot);
  }

  _applyDebugSnapshot(rawSnapshot) {
    if (typeof window === 'undefined' || !window.location) return rawSnapshot;
    const params = new URLSearchParams(window.location.search);
    const route = params.get('route');
    if (!route) return rawSnapshot;
    const debug = this._buildDebugSnapshot(route);
    if (!debug) return rawSnapshot;
    return this._normalizeSnapshot(debug);
  }

  _buildDebugSnapshot(route) {
    const base = { stats: { obedience: 5, disclosure: 25, suppression: 0, refusal: 0, witnessAcceptance: 10 }, flags: { typingPatternMatched: true, heardHerSayNo: true, emilyStatementPreserved: true, keptTypingStatementAccepted: true, doNotTurnAroundRevealed: true } };
    switch (route) {
      case 'witness':
        return { stats: { obedience: 5, disclosure: 25, suppression: 5, refusal: 2, witnessAcceptance: 10 }, flags: { typingPatternMatched: true, heardHerSayNo: true, emilyStatementPreserved: true, keptTypingStatementAccepted: true, doNotTurnAroundRevealed: true } };
      case 'audio_memory':
        return { stats: { obedience: 5, disclosure: 20, suppression: 5, refusal: 2, witnessAcceptance: 6 }, flags: { typingPatternMatched: false, heardHerSayNo: true, emilyStatementPreserved: false, keptTypingStatementAccepted: false, doNotTurnAroundRevealed: false } };
      case 'completed_exercise':
        return { stats: { obedience: 13, disclosure: 8, suppression: 8, refusal: 0, witnessAcceptance: 4 }, flags: { typingPatternMatched: false, heardHerSayNo: false, emilyStatementPreserved: false, keptTypingStatementAccepted: true, doNotTurnAroundRevealed: false } };
      case 'sightline_error':
        return { stats: { obedience: 3, disclosure: 18, suppression: 4, refusal: 7, witnessAcceptance: 3 }, flags: { typingPatternMatched: false, heardHerSayNo: false, emilyStatementPreserved: false, keptTypingStatementAccepted: false, doNotTurnAroundRevealed: true } };
      case 'gold_star':
        return { stats: { obedience: 8, disclosure: 10, suppression: 16, refusal: 1, witnessAcceptance: 3 }, flags: { typingPatternMatched: false, heardHerSayNo: false, emilyStatementPreserved: false, keptTypingStatementAccepted: false, doNotTurnAroundRevealed: false } };
      case 'incomplete':
        return { stats: { obedience: 5, disclosure: 12, suppression: 8, refusal: 3, witnessAcceptance: 4 }, flags: { typingPatternMatched: false, heardHerSayNo: false, emilyStatementPreserved: false, keptTypingStatementAccepted: false, doNotTurnAroundRevealed: false } };
      default:
        return null;
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(CRT.bg);
    this._buildUi();
    this.input.keyboard.on('keydown', (event) => this._handleKey(event));
    this._showRecord();
  }

  _buildUi() {
    const W = 1024, H = 768, PAD = 48, HEADER_H = 32, FOOTER_H = 50;

    this.add.rectangle(512, 384, W, H, CRT.bg);

    // header bar
    this.add.rectangle(512, HEADER_H / 2, W, HEADER_H, CRT.headerBg);
    this.add.text(PAD, HEADER_H / 2, 'HOME ROW  [FINAL RECORD]', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#aa1a00'
    }).setOrigin(0, 0.5);
    this.add.text(W - PAD, HEADER_H / 2, 'WORKSTATION 02  //  WRITE ACCESS', {
      fontFamily: 'Courier New, monospace', fontSize: '13px', color: CRT.phosphorDim
    }).setOrigin(1, 0.5);

    // separator lines
    this.add.rectangle(512, HEADER_H,     W, 1, CRT.border);
    this.add.rectangle(512, H - FOOTER_H, W, 1, CRT.border);

    // scanlines
    for (let y = 0; y < H; y += 4) {
      this.add.rectangle(512, y, W, 1, 0xff0000).setAlpha(0.022);
    }

    // flicker overlay
    this.flickerOverlay = this.add.rectangle(512, 384, W, H, 0xff0000).setAlpha(0.01);
    this.time.addEvent({
      delay: 160, loop: true,
      callback: () => {
        this.flickerOverlay.setAlpha(Phaser.Math.FloatBetween(0.005, 0.02));
        this.cameras.main.setAlpha(Phaser.Math.FloatBetween(0.988, 1));
      }
    });

    this.headerText = this.add.text(512, 46, this.config.title || 'FINAL CORRECTION EXERCISE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '26px',
      color: CRT.phosphor,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.subheaderText = this.add.text(512, 82, 'CHOOSE WHAT THE RECORD WILL SAY', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: CRT.phosphorDim,
      align: 'center'
    }).setOrigin(0.5, 0);

    this.mainPanel = this.add.rectangle(410, 360, 660, 460, CRT.panel)
      .setStrokeStyle(1, CRT.border, 0.9);
    this.sidePanel = this.add.rectangle(810, 360, 240, 460, CRT.panelSoft)
      .setStrokeStyle(1, CRT.border, 0.7);
    this.add.text(810, 145, 'WITNESS CHANNEL', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: CRT.phosphorDim,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.sideText = this.add.text(810, 190, 'WORKSTATION 02\nFINAL INPUT\n\nNO TUTOR UI\nNO PRACTICE MODE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: CRT.phosphor,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0);

    this.recordText = this.add.text(100, 145, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '17px',
      color: CRT.phosphor,
      wordWrap: { width: 590 },
      lineSpacing: 5
    });

    this.inputPanel = this.add.rectangle(410, 625, 660, 90, CRT.panel)
      .setStrokeStyle(1, CRT.border, 0.9);
    this.inputText = this.add.text(100, 592, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '19px',
      color: CRT.phosphor,
      wordWrap: { width: 590 },
      lineSpacing: 4
    });
    this.statusText = this.add.text(512, H - FOOTER_H + 14, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: CRT.warning,
      align: 'center'
    }).setOrigin(0.5, 0);
  }

  _showRecord() {
    const record = this._currentRecord();
    if (!record) {
      this._showSummary();
      return;
    }

    this.mode = 'choice';
    this.choice = null;
    this.typed = '';
    this.target = '';
    this.inputLocked = false;
    this.subheaderText.setText('CHOOSE WHAT THE RECORD WILL SAY');
    this.recordText.setFontSize('18px');
    this.recordText.setText([
      record.label,
      'OFFICIAL:',
      record.official,
      '',
      '[1] PRESERVE',
      `    ${this._lineFor(record, 'preserve')}`,
      '',
      '[2] CORRECT',
      `    ${this._lineFor(record, 'correct')}`,
      '',
      '[3] DELETE',
      `    ${this._lineFor(record, 'delete') || '[LINE REMOVED]'}`,
      '',
      '[4] REFUSE',
      `    ${this._lineFor(record, 'refuse')}`
    ].join('\n'));
    this.inputText.setAlpha(0.55);
    this.inputText.setText('INPUT:\n> [PRESS 1-4 TO CHOOSE]');
    this.statusText.setText(`PRESS 1-4 TO CHOOSE  //  RECORD ${this.index + 1} OF ${this.records.length}`);
  }

  _showTyping(record, action) {
    const label = LABELS[action] || 'CHOICE';
    const line = this._lineFor(record, action);
    const helpText = action === 'delete'
      ? 'TYPE DELETE OR PRESS ENTER TO REMOVE THIS LINE'
      : 'TYPE THE SELECTED LINE TO RECORD IT';

    this.subheaderText.setText(helpText);
    this.recordText.setText([
      record.label,
      `SELECTED: ${label}`,
      '',
      'TYPE TO RECORD:',
      line || '[LINE REMOVED]',
      '',
      helpText
    ].join('\n'));
    this.inputText.setAlpha(1);
    this._renderTyped();
    this.statusText.setText('STATEMENT READY FOR RECORDING');
  }

  _handleKey(event) {
    if (this.inputLocked || this.mode === 'summary') return;

    if (this.mode === 'choice') {
      this._handleChoice(event);
      return;
    }

    if (this.mode === 'typing') {
      this._handleTyping(event);
    }
  }

  _handleChoice(event) {
    const action = ACTIONS[event.key];
    if (!action) {
      this._flashInput();
      return;
    }

    const record = this._currentRecord();
    if (!record) return;

    this.choice = action;
    this.typed = '';
    this.target = action === 'delete' ? 'DELETE' : this._lineFor(record, action);
    this.mode = 'typing';
    this._showTyping(record, action);
  }

  _handleTyping(event) {
    if (event.key === 'Backspace') {
      if (event.preventDefault) event.preventDefault();
      if (this.typed.length > 0) {
        this.typed = this.typed.slice(0, -1);
        this._renderTyped();
      }
      return;
    }

    if (this.choice === 'delete' && event.key === 'Enter' && this.typed.length === 0) {
      this._completeRecord();
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    const expected = this.target[this.typed.length];
    if (!expected) return;

    if (event.key.toUpperCase() === expected.toUpperCase()) {
      this.typed += expected;
      this._renderTyped();
      if (this.typed === this.target) {
        this._completeRecord();
      }
    } else {
      this._flashInput();
    }
  }

  _completeRecord() {
    const record = this._currentRecord();
    if (!record || !this.choice) return;

    const action = this.choice;
    const line = this._lineFor(record, action);
    this.inputLocked = true;
    this.counts[action]++;
    this.selections.push({ id: record.id, label: record.label, action, line });
    this.statusText.setText(STAMPS[action] || 'STATEMENT RECORDED');

    this.time.delayedCall(850, () => {
      this.index++;
      this._showRecord();
    });
  }

  _showSummary() {
    this.mode = 'summary';
    this.inputLocked = true;
    this.combinedEnding = this._resolveCombinedEnding();

    const isWitness = this.combinedEnding.routeId === 'witness_statement';
    const silenceMs = isWitness ? 4500 : 1800;

    this.subheaderText.setText('');
    this.recordText.setText('');
    this.inputText.setAlpha(0);
    this.statusText.setText('');

    this.time.delayedCall(silenceMs, () => {
      if (!this.recordText || !this.recordText.active) return;

      this.subheaderText.setText('FINAL STATEMENT RECORDED');
      this.recordText.setFontSize('17px');

      const statementLines = this.selections.map((entry) => {
        const line = entry.action === 'delete' ? '[LINE REMOVED]' : entry.line;
        return `${entry.label}: ${line}`;
      });

      this.recordText.setText([
        `=== ${this.combinedEnding.title} ===`,
        '',
        this.combinedEnding.statement,
        this.combinedEnding.response,
        '',
        this.combinedEnding.body,
        '',
        `LOCAL RECORD: ${this._getLocalOutcome().label}`,
        '',
        'FINAL STATEMENT',
        '',
        ...statementLines,
        '',
        `PRESERVED: ${this.counts.preserve}`,
        `CORRECTED: ${this.counts.correct}`,
        `DELETED: ${this.counts.delete}`,
        `REFUSED: ${this.counts.refuse}`,
        '',
        'You may close this program.'
      ].join('\n'));
      this.statusText.setText('FINAL STATEMENT RECORDED');
    });
  }

  _renderTyped() {
    const cursor = this.typed.length < this.target.length ? '_' : '';
    this.inputText.setText(`INPUT:\n> ${this.typed}${cursor}`);
  }

  _flashInput() {
    this.inputText.setColor(CRT.warning);
    this.cameras.main.shake(90, 0.003);
    this.time.delayedCall(140, () => {
      if (this.inputText && this.inputText.active) {
        this.inputText.setColor(CRT.phosphor);
      }
    });
  }

  _currentRecord() {
    return this.records[this.index] || null;
  }

  _lineFor(record, action) {
    if (!record || !record.choices) return '';
    return record.choices[action] || '';
  }

  _getLocalOutcome() {
    const priority = ['refuse', 'correct', 'delete', 'preserve'];
    const labels = {
      preserve: 'GOLD STAR REPORT',
      correct: 'WITNESS STATEMENT',
      delete: 'BACKSPACE REPORT',
      refuse: 'UNSANCTIONED TESTIMONY'
    };
    const categories = {
      preserve: 'obedience',
      correct: 'witness',
      delete: 'delete',
      refuse: 'refusal'
    };
    const max = Math.max(
      this.counts.preserve,
      this.counts.correct,
      this.counts.delete,
      this.counts.refuse
    );
    if (max <= 0) {
      return {
        action: 'preserve',
        label: labels.preserve,
        category: categories.preserve,
        isMixed: false
      };
    }

    const leaders = Object.keys(this.counts).filter((action) => this.counts[action] === max);
    const isMixed = leaders.length > 1;

    for (const action of priority) {
      if (this.counts[action] === max) {
        return {
          action,
          label: labels[action],
          category: isMixed ? 'mixed' : categories[action],
          isMixed
        };
      }
    }
    return {
      action: 'preserve',
      label: labels.preserve,
      category: 'obedience',
      isMixed: false
    };
  }

  _resolveCombinedEnding() {
    const localOutcome = this._getLocalOutcome();
    const runEnding = this.runEnding || this._evaluateRunEnding(this.memorySnapshot);
    const stats = this.memorySnapshot.stats;
    const flags = this.memorySnapshot.flags;

    const witnessSupported =
      !!flags.typingPatternMatched &&
      !!flags.heardHerSayNo &&
      !!flags.emilyStatementPreserved &&
      stats.witnessAcceptance >= 8 &&
      stats.disclosure >= 20;

    const destroySupported =
      stats.refusal >= 6 &&
      (stats.disclosure >= 18 || !!flags.doNotTurnAroundRevealed);

    const obedienceSupported =
      stats.obedience >= 10 ||
      stats.suppression >= stats.disclosure ||
      stats.witnessAcceptance < 5;

    let combinedEnding;
    if (localOutcome.category === 'witness' && witnessSupported) {
      combinedEnding = runEnding.routeId === 'witness_statement'
        ? runEnding
        : this._evaluateRunEnding({
          stats: {
            ...stats,
            witnessAcceptance: Math.max(stats.witnessAcceptance, 10),
            disclosure: Math.max(stats.disclosure, 25)
          },
          flags: {
            ...flags,
            typingPatternMatched: true,
            heardHerSayNo: true,
            emilyStatementPreserved: true
          }
        });
    } else if (
      (localOutcome.category === 'refusal' || localOutcome.category === 'delete') &&
      destroySupported &&
      runEnding.routeId === 'sightline_error'
    ) {
      combinedEnding = runEnding;
    } else if (localOutcome.category === 'obedience' && obedienceSupported) {
      combinedEnding = (runEnding.routeId === 'completed_exercise' || runEnding.routeId === 'gold_star')
        ? runEnding
        : this._evaluateRunEnding({
          stats: {
            ...stats,
            obedience: Math.max(stats.obedience, 12),
            suppression: Math.max(stats.suppression, stats.disclosure)
          },
          flags: {
            ...flags,
            keptTypingStatementAccepted: true
          }
        });
    } else {
      combinedEnding = this._incompleteEnding();
    }

    if (this.debugEnabled || this.devMode) {
      console.log('[FinalWitnessDebug]', {
        runRoute: runEnding.routeId,
        localOutcome,
        combinedRoute: combinedEnding.routeId,
        finalStats: stats,
        finalFlags: flags,
        finalWitnessCounts: { ...this.counts }
      });
    }

    return combinedEnding;
  }

  _evaluateRunEnding(snapshot) {
    return getFinalStatement({
      getSnapshot: () => this._normalizeSnapshot(snapshot)
    });
  }

  _normalizeSnapshot(snapshot) {
    const empty = {
      stats: {
        obedience: 0,
        disclosure: 0,
        suppression: 0,
        refusal: 0,
        witnessAcceptance: 0
      },
      flags: {
        typingPatternMatched: false,
        heardHerSayNo: false,
        emilyStatementPreserved: false,
        keptTypingStatementAccepted: false,
        doNotTurnAroundRevealed: false
      }
    };

    return {
      stats: {
        ...empty.stats,
        ...(snapshot && snapshot.stats ? snapshot.stats : {})
      },
      flags: {
        ...empty.flags,
        ...(snapshot && snapshot.flags ? snapshot.flags : {})
      }
    };
  }

  _incompleteEnding() {
    return {
      routeId: 'incomplete_statement',
      statement: 'WE WERE CHILDREN',
      title: 'STATEMENT: PARTIAL',
      response: 'SECOND CHILD: UNREADY',
      body: [
        'The record does not close.',
        'Some lines were preserved.',
        'Some lines were refused.',
        'The witness is still deciding what can be said.'
      ].join('\n')
    };
  }
}
