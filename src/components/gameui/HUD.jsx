import { memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useUIState } from '@contexts/UIStateContext';
import { Terminal, Activity, Clock, Wifi } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

// HUD - persistent top bar (Heads-Up Display)
// Shows system status, current route context, and indicators
// Memoized to prevent unnecessary re-renders on route changes
export const HUD = memo(function HUD() {
  const location = useLocation();
  useUIState();

  // Format route for display as arknight/<page-name>
  const routeSegment = (location.pathname === '/' ? '/profile' : location.pathname)
    .replace(/^\/+/, '')
    .split('/')[0]
    .toLowerCase();
  const routeDisplay = `arknight/${routeSegment}`;

  // Mock system status
  const systemStatus = 'ONLINE';
  const connectionStrength = 100;

  return (
    <header className="hud">
      {/* Left: Identity mark */}
      <div className="hud-section hud-left">
        <div className="hud-id">
          <Terminal size={14} className="hud-icon" />
          <span className="hud-id-text">SYS.ARKNIGHT</span>
        </div>
      </div>

      {/* Center: Context indicator */}
      <div className="hud-section hud-center">
        <div className="hud-context">
          <span className="hud-context-label">SECTOR</span>
          <span className="hud-context-value">{routeDisplay}</span>
        </div>
      </div>

      {/* Right: Status indicators */}
      <div className="hud-section hud-right">
        <div className="hud-status">
          <ThemeToggle />
          <div className="hud-status-item" title="System status: online">
            <Activity size={12} className="hud-icon pulse" />
            <span className="hud-status-label">STATUS</span>
            <span className="hud-status-text">{systemStatus}</span>
          </div>
          <div className="hud-status-item" title="Network signal strength">
            <Wifi size={12} className="hud-icon" />
            <span className="hud-status-label">SIGNAL</span>
            <span className="hud-status-text">{connectionStrength}%</span>
          </div>
          <div className="hud-status-item" title="Current local time">
            <Clock size={12} className="hud-icon" />
            <span className="hud-status-label">TIME</span>
            <CurrentTime />
          </div>
        </div>
      </div>
    </header>
  );
});

// Separate time component to prevent HUD re-renders every second
const CurrentTime = memo(function CurrentTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  return <span className="hud-status-text">{timeStr}</span>;
});
