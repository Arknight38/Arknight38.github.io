import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollProgress } from '@components/ui';
import { getWriteupById, getRelatedWriteups, writeups } from '@data/writeups';

export function WriteupDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);

  const writeup = getWriteupById(slug);
  const currentIndex = writeups.findIndex((w) => w.id === slug);
  const prevWriteup = currentIndex > 0 ? writeups[currentIndex - 1] : null;
  const nextWriteup = currentIndex < writeups.length - 1 ? writeups[currentIndex + 1] : null;
  const relatedWriteups = getRelatedWriteups(slug, 3);

  useEffect(() => {
    if (!writeup) return;

    document.title = `${writeup.title} — Saku Grossarth`;
    
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
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

        {/* Subtitle */}
        {writeup.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg italic text-[var(--text3)] mb-10 leading-relaxed"
            style={{ fontFamily: 'var(--serif)' }}
          >
            {writeup.subtitle}
          </motion.p>
        )}

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
            '--tw-prose-blockquote-bg': 'var(--rose-light)',
            '--tw-prose-blockquote-border': 'var(--rose)',
          }}
        >
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse" />
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse w-3/4" />
              <div className="h-4 bg-[var(--surface)] rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <div className="markdown-content" style={{ fontFamily: 'var(--serif)' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-xl font-medium text-[var(--text)] mt-10 mb-4" style={{ fontFamily: 'var(--serif)' }}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-[var(--text)] mt-8 mb-3" style={{ fontFamily: 'var(--serif)' }}>
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-base text-[var(--text2)] leading-[1.85] mb-4" style={{ fontFamily: 'var(--serif)' }}>
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-none space-y-2 my-4 pl-0">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="pl-5 relative text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
                      <span className="absolute left-0 text-[var(--rose)]">—</span>
                      {children}
                    </li>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 overflow-x-auto my-6" style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                      {children}
                    </pre>
                  ),
                  code: ({ children, inline }) => (
                    inline ? (
                      <code className="text-[var(--rose)] bg-[var(--surface)] px-1.5 py-0.5 rounded text-sm" style={{ fontFamily: 'var(--mono)' }}>
                        {children}
                      </code>
                    ) : (
                      <code className="text-[var(--text2)]" style={{ fontFamily: 'var(--mono)' }}>
                        {children}
                      </code>
                    )
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-[var(--rose)] bg-[var(--rose-light)] pl-5 pr-4 py-4 my-6 rounded-r-lg italic text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-[var(--text)] font-medium">
                      {children}
                    </strong>
                  ),
                }}
              >
                {writeup.content}
              </ReactMarkdown>
            </div>
          )}
        </motion.div>

        {/* Related Writeups */}
        {relatedWriteups.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 pt-8 border-t border-[var(--border)]"
          >
            <h3 className="text-sm tracking-wider text-[var(--text3)] uppercase mb-6" style={{ fontFamily: 'var(--mono)' }}>
              Related writeups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedWriteups.map((related) => (
                <Link
                  key={related.id}
                  to={`/writeups/${related.id}`}
                  className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 no-underline group"
                >
                  <p className="text-[0.65rem] tracking-wide text-[var(--rose)] mb-2" style={{ fontFamily: 'var(--mono)' }}>
                    {related.category}
                  </p>
                  <p className="text-sm text-[var(--text)] group-hover:text-[var(--rose)] transition-colors line-clamp-2" style={{ fontFamily: 'var(--serif)' }}>
                    {related.title}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

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
