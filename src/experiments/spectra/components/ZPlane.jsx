import { useRef } from "react";
import { clamp } from "../dsp/biquad.js";
const CX = 170,
  CY = 145,
  RADIUS = 100;
export default function ZPlane({ settings, onChange }) {
  const svgRef = useRef(null),
    drag = useRef(null);
  const point = (radius, angle, sign) => ({
    x: CX + Math.cos(angle) * radius * RADIUS,
    y: CY - sign * Math.sin(angle) * radius * RADIUS,
  });
  const start = (event, type) => {
    if (event.button !== 0) return;
    drag.current = type;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const move = (event) => {
    if (!drag.current) return;
    const point = svgRef.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) return;
    const local = point.matrixTransform(matrix.inverse());
    const dx = (local.x - CX) / RADIUS;
    const dy = (CY - local.y) / RADIUS;
    const angle = Math.atan2(Math.abs(dy), dx),
      radius = Math.hypot(dx, dy);
    onChange(
      drag.current === "pole"
        ? { poleR: clamp(radius, 0.05, 0.98), poleA: angle }
        : { zeroR: clamp(radius, 0.05, 1.15), zeroA: angle },
    );
  };
  const end = () => {
    drag.current = null;
  };
  return (
    <section className="spectra-panel z-panel">
      <header>
        <h2>
          <span>04</span>Pole / zero plane
        </h2>
        <span className="stable-badge">STABLE</span>
      </header>
      <svg
        ref={svgRef}
        viewBox="0 0 340 300"
        aria-label="Z-plane. Drag either pole or zero; equivalent keyboard-accessible controls are in Parameters."
        role="img"
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <g fill="none" stroke="var(--line)">
          <circle cx={CX} cy={CY} r={RADIUS} />
          <circle cx={CX} cy={CY} r={RADIUS / 2} strokeDasharray="3 5" />
          <path d="M35 145H305M170 20V270" />
        </g>
        <g fill="var(--muted)" fontSize="13" fontFamily="system-ui">
          <text x="280" y="165">
            Re
          </text>
          <text x="181" y="30">
            Im
          </text>
          <text x="276" y="135">
            1
          </text>
          <text x="53" y="135">
            −1
          </text>
        </g>
        {["pole", "zero"].flatMap((type) =>
          [1, -1].map((sign) => {
            const { x, y } = point(
              settings[type === "pole" ? "poleR" : "zeroR"],
              settings[type === "pole" ? "poleA" : "zeroA"],
              sign,
            );
            return (
              <g
                key={`${type}${sign}`}
                className={`z-handle z-${type}`}
                data-kind={type}
                onPointerDown={(e) => start(e, type)}
              >
                <line
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity=".3"
                />
                <circle cx={x} cy={y} r="19" fill="transparent" />
                {type === "pole" ? (
                  <path
                    d={`M${x - 6} ${y - 6}l12 12m-12 0 12-12`}
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                )}
              </g>
            );
          }),
        )}
      </svg>
      <p className="plot-caption">
        <span className="pole-key">× Pole</span>{" "}
        <span className="zero-key">○ Zero</span> · Drag a pair. Poles stay
        inside the unit circle.
      </p>
    </section>
  );
}
