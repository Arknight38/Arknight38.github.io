import { Skeleton } from '@components/ui';

export function WriteupDetailSkeleton() {
  return (
    <div className="writeup-loading" data-testid="writeup-skeleton">
      <div className="space-y-3">
        <Skeleton className="!space-y-0" count={1} />
        <div className="h-10 w-3/4 rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-6 w-5/6 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '80ms' }} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '60ms' }} />
        <div className="h-4 w-10/12 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '120ms' }} />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-[var(--surface)] animate-pulse" />
        <div className="h-4 w-11/12 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '60ms' }} />
        <div className="h-4 w-9/12 rounded bg-[var(--surface)] animate-pulse" style={{ animationDelay: '120ms' }} />
      </div>
    </div>
  );
}

