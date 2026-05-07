const STATE_LABELS = {
  idle:                '[ Mr. Fingers is watching... ]',
  encourage:           '[ Mr. Fingers gives a thumbs up! ]',
  mistake_notice:      '[ Mr. Fingers frowns slightly. ]',
  corrective_smile:    '[ Mr. Fingers smiles. Too wide. ]',
  glitch_warning:      '[ Mr. Fingers flickers. ]',
  angry:               '[ Mr. Fingers is not smiling anymore. ]',
  emily_bleedthrough:  '[ Mr. Fingers is... someone else? ]',
  protector:           '[ Mr. Fingers stands between you and the screen. ]',
  witness:             '[ Mr. Fingers remembers. ]'
};

export default class MrFingersController {
  constructor() {
    this.state = 'idle';
    this.onStateChange = null;
  }

  setState(newState) {
    if (!STATE_LABELS[newState]) return;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, STATE_LABELS[newState]);
    }
  }

  getLabel() {
    return STATE_LABELS[this.state] || STATE_LABELS.idle;
  }

  getState() {
    return this.state;
  }
}
