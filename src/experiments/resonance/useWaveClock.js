import { useEffect, useRef } from "react";

export default function useWaveClock({
  field,
  running,
  steps,
  canvas,
  onUpdate,
  onError,
}) {
  const callbacks = useRef(null);
  useEffect(() => {
    callbacks.current = { onUpdate, onError };
  }, [onUpdate, onError]);
  useEffect(() => {
    if (!running) return;
    let frame,
      last = null,
      reported = null;
    const loop = (time) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) {
        last = reported = null;
        return;
      }
      if (last === null) {
        last = reported = time;
        return;
      }
      if (time - last < 1000 / 30) return;
      last = time;
      try {
        field.step(steps);
        canvas.current?.draw();
        if (time - reported >= 250) {
          reported = time;
          callbacks.current.onUpdate();
        }
      } catch (error) {
        cancelAnimationFrame(frame);
        callbacks.current.onError(error);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [field, running, steps, canvas]);
}
