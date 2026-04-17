import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useScrollLock } from '@hooks';
import { cn } from '@utils';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, details, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden')
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement;
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      dialogRef.current?.focus();
    }

    return () => {
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const onDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [open, closeOnEscape, onClose]);

  const handleDialogKeyDown = (event) => {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      data-testid="modal-backdrop"
      onMouseDown={() => {
        if (closeOnBackdrop) onClose?.();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full max-w-2xl rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_var(--shadow)] outline-none',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-medium text-[var(--text)]" style={{ fontFamily: 'var(--serif)' }}>
            {title}
          </h2>
          {showCloseButton ? (
            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text2)] transition-colors duration-200 hover:border-[var(--rose)] hover:text-[var(--rose)]"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export { Modal };
