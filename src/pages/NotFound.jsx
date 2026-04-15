import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui';

export function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Saku Grossarth';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Code */}
        <div className="mb-8">
          <span
            className="text-[8rem] leading-none font-light text-[var(--rose)] opacity-20"
            style={{ fontFamily: 'var(--mono)' }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <h1
          className="text-2xl text-[var(--text)] mb-4"
          style={{ fontFamily: 'var(--serif)' }}
        >
          Page not found
        </h1>
        <p className="text-[var(--text2)] mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Check the URL or navigate back home.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button as={Link} to="/" variant="primary">
            <Home size={14} />
            go home
          </Button>
          <Button as="button" onClick={() => window.history.back()} variant="secondary">
            <ArrowLeft size={14} />
            go back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
