import { useEffect, useRef } from "react";
export default function useLabClock(running, tick, fps = 30) {
  const callback = useRef(tick);
  useEffect(() => {
    callback.current = tick;
  }, [tick]);
  useEffect(() => {
    if (!running) return;
    let frame,
      last = 0;
    const loop = (time) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) {
        last = 0;
        return;
      }
      if (!last) {
        last = time;
        return;
      }
      if (time - last < 1000 / fps) return;
      const seconds = Math.min(0.1, (time - last) / 1000);
      last = time;
      callback.current(seconds);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, fps]);
}
