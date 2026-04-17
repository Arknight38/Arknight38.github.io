import { useEffect, useMemo, useState } from 'react';
import { cn } from '@utils';
import { useTextScramble } from '@hooks';

function ScrambleText({
  text,
  as: As = 'span',
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const running = useMemo(() => {
    if (trigger === 'manual') return !!runningProp;
    if (trigger === 'hover') return hovered;
    return mounted;
  }, [trigger, runningProp, hovered, mounted]);

  const { output, reduced } = useTextScramble({
    text,
    running,
    durationMs,
    charset,
    forceReducedMotion,
  });

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

