import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollProgress, ScrambleText } from '@components/ui';
import { getWriteupById, getRelatedWriteups, writeups } from '@data/writeups';
import { WriteupDetailSkeleton } from './WriteupDetail.skeleton';

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
    <div className="writeup-page">
      <ScrollProgress />

      {/* Article Shell */}
      <article className="writeup-article">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/writeups" className="writeup-back">
            <ArrowLeft size={14} />
            <span>BACK TO ARCHIVE</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="writeup-header"
        >
          <div className="writeup-meta">
            <span className="writeup-category">
              {writeup.categories ? writeup.categories[0] : writeup.category}
            </span>
            <span className="meta-dot">·</span>
            <span className="meta-item">
              <Calendar size={12} />
              {writeup.date}
            </span>
            <span className="meta-dot">·</span>
            <span className="meta-item">
              <Clock size={12} />
              {writeup.readTime}
            </span>
          </div>

          <ScrambleText as="h1" className="writeup-title" text={writeup.title} durationMs={650} />
        </motion.header>

        {/* Subtitle */}
        {writeup.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="writeup-subtitle"
          >
            {writeup.subtitle}
          </motion.p>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="writeup-content"
        >
          {loading ? (
            <WriteupDetailSkeleton />
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                  h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                  p: ({ children }) => <p className="markdown-p">{children}</p>,
                  ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                  li: ({ children }) => (
                    <li className="markdown-li">
                      <span className="li-bullet">—</span>
                      {children}
                    </li>
                  ),
                  pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
                  code: ({ children, inline }) =>
                    inline ? (
                      <code className="markdown-code-inline">{children}</code>
                    ) : (
                      <code className="markdown-code">{children}</code>
                    ),
                  blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
                  strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
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
            className="writeup-related"
          >
            <h3 className="related-title">RELATED ENTRIES</h3>
            <div className="related-grid">
              {relatedWriteups.map((related) => (
                <Link key={related.id} to={`/writeups/${related.id}`} className="related-card no-underline">
                  <span className="related-category">
                  {related.categories ? related.categories[0] : related.category}
                </span>
                  <p className="related-item-title">{related.title}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="writeup-nav">
          {prevWriteup ? (
            <Link to={`/writeups/${prevWriteup.id}`} className="nav-link prev">
              <span className="nav-label">PREVIOUS</span>
              <span className="nav-title">← {prevWriteup.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextWriteup ? (
            <Link to={`/writeups/${nextWriteup.id}`} className="nav-link next">
              <span className="nav-label">NEXT</span>
              <span className="nav-title">{nextWriteup.title} →</span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </div>
  );
}
