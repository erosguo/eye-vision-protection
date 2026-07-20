const STATES = {
  IDLE: 'IDLE',
  WORKING: 'WORKING',
  PAUSED: 'PAUSED',
  ON_BREAK: 'ON_BREAK'
}

const TRANSITIONS = {
  IDLE: { start: 'WORKING' },
  WORKING: { pause: 'PAUSED', complete: 'ON_BREAK' },
  PAUSED: { resume: 'WORKING', abort: 'IDLE' },
  ON_BREAK: { finish: 'WORKING', skip: 'WORKING', snooze: 'WORKING' }
}

class StateMachine {
  constructor() {
    this._state = STATES.IDLE
    this._listeners = []
  }

  get state() {
    return this._state
  }

  onTransition(callback) {
    this._listeners.push(callback)
  }

  transition(action) {
    const current = this._state
    const transitions = TRANSITIONS[current]
    if (!transitions || !transitions[action]) {
      return false
    }
    const next = transitions[action]
    this._state = next
    this._listeners.forEach(cb => cb(next, action, current))
    return true
  }

  can(action) {
    const transitions = TRANSITIONS[this._state]
    return !!(transitions && transitions[action])
  }

  reset() {
    this._state = STATES.IDLE
  }
}

StateMachine.STATES = STATES

if (typeof module !== 'undefined') {
  module.exports = { StateMachine, STATES }
}
