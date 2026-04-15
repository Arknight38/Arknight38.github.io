import { cn } from '@utils';

const tagVariants = {
  rose: 'bg-[var(--rose-light)] text-[var(--rose)]',
  lavender: 'bg-[var(--lavender-light)] text-[var(--lavender)]',
  sage: 'bg-[var(--sage-light)] text-[var(--sage)]',
  neutral: 'bg-[var(--border)] text-[var(--text2)]',
};

export function Tag({ children, variant = 'neutral', className, size = 'md' }) {
  const sizes = {
    sm: 'px-2 py-1 text-[0.6rem]',
    md: 'px-3 py-1.5 text-[0.68rem]',
    lg: 'px-4 py-2 text-[0.75rem]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-mono tracking-wide',
        tagVariants[variant],
        sizes[size],
        className
      )}
      style={{ fontFamily: 'var(--mono)' }}
    >
      {children}
    </span>
  );
}

export function LanguagePill({ children, lang }) {
  const langStyles = {
    rust: 'bg-[var(--rose-light)] text-[var(--rose)]',
    cpp: 'bg-[var(--lavender-light)] text-[var(--lavender)]',
    ts: 'bg-[rgba(49,120,198,0.12)] text-[#3178c6]',
    sh: 'bg-[rgba(137,87,150,0.12)] text-[#895796]',
    closed: 'bg-[var(--border)] text-[var(--text3)]',
  };

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[0.65rem] font-mono tracking-wide',
        langStyles[lang] || langStyles.neutral
      )}
    >
      {children}
    </span>
  );
}
