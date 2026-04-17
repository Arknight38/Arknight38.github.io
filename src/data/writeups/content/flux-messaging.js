export const fluxMessaging = {
  id: 'flux-messaging',
  title: 'Flux: High-Performance Messaging Platform',
  subtitle: 'A modern real-time messaging platform combining a Rust-powered backend with a React frontend.',
  date: '2024',
  categories: ['closed', 'systems', 'fullstack'],
  tags: ['rust', 'react', 'websockets', 'postgresql'],
  readTime: '12 min',
  featured: true,
  content: `## Architecture Overview

Flux is built with a clear separation between a high-performance Rust backend and a modern React frontend. The architecture prioritizes real-time communication through WebSockets while maintaining RESTful APIs for state management.

### Why Rust for the Backend?

Rust's zero-cost abstractions and fearless concurrency make it ideal for handling hundreds of simultaneous WebSocket connections without garbage collection pauses. The type system catches data races at compile time, critical for a system where message ordering matters.

## Backend Architecture

### Axum Web Framework

Built on Tokio's async runtime, Axum provides ergonomic request handling while maintaining high throughput. The modular handler structure separates concerns cleanly:

\`\`\`
server/src/
├── handlers/      # HTTP request handlers
│   ├── auth.rs   # JWT authentication
│   ├── messages.rs
│   └── channels.rs
├── models/        # Database models with SQLx
├── routes/        # API route definitions
└── websocket/     # WebSocket connection management
    ├── connection.rs
    └── broadcast.rs
\`\`\`

### Database Design

PostgreSQL with SQLx for compile-time checked queries. The schema supports:

- Servers with multiple channels
- Direct message conversations
- Friend relationships and presence
- Message history with pagination
- File metadata for uploads

> SQLx's compile-time query verification caught numerous bugs during development. Changing a database schema would cause compilation errors in dependent queries, forcing updates before deployment.

### WebSocket Message Flow

\`\`\`
1. Client connects via WebSocket upgrade
2. Server validates JWT from connection params
3. Connection added to channel broadcast groups
4. Incoming messages:
   - Parse JSON payload
   - Validate and persist to database
   - Broadcast to channel subscribers
   - Update presence/typing indicators
5. Connection cleanup on disconnect
\`\`\`

## Frontend Architecture

### React 19 with Concurrent Features

The frontend leverages React 19's concurrent rendering for smooth UI even during heavy message loads. TanStack Query manages server state with automatic caching and background refetching.

### Real-Time State Management

WebSocket messages are integrated with TanStack Query's cache:

- Incoming messages trigger cache updates
- Optimistic UI for sent messages
- Automatic retry with exponential backoff
- Presence indicators via heartbeat

## Key Features Implemented

### Core Messaging

- Real-time text channels with infinite scroll pagination
- Direct messages with read receipts
- Message editing and deletion
- Emoji reactions with optimistic updates
- File attachments (avatars, banners, up to 25MB)

### Social Features

- Friend system with pending requests
- User presence (online, idle, DND, invisible)
- Typing indicators via WebSocket broadcasts
- Rich profiles with custom avatars and banners
- Display names separate from usernames

### Security

- JWT authentication with refresh tokens
- Argon2id password hashing
- HTTP-only cookies to prevent XSS
- Rate limiting on auth endpoints

## Performance Optimizations

### Backend

- Connection pooling with dead connection cleanup
- Broadcast batching to reduce WebSocket frames
- Database query optimization with proper indexing
- Lazy loading of message history

### Frontend

- Virtualized lists for large message histories
- Image lazy loading with blur placeholders
- Code splitting by route
- Service worker for offline message composition

## File Storage

Cloudflare R2 (S3-compatible) stores user-generated content:

- Profile pictures and banners
- Message attachments
- Server icons

## What I Learned

Building Flux taught me about the complexity of real-time systems. Handling message ordering, connection resilience, and state synchronization across hundreds of clients requires careful design. Rust's type system was invaluable for preventing race conditions in the WebSocket broadcast logic.

## Current Status

Flux is a closed-source project with core messaging features complete. Planned additions include voice channels, message search, and a plugin system for custom functionality.`
};
