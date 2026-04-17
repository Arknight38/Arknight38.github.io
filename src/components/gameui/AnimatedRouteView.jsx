import { useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@hooks';

// Simple fade transition - more reliable than complex directional animations
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// AnimatedRouteView - simple and reliable page transitions
// Using mode="sync" instead of "wait" to prevent navigation deadlocks
export function AnimatedRouteView() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0 } },
        exit: { opacity: 1, scale: 1, transition: { duration: 0 } },
      }
    : pageVariants;

  return (
    <div className="route-viewport">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={location.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="route-content"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
