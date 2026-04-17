import { useEffect, useMemo, useState } from 'react';
import { cn } from '@utils';
import { useTextScramble } from '@hooks';

function ScrambleText({
  text,
  as: AsComponent = 'span',
  trigger = 'mount', // 'mount' | 'hover' | 'manual'
  running: runningProp,
  durationMs = 700,
  charset,
  className,
  mask = true,
  forceReducedMotion,
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState during render
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const running = useMemo(() => {
    if (trigger === 'manual') return !!runningProp;
    if (trigger === 'hover') return hovered;
    return hasMounted;
  }, [trigger, runningProp, hovered, hasMounted]);

  const { output, reduced } = useTextScramble({
    text,
    running,
    durationMs,
    charset,
    forceReducedMotion,
  });

  const As = AsComponent;

  return (
    <As
      className={cn(mask && !reduced && running && 'scramble-mask', className)}
      data-scramble-running={running ? 'true' : 'false'}
      onMouseEnter={trigger === 'hover' ? () => setHovered(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setHovered(false) : undefined}
      {...props}
    >
      {output}
    </As>
  );
}

export { ScrambleText };

