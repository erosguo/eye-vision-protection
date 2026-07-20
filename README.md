# Eye Vision Protection

![GitHub](https://img.shields.io/github/license/erosguo/eye-vision-protection)
![GitHub package.json version](https://img.shields.io/github/package-json/v/erosguo/eye-vision-protection)

**[English](README.md)** | **[中文](README.zh-CN.md)**

A cross-platform eye protection application built with Electron. It continuously monitors screen usage and reminds users to take breaks when the set time is reached.

## Features

- **Background Running**: Minimizes to system tray after startup
- **Smart Timing**: Detects user idle state and pauses/resumes automatically
- **Break Interception**: Full-screen overlay on all displays when break time comes
- **Customizable Settings**: Work interval, rest duration, sound alerts, and auto-start options
- **Tray Icon**: Shows working/resting status with different icons
- **Cross-platform**: Built with Electron, ready for Windows, macOS, and Linux

## Technology Stack

- **Framework**: Electron ^28.0.0
- **Packaging**: electron-builder ^24.9.0
- **Frontend**: Native HTML/CSS/JavaScript (ES6+)

## Architecture

Three-layer design with cross-platform intent:

| Layer | Directory | Description |
|-------|-----------|-------------|
| **Core** | `src/core/` | Platform-independent logic (StateMachine, TimerManager, SettingsManager) |
| **Adapter** | `src/adapters/` | Platform-specific implementations (ActivityDetector, ScreenBlocker, TrayManager, AudioPlayer) |
| **UI** | `src/ui/` | User interface components (Break overlay, Settings window) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/erosguo/eye-vision-protection.git

# Navigate to the project directory
cd eye-vision-protection

# Install dependencies
npm install
```

### Development

```bash
# Start the application in development mode
npm start
```

### Build

```bash
# Build for Windows (NSIS installer)
npm run build
```

## Project Structure

```
eye-vision-protection/
├── package.json              # Project configuration
├── README.md                 # English documentation
├── README.zh-CN.md           # Chinese documentation
├── spec.md                   # Technical specification
├── design.md                 # Design documentation
├── plan.md                   # Implementation plan
├── .gitignore                # Git ignore rules
├── .husky/                   # Git hooks
│   └── pre-commit            # Pre-commit hook
├── scripts/
│   └── generate-icons.js     # Icon generation script
└── src/
    ├── main.js               # Electron main process
    ├── preload.js            # IPC bridge
    ├── core/                 # Core logic
    │   ├── state-machine.js
    │   ├── settings-manager.js
    │   └── timer-manager.js
    ├── adapters/             # Platform adapters
    │   ├── activity-detector.js
    │   ├── screen-blocker.js
    │   ├── tray-manager.js
    │   └── audio-player.js
    ├── ui/                   # UI components
    │   ├── break/            # Break overlay
    │   └── settings/         # Settings window
    └── assets/               # Static resources
        ├── icon.png
        ├── tray-icon.png
        └── tray-icon-rest.png
```

## Configuration

Default settings (can be modified in the settings window):

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| workInterval | 25 minutes | 5-120 minutes | Time before break reminder |
| restDuration | 5 minutes | 1-30 minutes | Duration of each break |
| soundEnabled | true | - | Enable/disable alert sound |
| autoStart | false | - | Start on system boot |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Language Support

### Available Languages

| Language | File | Status |
|----------|------|--------|
| English | `README.md` | ✅ Maintained |
| 中文 (Chinese) | `README.zh-CN.md` | ✅ Maintained |

### Adding a New Language

Follow these steps to add a new language version:

1. **Create a new README file** with the appropriate language code:
   ```
   README.xx-XX.md
   ```
   Where `xx-XX` follows the [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) language code and [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country code.

2. **Translate the content** from `README.md` to the target language.

3. **Update the language switcher** at the top of all README files:
   - Add your new language link to the language bar
   - Format: `**[Language Name](README.xx-XX.md)**`

4. **Update the Language Support table** in `README.md`:
   - Add a new row for your language
   - Mark status as `✅ Maintained` or `🔄 In Progress`

### Language Code Examples

| Language | Code | File Name |
|----------|------|-----------|
| English | en | `README.md` |
| Chinese (Simplified) | zh-CN | `README.zh-CN.md` |
| Chinese (Traditional) | zh-TW | `README.zh-TW.md` |
| Japanese | ja | `README.ja.md` |
| Korean | ko | `README.ko.md` |
| Spanish | es | `README.es.md` |
| French | fr | `README.fr.md` |
| German | de | `README.de.md` |
| Portuguese | pt | `README.pt.md` |