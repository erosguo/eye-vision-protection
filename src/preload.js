const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  skipBreak: () => ipcRenderer.send('break-action', 'skip'),
  snoozeBreak: (minutes) => ipcRenderer.send('break-action', 'snooze', minutes),
  finishBreak: () => ipcRenderer.send('break-action', 'finish'),
  getState: () => ipcRenderer.invoke('get-state'),
  onStateChange: (callback) => {
    const handler = (event, state) => callback(state)
    ipcRenderer.on('state-changed', handler)
    return () => ipcRenderer.removeListener('state-changed', handler)
  },
  onBreakUpdate: (callback) => {
    const handler = (event, data) => callback(data)
    ipcRenderer.on('break-update', handler)
    return () => ipcRenderer.removeListener('break-update', handler)
  },
  sendBreakReady: () => ipcRenderer.send('break-ready')
})
