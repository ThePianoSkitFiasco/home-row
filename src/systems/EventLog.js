const STAT_ABBREV = {
  obedience: 'OBE',
  disclosure: 'DIS',
  suppression: 'SUP',
  refusal: 'REF',
  witnessAcceptance: 'WIT'
};

export default class EventLog {
  constructor(maxEntries = 10) {
    this.entries = [];
    this.maxEntries = maxEntries;
    this.onUpdate = null;
  }

  add(entry) {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    if (this.onUpdate) {
      this.onUpdate(this.entries);
    }
  }

  logTypingEvent(eventType, data, firedIntents) {
    if (eventType === 'typed' && firedIntents.length === 0) return;

    let entry = `[${eventType}]`;

    if (eventType === 'mistake') {
      entry += ` '${data.char}' exp '${data.expected}'`;
    } else if (eventType === 'deleted') {
      entry += ` rm '${data.char}'`;
    } else if (eventType === 'pause') {
      entry += ` ${(data.duration / 1000).toFixed(1)}s`;
    } else if (eventType === 'typed' && firedIntents.length > 0) {
      entry += ` streak:${data.correctStreak}`;
    }

    if (firedIntents.length > 0) {
      const names = firedIntents.map(i => i.id).join(', ');
      entry += ` → ${names}`;

      const allEffects = {};
      for (const intent of firedIntents) {
        if (!intent.effects) continue;
        for (const [k, v] of Object.entries(intent.effects)) {
          allEffects[k] = (allEffects[k] || 0) + v;
        }
      }
      const effectParts = Object.entries(allEffects)
        .map(([k, v]) => `${STAT_ABBREV[k] || k}${v > 0 ? '+' : ''}${v}`)
        .join(' ');
      if (effectParts) {
        entry += ` | ${effectParts}`;
      }
    }

    this.add(entry);
  }

  getEntries() {
    return [...this.entries];
  }
}
