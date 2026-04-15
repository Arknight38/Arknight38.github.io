import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Mail, Github, FileText, Copy, Check, ExternalLink, Globe } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const contactLinks = [
  {
    id: 'email',
    label: 'Email',
    value: 'sakugrossarth@gmail.com',
    href: 'mailto:sakugrossarth@gmail.com',
    icon: Mail,
    description: 'Best way to reach me for opportunities',
    color: 'var(--rose)',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'Arknight38',
    href: 'https://github.com/Arknight38',
    icon: Github,
    description: 'Open source projects and contributions',
    color: 'var(--lavender)',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'Saku Grossarth',
    href: 'https://linkedin.com/in/saku-grossarth',
    icon: Globe,
    description: 'Professional profile and background',
    color: 'var(--sage)',
  },
  {
    id: 'cv',
    label: 'CV / Resume',
    value: 'Saku_Grossarth_CV.pdf',
    href: '/Saku_Grossarth_CV.pdf',
    icon: FileText,
    description: 'Download my full resume (PDF)',
    color: 'var(--text2)',
  },
];

export function Contact() {
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    document.title = 'Contact — Saku Grossarth';
  }, []);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen px-6 lg:px-12 pb-16">
      {/* Header */}
      <header className="pt-[18vh] pb-12 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[var(--rose)] mb-6 text-[0.7rem] tracking-[0.14em]"
          style={{ fontFamily: 'var(--mono)' }}
        >
          get in touch
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(2.5rem,6vw,3.5rem)] leading-[1.1] tracking-[-0.02em] text-[var(--text)]"
          style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
        >
          Let's<br /><em className="not-italic text-[var(--rose)]">connect</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base text-[var(--text2)] max-w-md leading-[1.7]"
        >
          Open to opportunities in systems programming, security research, and low-level development.
        </motion.p>
      </header>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {contactLinks.map((link, index) => (
          <motion.div
            key={link.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <ContactCard
              link={link}
              onCopy={() => copyToClipboard(link.value, link.id)}
              copied={copiedId === link.id}
            />
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 pt-8 border-t border-[var(--border)] max-w-3xl mx-auto"
      >
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--sage)]" />
            <span className="text-[0.75rem] text-[var(--text3)]" style={{ fontFamily: 'var(--mono)' }}>
              Currently: open to work
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--rose)] animate-pulse" />
            <span className="text-[0.75rem] text-[var(--text3)]" style={{ fontFamily: 'var(--mono)' }}>
              Based in: Colorado Springs, CO
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ContactCard({ link, onCopy, copied }) {
  const Icon = link.icon;
  const isExternal = link.href.startsWith('http');
  const isEmail = link.href.startsWith('mailto:');
  const Component = isExternal || isEmail ? 'a' : 'a';
  const linkProps = isExternal
    ? { href: link.href, target: '_blank', rel: 'noopener' }
    : { href: link.href };

  return (
    <Component
      {...linkProps}
      className="block p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)] group no-underline"
    >
      <div className="flex flex-col gap-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: `color-mix(in srgb, ${link.color} 12%, transparent)` }}
        >
          <Icon size={18} style={{ color: link.color }} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p
            className="text-[0.65rem] tracking-[0.1em] text-[var(--text3)] mb-1 uppercase"
            style={{ fontFamily: 'var(--mono)' }}
          >
            {link.label}
          </p>
          <p
            className="text-lg text-[var(--text)] group-hover:text-[var(--rose)] transition-colors"
            style={{ fontFamily: 'var(--serif)' }}
          >
            {link.value}
          </p>
          <p className="text-sm text-[var(--text3)] mt-1">{link.description}</p>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3 mt-2">
          {link.id === 'email' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCopy();
              }}
              className="flex items-center gap-1.5 text-[0.7rem] text-[var(--text3)] hover:text-[var(--rose)] transition-colors"
              style={{ fontFamily: 'var(--mono)' }}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  copy
                </>
              )}
            </button>
          )}
          <span
            className="flex items-center gap-1 text-[0.7rem] text-[var(--rose)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            style={{ fontFamily: 'var(--mono)' }}
          >
            {isExternal ? (
              <>
                open <ExternalLink size={12} />
              </>
            ) : (
              'download'
            )}
          </span>
        </div>
      </div>
    </Component>
  );
}
