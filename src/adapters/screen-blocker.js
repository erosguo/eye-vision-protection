const { BrowserWindow, screen, ipcMain } = require('electron')
const path = require('path')

class ScreenBlocker {
  constructor(preloadPath) {
    this._windows = []
    this._preloadPath = preloadPath
    this._onUserAction = null
    this._setupIPC()
  }

  onUserAction(callback) {
    this._onUserAction = callback
  }

  show() {
    this.hide()
    const displays = screen.getAllDisplays()

    displays.forEach((display, index) => {
      const { x, y, width, height } = display.bounds
      const win = new BrowserWindow({
        x, y, width, height,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        fullscreen: true,
        skipTaskbar: true,
        resizable: false,
        focusable: true,
        webPreferences: {
          preload: this._preloadPath,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        }
      })

      win.setAlwaysOnTop(true, 'screen-saver')
      win.setVisibleOnAllWorkspaces(true)

      const breakPath = path.join(__dirname, '..', 'ui', 'break', 'index.html')
      win.loadFile(breakPath)

      win.on('closed', () => {
        this._windows = this._windows.filter(w => w !== win)
      })

      this._windows.push(win)
    })
  }

  hide() {
    this._windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.close()
      }
    })
    this._windows = []
  }

  updateDisplay(displayIndex, data) {
    if (this._windows[displayIndex] && !this._windows[displayIndex].isDestroyed()) {
      this._windows[displayIndex].webContents.send('break-update', data)
    }
  }

  broadcast(data) {
    this._windows.forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('break-update', data)
      }
    })
  }

  onBreakReady(callback) {
    this._onBreakReady = callback
  }

  _setupIPC() {
    ipcMain.on('break-action', (event, action, payload) => {
      if (this._onUserAction) {
        this._onUserAction(action, payload)
      }
    })
    ipcMain.on('break-ready', (event) => {
      if (this._onBreakReady) {
        this._onBreakReady(event)
      }
    })
  }

  destroy() {
    this.hide()
    try {
      ipcMain.removeAllListeners('break-action')
      ipcMain.removeAllListeners('break-ready')
    } catch {
    }
  }
}

module.exports = { ScreenBlocker }
