import { motion, useScroll, useSpring } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useReducedMotion } from '@hooks';

export function ScrollProgress() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 z-[100] origin-left"
      style={{
        scaleX: prefersReducedMotion ? 1 : scaleX,
        background: 'var(--rose)',
        opacity: prefersReducedMotion ? 0.4 : 1,
      }}
    />
  );
}
