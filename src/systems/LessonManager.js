export default class LessonManager {
  constructor() {
    this.acts = [];
    this.currentActIndex = 0;
    this.currentLessonIndex = 0;
  }

  loadActs(actJsonArray) {
    this.acts = actJsonArray;
    this.currentActIndex = 0;
    this.currentLessonIndex = 0;
  }

  loadAct(actJson) {
    this.loadActs([actJson]);
  }

  getCurrentAct() {
    return this.acts[this.currentActIndex] || null;
  }

  getCurrentLesson() {
    const act = this.getCurrentAct();
    if (!act) return null;
    return act.lessons[this.currentLessonIndex] || null;
  }

  getActTitle() {
    const act = this.getCurrentAct();
    return act ? act.title : '';
  }

  advance() {
    this.currentLessonIndex++;
    return this.getCurrentLesson();
  }

  advanceAct() {
    this.currentActIndex++;
    this.currentLessonIndex = 0;
    return this.getCurrentAct() !== null;
  }

  jumpToActId(actId) {
    const target = String(actId || '').trim();
    if (!target) return false;

    const index = this.acts.findIndex((act) => {
      if (!act || !act.actId) return false;
      return act.actId === target || act.actId.startsWith(`${target}_`);
    });
    if (index < 0) return false;

    this.currentActIndex = index;
    this.currentLessonIndex = 0;
    return true;
  }

  jumpToLessonId(lessonId) {
    const target = String(lessonId || '').trim();
    if (!target) return false;

    for (let actIndex = 0; actIndex < this.acts.length; actIndex++) {
      const act = this.acts[actIndex];
      const lessons = act && act.lessons;
      if (!Array.isArray(lessons)) continue;

      const lessonIndex = lessons.findIndex((lesson) => lesson && lesson.id === target);
      if (lessonIndex >= 0) {
        this.currentActIndex = actIndex;
        this.currentLessonIndex = lessonIndex;
        return true;
      }
    }

    return false;
  }

  isActComplete() {
    const act = this.getCurrentAct();
    if (!act) return true;
    return this.currentLessonIndex >= act.lessons.length;
  }

  isAllComplete() {
    return this.currentActIndex >= this.acts.length;
  }

  getLessonNumber() {
    return this.currentLessonIndex + 1;
  }

  getTotalLessons() {
    const act = this.getCurrentAct();
    return act ? act.lessons.length : 0;
  }

  getActNumber() {
    return this.currentActIndex + 1;
  }

  getTotalActs() {
    return this.acts.length;
  }

  getGlobalLessonNumber() {
    let count = 0;
    for (let i = 0; i < this.currentActIndex; i++) {
      count += this.acts[i].lessons.length;
    }
    return count + this.currentLessonIndex + 1;
  }

  getGlobalTotalLessons() {
    let count = 0;
    for (const act of this.acts) {
      count += act.lessons.length;
    }
    return count;
  }
}
