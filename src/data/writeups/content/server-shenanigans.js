export const serverShenanigans = {
  id: 'server-shenanigans',
  title: 'ServerShenanigans: Custom File Transfer Protocol',
  subtitle: 'Client-server file sharing with resume support, zlib compression, and SHA-256 integrity checks.',
  date: '2024',
  categories: ['tools', 'fullstack'],
  tags: ['cpp', 'networking', 'zlib', 'sha256', 'winsock2'],
  readTime: '10 min',
  featured: false,
  content: `## Overview

ServerShenanigans is a client-server file sharing system built from scratch. It features resume support for interrupted transfers, zlib compression for bandwidth efficiency, and SHA-256 integrity verification to ensure data correctness.

## Architecture

### Multi-Client Support

The server handles up to 50 concurrent connections using a simple thread-per-client model:

\`\`\`
Server (Main Thread)
    ├── Client Thread 1 (File Transfer)
    ├── Client Thread 2 (File Transfer)
    └── Client Thread N (File Transfer)
\`\`\`

Each client connection runs in its own thread, keeping the implementation straightforward while maintaining acceptable performance for the target use case.

### Memory Efficiency

Stack-allocated 64KB buffers keep heap usage low:

\`\`\`cpp
char buffer[65536];  // Stack allocation, no malloc overhead
\`\`\`

This design choice eliminates heap fragmentation concerns and simplifies memory management in a multi-threaded environment.

## Transfer Protocol

### Modes

**RAW Mode**
- Direct byte-for-byte transfer
- No processing overhead
- Best for already-compressed files

**COMPRESSED Mode**
- zlib compression on-the-fly
- Significant bandwidth savings for text/log files
- Compression level configurable per-file

### Resume Capability

Offset-based resume allows interrupted transfers to continue:

1. Client requests file with starting offset
2. Server seeks to position in file
3. Transfer continues from last known good position
4. SHA-256 hash verified on completion

## Integrity Verification

SHA-256 hashes ensure file integrity end-to-end:

- Client computes hash after receiving file
- Compares against server-provided hash
- Retry triggered on mismatch

## Technical Highlights

### Winsock2 Implementation

Direct Windows socket API usage without abstraction layers:

\`\`\`cpp
WSADATA wsaData;
WSAStartup(MAKEWORD(2, 2), &wsaData);

SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr));
listen(serverSocket, SOMAXCONN);
\`\`\`

### Compression Pipeline

zlib integration for real-time compression:

\`\`\`cpp
z_stream strm;
deflateInit(&strm, Z_DEFAULT_COMPRESSION);

// Compress buffer
strm.next_in = (Bytef*)inputBuffer;
strm.avail_in = bytesRead;
strm.next_out = (Bytef*)outputBuffer;
strm.avail_out = bufferSize;

deflate(&strm, Z_SYNC_FLUSH);
\`\`\`

### Progress Tracking

Real-time transfer progress visible on client side:

- Bytes transferred / total size
- Current transfer rate (KB/s)
- Estimated time remaining
- Compression ratio (when applicable)

## What I Learned

Building this protocol taught me about:
- TCP socket programming fundamentals
- Thread synchronization in C++
- Stream compression with zlib
- Cryptographic hashing for integrity
- Network protocol design tradeoffs

The project reinforced that simple designs often outperform complex ones for focused use cases.`
};
