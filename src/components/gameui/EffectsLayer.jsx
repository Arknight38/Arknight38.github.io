import { memo } from 'react';
import { useParallax } from '@hooks';

// EffectsLayer - visual effects for game-like immersion
// Scanlines, noise texture, vignette edges
// Optional but encouraged for system immersion

export const EffectsLayer = memo(function EffectsLayer() {
  const { offset, prefersReducedMotion } = useParallax(6);

  const softX = offset.x * 0.35;
  const softY = offset.y * 0.35;
  const strongX = offset.x * 0.55;
  const strongY = offset.y * 0.55;

  return (
    <div className="effects-layer" aria-hidden="true">
      {/* Scanline overlay */}
      <div
        className="scanlines"
        style={
          prefersReducedMotion
            ? undefined
            : { transform: `translate3d(${softX}px, ${softY}px, 0)` }
        }
      />

      {/* Noise texture */}
      <div
        className="noise"
        style={
          prefersReducedMotion
            ? undefined
            : { transform: `translate3d(${strongX}px, ${strongY}px, 0)` }
        }
      />

      {/* Vignette edges */}
      <div className="vignette" />

      {/* Grid accent lines */}
      <div
        className="grid-lines"
        style={
          prefersReducedMotion
            ? undefined
            : { transform: `translate3d(${softX * -1}px, ${softY * -1}px, 0)` }
        }
      />
    </div>
  );
});
