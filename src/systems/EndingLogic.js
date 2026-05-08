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
        'The lesson ends where your hands began.',
        'Not with rescue.',
        'Not with innocence.',
        'Only with her name still present,',
        'and yours no longer missing from the room.'
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
      response: 'SOUND RECOVERED.',
      body: [
        'You did not need to see everything.',
        'The room had a sound.',
        'You carried it longer than the program could.'
      ].join('\n')
    };
  }

  if (keptTypingStatementAccepted && obedience >= 12) {
    return {
      routeId: 'completed_exercise',
      statement: 'I KEPT TYPING',
      title: 'COMPLETED EXERCISE',
      response: 'ACTION CONFIRMED.',
      body: [
        'The program records the motion.',
        'Key after key.',
        'Line after line.',
        'Whatever you meant,',
        'your hands did not stop.'
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
      response: 'SIGHTLINE UNRESOLVED.',
      body: [
        'The sentence points behind you.',
        'It always has.',
        'But the chair was small,',
        'the voice was adult,',
        'and the screen was waiting.'
      ].join('\n')
    };
  }

  if (suppression >= disclosure || witnessAcceptance < 5) {
    return {
      routeId: 'gold_star',
      statement: 'I DID NOT SEE ANYTHING',
      title: 'GOLD STAR',
      response: 'GOLD STAR AWARDED.',
      body: [
        'The program accepts your answer.',
        'Your score improves.',
        'Emily Vale remains absent.',
        'Mr Fingers is very proud.'
      ].join('\n')
    };
  }

  return {
    routeId: 'incomplete_statement',
    statement: 'I KEPT TYPING',
    title: 'INCOMPLETE STATEMENT',
    response: 'STATEMENT INCOMPLETE.',
    body: [
      'The record does not close.',
      'Some words stayed.',
      'Some words were corrected.',
      'The cursor waits where the sentence should end.'
    ].join('\n')
  };
}

export default getFinalStatement;
