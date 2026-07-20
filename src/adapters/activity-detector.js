const { powerMonitor } = require('electron')

const IDLE_THRESHOLD = 120
const LONG_IDLE_THRESHOLD = 600

class ActivityDetector {
  constructor() {
    this._interval = null
    this._checkIntervalMs = 5000
    this._wasIdle = false
    this._onActive = null
    this._onIdle = null
    this._onLongIdle = null
  }

  onActive(callback) {
    this._onActive = callback
  }

  onIdle(callback) {
    this._onIdle = callback
  }

  onLongIdle(callback) {
    this._onLongIdle = callback
  }

  start() {
    this._interval = setInterval(() => this._check(), this._checkIntervalMs)
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  _check() {
    const idleTime = powerMonitor.getSystemIdleTime()

    if (idleTime >= LONG_IDLE_THRESHOLD) {
      if (this._wasIdle) return
      this._wasIdle = true
      if (this._onLongIdle) this._onLongIdle()
      if (this._onIdle) this._onIdle()
    } else if (idleTime >= IDLE_THRESHOLD) {
      if (this._wasIdle) return
      this._wasIdle = true
      if (this._onIdle) this._onIdle()
    } else {
      if (!this._wasIdle) return
      this._wasIdle = false
      if (this._onActive) this._onActive()
    }
  }

  destroy() {
    this.stop()
  }
}

module.exports = { ActivityDetector }
