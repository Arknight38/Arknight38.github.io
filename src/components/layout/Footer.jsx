import { ArrowUp } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-8 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[var(--border)] mt-auto">
      <div className="flex items-center gap-4">
        <span className="text-[var(--text)]" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
          Saku Grossarth
        </span>
        <span className="text-[0.7rem] text-[var(--text3)]" style={{ fontFamily: 'var(--mono)' }}>
          Documentation written with AI assistance, fact-checked by me.
        </span>
      </div>

      <button
        onClick={scrollToTop}
        className="flex items-center gap-2 text-[0.7rem] text-[var(--text3)] hover:text-[var(--rose)] transition-colors group"
        style={{ fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}
      >
        back to top
        <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </footer>
  );
}
