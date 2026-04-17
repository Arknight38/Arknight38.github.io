import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@utils';

function Accordion({ items = [], type = 'multiple', defaultOpen = [], className }) {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));
  const baseId = useId();

  const toggleItem = (id) => {
    setOpenItems((previous) => {
      const next = new Set(previous);
      const isOpen = next.has(id);

      if (isOpen) {
        next.delete(id);
        return next;
      }

      if (type === 'single') {
        return new Set([id]);
      }

      next.add(id);
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-[var(--border)] rounded-[var(--r-md)] border border-[var(--border)]', className)}>
      {items.map((item, index) => {
        const itemId = item.id ?? `${baseId}-${index}`;
        const isOpen = openItems.has(itemId);
        const triggerId = `${itemId}-trigger`;
        const panelId = `${itemId}-panel`;

        return (
          <div key={itemId} className="bg-[var(--surface)] first:rounded-t-[var(--r-md)] last:rounded-b-[var(--r-md)]">
            <h3>
              <button
                id={triggerId}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[0.95rem] text-[var(--text)] transition-colors duration-200 hover:text-[var(--rose)]"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(itemId)}
              >
                <span>{item.title}</span>
                <ChevronDown
                  size={16}
                  className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="grid grid-rows-[1fr] overflow-hidden px-5 pb-4 text-sm text-[var(--text2)] transition-all duration-300"
              >
                <div className="min-h-0">{item.content}</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export { Accordion };
