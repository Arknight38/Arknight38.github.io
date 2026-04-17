import { cn } from '@utils';

function SkillBadge({ name, level = 3, max = 5, className }) {
  const safeLevel = Math.min(Math.max(level, 0), max);
  const fillPercent = Math.round((safeLevel / max) * 100);

  return (
    <div className={cn('rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm text-[var(--text)]">{name}</span>
        <span className="text-[0.68rem] font-mono text-[var(--text3)]">{safeLevel}/{max}</span>
      </div>
      <div
        role="meter"
        aria-label={`${name} proficiency`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={safeLevel}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]"
      >
        <div
          className="h-full rounded-full bg-[var(--rose)] transition-[width] duration-300"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

export { SkillBadge };
