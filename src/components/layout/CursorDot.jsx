import { useEffect, useRef } from 'react';

export function CursorDot() {
  const dotRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const dotPosRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    // Disable custom cursor for reduced motion users and coarse pointers.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion || coarsePointer) {
      dot.style.display = 'none';
      return;
    }

    const moveDot = () => {
      if (!dotRef.current) return;

      const dx = mouseRef.current.x - dotPosRef.current.x;
      const dy = mouseRef.current.y - dotPosRef.current.y;

      // Stop looping when dot has caught up — restarts on next mousemove
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        rafRef.current = null;
        return;
      }

      dotPosRef.current.x += dx * 0.35;
      dotPosRef.current.y += dy * 0.35;

      // GPU-accelerated transform instead of left/top
      dotRef.current.style.transform = `translate3d(${dotPosRef.current.x}px, ${dotPosRef.current.y}px, 0)`;

      rafRef.current = requestAnimationFrame(moveDot);
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (!hasMovedRef.current) {
        dot.classList.add('cursor-dot--active');
        hasMovedRef.current = true;
      }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(moveDot);
      }
    };

    const handleMouseLeave = () => {
      dot.style.opacity = '0';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const handleMouseEnter = () => {
      dot.style.opacity = '1';
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(moveDot);
      }
    };

    const selector = 'a, button, input, textarea, select, [role="button"], [data-cursor-target], .stat-card, .skill-card, .project-item, .ach-card, .writeup-card, .btn';

    // Event delegation — works with dynamically added elements (route changes etc.)
    const handleElementEnter = (e) => {
      if (e.target.closest(selector)) {
        dot.classList.add('cursor-dot--hover');
      }
    };

    const handleElementLeave = (e) => {
      if (e.target.closest(selector)) {
        dot.classList.remove('cursor-dot--hover');
      }
    };

    const handleMouseDown = () => {
      dot.classList.add('cursor-dot--click');
    };

    const handleMouseUp = () => {
      dot.classList.remove('cursor-dot--click');
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleElementEnter);
    document.addEventListener('mouseout', handleElementLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    rafRef.current = requestAnimationFrame(moveDot);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleElementEnter);
      document.removeEventListener('mouseout', handleElementLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="cursor-dot"
      aria-hidden="true"
    >
      <span className="cursor-dot-ring" />
    </div>
  );
}