import { memo } from 'react';
import { HUD } from './HUD';
import { Navigation } from './Navigation';
import { AnimatedRouteView } from './AnimatedRouteView';
import { OverlayLayer } from './OverlayLayer';
import { EffectsLayer } from './EffectsLayer';

// AppShell - NEVER unmounts, persistent across all routes
// This is the root container that provides the game-like UI frame
export const AppShell = memo(function AppShell() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Background effects layer (scanlines, noise, vignette) */}
      <EffectsLayer />

      {/* Persistent HUD - top status bar */}
      <HUD />

      {/* Persistent Navigation - mode switcher */}
      <Navigation />

      {/* Main content area with route transitions */}
      <div id="main-content" className="app-main" tabIndex={-1}>
        <AnimatedRouteView />
      </div>

      {/* Overlay system for detailed content */}
      <OverlayLayer />
    </div>
  );
});
