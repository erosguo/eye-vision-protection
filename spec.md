# 视力保护助手 - 技术规范文档

## 1. 项目概述

### 1.1 项目定位
一款基于 Electron 的跨平台视力保护应用，通过持续检测用户屏幕操作时长，在达到设定时间后拦截屏幕并提醒用户休息。

### 1.2 技术栈
| 层次 | 技术选型 | 版本 |
|------|---------|------|
| 桌面框架 | Electron | ^28.0.0 |
| 打包工具 | electron-builder | ^24.9.0 |
| 前端 | 原生 HTML/CSS/JS | ES6+ |

### 1.3 架构设计
采用分层架构，实现跨平台扩展能力：

```
┌──────────────────────────────────────────────────┐
│                  UI 层 (平台相关)                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Windows  │  │  macOS   │  │  Mobile (future) │ │
│  │ Electron │  │  Swift   │  │  React Native   │ │
│  └────┬─────┘  └────┬─────┘  └───────┬─────────┘ │
├───────┴──────────────┴────────────────┴──────────┤
│              平台适配层 (Adapter)                   │
│  - ScreenBlocker (全屏拦截)                       │
│  - ActivityDetector (活动检测)                     │
│  - SystemTray (后台图标)                          │
│  - AudioPlayer (音频播放)                         │
├──────────────────────────────────────────────────┤
│              核心逻辑层 (Core, 纯JS)                │
│  - TimerManager (计时引擎)                        │
│  - SettingsManager (配置管理)                      │
│  - StateMachine (状态机)                          │
│  - 零平台依赖，纯逻辑                               │
└──────────────────────────────────────────────────┘
```

---

## 2. 文件结构

```
eye-vision-protection/
├── package.json                              # 项目配置与构建脚本
├── spec.md                                   # 技术规范文档
├── design.md                                 # 设计文档
├── plan.md                                   # 实施计划
├── .gitignore                                # Git 忽略配置
├── .husky/                                   # Git Hooks
│   └── pre-commit                            # 预提交钩子
├── dist/                                     # 构建输出目录
├── scripts/
│   └── generate-icons.js                     # 图标生成脚本
└── src/
    ├── main.js                               # Electron 主进程入口
    ├── preload.js                            # IPC 桥接脚本
    ├── core/                                 # 跨平台核心逻辑层
    │   ├── state-machine.js                  # 状态机
    │   ├── settings-manager.js               # 配置管理
    │   └── timer-manager.js                  # 计时引擎
    ├── adapters/                             # Windows 平台适配层
    │   ├── activity-detector.js              # 活动检测
    │   ├── screen-blocker.js                 # 屏幕拦截
    │   ├── tray-manager.js                   # 系统托盘
    │   └── audio-player.js                   # 音频播放
    ├── ui/                                   # UI 层
    │   ├── break/                            # 休息拦截界面
    │   │   ├── index.html
    │   │   ├── style.css
    │   │   └── renderer.js
    │   └── settings/                         # 设置界面
    │       ├── index.html
    │       ├── style.css
    │       └── renderer.js
    └── assets/                               # 静态资源
        ├── icon.png                          # 应用图标
        ├── tray-icon.png                     # 托盘工作图标
        └── tray-icon-rest.png                # 托盘休息图标
```

---

## 3. 核心模块规范

### 3.1 StateMachine（状态机）

**文件**: `src/core/state-machine.js`

**状态定义**:
| 状态 | 说明 |
|------|------|
| IDLE | 空闲状态，未开始计时 |
| WORKING | 工作中，计时进行中 |
| PAUSED | 暂停状态，用户空闲超过2分钟 |
| ON_BREAK | 休息中，屏幕被拦截 |

**状态转换**:
```
IDLE → WORKING (start)
WORKING → ON_BREAK (complete)
ON_BREAK → WORKING (finish/skip/snooze)
WORKING → PAUSED (pause)
PAUSED → WORKING (resume)
PAUSED → IDLE (abort)
```

**API**:
| 方法 | 说明 | 返回值 |
|------|------|--------|
| `get state()` | 获取当前状态 | string |
| `onTransition(callback)` | 注册状态变更回调 | void |
| `transition(action)` | 执行状态转换 | boolean |
| `can(action)` | 检查是否可执行指定动作 | boolean |
| `reset()` | 重置为 IDLE 状态 | void |

### 3.2 SettingsManager（配置管理）

**文件**: `src/core/settings-manager.js`

**默认配置**:
| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| workInterval | number | 25 | 工作间隔（分钟） |
| restDuration | number | 5 | 休息时长（分钟） |
| soundEnabled | boolean | true | 是否启用提示音 |
| autoStart | boolean | false | 是否开机自启 |

**API**:
| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `get(key)` | 获取单个配置 | key: string | any |
| `getAll()` | 获取所有配置 | - | object |
| `set(key, value)` | 设置单个配置 | key: string, value: any | void |
| `setAll(settings)` | 批量设置配置 | settings: object | void |
| `reset()` | 重置为默认值 | - | void |

**存储路径**: `app.getPath('userData')/settings.json`

### 3.3 TimerManager（计时引擎）

**文件**: `src/core/timer-manager.js`

**职责**:
- 管理工作计时和休息计时
- 依赖 StateMachine 和 SettingsManager
- 提供状态查询和控制接口

**API**:
| 方法 | 说明 | 返回值 |
|------|------|--------|
| `get state()` | 获取当前状态 | string |
| `get workRemaining()` | 获取工作剩余秒数 | number |
| `get restRemaining()` | 获取休息剩余秒数 | number |
| `get isRunning()` | 是否正在运行 | boolean |
| `onWorkComplete(callback)` | 注册工作完成回调 | void |
| `onRestComplete(callback)` | 注册休息完成回调 | void |
| `onStateChange(callback)` | 注册状态变更回调 | void |
| `start()` | 开始计时 | boolean |
| `pause()` | 暂停计时 | boolean |
| `resume()` | 恢复计时 | boolean |
| `abort()` | 中止计时，重置为 IDLE | boolean |
| `startBreak()` | 开始休息 | boolean |
| `skipBreak()` | 跳过休息 | boolean |
| `snoozeBreak(minutes)` | 延迟休息 | boolean |
| `finishBreak()` | 完成休息 | boolean |
| `destroy()` | 销毁资源 | void |

---

## 4. 适配器模块规范

### 4.1 ActivityDetector（活动检测）

**文件**: `src/adapters/activity-detector.js`

**检测逻辑**:
- 每 5 秒检测一次系统空闲时间
- 空闲 ≥ 120 秒（2分钟）→ 触发 onIdle
- 空闲 ≥ 600 秒（10分钟）→ 触发 onLongIdle
- 恢复活动 → 触发 onActive

**API**:
| 方法 | 说明 |
|------|------|
| `onActive(callback)` | 注册活动恢复回调 |
| `onIdle(callback)` | 注册空闲回调 |
| `onLongIdle(callback)` | 注册长时间空闲回调 |
| `start()` | 开始检测 |
| `stop()` | 停止检测 |
| `destroy()` | 销毁资源 |

### 4.2 ScreenBlocker（屏幕拦截）

**文件**: `src/adapters/screen-blocker.js`

**功能**:
- 遍历所有显示器，为每个显示器创建全屏拦截窗口
- 支持关闭所有拦截窗口
- 支持向所有拦截窗口广播数据

**API**:
| 方法 | 说明 | 参数 |
|------|------|------|
| `onUserAction(callback)` | 注册用户操作回调 | - |
| `onBreakReady(callback)` | 注册休息窗口就绪回调 | - |
| `show()` | 显示拦截窗口 | - |
| `hide()` | 隐藏拦截窗口 | - |
| `updateDisplay(displayIndex, data)` | 更新指定显示器数据 | displayIndex: number, data: object |
| `broadcast(data)` | 广播数据到所有窗口 | data: object |
| `destroy()` | 销毁资源 | - |

**用户操作类型**:
| 操作 | 说明 |
|------|------|
| skip | 跳过本次休息 |
| snooze | 延迟休息（带分钟参数） |
| finish | 完成休息 |

### 4.3 TrayManager（系统托盘）

**文件**: `src/adapters/tray-manager.js`

**功能**:
- 创建系统托盘图标
- 右键菜单：显示设置、暂停/恢复计时、退出
- 图标状态切换（工作中/休息中）

**API**:
| 方法 | 说明 | 参数 |
|------|------|------|
| `onShowSettings(callback)` | 注册显示设置回调 | - |
| `onTogglePause(callback)` | 注册暂停/恢复回调 | - |
| `onQuit(callback)` | 注册退出回调 | - |
| `create()` | 创建托盘图标 | - |
| `setPaused(paused)` | 设置暂停状态 | paused: boolean |
| `setWorkingIcon()` | 设置工作图标 | - |
| `setRestIcon()` | 设置休息图标 | - |
| `destroy()` | 销毁资源 | - |

### 4.4 AudioPlayer（音频播放）

**文件**: `src/adapters/audio-player.js`

**功能**:
- 使用系统蜂鸣播放提示音
- 支持启用/禁用

**API**:
| 方法 | 说明 | 参数 |
|------|------|------|
| `setEnabled(enabled)` | 设置是否启用 | enabled: boolean |
| `playBreakAlert()` | 播放休息提醒音 | - |
| `destroy()` | 销毁资源 | - |

---

## 5. IPC 通信规范

### 5.1 主进程 → 渲染进程

| 事件名 | 说明 | 数据结构 |
|--------|------|----------|
| state-changed | 状态变更通知 | `{ status, workRemaining, restRemaining }` |
| break-update | 休息进度更新 | `{ restRemaining, totalRestSeconds }` |

### 5.2 渲染进程 → 主进程

| 通道名 | 说明 | 参数 | 返回值 |
|--------|------|------|--------|
| get-settings | 获取配置 | - | settings object |
| save-settings | 保存配置 | settings: object | - |
| get-state | 获取当前状态 | - | state object |
| break-action | 休息操作 | action: string, payload?: any | - |
| break-ready | 休息窗口就绪 | - | - |

### 5.3 Preload 暴露 API

通过 `contextBridge.exposeInMainWorld('api', ...)` 暴露：

| API | 说明 | 参数 | 返回值 |
|-----|------|------|--------|
| `getSettings()` | 获取配置 | - | Promise\<object\> |
| `saveSettings(settings)` | 保存配置 | settings: object | Promise\<void\> |
| `skipBreak()` | 跳过休息 | - | void |
| `snoozeBreak(minutes)` | 延迟休息 | minutes: number | void |
| `finishBreak()` | 完成休息 | - | void |
| `getState()` | 获取状态 | - | Promise\<object\> |
| `onStateChange(callback)` | 监听状态变更 | callback: function | unsubscribe: function |
| `onBreakUpdate(callback)` | 监听休息更新 | callback: function | unsubscribe: function |
| `sendBreakReady()` | 通知窗口就绪 | - | void |

---

## 6. 计时策略规范

### 6.1 工作计时
- 默认工作间隔：25 分钟（可配置：5-120 分钟，步进 5）
- 计时持续进行，每秒递减
- 检测到用户空闲 ≥ 2 分钟 → 暂停计时
- 用户回来后 → 恢复计时
- 用户累计离开超过 10 分钟 → 重置当前工作计时

### 6.2 休息计时
- 默认休息时长：5 分钟（可配置：1-30 分钟，步进 1）
- 工作计时归零 → 触发休息拦截
- 休息计时每秒递减
- 休息计时归零 → 自动结束休息

---

## 7. 代码规范

### 7.1 命名规范
- 文件命名：小写字母 + 连字符（kebab-case），如 `timer-manager.js`
- 类名：帕斯卡命名（PascalCase），如 `TimerManager`
- 变量/方法：驼峰命名（camelCase），如 `workRemaining`
- 常量：全大写 + 下划线，如 `IDLE_THRESHOLD`
- 私有成员：下划线前缀，如 `_state`, `_interval`

### 7.2 代码风格
- 使用 ES6+ 语法（class、箭头函数、模板字符串）
- 缩进：2 空格
- 分号：必须添加
- 文件末尾：必须留空行

### 7.3 错误处理
- 所有异步操作必须有 try-catch
- 关键操作（文件读写、IPC 通信）必须有错误处理
- 错误处理中使用静默 fail，避免应用崩溃

---

## 8. 构建与发布规范

### 8.1 构建命令
```bash
npm start          # 开发模式启动
npm run build      # 构建 Windows 安装包
```

### 8.2 构建配置
- 输出目录：`dist/`
- 目标格式：NSIS 安装包
- 应用 ID：`com.eye-vision-protection.app`
- 产品名称：`视力保护助手`

### 8.3 发布要求
- 确保所有依赖已安装：`npm install`
- 确保构建成功：`npm run build`
- 确保安装包可正常安装和运行

---

## 9. 版本规范

使用语义化版本（Semantic Versioning）：
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能新增
- `PATCH`: 向后兼容的 bug 修复

---

## 10. 安全规范

### 10.1 Electron 安全
- 启用 `contextIsolation: true`
- 禁用 `nodeIntegration: false`
- 通过 preload 脚本暴露安全的 API
- 使用 `contextBridge` 隔离主进程与渲染进程

### 10.2 数据安全
- 配置文件存储在用户数据目录
- 不存储敏感信息
- 敏感操作需要用户确认

---

## 11. 开发环境规范

### 11.1 Node.js 版本
- 推荐：Node.js 18+
- 最低：Node.js 16+

### 11.2 Git Hooks
- 使用 husky 管理 Git 钩子
- pre-commit 钩子：执行代码检查

### 11.3 .gitignore
- 忽略 `node_modules/`
- 忽略 `dist/`
- 忽略 `.env` 文件
- 忽略操作系统文件（.DS_Store, Thumbs.db）