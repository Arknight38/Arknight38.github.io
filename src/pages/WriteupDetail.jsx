import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import { ScrollProgress } from '@components/ui';

// Writeup metadata (matching Writeups.jsx)
const writeupsMeta = [
  { id: 'flux-messaging', title: 'Flux: A Real-Time Messaging Platform in Rust', date: '2024', readTime: '12 min', category: 'systems' },
  { id: 'arkvisor', title: 'ArkVisor: Building a Hypervisor from Scratch', date: '2024', readTime: '15 min', category: 'systems' },
  { id: 'atlus', title: 'Atlus: A Native Binary Diff Workbench', date: '2024', readTime: '10 min', category: 'tools' },
  { id: 'wdfilterdrv', title: 'WdFilterDrv: Kernel-Mode Driver Development', date: '2024', readTime: '14 min', category: 'systems' },
  { id: 'cs2-extern', title: 'CS2 External: Kernel Memory Operations', date: '2024', readTime: '11 min', category: 'systems' },
  { id: 'gif-engine', title: 'Gif-Engine: Desktop Animation Manager', date: '2024', readTime: '8 min', category: 'tools' },
  { id: 'fbla-spotlocal', title: 'SpotLocal: FBLA Coding Competition Project', date: '2025', readTime: '9 min', category: 'fullstack' },
  { id: 'snowflake-analytics', title: 'Yelp Analytics: Snowflake Data Warehouse', date: '2025', readTime: '7 min', category: 'data' },
  { id: 'rune-editor', title: 'Rune Editor: Memory Manipulation Tool', date: '2024', readTime: '6 min', category: 'tools' },
  { id: 'hd2-cheats', title: 'Helldivers 2: Game Modification Framework', date: '2024', readTime: '13 min', category: 'systems' },
  { id: 'kdmapper', title: 'KDMapper: Manual Driver Mapping', date: '2024', readTime: '10 min', category: 'systems' },
  { id: 'cs2externdrv', title: 'CS2 External Driver Architecture', date: '2024', readTime: '12 min', category: 'systems' },
  { id: 'byovd-scanner', title: 'BYOVD: Vulnerable Driver Scanner', date: '2024', readTime: '8 min', category: 'tools' },
  { id: 'monitor-def-not-mal', title: 'Security Research: C2 Framework', date: '2024', readTime: '11 min', category: 'tools' },
  { id: 'manualmapdrv', title: 'Manual Map Driver: PE Loading', date: '2024', readTime: '14 min', category: 'systems' },
  { id: 'rnw-drv', title: 'RNW Driver: Network Stack Analysis', date: '2024', readTime: '9 min', category: 'systems' },
];

// Placeholder content for writeups - in production these would be loaded from markdown files
const placeholderContent = {
  'flux-messaging': {
    title: 'Flux: A Real-Time Messaging Platform in Rust',
    subtitle: 'Building a high-performance messaging platform from scratch with Rust, Axum, Tokio, and WebSockets',
    content: `
## Overview

Flux is a real-time messaging platform built from the ground up in Rust. The goal was to understand how modern chat applications work at a fundamental level — from WebSocket connection handling to database schema design.

## Architecture

The backend is built on Axum (Tokio's web framework) with the following components:

- **WebSocket Manager**: Handles thousands of concurrent connections with sub-100ms latency
- **Authentication**: JWT tokens with Argon2 password hashing and HTTP-only cookies
- **Database**: PostgreSQL with SQLx for compile-time checked queries
- **Storage**: AWS S3 and Cloudflare R2 for file uploads
- **Containerization**: Full Docker support for easy deployment

## Key Features

### Real-time Messaging
The WebSocket layer uses Tokio's async runtime to handle message broadcasting efficiently. Each message is validated, stored in the database, and broadcast to relevant clients.

### Server & Channel System
Users can create servers, each containing multiple channels. Permissions are handled through a role-based system.

### Direct Messages
Private conversations between users with full history persistence.

### Friend System
Send/receive friend requests, manage blocked users, see friends' online status.

### File Uploads
Support for images and other files, stored in cloud object storage with CDN delivery.

## Technical Challenges

### Connection Scaling
The biggest challenge was handling thousands of concurrent WebSocket connections. This required:

- Efficient connection pooling
- Message batching for broadcast operations
- Careful memory management to prevent leaks

### Database Design
Designing a schema that could handle:
- Fast message history queries
- User presence tracking
- Permission lookups

## Lessons Learned

Building Flux taught me a lot about:
- Rust's async ecosystem
- WebSocket protocol internals
- Database optimization techniques
- JWT security best practices
- Docker multi-stage builds

## Future Improvements

- End-to-end encryption for DMs
- Voice/video calling via WebRTC
- Mobile app using React Native
    `,
  },
};

export function WriteupDetail() {
  const { slug } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const writeup = writeupsMeta.find((w) => w.id === slug);
  const currentIndex = writeupsMeta.findIndex((w) => w.id === slug);
  const prevWriteup = currentIndex > 0 ? writeupsMeta[currentIndex - 1] : null;
  const nextWriteup = currentIndex < writeupsMeta.length - 1 ? writeupsMeta[currentIndex + 1] : null;

  useEffect(() => {
    if (!writeup) return;

    document.title = `${writeup.title} — Saku Grossarth`;

    // In production, this would fetch markdown content
    // For now, use placeholder or fetch from the legacy HTML
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Try to load from legacy backup or use placeholder
        const placeholder = placeholderContent[slug];
        if (placeholder) {
          setContent(placeholder.content);
        } else {
          setContent('This writeup is being migrated. Please check back soon.');
        }
      } catch (error) {
        setContent('Failed to load writeup content.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug, writeup]);

  if (!writeup) {
    return <Navigate to="/writeups" replace />;
  }

  return (
    <div className="min-h-screen">
      <ScrollProgress />

      {/* Article Shell */}
      <article className="max-w-3xl mx-auto px-6 lg:px-12 pt-32 pb-16">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/writeups"
            className="inline-flex items-center gap-2 text-[0.7rem] text-[var(--text3)] hover:text-[var(--rose)] transition-colors mb-8"
            style={{ fontFamily: 'var(--mono)' }}
          >
            <ArrowLeft size={14} />
            back to writeups
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 text-[0.7rem] text-[var(--text3)] mb-6" style={{ fontFamily: 'var(--mono)' }}>
            <span className="text-[var(--rose)]">{writeup.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {writeup.date}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {writeup.readTime} read
            </span>
          </div>

          <h1
            className="text-[clamp(2rem,5vw,2.75rem)] leading-[1.15] text-[var(--text)] mb-5"
            style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
          >
            {writeup.title}
          </h1>
        </motion.header>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-lg max-w-none"
          style={{
            '--tw-prose-body': 'var(--text2)',
            '--tw-prose-headings': 'var(--text)',
            '--tw-prose-links': 'var(--rose)',
            '--tw-prose-code': 'var(--rose)',
            '--tw-prose-pre-bg': 'var(--surface)',
            '--tw-prose-pre-border': 'var(--border)',
          }}
        >
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse" />
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse w-3/4" />
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <div
              className="space-y-6"
              style={{ fontFamily: 'var(--serif)' }}
              dangerouslySetInnerHTML={{
                __html: content
                  .split('\n\n')
                  .map((para) => {
                    if (para.startsWith('## ')) {
                      return `<h2 class="text-xl font-medium text-[var(--text)] mt-10 mb-4" style="font-family: var(--serif)">${para.slice(3)}</h2>`;
                    }
                    if (para.startsWith('### ')) {
                      return `<h3 class="text-lg font-medium text-[var(--text)] mt-8 mb-3" style="font-family: var(--serif)">${para.slice(4)}</h3>`;
                    }
                    if (para.startsWith('- ')) {
                      return `<ul class="list-none space-y-2 my-4">${para
                        .split('\n')
                        .map((item) => `<li class="pl-5 relative text-[var(--text2)]" style="font-family: var(--serif)"><span class="absolute left-0 text-[var(--rose)]">—</span>${item.slice(2)}</li>`)
                        .join('')}</ul>`;
                    }
                    if (para.startsWith('```')) {
                      return `<pre class="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 overflow-x-auto my-6" style="font-family: var(--mono); font-size: 0.85rem"><code class="text-[var(--text2)]">${para.replace(/```\w*\n?/g, '').trim()}</code></pre>`;
                    }
                    return `<p class="text-base text-[var(--text2)] leading-[1.85]" style="font-family: var(--serif)">${para.replace(/\*\*(.*?)\*\*/g, '<em class="not-italic text-[var(--text)]">$1</em>')}</p>`;
                  })
                  .join(''),
              }}
            />
          )}
        </motion.div>

        {/* Navigation */}
        <nav className="mt-16 pt-8 border-t border-[var(--border)] flex justify-between gap-4">
          {prevWriteup ? (
            <Link
              to={`/writeups/${prevWriteup.id}`}
              className="flex flex-col gap-1 no-underline group"
            >
              <span className="text-[0.65rem] tracking-[0.1em] text-[var(--text3)] uppercase" style={{ fontFamily: 'var(--mono)' }}>
                previous
              </span>
              <span
                className="text-base text-[var(--text)] group-hover:text-[var(--rose)] transition-colors"
                style={{ fontFamily: 'var(--serif)' }}
              >
                ← {prevWriteup.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextWriteup ? (
            <Link
              to={`/writeups/${nextWriteup.id}`}
              className="flex flex-col gap-1 no-underline group text-right"
            >
              <span className="text-[0.65rem] tracking-[0.1em] text-[var(--text3)] uppercase" style={{ fontFamily: 'var(--mono)' }}>
                next
              </span>
              <span
                className="text-base text-[var(--text)] group-hover:text-[var(--rose)] transition-colors"
                style={{ fontFamily: 'var(--serif)' }}
              >
                {nextWriteup.title} →
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </div>
  );
}
