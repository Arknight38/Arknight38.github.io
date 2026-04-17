import { memo } from 'react';
import { motion as Motion } from 'framer-motion';

// ThreeZoneLayout - Arknights-inspired 3-zone horizontal layout
// LEFT → identity / contextual information
// CENTER → primary focal element
// RIGHT → actions / controls
// Zones must remain spatially consistent across all screens
// No full-screen vertical stacking - vertical stacking allowed within zones only

// Stagger animation for zone entry
const zoneVariants = {
  left: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.25, ease: 'easeOut', delay: 0.1 },
    },
  },
  center: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: 'easeOut', delay: 0 },
    },
  },
  right: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.25, ease: 'easeOut', delay: 0.15 },
    },
  },
};

export const ThreeZoneLayout = memo(function ThreeZoneLayout({
  left,
  center,
  right,
  leftClassName = '',
  centerClassName = '',
  rightClassName = '',
  animate = true,
}) {
  return (
    <div className="three-zone-layout">
      {/* LEFT ZONE - Identity / Context */}
      <Motion.aside
        className={`zone-left ${leftClassName}`}
        variants={animate ? zoneVariants.left : undefined}
        initial={animate ? 'hidden' : false}
        animate="visible"
      >
        {left}
      </Motion.aside>

      {/* CENTER ZONE - Primary Focal */}
      <Motion.main
        className={`zone-center ${centerClassName}`}
        variants={animate ? zoneVariants.center : undefined}
        initial={animate ? 'hidden' : false}
        animate="visible"
      >
        {center}
      </Motion.main>

      {/* RIGHT ZONE - Actions / Controls */}
      <Motion.aside
        className={`zone-right ${rightClassName}`}
        variants={animate ? zoneVariants.right : undefined}
        initial={animate ? 'hidden' : false}
        animate="visible"
      >
        {right}
      </Motion.aside>
    </div>
  );
});

// Card component for the layered card system
// Hierarchy: background (decorative) → mid-layer (grouped info) → focal (primary)
export const ZoneCard = memo(function ZoneCard({
  children,
  variant = 'mid', // 'background' | 'mid' | 'focal'
  className = '',
  interactive = false,
  active = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  const cardClasses = [
    'zone-card',
    `zone-card-${variant}`,
    interactive && 'zone-card-interactive',
    active && 'zone-card-active',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {active && <div className="zone-card-glow" />}
      <div className="zone-card-content">
        {children}
      </div>
    </div>
  );
});

// Stat bar component for skills display
export const StatBar = memo(function StatBar({
  label,
  value,
  max = 100,
  color = 'rose',
  animate = true,
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="stat-bar">
      <div className="stat-bar-header">
        <span className="stat-bar-label">{label}</span>
        <span className="stat-bar-value">{value}%</span>
      </div>
      <div className="stat-bar-track">
        <Motion.div
          className={`stat-bar-fill stat-bar-fill-${color}`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
});
