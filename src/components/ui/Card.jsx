import { forwardRef } from 'react';
import { cn } from '@utils';

const Card = forwardRef(({ children, className, hover = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] p-6',
        hover && 'transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('text-xl font-medium text-[var(--text)]', className)}
      style={{ fontFamily: 'var(--serif)' }}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text2)] mt-2', className)}
      style={{ fontFamily: 'var(--sans)' }}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-[var(--border)]', className)} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
