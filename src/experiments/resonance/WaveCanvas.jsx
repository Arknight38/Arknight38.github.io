import { useEffect, useImperativeHandle, useRef } from "react";
import { createFieldRenderer } from "./renderer.js";

export default function WaveCanvas({
  ref,
  field,
  gain,
  display,
  preview,
  wallWidth,
  running,
  label,
  ...events
}) {
  const element = useRef(null),
    draw = useRef(null),
    settings = useRef(null);
  useImperativeHandle(ref, () => ({ draw: () => draw.current?.() }), []);
  useEffect(() => {
    settings.current = { gain, display, preview, wallWidth };
    if (!running) draw.current?.();
  });
  useEffect(() => {
    const canvas = element.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const render = createFieldRenderer(field.size);
    let width = 0,
      height = 0;
    draw.current = () => {
      if (!width || !height) return;
      const s = settings.current;
      render(
        ctx,
        width,
        height,
        field,
        s.gain,
        s.display,
        s.preview,
        s.wallWidth,
      );
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(width * dpr),
        ph = Math.round(height * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      draw.current();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      draw.current = null;
    };
  }, [field]);
  return (
    <canvas
      ref={element}
      className="lab-canvas"
      role="img"
      aria-label={label}
      {...events}
    />
  );
}
