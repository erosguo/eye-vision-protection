const { StateMachine, STATES } = require('./state-machine.js')

class TimerManager {
  constructor(settingsManager) {
    this._sm = new StateMachine()
    this._settings = settingsManager
    this._workRemaining = 0
    this._restRemaining = 0
    this._interval = null
    this._onWorkComplete = null
    this._onRestComplete = null
    this._onStateChange = null
    this._tickMs = 1000

    this._sm.onTransition((state, action, prev) => {
      if (this._onStateChange) {
        this._onStateChange(state, action, prev)
      }
    })
  }

  get state() {
    return this._sm.state
  }

  get workRemaining() {
    return this._workRemaining
  }

  get restRemaining() {
    return this._restRemaining
  }

  get isRunning() {
    return this._interval !== null
  }

  onWorkComplete(callback) {
    this._onWorkComplete = callback
  }

  onRestComplete(callback) {
    this._onRestComplete = callback
  }

  onStateChange(callback) {
    this._onStateChange = callback
    this._sm.onTransition(callback)
  }

  start() {
    if (!this._sm.can('start')) return false
    this._workRemaining = this._settings.get('workInterval') * 60
    this._sm.transition('start')
    this._startTick()
    return true
  }

  pause() {
    if (!this._sm.can('pause')) return false
    this._sm.transition('pause')
    this._stopTick()
    return true
  }

  resume() {
    if (!this._sm.can('resume')) return false
    this._sm.transition('resume')
    this._startTick()
    return true
  }

  abort() {
    if (!this._sm.can('abort')) return false
    this._sm.transition('abort')
    this._stopTick()
    this._workRemaining = 0
    this._restRemaining = 0
    return true
  }

  startBreak() {
    if (!this._sm.can('complete')) return false
    this._sm.transition('complete')
    this._stopTick()
    this._restRemaining = this._settings.get('restDuration') * 60
    this._startTick()
    return true
  }

  skipBreak() {
    if (!this._sm.can('skip')) return false
    this._sm.transition('skip')
    this._stopTick()
    this._startWorkCycle()
    return true
  }

  snoozeBreak(minutes) {
    if (!this._sm.can('snooze')) return false
    this._sm.transition('snooze')
    this._stopTick()
    this._workRemaining = minutes * 60
    this._startTick()
    return true
  }

  finishBreak() {
    if (!this._sm.can('finish')) return false
    this._sm.transition('finish')
    this._stopTick()
    this._startWorkCycle()
    return true
  }

  _startWorkCycle() {
    this._workRemaining = this._settings.get('workInterval') * 60
    this._startTick()
  }

  _startTick() {
    this._stopTick()
    this._interval = setInterval(() => this._tick(), this._tickMs)
  }

  _stopTick() {
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  _tick() {
    if (this._sm.state === STATES.WORKING) {
      this._workRemaining--
      if (this._workRemaining <= 0) {
        this._workRemaining = 0
        this._stopTick()
        if (this._onWorkComplete) {
          this._onWorkComplete()
        }
      }
    } else if (this._sm.state === STATES.ON_BREAK) {
      this._restRemaining--
      if (this._restRemaining <= 0) {
        this._restRemaining = 0
        this._stopTick()
        if (this._onRestComplete) {
          this._onRestComplete()
        }
      }
    }
  }

  destroy() {
    this._stopTick()
    this._sm.reset()
  }
}

module.exports = { TimerManager }
