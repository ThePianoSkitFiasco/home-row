const STATES = {
  idle: {
    id: 'idle',
    label: '[ Mr. Fingers is watching... ]',
    spriteKey: 'mr_idle'
  },
  encourage: {
    id: 'encourage',
    label: '[ Mr. Fingers gives a thumbs up! ]',
    spriteKey: 'mr_encourage'
  },
  mistake_notice: {
    id: 'mistake_notice',
    label: '[ Mr. Fingers frowns slightly. ]',
    spriteKey: 'mr_mistake_notice'
  },
  corrective_smile: {
    id: 'corrective_smile',
    label: '[ Mr. Fingers smiles. Too wide. ]',
    spriteKey: 'mr_corrective_smile'
  },
  glitch_warning: {
    id: 'glitch_warning',
    label: '[ Mr. Fingers flickers. ]',
    spriteKey: 'mr_glitch_warning',
    flicker: true
  },
  angry: {
    id: 'angry',
    label: '[ Mr. Fingers is not smiling anymore. ]',
    spriteKey: 'mr_angry',
    hardFlash: true
  },
  emily_bleedthrough: {
    id: 'emily_bleedthrough',
    label: '[ Mr. Fingers is... someone else? ]',
    spriteKey: 'mr_emily_bleedthrough',
    flicker: true
  },
  protector: {
    id: 'protector',
    label: '[ Mr. Fingers stands between you and the screen. ]',
    spriteKey: 'mr_protector'
  },
  witness: {
    id: 'witness',
    label: '[ Mr. Fingers remembers. ]',
    spriteKey: 'mr_witness',
    calm: true
  }
};

export default class MrFingersController {
  constructor() {
    this.state = 'idle';
    this.onStateChange = null;
  }

  setState(newState) {
    const stateConfig = STATES[newState];
    if (!stateConfig) return;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, stateConfig.label, stateConfig);
    }
  }

  getLabel() {
    return this.getStateConfig().label;
  }

  getState() {
    return this.state;
  }

  getStateConfig(state = this.state) {
    return STATES[state] || STATES.idle;
  }

  getStates() {
    return Object.values(STATES);
  }
}
