import { getFinalStatement } from '../systems/EndingLogic.js';

const CRT = {
  bg: 0x020402,
  panel: 0x030703,
  panelSoft: 0x061006,
  border: 0x3d7228,
  phosphor: '#d5ffb8',
  phosphorDim: '#6fbf45',
  warning: '#ff7a45'
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
    this.memorySnapshot = this._normalizeSnapshot(data.memorySnapshot);
    this.runEnding = data.runEnding || this._evaluateRunEnding(this.memorySnapshot);
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
  }

  create() {
    this.cameras.main.setBackgroundColor(CRT.bg);
    this._buildUi();
    this.input.keyboard.on('keydown', (event) => this._handleKey(event));
    this._showRecord();
  }

  _buildUi() {
    this.add.rectangle(512, 384, 1024, 768, CRT.bg);
    for (let x = 0; x <= 1024; x += 32) {
      this.add.rectangle(x, 384, 1, 768, CRT.border).setAlpha(0.08);
    }
    for (let y = 0; y <= 768; y += 24) {
      this.add.rectangle(512, y, 1024, 1, CRT.border).setAlpha(0.08);
    }

    this.add.rectangle(512, 384, 1024, 768, 0x000000).setAlpha(0.22);
    this.headerText = this.add.text(512, 34, this.config.title || 'FINAL CORRECTION EXERCISE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '30px',
      color: CRT.phosphor,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.subheaderText = this.add.text(512, 76, 'CHOOSE WHAT THE RECORD WILL SAY', {
      fontFamily: 'Courier New, monospace',
      fontSize: '17px',
      color: CRT.phosphorDim,
      align: 'center'
    }).setOrigin(0.5, 0);

    this.mainPanel = this.add.rectangle(410, 346, 660, 470, CRT.panel)
      .setStrokeStyle(2, CRT.border, 0.9);
    this.sidePanel = this.add.rectangle(810, 346, 260, 470, CRT.panelSoft)
      .setStrokeStyle(1, CRT.border, 0.7);
    this.add.text(810, 132, 'WITNESS CHANNEL', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: CRT.phosphorDim,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.sideText = this.add.text(810, 182, 'WORKSTATION 02\nFINAL INPUT\n\nNO TUTOR UI\nNO PRACTICE MODE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: CRT.phosphor,
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0);

    this.recordText = this.add.text(112, 132, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: CRT.phosphor,
      wordWrap: { width: 590 },
      lineSpacing: 5
    });

    this.inputPanel = this.add.rectangle(410, 617, 660, 100, CRT.panel)
      .setStrokeStyle(2, CRT.border, 0.9);
    this.inputText = this.add.text(112, 580, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: CRT.phosphor,
      wordWrap: { width: 590 },
      lineSpacing: 4
    });
    this.statusText = this.add.text(512, 704, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
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
    this.subheaderText.setText('FINAL STATEMENT RECORDED');
    this.recordText.setFontSize('17px');
    this.combinedEnding = this._resolveCombinedEnding();

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
    this.inputText.setAlpha(0);
    this.statusText.setText('FINAL STATEMENT RECORDED');
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
