const GLOBAL_INTENT_CAPS = {
  mistake_generic: 3,
  deletion_generic: 3,
  pause_generic: 1
};

export default class IntentEngine {
  constructor(memoryState, mrFingers) {
    this.intents = [];
    this.firedOnce = new Set();
    this.memoryState = memoryState;
    this.mrFingers = mrFingers;
    this.onResponse = null;
    this.lessonEffectCounts = {};
  }

  loadIntents(intentsJson) {
    this.intents = [...intentsJson].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  resetLessonCaps() {
    this.lessonEffectCounts = {};
  }

  processEvent(eventType, data, currentLessonId, currentActId = null) {
    const results = [];
    const matchedGroups = new Set();

    for (const intent of this.intents) {
      if (intent.once && this.firedOnce.has(intent.id)) continue;

      if (intent.eventType !== eventType) continue;

      if (intent.intentGroup && matchedGroups.has(intent.intentGroup)) continue;

      if (intent.lesson !== '*' && intent.lesson !== currentLessonId) continue;

      if (!this._matchesAct(intent, currentActId)) continue;

      if (!this._matchPatterns(intent, eventType, data)) continue;

      const explicitLessonCap = Number.isInteger(intent.lessonCap) ? intent.lessonCap : null;
      if (explicitLessonCap !== null && (this.lessonEffectCounts[intent.id] || 0) >= explicitLessonCap) {
        continue;
      }

      const cap = GLOBAL_INTENT_CAPS[intent.id];
      const capped = cap !== undefined && (this.lessonEffectCounts[intent.id] || 0) >= cap;

      if (intent.effects && !capped) {
        this.memoryState.applyEffects(intent.effects);
        if (cap !== undefined) {
          this.lessonEffectCounts[intent.id] = (this.lessonEffectCounts[intent.id] || 0) + 1;
        }
      }

      if (intent.flags) {
        this.memoryState.applyFlags(intent.flags);
      }

      if (intent.mrTrigger) {
        this.mrFingers.setState(intent.mrTrigger);
      }

      if (intent.response && this.onResponse) {
        this.onResponse(intent.response, intent.mrTrigger, intent);
      }

      if (intent.once) {
        this.firedOnce.add(intent.id);
      }

      if (explicitLessonCap !== null) {
        this.lessonEffectCounts[intent.id] = (this.lessonEffectCounts[intent.id] || 0) + 1;
      }

      if (intent.intentGroup) {
        matchedGroups.add(intent.intentGroup);
      }

      results.push(intent);
    }

    return results;
  }

  _matchesAct(intent, currentActId) {
    if (!intent.act || intent.act === '*') return true;
    if (!currentActId) return false;
    if (Array.isArray(intent.act)) {
      return intent.act.includes(currentActId);
    }
    return intent.act === currentActId;
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

    let textToMatch;
    if (intent.matchSource === 'typed') {
      textToMatch = data.typed || '';
    } else if (intent.matchSource === 'assigned') {
      textToMatch = data.assignedText || '';
    } else if (intent.matchSource === 'previousTyped') {
      textToMatch = data.previousTyped || '';
    } else {
      textToMatch = eventType === 'deleted' && data.previousTyped
        ? data.previousTyped
        : [data.typed, data.assignedText].filter(Boolean).join(' ');
    }
    const typed = textToMatch.toLowerCase();

    for (const pattern of intent.patterns) {
      if (intent.matchMode === 'exact') {
        if (typed === pattern.toLowerCase()) return true;
      } else if (intent.matchMode === 'regex') {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(textToMatch)) return true;
      } else {
        if (typed.includes(pattern.toLowerCase())) return true;
      }
    }

    return false;
  }
}
