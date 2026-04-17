import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function useTextScramble({
  text,
  running,
  durationMs = 700,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_/\\<>[]{}',
  preserveSpaces = true,
  forceReducedMotion,
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = forceReducedMotion ?? prefersReducedMotion;

  const finalText = text ?? '';
  const chars = useMemo(() => charset.split(''), [charset]);
  const [output, setOutput] = useState(finalText);

  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    setOutput(finalText);
  }, [finalText]);

  useEffect(() => {
    if (!running) return;

    if (reduced) {
      setOutput(finalText);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = durationMs <= 0 ? 1 : clamp(elapsed / durationMs, 0, 1);

      const revealCount = Math.floor(finalText.length * t);
      const next = finalText
        .split('')
        .map((c, i) => {
          if (preserveSpaces && c === ' ') return ' ';
          if (i < revealCount) return c;
          return chars[(i * 13 + Math.floor(elapsed / 30)) % chars.length] ?? c;
        })
        .join('');

      setOutput(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOutput(finalText);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, reduced, durationMs, finalText, chars, preserveSpaces]);

  return { output, reduced };
}

