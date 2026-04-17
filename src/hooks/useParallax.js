import { useEffect, useState, useMemo } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useParallax(intensity = 8) {
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;

    const onPointerMove = (event) => {
      const x = ((event.clientX / window.innerWidth) * 2 - 1) * intensity;
      const y = ((event.clientY / window.innerHeight) * 2 - 1) * intensity;
      setOffset({ x, y });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [intensity, prefersReducedMotion]);

  // Memoize offset to reset when reduced motion preference changes
  const finalOffset = useMemo(() => {
    return prefersReducedMotion ? { x: 0, y: 0 } : offset;
  }, [prefersReducedMotion, offset]);

  return { offset: finalOffset, prefersReducedMotion };
}
