# JustNotepad

A simple, beautiful, and fast notepad built with Electron. Works on Windows, macOS, and Linux.

## Features

- **Minimalist interface**: clean frameless window with custom title bar
- **Dark theme**: follows system preference or toggle manually
- **Dual language**: Russian and English UI, auto-detects system language
- **Find & Replace**: real-time search with highlighting and replace
- **Autosave**: automatically saves changes after 1 second of inactivity
- **Recent files**: quick access to the last 10 opened notes
- **Wallpapers**: 6 built-in backgrounds with dark overlay
- **Multi-window**: open multiple instances independently
- **Grammar check**: built-in spellcheck per note
- **Zoom**: adjustable text size with Ctrl+Wheel
- **Uniform margins**: toggle comfortable reading layout

## Project structure

```
JustNotepad/
  src/
    main.js          — Electron main process
    index.html       — UI layout
    renderer.js      — all app logic
    translations.js  — RU/EN translations
    styles.css       — all styles
    wallpapers/      — 6 background images
  build/
    notes.png        — app icon
  package.json
  README.md
```

## How to run

```bash
npm install
npm start
```

## How to build an installer

### Using electron-builder (recommended)

Install electron-builder:

```bash
npm install --save-dev electron-builder
```

Build the installer:

```bash
npm run build
```

The installer will appear in the `dist/` folder. Once installed, `.txt` files will automatically open with JustNotepad, and "Open with JustNotepad" will appear in the context menu.
