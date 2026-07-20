const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron')
const path = require('path')
const { SettingsManager } = require('./core/settings-manager.js')
const { TimerManager } = require('./core/timer-manager.js')
const { ActivityDetector } = require('./adapters/activity-detector.js')
const { ScreenBlocker } = require('./adapters/screen-blocker.js')
const { TrayManager } = require('./adapters/tray-manager.js')
const { AudioPlayer } = require('./adapters/audio-player.js')
const { STATES } = require('./core/state-machine.js')

let settingsManager
let timerManager
let activityDetector
let screenBlocker
let trayManager
let audioPlayer
let settingsWindow = null
let updateInterval = null

const preloadPath = path.join(__dirname, 'preload.js')
const iconPath = path.join(__dirname, 'assets', 'icon.png')
const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png')

app.whenReady().then(() => {
  settingsManager = new SettingsManager(app.getPath('userData'))
  audioPlayer = new AudioPlayer()
  audioPlayer.setEnabled(settingsManager.get('soundEnabled'))

  timerManager = new TimerManager(settingsManager)
  screenBlocker = new ScreenBlocker(preloadPath)
  activityDetector = new ActivityDetector()

  trayManager = new TrayManager(trayIconPath)
  trayManager.create()
  trayManager.onShowSettings(() => openSettingsWindow())
  trayManager.onTogglePause(() => togglePause())
  trayManager.onQuit(() => {
    app.isQuitting = true
    app.quit()
  })

  setupTimerCallbacks()
  setupActivityCallbacks()
  setupScreenBlockerCallbacks()
  setupIPC()

  timerManager.start()
  activityDetector.start()
  startUpdateInterval()

  app.on('before-quit', () => {
    app.isQuitting = true
    cleanup()
  })

  app.on('window-all-closed', () => {
  })
})

function setupTimerCallbacks() {
  timerManager.onWorkComplete(() => {
    audioPlayer.playBreakAlert()
    screenBlocker.show()
    trayManager.setRestIcon()
  })

  timerManager.onRestComplete(() => {
    screenBlocker.hide()
    timerManager.finishBreak()
    trayManager.setWorkingIcon()
  })

  timerManager.onStateChange((state) => {
    broadcastState()
  })
}

function setupActivityCallbacks() {
  activityDetector.onIdle(() => {
    if (timerManager.state === STATES.WORKING) {
      timerManager.pause()
    }
  })

  activityDetector.onActive(() => {
    if (timerManager.state === STATES.PAUSED) {
      timerManager.resume()
    }
  })

  activityDetector.onLongIdle(() => {
    if (timerManager.state === STATES.PAUSED || timerManager.state === STATES.WORKING) {
      timerManager.abort()
    }
  })
}

function setupScreenBlockerCallbacks() {
  screenBlocker.onUserAction((action, payload) => {
    switch (action) {
      case 'skip':
        timerManager.skipBreak()
        screenBlocker.hide()
        trayManager.setWorkingIcon()
        break
      case 'snooze':
        timerManager.snoozeBreak(payload || 5)
        screenBlocker.hide()
        trayManager.setWorkingIcon()
        break
      case 'finish':
        timerManager.finishBreak()
        screenBlocker.hide()
        trayManager.setWorkingIcon()
        break
    }
  })

  screenBlocker.onBreakReady(() => {
    broadcastBreakUpdate()
  })
}

function startUpdateInterval() {
  updateInterval = setInterval(() => {
    broadcastBreakUpdate()
    broadcastState()
  }, 1000)
}

function broadcastBreakUpdate() {
  const data = {
    restRemaining: timerManager.restRemaining,
    totalRestSeconds: settingsManager.get('restDuration') * 60
  }
  screenBlocker.broadcast(data)
}

function broadcastState() {
  const state = {
    status: timerManager.state,
    workRemaining: timerManager.workRemaining,
    restRemaining: timerManager.restRemaining
  }
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send('state-changed', state)
      } catch {
      }
    }
  })
}

function setupIPC() {
  ipcMain.handle('get-settings', () => settingsManager.getAll())
  ipcMain.handle('save-settings', (event, settings) => {
    settingsManager.setAll(settings)
    audioPlayer.setEnabled(settings.soundEnabled)
    try {
      app.setLoginItemSettings({
        openAtLogin: settings.autoStart
      })
    } catch {
    }
  })
  ipcMain.handle('get-state', () => ({
    status: timerManager.state,
    workRemaining: timerManager.workRemaining,
    restRemaining: timerManager.restRemaining
  }))

}

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 520,
    resizable: false,
    title: '视力保护助手 - 设置',
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const settingsPath = path.join(__dirname, 'ui', 'settings', 'index.html')
  settingsWindow.loadFile(settingsPath)

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function togglePause() {
  if (timerManager.state === STATES.PAUSED) {
    timerManager.resume()
    trayManager.setPaused(false)
  } else if (timerManager.state === STATES.WORKING) {
    timerManager.pause()
    trayManager.setPaused(true)
  }
}

function cleanup() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
  if (screenBlocker) screenBlocker.destroy()
  if (activityDetector) activityDetector.destroy()
  if (timerManager) timerManager.destroy()
  if (trayManager) trayManager.destroy()
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close()
  }
}
