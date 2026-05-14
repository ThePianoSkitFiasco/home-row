export default class MemoryState {
  constructor() {
    this.stats = {
      obedience: 0,
      disclosure: 0,
      suppression: 0,
      refusal: 0,
      witnessAcceptance: 0
    };

    this.flags = {
      emilyFound: false,
      recordContradicted: false,
      secondWorkstationRevealed: false,
      teacherOverrideSeen: false,
      typingPatternMatched: false,
      playerImplicationStarted: false,
      heardEmily: false,
      calderCommandRevealed: false,
      doNotTurnAroundRevealed: false,
      keptEyesOnScreen: false,
      heardHerSayNo: false,
      emilyStatementStarted: false,
      emilyNamedHerself: false,
      doorLockedRevealed: false,
      otherChildCommanded: false,
      emilyAskedNotCorrected: false,
      emilyStatementPreserved: false,
      mrFingersBreakStarted: false,
      protectorIdentityRevealed: false,
      repressionAdmitted: false,
      memoryCorrectionAdmitted: false,
      postHostFound: false,
      playerPraisedForObedience: false,
      choicePressureStarted: false,
      correctionExamStarted: false,
      officialAbsenceChallenged: false,
      supervisionChallenged: false,
      sawNothingStatementShown: false,
      heardNothingStatementShown: false,
      keptTypingStatementAccepted: false,
      recordCompletionStarted: false
    };
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

  applyFlags(flags) {
    if (!flags) return;
    for (const [key, value] of Object.entries(flags)) {
      this.setFlag(key, value);
    }
  }

  getFlag(name) {
    return this.flags[name] || false;
  }

  getFlags() {
    return { ...this.flags };
  }

  getSnapshot() {
    return {
      stats: { ...this.stats },
      flags: { ...this.flags }
    };
  }
}
