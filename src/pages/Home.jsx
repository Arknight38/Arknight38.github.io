import { useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { ArrowRight, Github } from 'lucide-react';
import { Button } from '@components/ui';
import { SEO } from '@components/SEO';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export function Home() {
  useEffect(() => {
    document.title = 'Saku Grossarth';
  }, []);

  const interests = ['skiing', 'volleyball', 'gaming', 'anime', 'manga & webnovels', 'driving / racing', 'organizing things'];

  return (
    <div className="min-h-screen">
      <SEO
        title="Home"
        description="Saku Grossarth — Computer Engineer specializing in systems programming, kernel development, reverse engineering, and low-level engineering."
        pathname="/"
      />
      {/* Hero / Intro Section */}
      <section className="pt-[22vh] pb-24 px-6 lg:px-12 max-w-3xl mx-auto">
        <motion.p
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[var(--rose)] mb-8 text-[0.7rem] tracking-[0.14em]"
          style={{ fontFamily: 'var(--mono)' }}
        >
          colorado springs &nbsp;&mdash;&nbsp; computer engineer
        </motion.p>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[clamp(3.2rem,8vw,5.8rem)] leading-none tracking-[-0.02em] text-[var(--text)] mb-2"
          style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
        >
          Saku<br /><em className="not-italic text-[var(--rose)]">Grossarth</em>
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-[clamp(1rem,2.5vw,1.25rem)] text-[var(--text3)] mb-14 italic"
          style={{ fontFamily: 'var(--serif)' }}
        >
          I like building things that are interesting from the ground up.
        </motion.p>

        {/* Bio */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
          <p className="text-[1.13rem] leading-[1.95] text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
            My dad got me into coding through Khan Academy. I went from that to C, then C++, then Python,
            then CS50, and at some point I just started spending all my time in developer forums
            trying to learn whatever I could find. I'm still that way to this day.
          </p>
          <p className="text-[1.13rem] leading-[1.95] text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
            These days I mostly work in <em className="not-italic text-[var(--text)]">Rust and C++</em> on systems stuff, such as kernel drivers,
            hypervisors, binary analysis tools, reverse engineering. I like understanding how things
            actually work at the hardware and OS level. I've built a real-time messaging platform
            from scratch, a kernel-mode driver with a manual PE mapper, a hypervisor, and a
            bunch of other things I've written up on the <Link to="/writeups" className="text-[var(--rose)] underline underline-offset-[3px] decoration-[color-mix(in_srgb,var(--rose)_40%,transparent)] hover:decoration-[var(--rose)]">writeups page</Link>.
          </p>
          <p className="text-[1.13rem] leading-[1.95] text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
            I'm a junior at Pine Creek, class rank 7. I went to FBLA nationals for
            Coding & Programming after placing 1st at district and state. Last year I interned
            on the R&D team at Restaurant365 writing SQL against production Snowflake datasets.
            I'm also the <a href="https://github.com/Arknight38" target="_blank" rel="noopener" className="text-[var(--rose)] underline underline-offset-[3px] decoration-[color-mix(in_srgb,var(--rose)_40%,transparent)] hover:decoration-[var(--rose)]">#3 contributor to wplacer</a>
            — 40 commits, 5,306 lines — and helped run their 2,500-member contributor Discord.
          </p>
        </motion.div>

        {/* Outside of Code */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 pt-12 border-t border-[var(--border)]"
        >
          <p className="text-[0.65rem] tracking-[0.14em] text-[var(--text3)] mb-5 uppercase" style={{ fontFamily: 'var(--mono)' }}>
            OUTSIDE OF CODE
          </p>
          <div className="flex flex-wrap gap-3">
            {interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-1.5 rounded-full text-[0.95rem] italic text-[var(--text2)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--rose)] hover:text-[var(--rose)] hover:bg-[var(--rose-light)] transition-all duration-300"
                style={{ fontFamily: 'var(--serif)' }}
              >
                {interest}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Currently */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-12 p-7 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex gap-5 items-start"
        >
          <div className="w-2 h-2 rounded-full bg-[var(--rose)] mt-2 flex-shrink-0 shadow-[0_0_0_3px_color-mix(in_srgb,var(--rose)_25%,transparent)] animate-pulse" />
          <div>
            <p className="text-[0.65rem] tracking-[0.12em] text-[var(--text3)] mb-1 uppercase" style={{ fontFamily: 'var(--mono)' }}>
              CURRENTLY
            </p>
            <p className="text-[0.95rem] leading-[1.7] text-[var(--text2)]" style={{ fontFamily: 'var(--serif)' }}>
              Diving deeper into <em className="not-italic text-[var(--text)]">anticheat reversing</em> and low-level c++/rust.
              Always reading something new, TBATE.
            </p>
          </div>
        </motion.div>

        {/* CTA Row */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mt-16 pt-12 border-t border-[var(--border)] flex flex-wrap items-center gap-4"
        >
          <Button as={Link} to="/projects" variant="primary">
            projects <ArrowRight size={14} />
          </Button>
          <Button as={Link} to="/writeups" variant="secondary">
            writeups
          </Button>
          <Button as="a" href="https://github.com/Arknight38" target="_blank" rel="noopener" variant="secondary">
            <Github size={14} /> github
          </Button>
          <span className="text-[0.6rem] text-[var(--border)]" style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>
            ·
          </span>
          <Button as="a" href="/Saku_Grossarth_CV.pdf" variant="secondary">
            cv
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
