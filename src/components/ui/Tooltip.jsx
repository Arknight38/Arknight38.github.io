import { cloneElement, isValidElement, useState } from 'react';
import {
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useFloating,
  FloatingPortal,
  autoUpdate,
} from '@floating-ui/react';
import { cn } from '@utils';

function Tooltip({ children, content, placement = 'top', className, openDelay = 80, closeDelay = 70 }) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, {
    move: false,
    delay: { open: openDelay, close: closeDelay },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  if (!isValidElement(children)) {
    return null;
  }

  return (
    <>
      {cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(children.props),
      })}
      {isOpen && content ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={cn(
              'z-[130] rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface2)] px-3 py-1.5 text-xs text-[var(--text2)] shadow-[0_10px_30px_var(--shadow)]',
              className
            )}
            {...getFloatingProps()}
          >
            {content}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}

export { Tooltip };
