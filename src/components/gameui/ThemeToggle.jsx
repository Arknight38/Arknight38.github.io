import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useReducedMotion } from '@hooks';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 360);
    return () => clearTimeout(t);
  }, [flash]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`hud-theme-toggle ${flash ? 'flash' : ''} ${isDark ? 'is-dark' : 'is-light'} ${
        prefersReducedMotion ? 'reduced' : ''
      }`}
      onClick={() => {
        setFlash(true);
        toggleTheme();
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="hud-theme-toggle-inner" aria-hidden="true">
        <span className="hud-theme-icon sun">
          <Sun size={14} />
        </span>
        <span className="hud-theme-icon moon">
          <Moon size={14} />
        </span>
        <span className="hud-theme-eclipse" />
      </span>
    </button>
  );
}

