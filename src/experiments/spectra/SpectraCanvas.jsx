import { useEffect, useRef } from "react";
export default function SpectraCanvas({
  kind,
  title,
  number,
  caption,
  registerSurface,
  className = "",
}) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    const surface = { canvas, ctx, width: 0, height: 0, dpr: 1 };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      surface.width = bounds.width;
      surface.height = bounds.height;
      surface.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * surface.dpr);
      canvas.height = Math.round(bounds.height * surface.dpr);
    };
    const unregister = registerSurface(kind, surface);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      unregister();
    };
  }, [kind, registerSurface]);
  return (
    <section className={`spectra-panel ${className}`}>
      <header>
        <h2>
          <span>{number}</span>
          {title}
        </h2>
      </header>
      <canvas ref={ref} aria-label={title} role="img" />
      <p className="plot-caption">{caption}</p>
    </section>
  );
}
