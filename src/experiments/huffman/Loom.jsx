import { useEffect, useRef, useState } from "react";
import { forestAt, symbolLabel } from "./codec.js";
export default function Loom({ model, step, selected, onSelect }) {
  const viewport = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [bounds, setBounds] = useState({ width: 900, height: 430 });
  useEffect(() => {
    if (!viewport.current || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const rect = viewport.current.getBoundingClientRect();
      if (rect.width && rect.height)
        setBounds({ width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport.current);
    update();
    return () => observer.disconnect();
  }, []);
  const roots = forestAt(model, step),
    points = [],
    edges = [];
  let leaf = 0,
    maxDepth = 0;
  const place = (id, depth) => {
    const node = model.nodes[id];
    maxDepth = Math.max(maxDepth, depth);
    let y;
    if (node.left < 0) y = 42 + leaf++ * 49;
    else {
      const a = place(node.left, depth + 1),
        b = place(node.right, depth + 1);
      y = (a + b) / 2;
      edges.push(
        { from: id, to: node.left, bit: "0" },
        { from: id, to: node.right, bit: "1" },
      );
    }
    points[id] = { x: 55 + depth * 130, y };
    return y;
  };
  roots.forEach((id) => place(id, 0));
  const highlighted = new Set();
  const trace = (id) => {
    const node = model.nodes[id];
    if (node.left < 0) {
      if (node.symbol === selected) {
        highlighted.add(id);
        return true;
      }
      return false;
    }
    const found = trace(node.left) || trace(node.right);
    if (found) highlighted.add(id);
    return found;
  };
  if (selected !== null) roots.forEach(trace);
  const width = Math.max(380, 230 + maxDepth * 130),
    height = Math.max(310, 55 + leaf * 49);
  const recent = step ? model.merges[step - 1].parent : -1;
  const scale =
    zoom === "fit"
      ? Math.max(
          0.05,
          Math.min(
            (bounds.width - 18) / width,
            (bounds.height - 18) / height,
            1,
          ),
        )
      : zoom;
  if (!model.leafCount)
    return (
      <div className="loom-empty">Add some text to start weaving a code.</div>
    );
  return (
    <div className="huff-tree-viewport">
      <div className="huff-zoom" aria-label="Tree zoom controls">
        <span>Tree viewport</span>
        <button onClick={() => setZoom("fit")} aria-pressed={zoom === "fit"}>
          Fit tree
        </button>
        <button
          onClick={() => setZoom(Math.max(0.15, scale - 0.15))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button onClick={() => setZoom(1)} aria-label="Actual size">
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={() => setZoom(Math.min(2.5, scale + 0.15))}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <div
        ref={viewport}
        className="loom-scroll"
        tabIndex={0}
        aria-label="Scrollable Huffman tree. Use zoom controls or select a leaf to trace it."
      >
        <svg
          width={width * scale}
          height={height * scale}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label={`Huffman forest after ${step} merges. ${roots.length} active roots.`}
        >
          <defs>
            <pattern
              id="loom-grid"
              width="26"
              height="26"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".7" fill="#4b563f" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#loom-grid)" />
          {edges.map(({ from, to, bit }) => {
            const a = points[from],
              b = points[to],
              lit = highlighted.has(from) && highlighted.has(to);
            return (
              <g
                key={to}
                className={lit ? "loom-thread traced" : "loom-thread"}
              >
                <path
                  d={`M${a.x} ${a.y}C${a.x + 65} ${a.y},${b.x - 65} ${b.y},${b.x} ${b.y}`}
                />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>
                  {bit}
                </text>
              </g>
            );
          })}
          {points.map((point, id) => {
            if (!point) return null;
            const node = model.nodes[id],
              isLeaf = node.left < 0;
            return (
              <g
                key={id}
                transform={`translate(${point.x} ${point.y})`}
                className={`loom-node ${highlighted.has(id) ? "traced" : ""} ${id === recent ? "recent" : ""}`}
                role={isLeaf ? "button" : undefined}
                tabIndex={isLeaf ? 0 : undefined}
                aria-label={
                  isLeaf ? `Trace byte ${symbolLabel(node.symbol)}` : undefined
                }
                aria-pressed={isLeaf ? selected === node.symbol : undefined}
                onClick={
                  isLeaf
                    ? () =>
                        onSelect(selected === node.symbol ? null : node.symbol)
                    : undefined
                }
                onKeyDown={
                  isLeaf
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(
                            selected === node.symbol ? null : node.symbol,
                          );
                        }
                      }
                    : undefined
                }
              >
                {isLeaf && (
                  <rect
                    x="-18"
                    y="-24"
                    width="110"
                    height="48"
                    fill="transparent"
                  />
                )}
                <circle r={isLeaf ? 8 : 13} />
                {!isLeaf && (
                  <text className="node-weight" y="-20" textAnchor="middle">
                    {node.weight}
                  </text>
                )}
                {isLeaf && (
                  <>
                    <text x="18" y="-3" className="node-symbol">
                      {symbolLabel(node.symbol)}
                    </text>
                    <text x="18" y="16" className="node-count">
                      {node.weight}×
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
