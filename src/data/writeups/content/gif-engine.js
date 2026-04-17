export const gifEngine = {
  id: 'gif-engine',
  title: 'Gif-Engine: Desktop Animation Manager',
  subtitle: 'Process-isolated GIF rendering with per-pixel transparency on Windows.',
  date: '2024',
  categories: ['tools', 'systems'],
  tags: ['rust', 'windows', 'gui', 'multimedia'],
  readTime: '8 min',
  featured: false,
  content: `## Overview

A desktop GIF animation manager for Windows, built because existing tools had performance problems. Each GIF runs in its own isolated process.

## Architecture

### Process Isolation

\`\`\`
Main Process (Manager)
    ├── Child Process 1 (GIF 1)
    ├── Child Process 2 (GIF 2)
    └── Child Process N (GIF N)
\`\`\`

Each child process:
- Renders one GIF via GDI+ or Direct2D
- Communicates via named pipes
- Can crash without affecting others

### Transparency Implementation

Uses \`WS_EX_LAYERED\` windows with \`UpdateLayeredWindow\`:

\`\`\`rust
UpdateLayeredWindow(
    hwnd,
    None,
    Some(&ptPos),
    Some(&size),
    hdc_mem,
    Some(&pt_src),
    0,  // No color key
    Some(&blend),  // Per-pixel alpha
    ULW_ALPHA,
);
\`\`\`

### GUI Framework

Built with egui (immediate mode):
- File browser for GIF selection
- Position/size controls
- Playback speed adjustment
- System tray integration

## Features

- Drag-and-drop GIF files
- Click-through when not interacting
- Persistent configuration
- Auto-start with Windows
- Low CPU/memory usage

## What I Learned

- Windows layered window API
- Process spawning and management in Rust
- IPC with named pipes
- GDI+ image decoding
- System tray implementation`
};
