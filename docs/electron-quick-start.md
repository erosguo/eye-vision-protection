# Electron 快速入门笔记

本文基于 eye-vision-protection 项目，介绍 Electron 的核心概念和开发模式。

---

## 1. 什么是 Electron

Electron 是一个使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用的框架。它将 Chromium 和 Node.js 嵌入到一个二进制文件中，使你可以用 Web 技术编写桌面应用。

**核心优势**：
- 跨平台：一套代码运行在 Windows、macOS、Linux
- 使用熟悉的 Web 技术栈
- 访问系统级 API（文件系统、系统托盘、窗口管理等）
- 活跃的社区和丰富的生态

---

## 2. 项目基础配置

### 2.1 package.json 核心配置

```json
{
  "name": "eye-vision-protection",
  "version": "1.0.0",
  "main": "src/main.js",      
  "scripts": {
    "start": "electron .",   
    "build": "electron-builder --win"  
  },
  "build": {
    "appId": "com.eye-vision-protection.app",
    "productName": "视力保护助手",
    "directories": { "output": "dist" },
    "files": ["src/**/*", "package.json"],
    "win": {
      "target": "nsis",
      "icon": "src/assets/icon.png"
    }
  }
}
```

**关键字段说明**：
| 字段 | 说明 |
|------|------|
| `main` | 主进程入口文件 |
| `scripts.start` | 启动开发模式 |
| `scripts.build` | 打包命令 |
| `build.appId` | 应用唯一标识符 |
| `build.files` | 需要打包的文件 |
| `build.win.target` | Windows 打包目标（nsis 安装包） |

### 2.2 项目结构

```
eye-vision-protection/
├── src/
│   ├── main.js          # 主进程（Node.js 环境）
│   ├── preload.js       # 预加载脚本（桥接层）
│   ├── core/            # 核心业务逻辑
│   ├── adapters/        # 平台适配器
│   └── ui/              # 渲染进程（Web 环境）
│       ├── settings/    # 设置窗口
│       └── break/       # 休息拦截窗口
└── package.json
```

---

## 3. 主进程 vs 渲染进程

### 3.1 核心概念

| 进程 | 环境 | 能力 | 典型用途 |
|------|------|------|----------|
| **主进程** | Node.js | 系统级 API、窗口管理、IPC | 应用生命周期、业务逻辑、系统交互 |
| **渲染进程** | Chromium | Web API | UI 渲染、用户交互 |

### 3.2 主进程示例

[main.js](file:///d:/project/erosguo/eye-vision-protection/src/main.js) 是本项目的主进程入口：

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')

app.whenReady().then(() => {
  // 创建窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      
      nodeIntegration: false       
    }
  })
  
  mainWindow.loadFile('src/ui/index.html')
})
```

**安全配置**：
- `contextIsolation: true` - 开启上下文隔离，防止渲染进程访问 Node.js 原生 API
- `nodeIntegration: false` - 禁止直接在渲染进程使用 Node.js

### 3.3 渲染进程示例

渲染进程就是普通的 HTML/CSS/JavaScript：

```html
<!-- src/ui/settings/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>设置</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <input type="number" id="workInterval">
    <button onclick="saveSettings()">保存</button>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
```

---

## 4. IPC 通信

### 4.1 什么是 IPC

IPC (Inter-Process Communication) 是主进程和渲染进程之间的通信机制。

**通信方式**：

| 方向 | API | 用途 |
|------|-----|------|
| 渲染 → 主（单向） | `ipcRenderer.send()` | 发送事件通知 |
| 渲染 → 主（双向） | `ipcRenderer.invoke()` | 请求-响应模式 |
| 主 → 渲染 | `webContents.send()` | 主动推送数据 |

### 4.2 预加载脚本（Bridge）

[preload.js](file:///d:/project/erosguo/eye-vision-protection/src/preload.js) 是连接两个进程的桥梁：

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onStateChange: (callback) => {
    const handler = (event, state) => callback(state)
    ipcRenderer.on('state-changed', handler)
    return () => ipcRenderer.removeListener('state-changed', handler)
  }
})
```

**`contextBridge.exposeInMainWorld()`** 将安全的 API 暴露给渲染进程的 `window` 对象。

### 4.3 主进程 IPC 处理

```javascript
// main.js - 注册 IPC 处理
ipcMain.handle('get-settings', () => settingsManager.getAll())

ipcMain.handle('save-settings', (event, settings) => {
  settingsManager.setAll(settings)
  return true
})

// 主动向渲染进程发送消息
function broadcastState() {
  const state = { status: 'working', workRemaining: 1500 }
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('state-changed', state)
  })
}
```

### 4.4 渲染进程调用

```javascript
// renderer.js - 调用暴露的 API
async function loadSettings() {
  const settings = await window.api.getSettings()
  console.log(settings)
}

// 监听主进程推送
const unsubscribe = window.api.onStateChange((state) => {
  console.log('状态变化:', state)
})
```

---

## 5. 系统托盘

### 5.1 创建托盘图标

```javascript
const { Tray, Menu } = require('electron')

class TrayManager {
  constructor(iconPath) {
    this._iconPath = iconPath
    this._tray = null
  }
  
  create() {
    this._tray = new Tray(this._iconPath)
    
    const contextMenu = Menu.buildFromTemplate([
      { label: '显示设置', click: () => this._onShowSettings() },
      { label: '暂停/继续', click: () => this._onTogglePause() },
      { type: 'separator' },
      { label: '退出', click: () => this._onQuit() }
    ])
    
    this._tray.setContextMenu(contextMenu)
    this._tray.setToolTip('视力保护助手')
  }
}
```

### 5.2 切换托盘图标

```javascript
setRestIcon() {
  this._tray.setImage(path.join(__dirname, '../assets/tray-icon-rest.png'))
}

setWorkingIcon() {
  this._tray.setImage(this._iconPath)
}
```

---

## 6. 窗口管理

### 6.1 创建无边框全屏窗口

```javascript
const blockerWindow = new BrowserWindow({
  fullscreen: true,
  frame: false,          
  transparent: true,     
  alwaysOnTop: true,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false
  }
})
```

**配置说明**：
- `frame: false` - 隐藏窗口边框和标题栏
- `transparent: true` - 透明背景
- `alwaysOnTop: true` - 始终在最顶层

### 6.2 多显示器支持

```javascript
const displays = screen.getAllDisplays()

displays.forEach((display, index) => {
  const win = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: { preload: preloadPath }
  })
  this._windows.push(win)
})
```

---

## 7. 数据持久化

### 7.1 使用文件系统

```javascript
const fs = require('fs')
const path = require('path')

class SettingsManager {
  constructor(userDataPath) {
    this._settingsPath = path.join(userDataPath, 'settings.json')
    this._defaults = {
      workInterval: 25,
      restDuration: 5,
      soundEnabled: true,
      autoStart: false
    }
  }
  
  getAll() {
    try {
      const data = fs.readFileSync(this._settingsPath, 'utf-8')
      return { ...this._defaults, ...JSON.parse(data) }
    } catch {
      return { ...this._defaults }
    }
  }
  
  setAll(settings) {
    fs.writeFileSync(this._settingsPath, JSON.stringify(settings, null, 2))
  }
}
```

**用户数据目录**：`app.getPath('userData')` 返回系统指定的用户数据目录

---

## 8. 应用生命周期

### 8.1 关键事件

```javascript
app.on('ready', () => {
  // 应用初始化完成
})

app.on('window-all-closed', () => {
  // 所有窗口关闭
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS 点击 Dock 图标
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  // 退出前清理
  cleanup()
})
```

### 8.2 优雅退出

```javascript
function cleanup() {
  if (updateInterval) clearInterval(updateInterval)
  if (screenBlocker) screenBlocker.destroy()
  if (activityDetector) activityDetector.destroy()
  if (timerManager) timerManager.destroy()
}
```

---

## 9. 打包发布

### 9.1 使用 electron-builder

**安装依赖**：
```bash
npm install electron-builder --save-dev
```

**打包命令**：
```bash
npm run build           # Windows NSIS 安装包
npm run build -- --mac  # macOS DMG
npm run build -- --linux # Linux AppImage
```

### 9.2 打包配置

```json
{
  "build": {
    "appId": "com.eye-vision-protection.app",
    "productName": "视力保护助手",
    "directories": { "output": "dist" },
    "files": ["src/**/*", "package.json"],
    "win": {
      "target": "nsis",
      "icon": "src/assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

---

## 10. 安全最佳实践

### 10.1 必须开启的安全配置

```javascript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,        
    nodeIntegration: false,        
    enableRemoteModule: false,     
    sandbox: true                  
  }
})
```

### 10.2 预加载脚本安全

- 只暴露必要的 API
- 对传入参数进行验证
- 使用 `contextBridge.exposeInMainWorld()` 而非 `window.X = Y`

### 10.3 内容安全策略 (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
">
```

---

## 11. 调试技巧

### 11.1 打开开发者工具

```javascript
mainWindow.webContents.openDevTools()
```

### 11.2 控制台日志

```javascript
console.log('主进程日志')

// 在渲染进程中
window.api.onStateChange((state) => {
  console.log('状态:', state)
})
```

### 11.3 进程间日志区分

- 主进程日志：显示在启动终端
- 渲染进程日志：显示在 DevTools 控制台

---

## 12. 常见问题

### Q1: 应用启动后没有窗口？

检查 `main.js` 是否在 `app.whenReady()` 回调中创建了窗口。

### Q2: 渲染进程无法访问 Node.js API？

这是安全限制。需要通过 `preload.js` 的 `contextBridge` 暴露。

### Q3: 打包后找不到文件？

确保 `package.json` 的 `build.files` 包含所有需要的文件。

### Q4: 如何处理多平台差异？

使用平台适配器模式：

```javascript
// adapters/activity-detector.js
class ActivityDetector {
  constructor() {
    if (process.platform === 'win32') {
      this._detector = new WindowsActivityDetector()
    } else if (process.platform === 'darwin') {
      this._detector = new MacActivityDetector()
    }
  }
}
```

---

## 13. 学习资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - 在线代码编辑器
- [electron-builder 文档](https://www.electron.build/)
- [awesome-electron](https://github.com/sindresorhus/awesome-electron)