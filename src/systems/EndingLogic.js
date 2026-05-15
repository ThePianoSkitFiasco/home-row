export function getFinalStatement(memoryState) {
  const snapshot = memoryState.getSnapshot();
  const stats = snapshot.stats;
  const flags = snapshot.flags;
  const obedience = stats.obedience;
  const disclosure = stats.disclosure;
  const suppression = stats.suppression;
  const refusal = stats.refusal;
  const witnessAcceptance = stats.witnessAcceptance;
  const typingPatternMatched = flags.typingPatternMatched;
  const heardHerSayNo = flags.heardHerSayNo;
  const emilyStatementPreserved = flags.emilyStatementPreserved;
  const keptTypingStatementAccepted = flags.keptTypingStatementAccepted;
  const doNotTurnAroundRevealed = flags.doNotTurnAroundRevealed;

  if (
    witnessAcceptance >= 10 &&
    disclosure >= 25 &&
    typingPatternMatched &&
    heardHerSayNo &&
    emilyStatementPreserved
  ) {
    return {
      routeId: 'witness_statement',
      statement: 'I AM TYPING NOW',
      title: 'HOME ROW: REWRITTEN',
      response: 'YOU SAID IT.',
      body: [
        'I was a child and I was there.',
        'I heard her.',
        'I kept typing.',
        'I am saying it now.',
        '',
        'For the first time, Mr Fingers points away from the screen.'
      ].join('\n')
    };
  }

  if (
    heardHerSayNo &&
    disclosure >= 20 &&
    witnessAcceptance >= 6
  ) {
    return {
      routeId: 'audio_memory',
      statement: 'I HEARD HER SAY NO',
      title: 'STATEMENT: PARTIAL',
      response: 'YOU HEARD IT.',
      body: [
        'You heard more than you said.',
        'You carried it without a name for it.',
        'The sound returned before the rest of the room.'
      ].join('\n')
    };
  }

  if (keptTypingStatementAccepted && obedience >= 12) {
    return {
      routeId: 'completed_exercise',
      statement: 'I KEPT TYPING',
      title: 'COMPLETE THE COURSE',
      response: 'CERTIFICATE AWARDED.',
      body: [
        'The course is complete.',
        'The memory is not.',
        'You kept typing.',
        'That is what you were taught.'
      ].join('\n')
    };
  }

  if (
    doNotTurnAroundRevealed &&
    refusal >= 6 &&
    disclosure >= 18
  ) {
    return {
      routeId: 'sightline_error',
      statement: 'I SHOULD HAVE TURNED AROUND',
      title: 'DESTROY THE MASCOT',
      response: 'PROGRAM TERMINATED.',
      body: [
        'The lesson shell tears open.',
        'What remains is not kinder for being direct.',
        'Calder is no longer translated.',
        'Neither are you.',
        'You are still in that room.'
      ].join('\n')
    };
  }

  if (suppression >= 15 || witnessAcceptance < 3) {
    return {
      routeId: 'gold_star',
      statement: 'I DID NOT HEAR ANYTHING',
      title: 'COMPLETE THE COURSE',
      response: 'CERTIFICATE AWARDED.',
      body: [
        'The lesson is complete.',
        'Your hands are on the home row.',
        'You have not said anything.',
        'You will not say anything.',
        'Well done.'
      ].join('\n')
    };
  }

  return {
    routeId: 'incomplete_statement',
    statement: 'WE WERE CHILDREN',
    title: 'STATEMENT: PARTIAL',
    response: 'THE CURSOR WAITS.',
    body: [
      'The cursor is still waiting.',
      'You know what happened.',
      'You have not said it yet.'
    ].join('\n')
  };
}

export default getFinalStatement;
