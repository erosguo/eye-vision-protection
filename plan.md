# 视力保护助手 - 实施计划

> 每个任务约 2-5 分钟，按顺序执行

---

## 任务 1：项目初始化和目录结构
- **文件**: `package.json`, 目录创建
- **操作**: 创建 `package.json`（含 electron、electron-builder 依赖），创建 `src/` 及其子目录
- **验证**: `npm install` 成功，目录结构完整

## 任务 2：Core - StateMachine
- **文件**: `src/core/state-machine.js`
- **内容**: 纯 JS 状态机，状态：IDLE/PAUSED/WORKING/ON_BREAK。提供 `transition(action)` 方法
- **验证**: 单元测试：IDLE→WORKING→ON_BREAK→WORKING 路径正确

## 任务 3：Core - SettingsManager
- **文件**: `src/core/settings-manager.js`
- **内容**: 加载/保存 `settings.json`，默认值（workInterval: 25, restDuration: 5, soundEnabled: true, autoStart: false）
- **验证**: 保存后读取结果与写入一致

## 任务 4：Core - TimerManager
- **文件**: `src/core/timer-manager.js`
- **内容**: 依赖 StateMachine 和 SettingsManager。管理工作计时和休息计时。提供 start/pause/reset/tick 方法。触发 onWorkComplete / onRestComplete 回调
- **验证**: tick 100 次后计时归零，触发回调

## 任务 5：Adapter - ActivityDetector
- **文件**: `src/adapters/activity-detector.js`
- **内容**: 使用 `powerMonitor.getSystemIdleTime()` 每 5 秒检测。空闲 ≥ 2 分钟 → onIdle，空闲 ≥ 10 分钟 → onLongIdle，恢复活动 → onActive
- **验证**: 模拟空闲时间触发正确回调

## 任务 6：Adapter - ScreenBlocker
- **文件**: `src/adapters/screen-blocker.js`
- **内容**: 遍历 `screen.getAllDisplays()`，为每个显示器创建全屏、置顶、无框 BrowserWindow。加载 `break/index.html`。支持关闭所有窗口
- **验证**: 多显示器环境下每屏显示拦截窗口

## 任务 7：Adapter - TrayManager
- **文件**: `src/adapters/tray-manager.js`
- **内容**: 创建系统托盘图标，右键菜单（显示设置/暂停/恢复/退出）。图标使用 `assets/tray-icon.png`
- **验证**: 托盘图标显示，菜单功能正常

## 任务 8：Adapter - AudioPlayer
- **文件**: `src/adapters/audio-player.js`
- **内容**: 使用系统蜂鸣（`shell.beep()`）或生成短促音频。提供 `playBreakAlert()` 方法
- **验证**: 调用时听到提示音

## 任务 9：Main Process (main.js)
- **文件**: `src/main.js`
- **内容**: 初始化所有模块，组装核心流程：
  1. 创建托盘
  2. 初始化 TimerManager + ActivityDetector
  3. 计时归零 → ScreenBlocker 显示 → 用户选择 → 关闭窗口 → 重置计时
  4. 创建 Settings 窗口的 IPC 处理
- **验证**: 应用启动，托盘显示，计时工作

## 任务 10：Preload Script
- **文件**: `src/preload.js`
- **内容**: 使用 `contextBridge` 暴露 IPC API：
  - `api.getSettings()` / `api.saveSettings()`
  - `api.skipBreak()` / `api.snoozeBreak(minutes)`
  - `api.getState()` / `api.onStateChange(callback)`
- **验证**: 渲染进程可调用所有 API

## 任务 11：Break UI
- **文件**: `src/ui/break/index.html`, `style.css`, `renderer.js`
- **内容**:
  - 全屏深色背景，居中显示提示语
  - 大号倒计时数字
  - 进度条
  - 三个按钮：跳过 / 5分钟后 / 10分钟后
- **验证**: 页面显示美观，按钮触发 IPC

## 任务 12：Settings UI
- **文件**: `src/ui/settings/index.html`, `style.css`, `renderer.js`
- **内容**:
  - 工作间隔滑块/输入（5-120，步进 5）
  - 休息时长滑块/输入（1-30，步进 1）
  - 提示音开关
  - 开机自启开关
  - 保存按钮
- **验证**: 设置可保存和加载

## 任务 13：Assets - 图标
- **文件**: `src/assets/icon.png`, `src/assets/tray-icon.png`
- **内容**: 生成简单的眼睛图标（16x16 和 256x256 PNG）。可使用 Canvas 生成或基础 SVG 转 PNG
- **验证**: 图标显示正常

## 任务 14：打包配置
- **文件**: 修改 `package.json` 添加 build 配置
- **内容**: electron-builder 配置，NSIS 安装包，Windows 平台
- **验证**: `npx electron-builder --win` 成功生成安装包
