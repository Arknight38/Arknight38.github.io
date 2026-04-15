import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { useIsMobile, useScrollLock } from '@hooks';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useScrollLock(mobileMenuOpen && isMobile);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const navLinks = [
    { to: '/', label: 'home' },
    { to: '/projects', label: 'projects' },
    { to: '/experience', label: 'experience' },
    { to: '/writeups', label: 'writeups' },
    { to: '/contact', label: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 transition-all duration-300 ${
        scrolled ? 'bg-[var(--bg)]/85 backdrop-blur-xl border-b border-[var(--border)]' : 'bg-transparent'
      }`}
      style={{ transitionTimingFunction: 'var(--ease)' }}
    >
      <NavLink
        to="/"
        className="text-[var(--text)] hover:text-[var(--rose)] transition-colors"
        style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '1.1rem', letterSpacing: '-0.01em', textDecoration: 'none' }}
      >
        saku.g
      </NavLink>

      <div className="flex items-center gap-6 lg:gap-8">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-all hover:scale-90"
          style={{ color: 'var(--text3)' }}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-7 list-none">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `text-[0.72rem] tracking-[0.06em] transition-colors no-underline ${
                    isActive ? 'text-[var(--rose)]' : 'text-[var(--text3)] hover:text-[var(--rose)]'
                  }`
                }
                style={{ fontFamily: 'var(--mono)' }}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full transition-all"
          style={{ color: 'var(--text3)' }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isMobile && (
        <div
          className="fixed inset-0 top-[60px] z-40 flex flex-col items-center justify-center gap-8"
          style={{ background: 'var(--bg)' }}
        >
          {navLinks.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-2xl tracking-wide transition-colors no-underline ${
                  isActive ? 'text-[var(--rose)]' : 'text-[var(--text)]'
                }`
              }
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
