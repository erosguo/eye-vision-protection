const { shell } = require('electron')

class AudioPlayer {
  constructor() {
    this._enabled = true
  }

  setEnabled(enabled) {
    this._enabled = enabled
  }

  playBreakAlert() {
    if (!this._enabled) return
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        try {
          shell.beep()
        } catch {
        }
      }, i * 300)
    }
  }

  destroy() {
  }
}

module.exports = { AudioPlayer }
