import { forwardRef } from 'react';
import { cn } from '@utils';

const IconButton = forwardRef(({ children, className, size = 'md', ...props }, ref) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'group relative inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] transition-all duration-200 hover:scale-95 hover:border-[var(--rose)] hover:text-[var(--rose)] active:scale-90',
        'before:absolute before:inset-0 before:rounded-full before:bg-[var(--rose)]/0 before:transition-colors before:duration-200 active:before:bg-[var(--rose)]/10',
        sizes[size],
        className
      )}
      {...props}
    >
      <span className="relative z-[1]">{children}</span>
    </button>
  );
});

IconButton.displayName = 'IconButton';

export { IconButton };
