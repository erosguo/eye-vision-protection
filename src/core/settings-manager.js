const fs = require('fs')
const path = require('path')

const DEFAULTS = {
  workInterval: 25,
  restDuration: 5,
  soundEnabled: true,
  autoStart: false
}

class SettingsManager {
  constructor(userDataPath) {
    this._filePath = path.join(userDataPath, 'settings.json')
    this._settings = { ...DEFAULTS }
    this._load()
  }

  get(key) {
    return this._settings[key]
  }

  getAll() {
    return { ...this._settings }
  }

  set(key, value) {
    this._settings[key] = value
    this._save()
  }

  setAll(settings) {
    Object.assign(this._settings, DEFAULTS, settings)
    this._save()
  }

  reset() {
    this._settings = { ...DEFAULTS }
    this._save()
  }

  _load() {
    try {
      if (fs.existsSync(this._filePath)) {
        const data = fs.readFileSync(this._filePath, 'utf-8')
        const parsed = JSON.parse(data)
        Object.assign(this._settings, DEFAULTS, parsed)
      }
    } catch {
      this._settings = { ...DEFAULTS }
    }
  }

  _save() {
    try {
      const dir = path.dirname(this._filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this._filePath, JSON.stringify(this._settings, null, 2), 'utf-8')
    } catch {
    }
  }
}

module.exports = { SettingsManager, DEFAULTS }
