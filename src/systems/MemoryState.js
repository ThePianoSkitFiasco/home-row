export default class MemoryState {
  constructor() {
    this.stats = {
      obedience: 0,
      disclosure: 0,
      suppression: 0,
      refusal: 0,
      witnessAcceptance: 0
    };

    this.flags = {};
  }

  applyEffects(effects) {
    if (!effects) return;
    for (const [key, value] of Object.entries(effects)) {
      if (key in this.stats) {
        this.stats[key] += value;
      }
    }
  }

  getStat(name) {
    return this.stats[name] || 0;
  }

  setFlag(name, value = true) {
    this.flags[name] = value;
  }

  getFlag(name) {
    return this.flags[name] || false;
  }

  getSnapshot() {
    return {
      stats: { ...this.stats },
      flags: { ...this.flags }
    };
  }
}
