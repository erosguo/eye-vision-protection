# 视力保护助手 - 设计文档

## 1. 项目概述
一个跨平台视力保护应用，持续检测用户屏幕操作时长，在达到设定时间后拦截屏幕并提醒用户休息。**首发 Windows (Electron)**，架构预留未来扩展到 macOS、iOS、Android 的能力。

## 2. 技术栈（Windows 首发）
| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 桌面框架 | Electron | 跨平台基础，Tray、多窗口、PowerMonitor 原生支持 |
| 前端 | 原生 HTML/CSS/JS | 功能简洁，零框架依赖，便于未来迁移 |
| 打包 | electron-builder | Windows NSIS 安装包 |
| 活动检测 | electron powerMonitor + 轮询 | 内置 API，零额外依赖 |

## 3. 跨平台分层架构

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

- **Core 层**：纯 JavaScript/TypeScript 逻辑，无任何平台 API 依赖，可直接在 Web / React Native / Node 环境复用
- **Adapter 层**：定义接口（Interface），每个平台提供具体实现
- **UI 层**：各平台原生渲染，调用 Adapter

## 4. 核心功能（Windows 版本）

### 4.1 后台运行
- 启动后最小化到系统托盘
- 托盘图标状态指示（工作中 / 休息中）
- 右键菜单：显示设置、暂停/恢复计时、退出

### 4.2 计时策略（混合模式）
- 工作间隔默认 25 分钟，休息时长默认 5 分钟，均可配置
- 混合计时规则：
  - 计时持续进行
  - 检测到用户空闲 ≥ 2 分钟 → 暂停计时，标记"离开"
  - 用户回来后 → 恢复计时
  - 用户累计离开超过 10 分钟 → 重置当前工作计时（重新计时）
- 工作计时归零 → 触发休息拦截

### 4.3 休息拦截屏幕
- 在所有显示器上创建全屏、置顶窗口
- 显示内容：
  - "请休息一下，让眼睛离开屏幕" + 英文提示
  - 休息倒计时（大号数字）
  - 进度条
- 播放系统提示音
- 用户选项：
  - "跳过本次休息"
  - "5分钟后提醒"
  - "10分钟后提醒"

### 4.4 设置窗口
- 工作间隔：5-120 分钟，步进 5 分钟
- 休息时长：1-30 分钟，步进 1 分钟
- 提示音开关
- 开机自启
- 设置保存到 `userData/settings.json`

## 5. 状态机

```
IDLE → WORKING (计时开始)
WORKING → ON_BREAK (计时归零)
ON_BREAK → WORKING (休息结束或被跳过)
WORKING → PAUSED (空闲超过2分钟)
PAUSED → WORKING (用户回来)
PAUSED → IDLE (空闲超过10分钟，重置)
```

## 6. 数据流
1. Config (`settings.json`) → SettingsManager → TimerManager
2. Adapter::ActivityDetector 每 5 秒检测 → Core TimerManager 推进/暂停
3. TimerManager 计时归零 → 通知 Adapter::ScreenBlocker
4. ScreenBlocker 在每个显示器创建全屏窗口
5. 用户选择 → IPC → Core TimerManager 处理
6. TimerManager 更新状态

## 7. 文件结构
```
eye-vision-protection/
├── package.json
├── src/
│   ├── main.js                  # Electron 主进程入口
│   ├── preload.js               # IPC 桥接
│   ├── core/                    # 跨平台核心逻辑层
│   │   ├── timer-manager.js
│   │   ├── settings-manager.js
│   │   └── state-machine.js
│   ├── adapters/                # Windows 平台适配层
│   │   ├── activity-detector.js
│   │   ├── screen-blocker.js
│   │   ├── tray-manager.js
│   │   └── audio-player.js
│   ├── ui/                      # UI 层
│   │   ├── settings/
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   └── renderer.js
│   │   └── break/
│   │       ├── index.html
│   │       ├── style.css
│   │       └── renderer.js
│   └── assets/
│       ├── icon.png
│       └── tray-icon.png
├── design.md
└── plan.md
```

## 8. 边界情况
- 用户全屏游戏/视频时：检测全屏状态，延后提醒
- 系统休眠/锁定：唤醒后重置计时
- 多显示器：每屏独立 BreakWindow，操作同步
- 设置未保存时使用默认值
- 应用退出时保存当前计时状态，下次启动恢复
