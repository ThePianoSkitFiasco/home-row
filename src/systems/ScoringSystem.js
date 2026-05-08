export default class ScoringSystem {
  static evaluate(stats) {
    const wpm = stats.wpm || 0;
    const accuracy = stats.accuracy || 100;

    let stars = 1;
    if (accuracy >= 95) stars = 3;
    else if (accuracy >= 80) stars = 2;

    const goldStar = accuracy === 100 && wpm >= 15;

    let grade;
    if (accuracy >= 97) grade = 'A+';
    else if (accuracy >= 93) grade = 'A';
    else if (accuracy >= 90) grade = 'A-';
    else if (accuracy >= 87) grade = 'B+';
    else if (accuracy >= 83) grade = 'B';
    else if (accuracy >= 80) grade = 'B-';
    else if (accuracy >= 77) grade = 'C+';
    else if (accuracy >= 73) grade = 'C';
    else if (accuracy >= 70) grade = 'C-';
    else if (accuracy >= 60) grade = 'D';
    else grade = 'F';

    let comment;
    if (goldStar) comment = 'Gold Star! Perfect typing!';
    else if (grade.startsWith('A')) comment = 'Excellent work! Neat fingers!';
    else if (grade.startsWith('B')) comment = 'Good effort! Keep practicing!';
    else if (grade.startsWith('C')) comment = 'Practice makes perfect!';
    else comment = 'Try again — you can do better!';

    return { wpm, accuracy, stars, goldStar, grade, comment };
  }

  static formatReportCard(stats) {
    const result = ScoringSystem.evaluate(stats);
    const starStr = result.goldStar
      ? '[ GOLD STAR ]'
      : '[ ' + '*'.repeat(result.stars) + ' ]';

    return {
      ...result,
      lines: [
        'PROGRESS REPORT',
        '',
        `Speed:     ${result.wpm} WPM`,
        `Accuracy:  ${result.accuracy}%`,
        `Grade:     ${result.grade}`,
        `Rating:    ${starStr}`,
        '',
        result.comment
      ]
    };
  }
}
