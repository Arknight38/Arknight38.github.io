import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { ArrowUpRight, FileText } from 'lucide-react';
import { projects, projectFilters } from '@data';
import { LanguagePill } from '@components/ui';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export function Projects() {
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    document.title = 'Projects — Saku Grossarth';
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => p.tags.includes(activeFilter));
  }, [activeFilter]);

  return (
    <div className="min-h-screen px-6 lg:px-12 pb-16">
      {/* Header */}
      <header className="pt-[18vh] pb-16 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-[var(--rose)] mb-6 text-[0.7rem] tracking-[0.14em]"
          style={{ fontFamily: 'var(--mono)' }}
        >
          portfolio
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-[clamp(2.5rem,6vw,3.5rem)] leading-[1.1] tracking-[-0.02em] text-[var(--text)]"
          style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
        >
          Things I've<br /><em className="not-italic text-[var(--rose)]">built</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8 text-base text-[var(--text2)] max-w-xl leading-[1.7]"
        >
          Kernel drivers, a hypervisor, a full-stack messaging platform, binary analysis tools,
          and more. Closed-source projects link to technical writeups instead of code.
        </motion.p>
      </header>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap gap-2 mb-8 max-w-3xl mx-auto"
      >
        {projectFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3.5 py-1.5 rounded-full text-[0.68rem] tracking-[0.07em] transition-all duration-300 border ${
              activeFilter === filter.id
                ? 'border-[var(--rose)] text-[var(--rose)] bg-[var(--rose-dim)]'
                : 'border-[var(--border)] text-[var(--text3)] hover:border-[var(--rose)] hover:text-[var(--rose)]'
            }`}
            style={{ fontFamily: 'var(--mono)' }}
          >
            {filter.label}
          </button>
        ))}
      </motion.div>

      {/* Projects Grid */}
      <div className="flex flex-col gap-3.5 max-w-3xl mx-auto">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </div>

      {/* Skills Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-16 pt-12 border-t border-[var(--border)] max-w-3xl mx-auto"
      >
        <h2 className="text-2xl text-[var(--text)] mb-8 font-normal" style={{ fontFamily: 'var(--serif)' }}>
          What I work with
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkillCard title="Languages" skills={['Rust', 'C++', 'C', 'Python', 'TypeScript', 'x86 ASM']} color="rose" />
          <SkillCard title="Systems & Low-Level" skills={['Kernel Drivers', 'Hypervisors', 'Memory Mgmt', 'IPC', 'Reverse Eng']} color="lavender" />
          <SkillCard title="Backend & Infra" skills={['Axum / Tokio', 'PostgreSQL', 'WebSockets', 'Docker', 'AWS S3 / R2']} color="sage" />
          <SkillCard title="Tools" skills={['Git / GitHub', 'Zydis', 'LIEF', 'Snowflake', 'egui']} color="neutral" />
        </div>
      </motion.div>
    </div>
  );
}

function ProjectCard({ project }) {
  const isExternal = project.linkType === 'github';
  const isWriteup = project.linkType === 'writeup';
  const Component = isExternal ? 'a' : Link;
  const linkProps = isExternal
    ? { href: project.link, target: '_blank', rel: 'noopener' }
    : { to: project.link };

  return (
    <Component
      {...linkProps}
      className="block p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)] group no-underline"
    >
      {/* Featured Bar */}
      {project.tags.includes('featured') && (
        <div
          className="text-[0.6rem] tracking-[0.1em] text-[var(--rose)] uppercase pb-2 mb-1 border-b border-[var(--rose-b)]"
          style={{ fontFamily: 'var(--mono)' }}
        >
          featured project
        </div>
      )}

      {/* Top Row */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3
            className="text-xl font-medium text-[var(--text)] group-hover:text-[var(--rose)] transition-colors"
            style={{ fontFamily: 'var(--serif)' }}
          >
            {project.name}
          </h3>
          {project.languages.map((lang) => (
            <LanguagePill key={lang} lang={lang}>
              {lang === 'rust' && 'Rust'}
              {lang === 'cpp' && 'C++'}
              {lang === 'c' && 'C'}
              {lang === 'ts' && 'TypeScript'}
              {lang === 'python' && 'Python'}
              {lang === 'sh' && 'SQL'}
              {lang === 'asm' && 'ASM'}
              {lang === 'closed' && 'closed source'}
            </LanguagePill>
          ))}
        </div>
        <span
          className="text-[0.7rem] text-[var(--text3)] tracking-wide flex items-center gap-1 group-hover:text-[var(--rose)] transition-colors"
          style={{ fontFamily: 'var(--mono)' }}
        >
          {isWriteup ? (
            <>
              read writeup <FileText size={12} />
            </>
          ) : isExternal ? (
            <>
              view on github <ArrowUpRight size={12} />
            </>
          ) : (
            <>
              view project <ArrowUpRight size={12} />
            </>
          )}
        </span>
      </div>

      {/* Description */}
      <p className="text-[0.9rem] text-[var(--text2)] leading-[1.7] mb-4">{project.description}</p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {project.chips.map((chip) => (
          <span
            key={chip}
            className="px-2.5 py-1 rounded-full text-[0.65rem] text-[var(--text3)] bg-[var(--border)]"
            style={{ fontFamily: 'var(--mono)', letterSpacing: '0.03em' }}
          >
            {chip}
          </span>
        ))}
      </div>
    </Component>
  );
}

function SkillCard({ title, skills, color }) {
  const bgColors = {
    rose: 'bg-[var(--rose-light)]',
    lavender: 'bg-[var(--lavender-light)]',
    sage: 'bg-[var(--sage-light)]',
    neutral: 'bg-[var(--border)]',
  };

  const textColors = {
    rose: 'text-[var(--rose)]',
    lavender: 'text-[var(--lavender)]',
    sage: 'text-[var(--sage)]',
    neutral: 'text-[var(--text2)]',
  };

  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <h3
        className="text-[0.65rem] tracking-[0.12em] text-[var(--rose)] mb-4 uppercase"
        style={{ fontFamily: 'var(--mono)' }}
      >
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={`px-2.5 py-1 rounded-full text-[0.7rem] ${bgColors[color]} ${textColors[color]}`}
            style={{ fontFamily: 'var(--mono)' }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
