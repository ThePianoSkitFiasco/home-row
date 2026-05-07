export default class IntentEngine {
  constructor(memoryState, mrFingers) {
    this.intents = [];
    this.firedOnce = new Set();
    this.memoryState = memoryState;
    this.mrFingers = mrFingers;
    this.onResponse = null;
  }

  loadIntents(intentsJson) {
    this.intents = intentsJson;
  }

  processEvent(eventType, data, currentLessonId) {
    const results = [];

    for (const intent of this.intents) {
      if (intent.once && this.firedOnce.has(intent.id)) continue;

      if (intent.eventType !== eventType) continue;

      if (intent.lesson !== '*' && intent.lesson !== currentLessonId) continue;

      if (!this._matchPatterns(intent, eventType, data)) continue;

      if (intent.effects) {
        this.memoryState.applyEffects(intent.effects);
      }

      if (intent.flags) {
        this.memoryState.applyFlags(intent.flags);
      }

      if (intent.mrTrigger) {
        this.mrFingers.setState(intent.mrTrigger);
      }

      if (intent.response && this.onResponse) {
        this.onResponse(intent.response, intent.mrTrigger);
      }

      if (intent.once) {
        this.firedOnce.add(intent.id);
      }

      results.push(intent);
    }

    return results;
  }

  _matchPatterns(intent, eventType, data) {
    if (intent.triggerOnCorrectStreak && eventType === 'typed') {
      return data.correctStreak > 0 && data.correctStreak % intent.triggerOnCorrectStreak === 0;
    }

    const minPauseMs = intent.minPauseMs || intent.pauseThreshold;
    if (minPauseMs && eventType === 'pause' && data.duration < minPauseMs) {
      return false;
    }

    if (minPauseMs && eventType === 'pause' && (!intent.patterns || intent.patterns.length === 0)) {
      return true;
    }

    if (!intent.patterns || intent.patterns.length === 0) {
      return true;
    }

    const textToMatch = eventType === 'deleted' && data.previousTyped
      ? data.previousTyped
      : [data.typed, data.assignedText].filter(Boolean).join(' ');
    const typed = textToMatch.toLowerCase();

    for (const pattern of intent.patterns) {
      if (intent.matchMode === 'exact') {
        if (typed === pattern.toLowerCase()) return true;
      } else {
        if (typed.includes(pattern.toLowerCase())) return true;
      }
    }

    return false;
  }
}
