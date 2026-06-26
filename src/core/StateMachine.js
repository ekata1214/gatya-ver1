export const States = {
  IDLE: 'IDLE',
  FIRE_ONLY: 'FIRE_ONLY',
  CARD_SPAWN: 'CARD_SPAWN',
  CARD_DISAPPEAR: 'CARD_DISAPPEAR',
  SSR_DROP: 'SSR_DROP',
  TITLE_SHOW: 'TITLE_SHOW',
  TITLE_OUT: 'TITLE_OUT',
  INK_PLAY: 'INK_PLAY',
  COUNT_VIDEO: 'COUNT_VIDEO',
  COUNT_5: 'COUNT_5',
  COUNT_4: 'COUNT_4',
  COUNT_3: 'COUNT_3',
  COUNT_2: 'COUNT_2',
  COUNT_1: 'COUNT_1',
  COUNT_LAST: 'COUNT_LAST',
  BLACKOUT: 'BLACKOUT',
  SSR_RESULT: 'SSR_RESULT',
  WHITEOUT: 'WHITEOUT',
  FINISH: 'FINISH',
};

export class StateMachine {
  constructor(onChange) {
    this.state = States.IDLE;
    this.onChange = onChange;
  }

  transition(next) {
    if (this.state === next) return;
    const prev = this.state;
    this.state = next;
    this.onChange?.(next, prev);
  }

  reset() {
    this.state = States.IDLE;
  }
}
