import { useEffect, useRef } from "react";
import { probabilityColor } from "./rendering.js";
const ZERO = "#f3a388",
  ONE = "#d7ff3f";
export function CanvasPlot({ draw, label, className = "", ...events }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    const render = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, width, height);
    };
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    render();
    return () => observer.disconnect();
  }, [draw]);
  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label={label}
      {...events}
    />
  );
}
export function NetworkDiagram({ network, pass, selected, onSelect }) {
  const shapes = network.shape,
    cols = shapes.length,
    max = Math.max(...shapes),
    height = Math.max(150, max * 36 + 30);
  const x = (l) => 35 + (l / (cols - 1)) * 530,
    y = (l, n) => height / 2 + (n - (shapes[l] - 1) / 2) * 34;
  return (
    <svg
      viewBox={`0 0 600 ${height}`}
      role="group"
      aria-label="Network weights and probe activations"
      className="neural-network-diagram"
    >
      {network.layers.flatMap((layer, l) =>
        Array.from({ length: layer.size }, (_, j) =>
          Array.from({ length: layer.inputs }, (_, k) => {
            const weight = layer.w[j * layer.inputs + k];
            return (
              <line
                key={`${l}-${j}-${k}`}
                x1={x(l)}
                y1={y(l, k)}
                x2={x(l + 1)}
                y2={y(l + 1, j)}
                stroke={weight >= 0 ? ONE : ZERO}
                strokeWidth={0.4 + Math.min(Math.abs(weight), 3) * 0.6}
                opacity={0.15 + Math.min(Math.abs(weight), 2) * 0.2}
              />
            );
          }),
        ),
      )}
      {shapes.flatMap((size, l) =>
        Array.from({ length: size }, (_, n) => {
          const a = pass.activations[l][n],
            chosen = selected.layer === l - 1 && selected.neuron === n;
          return (
            <g
              key={`${l}-${n}`}
              role={l ? "button" : undefined}
              tabIndex={l ? 0 : undefined}
              aria-label={
                l
                  ? `${l === cols - 1 ? "Output" : `Hidden layer ${l}`} neuron ${n + 1}, activation ${a.toFixed(3)}`
                  : `Input ${n + 1}`
              }
              onClick={() => l && onSelect({ layer: l - 1, neuron: n })}
              onKeyDown={(e) => {
                if (l && ["Enter", " "].includes(e.key)) {
                  e.preventDefault();
                  onSelect({ layer: l - 1, neuron: n });
                }
              }}
            >
              <circle
                cx={x(l)}
                cy={y(l, n)}
                r={11}
                fill={probabilityColor(
                  l === 0
                    ? (a + 1) / 2
                    : network.activation === "tanh" && l < cols - 1
                      ? (a + 1) / 2
                      : a /
                        (network.activation === "relu" && l < cols - 1
                          ? 1 + a
                          : 1),
                )}
                stroke={chosen ? "#fff" : "#839273"}
                strokeWidth={chosen ? 2.5 : 1}
              />
              <text
                x={x(l)}
                y={height - 3}
                textAnchor="middle"
                fill="#b8c5af"
                fontSize="11"
              >
                {n === 0
                  ? l === 0
                    ? "INPUT"
                    : l === cols - 1
                      ? "OUTPUT"
                      : `HIDDEN ${l}`
                  : ""}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
