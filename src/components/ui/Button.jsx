import { forwardRef } from 'react';
import { cn } from '@utils';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className,
  as = 'button',
  ...props 
}, ref) => {
  const Component = as;
  
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 font-mono text-[0.72rem] tracking-[0.08em]';
  
  const variants = {
    primary: 'bg-[var(--rose)] text-white border border-[var(--rose)] hover:bg-[color-mix(in_srgb,var(--rose)_85%,var(--text))]',
    secondary: 'bg-transparent text-[var(--text2)] border border-[var(--border)] hover:border-[var(--rose)] hover:text-[var(--rose)]',
    ghost: 'bg-transparent text-[var(--text2)] border-transparent hover:text-[var(--rose)]',
    icon: 'p-2 rounded-full bg-transparent text-[var(--text3)] hover:text-[var(--rose)] hover:scale-90',
  };
  
  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-6 py-2.5',
    lg: 'px-8 py-3',
    icon: 'p-2',
  };

  return (
    <Component
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : children}
    </Component>
  );
});

Button.displayName = 'Button';

export { Button };
