import { useEffect, useRef, useCallback } from 'react';

export function CursorDot() {
  const dotRef = useRef(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const dotPosRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const isHoveringRef = useRef(false);

  const moveDot = useCallback(() => {
    if (!dotRef.current) return;

    dotPosRef.current.x += (mouseRef.current.x - dotPosRef.current.x) * 0.15;
    dotPosRef.current.y += (mouseRef.current.y - dotPosRef.current.y) * 0.15;

    dotRef.current.style.left = `${dotPosRef.current.x}px`;
    dotRef.current.style.top = `${dotPosRef.current.y}px`;

    rafRef.current = requestAnimationFrame(moveDot);
  }, []);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

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

    // Handle hover states for interactive elements
    const handleElementEnter = () => {
      isHoveringRef.current = true;
      dot.classList.add('hover');
    };

    const handleElementLeave = () => {
      isHoveringRef.current = false;
      dot.classList.remove('hover');
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, input, textarea, select, [role="button"], .stat-card, .skill-card, .project-item, .ach-card, .writeup-card, .btn'
    );

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleElementEnter);
      el.addEventListener('mouseleave', handleElementLeave);
    });

    // Start animation loop
    rafRef.current = requestAnimationFrame(moveDot);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);

      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleElementEnter);
        el.removeEventListener('mouseleave', handleElementLeave);
      });

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [moveDot]);

  return (
    <div
      ref={dotRef}
      className="fixed w-2 h-2 rounded-full pointer-events-none z-[9999] opacity-0 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
      style={{
        background: 'var(--rose)',
        border: '2px solid var(--surface)',
        boxShadow: '0 0 4px rgba(0,0,0,0.3)',
      }}
    />
  );
}
