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
      response: 'MASCOT STATUS: ALTERED',
      body: [
        'EMILY VALE: RECORDED',
        'SECOND CHILD: NAMED',
        'LESSON STATUS: CONTINUING',
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
      response: 'SECOND CHILD: UNREADY',
      body: [
        'Emily remembered more than you did.',
        'She carried your outline without your name.',
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
        'The mascot remains in place.',
        'The lesson accepts your obedience.',
        'SECOND CHILD: UNNAMED',
        'The course is complete.',
        'The memory is not.'
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
        'BUFFER REMOVED.',
        'The lesson shell tears open.',
        'What remains is not kinder for being direct.',
        'Calder is no longer translated.',
        'Neither are you.',
        'The second child is still unnamed.'
      ].join('\n')
    };
  }

  if (suppression >= disclosure || witnessAcceptance < 5) {
    return {
      routeId: 'gold_star',
      statement: 'I DID NOT SEE ANYTHING',
      title: 'COMPLETE THE COURSE',
      response: 'CERTIFICATE AWARDED.',
      body: [
        'The program accepts your answer.',
        'The mascot keeps his shape.',
        'SECOND CHILD: UNNAMED',
        'Emily Vale remains recorded only in part.',
        'The lesson closes around the missing name.'
      ].join('\n')
    };
  }

  return {
    routeId: 'incomplete_statement',
    statement: 'WE WERE CHILDREN',
    title: 'STATEMENT: PARTIAL',
    response: 'SECOND CHILD: UNREADY',
    body: [
      'The record does not close.',
      'Emily Vale is there.',
      'You are there too, but not all at once.',
      'The cursor waits for the part you still refuse to name.'
    ].join('\n')
  };
}

export default getFinalStatement;
