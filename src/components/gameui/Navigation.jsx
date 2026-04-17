import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User, Briefcase, Activity, Radio } from 'lucide-react';

// Navigation - persistent mode switcher
// Simple and reliable - no complex locking mechanism
export const Navigation = memo(function Navigation() {
  const location = useLocation();

  const navItems = [
    { to: '/profile', icon: User, label: 'PROFILE' },
    { to: '/work', icon: Briefcase, label: 'WORK' },
    { to: '/now', icon: Activity, label: 'NOW' },
    { to: '/contact', icon: Radio, label: 'CONTACT' },
  ];

  return (
    <nav className="game-nav" aria-label="Primary navigation">
      <div className="game-nav-rail">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
                          (item.to === '/profile' && location.pathname === '/');
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`game-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="game-nav-indicator">
                <div className="game-nav-glow" />
              </div>
              <Icon size={20} className="game-nav-icon" />
              <span className="game-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Active route indicator line */}
      <div className="game-nav-active-line" />
    </nav>
  );
});
