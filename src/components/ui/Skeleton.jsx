import { cn } from '@utils';
import { useReducedMotion } from '@hooks/useReducedMotion';

export function Skeleton({ className, count = 1 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-[var(--surface)] rounded w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[var(--surface)] rounded animate-pulse w-full"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className={cn('h-3 w-20 rounded mb-4', prefersReducedMotion ? 'bg-[var(--border)]' : 'bg-[var(--border)] animate-pulse')} />
      <div className={cn('h-6 w-3/4 rounded mb-3', prefersReducedMotion ? 'bg-[var(--border)]' : 'bg-[var(--border)] animate-pulse')} style={{ animationDelay: '100ms' }} />
      <div className={cn('h-4 w-full rounded mb-2', prefersReducedMotion ? 'bg-[var(--border)]' : 'bg-[var(--border)] animate-pulse')} style={{ animationDelay: '200ms' }} />
      <div className={cn('h-4 w-5/6 rounded', prefersReducedMotion ? 'bg-[var(--border)]' : 'bg-[var(--border)] animate-pulse')} style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen px-6 lg:px-12 pb-16">
      <div className="pt-[18vh] pb-16 max-w-3xl mx-auto space-y-4">
        <div className="h-3 w-24 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-12 w-3/4 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '100ms' }} />
        <div className="h-20 w-full rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '200ms' }} />
      </div>
    </div>
  );
}
