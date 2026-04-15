import { useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { experiences, achievements } from '@data';

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

export function Experience() {
  useEffect(() => {
    document.title = 'Experience — Saku Grossarth';
  }, []);

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
          where I've worked
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="text-[clamp(2.5rem,6vw,3.5rem)] leading-[1.1] tracking-[-0.02em] text-[var(--text)]"
          style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
        >
          Experience &<br /><em className="not-italic text-[var(--rose)]">background</em>
        </motion.h1>
      </header>

      {/* Experience List */}
      <div className="flex flex-col gap-12 max-w-3xl mx-auto">
        {experiences.map((exp, index) => (
          <motion.div
            key={exp.id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-[100px_1fr] gap-8 pb-12 border-b border-[var(--border)] last:border-0 last:pb-0"
          >
            {/* Left Column */}
            <div className="flex flex-col gap-1">
              <span
                className="text-[0.7rem] tracking-[0.08em] text-[var(--rose)]"
                style={{ fontFamily: 'var(--mono)' }}
              >
                {exp.period}
              </span>
              <span
                className="text-[0.65rem] tracking-[0.08em] text-[var(--text3)] uppercase"
                style={{ fontFamily: 'var(--mono)' }}
              >
                {exp.type}
              </span>
            </div>

            {/* Right Column */}
            <div>
              <h3
                className="text-xl font-medium text-[var(--text)] mb-1"
                style={{ fontFamily: 'var(--serif)' }}
              >
                {exp.role}
              </h3>
              <p
                className="text-[0.95rem] italic text-[var(--text3)] mb-4"
                style={{ fontFamily: 'var(--serif)' }}
              >
                {exp.organization}
                {exp.organizationDetail && (
                  <span className="not-italic"> — {exp.organizationDetail}</span>
                )}
              </p>
              <ul className="flex flex-col gap-3 list-none">
                {exp.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className="text-[0.95rem] text-[var(--text2)] leading-[1.7] pl-5 relative"
                  >
                    <span className="absolute left-0 text-[var(--rose)]">—</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-16 max-w-3xl mx-auto"
      >
        <h3
          className="text-[0.65rem] tracking-[0.14em] text-[var(--text3)] mb-6 uppercase"
          style={{ fontFamily: 'var(--mono)' }}
        >
          certifications & achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {achievements.map((ach, index) => (
            <motion.div
              key={ach.label}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)]"
            >
              <span
                className="block text-[0.85rem] text-[var(--text)] mb-1"
                style={{ fontFamily: 'var(--serif)' }}
              >
                {ach.label}
              </span>
              <span
                className="text-[0.6rem] text-[var(--text3)] tracking-wide"
                style={{ fontFamily: 'var(--mono)' }}
              >
                {ach.sub}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
