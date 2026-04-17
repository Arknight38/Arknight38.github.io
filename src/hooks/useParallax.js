import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useParallax(intensity = 8) {
  const prefersReducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    const onPointerMove = (event) => {
      const x = ((event.clientX / window.innerWidth) * 2 - 1) * intensity;
      const y = ((event.clientY / window.innerHeight) * 2 - 1) * intensity;
      setOffset({ x, y });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [intensity, prefersReducedMotion]);

  return { offset, prefersReducedMotion };
}
