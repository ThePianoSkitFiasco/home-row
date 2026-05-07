export default class TypingEngine {
  constructor() {
    this.assignedText = '';
    this.typedChars = [];
    this.correctCount = 0;
    this.mistakeCount = 0;
    this.backspaceCount = 0;
    this.totalPauseTime = 0;
    this.completedLines = 0;
    this.lastKeyTime = 0;
    this.pauseThreshold = 3000;
    this.isComplete = false;
    this.correctStreak = 0;

    this.onEvent = null;
  }

  loadLine(text) {
    this.assignedText = text;
    this.typedChars = [];
    this.isComplete = false;
    this.lastKeyTime = Date.now();
    this.correctStreak = 0;
  }

  handleKey(event) {
    if (this.isComplete) return;

    const now = Date.now();
    const elapsed = now - this.lastKeyTime;
    if (this.lastKeyTime > 0 && elapsed > this.pauseThreshold) {
      this.totalPauseTime += elapsed;
      this._emit('pause', {
        duration: elapsed,
        typed: this.getTypedText(),
        assignedText: this.assignedText
      });
    }
    this.lastKeyTime = now;

    if (event.key === 'Backspace') {
      if (this.typedChars.length > 0) {
        const previousTyped = this.getTypedText();
        const removed = this.typedChars.pop();
        this.backspaceCount++;
        this._emit('deleted', { char: removed.char, typed: this.getTypedText(), previousTyped });
      }
      return;
    }

    if (event.key.length !== 1) return;

    const index = this.typedChars.length;
    if (index >= this.assignedText.length) return;

    const expected = this.assignedText[index];
    const isCorrect = event.key === expected;

    this.typedChars.push({ char: event.key, expected, correct: isCorrect });

    if (isCorrect) {
      this.correctCount++;
      this.correctStreak++;
      this._emit('typed', { char: event.key, typed: this.getTypedText(), correctStreak: this.correctStreak });
    } else {
      this.mistakeCount++;
      this.correctStreak = 0;
      this._emit('mistake', { char: event.key, expected, typed: this.getTypedText() });
    }

    if (this.typedChars.length >= this.assignedText.length) {
      this.isComplete = true;
      this.completedLines++;
      this._emit('line_complete', { typed: this.getTypedText() });
    }
  }

  getTypedText() {
    return this.typedChars.map(c => c.char).join('');
  }

  getCharStates() {
    return this.typedChars.map((c, i) => ({
      char: c.char,
      expected: this.assignedText[i],
      correct: c.correct
    }));
  }

  getAccuracy() {
    const total = this.correctCount + this.mistakeCount;
    if (total === 0) return 100;
    return Math.round((this.correctCount / total) * 100);
  }

  getStats() {
    return {
      correct: this.correctCount,
      mistakes: this.mistakeCount,
      backspaces: this.backspaceCount,
      pauseTime: this.totalPauseTime,
      completedLines: this.completedLines,
      accuracy: this.getAccuracy()
    };
  }

  _emit(eventType, data) {
    if (this.onEvent) {
      this.onEvent(eventType, data);
    }
  }
}
