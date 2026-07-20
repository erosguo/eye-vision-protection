# 视力保护助手

![GitHub](https://img.shields.io/github/license/erosguo/eye-vision-protection)
![GitHub package.json version](https://img.shields.io/github/package-json/v/erosguo/eye-vision-protection)

一款基于 Electron 构建的跨平台视力保护应用。持续检测用户屏幕操作时长，在达到设定时间后拦截屏幕并提醒用户休息。

## 功能特性

- **后台运行**: 启动后最小化到系统托盘
- **智能计时**: 自动检测用户空闲状态，暂停/恢复计时
- **休息拦截**: 休息时间到达时，在所有显示器上显示全屏拦截窗口
- **自定义设置**: 工作间隔、休息时长、提示音开关、开机自启等可配置项
- **托盘图标**: 根据工作/休息状态显示不同图标
- **跨平台**: 基于 Electron 开发，支持 Windows、macOS 和 Linux

## 技术栈

- **框架**: Electron ^28.0.0
- **打包工具**: electron-builder ^24.9.0
- **前端**: 原生 HTML/CSS/JavaScript (ES6+)

## 架构设计

采用三层架构设计，预留跨平台扩展能力：

| 层次 | 目录 | 描述 |
|------|------|------|
| **Core（核心层）** | `src/core/` | 平台无关的纯逻辑层（状态机、计时器、配置管理） |
| **Adapter（适配层）** | `src/adapters/` | 平台相关的实现（活动检测、屏幕拦截、托盘管理、音频播放） |
| **UI（界面层）** | `src/ui/` | 用户界面组件（休息拦截界面、设置窗口） |

## 快速开始

### 前置条件

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/erosguo/eye-vision-protection.git

# 进入项目目录
cd eye-vision-protection

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发模式
npm start
```

### 构建

```bash
# 构建 Windows 安装包（NSIS）
npm run build
```

## 项目结构

```
eye-vision-protection/
├── package.json              # 项目配置
├── README.md                 # 英文文档
├── README.zh-CN.md           # 中文文档
├── spec.md                   # 技术规范
├── design.md                 # 设计文档
├── plan.md                   # 实施计划
├── .gitignore                # Git 忽略规则
├── .husky/                   # Git 钩子
│   └── pre-commit            # 预提交钩子
├── scripts/
│   └── generate-icons.js     # 图标生成脚本
└── src/
    ├── main.js               # Electron 主进程入口
    ├── preload.js            # IPC 桥接脚本
    ├── core/                 # 核心逻辑
    │   ├── state-machine.js  # 状态机
    │   ├── settings-manager.js # 配置管理
    │   └── timer-manager.js  # 计时引擎
    ├── adapters/             # 平台适配器
    │   ├── activity-detector.js # 活动检测
    │   ├── screen-blocker.js # 屏幕拦截
    │   ├── tray-manager.js   # 托盘管理
    │   └── audio-player.js   # 音频播放
    ├── ui/                   # 用户界面
    │   ├── break/            # 休息拦截界面
    │   └── settings/         # 设置窗口
    └── assets/               # 静态资源
        ├── icon.png          # 应用图标
        ├── tray-icon.png     # 托盘工作图标
        └── tray-icon-rest.png # 托盘休息图标
```

## 配置说明

默认配置（可在设置窗口中修改）：

| 配置项 | 默认值 | 范围 | 说明 |
|--------|--------|------|------|
| workInterval | 25 分钟 | 5-120 分钟 | 触发休息提醒的工作时长 |
| restDuration | 5 分钟 | 1-30 分钟 | 每次休息的持续时间 |
| soundEnabled | true | - | 是否启用提示音 |
| autoStart | false | - | 是否开机自启 |

## 计时策略

- **工作计时**: 持续进行，每秒递减
- **空闲检测**: 用户空闲超过 2 分钟 → 暂停计时；用户回来后 → 恢复计时
- **长时间空闲**: 用户累计离开超过 10 分钟 → 重置当前工作计时
- **休息触发**: 工作计时归零 → 全屏拦截提醒休息

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件