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
      statement: 'I WAS A CHILD AND I WAS THERE',
      title: 'WITNESS STATEMENT',
      response: 'RECORDED.',
      body: [
        'The record does not become whole.',
        'It becomes honest enough to keep.',
        'Emily Vale is no longer absent.',
        'The second user is no longer missing from the room.'
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
      title: 'AUDIO MEMORY',
      response: 'MEMORY ENTERED INTO RECORD.',
      body: [
        'The record accepts sound before sight.',
        'What you heard remains incomplete,',
        'but it remains.'
      ].join('\n')
    };
  }

  if (keptTypingStatementAccepted && obedience >= 12) {
    return {
      routeId: 'completed_exercise',
      statement: 'I KEPT TYPING',
      title: 'COMPLETED EXERCISE',
      response: 'ACTION CONFIRMED. INTENT UNKNOWN.',
      body: [
        'The program records the action.',
        'It cannot record why.',
        'Your hands stayed on the keys.',
        'The room stayed behind you.'
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
      title: 'SIGHTLINE ERROR',
      response: 'LOOKING WAS NEVER REQUIRED. KNOWING WAS.',
      body: [
        'The record circles the place where looking should have been.',
        'But you were a child.',
        'The screen was bright.',
        'The voice behind you was adult.'
      ].join('\n')
    };
  }

  if (suppression >= disclosure || witnessAcceptance < 5) {
    return {
      routeId: 'gold_star',
      statement: 'I DID NOT SEE ANYTHING',
      title: 'GOLD STAR',
      response: 'RECORD ACCEPTED.',
      body: [
        'The lesson accepts your correction.',
        'Emily Vale remains absent.',
        'Your hands return to home row.'
      ].join('\n')
    };
  }

  return {
    routeId: 'incomplete_statement',
    statement: 'I KEPT TYPING',
    title: 'INCOMPLETE STATEMENT',
    response: 'THE RECORD REMAINS OPEN.',
    body: [
      'The record remains open.',
      'Some lines were typed.',
      'Some were removed.',
      'The cursor waits.'
    ].join('\n')
  };
}

export default getFinalStatement;
