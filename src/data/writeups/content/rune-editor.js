export const runeEditor = {
  id: 'rune-editor',
  title: 'Rune Editor: Memory Manipulation Tool',
  subtitle: 'Process memory editor with React frontend and C++ backend.',
  date: '2024',
  categories: ['tools', 'reverse-engineering', 'closed'],
  tags: ['memory', 'react', 'cpp', 'reverse-engineering'],
  readTime: '6 min',
  featured: false,
  content: `## Overview

Elden Ring rune editor with React frontend and C++ backend for process memory access.

## Architecture

### Frontend
- React 18 with Vite
- Real-time value display
- Scan and edit interface

### Backend
- cpp-httplib for HTTP server
- Win32 API for memory operations
- Pattern scanning for pointers

### Communication
\`\`\`
Frontend (React) ← HTTP/JSON → Backend (C++) ← ReadProcessMemory → Game Process
\`\`\`

## Features

- Dynamic address scanning
- Pointer chain resolution
- Value editing with undo
- Process attach/detach

## What I Learned

- Win32 memory API
- HTTP server in C++
- React/Vite integration
- Process debugging techniques`
};
