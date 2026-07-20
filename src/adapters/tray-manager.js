const { Tray, Menu, app, nativeImage } = require('electron')
const path = require('path')

class TrayManager {
  constructor(iconPath) {
    this._tray = null
    this._iconPath = iconPath
    this._onShowSettings = null
    this._onTogglePause = null
    this._onQuit = null
    this._isPaused = false
  }

  onShowSettings(callback) {
    this._onShowSettings = callback
  }

  onTogglePause(callback) {
    this._onTogglePause = callback
  }

  onQuit(callback) {
    this._onQuit = callback
  }

  create() {
    const icon = nativeImage.createFromPath(this._iconPath)
    this._tray = new Tray(icon.resize({ width: 16, height: 16 }))
    this._tray.setToolTip('视力保护助手')
    this._updateMenu()
  }

  setPaused(paused) {
    this._isPaused = paused
    this._updateMenu()
  }

  setWorkingIcon() {
    this._updateIcon('working')
  }

  setRestIcon() {
    this._updateIcon('rest')
  }

  _updateIcon(status) {
    try {
      const iconName = status === 'rest' ? 'tray-icon-rest.png' : 'tray-icon.png'
      const iconPath = path.join(path.dirname(this._iconPath), iconName)
      const { nativeImage } = require('electron')
      const icon = nativeImage.createFromPath(iconPath)
      this._tray.setImage(icon.resize({ width: 16, height: 16 }))
    } catch {
    }
  }

  _updateMenu() {
    const pauseLabel = this._isPaused ? '恢复计时' : '暂停计时'
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示设置',
        click: () => {
          if (this._onShowSettings) this._onShowSettings()
        }
      },
      { type: 'separator' },
      {
        label: pauseLabel,
        click: () => {
          if (this._onTogglePause) this._onTogglePause()
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          if (this._onQuit) this._onQuit()
        }
      }
    ])
    this._tray.setContextMenu(contextMenu)
  }

  destroy() {
    if (this._tray) {
      this._tray.destroy()
      this._tray = null
    }
  }
}

module.exports = { TrayManager }
