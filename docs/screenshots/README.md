# Screenshots Directory

This directory contains demo screenshots for the README.md file.

## Available Screenshots

| File | Description |
|------|-------------|
| `settings.png` | Settings window screenshot |
| `break.png` | Break overlay screenshot |

## How to Update Screenshots

### Method 1: Manual Screenshot

1. Start the application: `npm start`
2. For settings screenshot:
   - Right-click the tray icon → "显示设置"
   - Press `Win + Shift + S` (Windows) or `Cmd + Shift + 4` (macOS) to capture
   - Save as `settings.png` in this directory
3. For break screenshot:
   - Set work interval to 1 minute in settings
   - Wait for the break overlay to appear
   - Press `Win + Shift + S` (Windows) or `Cmd + Shift + 4` (macOS) to capture
   - Save as `break.png` in this directory

### Method 2: Automated Script

Run the screenshot capture script:

```bash
npm run screenshots
```

This will automatically capture screenshots and save them to this directory.

## Recommended Dimensions

- Settings window: 480 × 520 pixels
- Break overlay: Full screen (1920 × 1080 or similar)