export default function HistoryPlot({
  series,
  label,
  log = false,
  xStart = "Oldest",
  xEnd = "Latest",
}) {
  const transform = (v) => (log ? Math.log10(Math.max(1e-12, v)) : v);
  const values = series.flatMap((s) =>
    s.values.filter(Number.isFinite).map(transform),
  );
  const min = Math.min(...values, 0),
    max = Math.max(...values, 1e-12),
    span = max - min || 1;
  return (
    <figure className="lab-history">
      <figcaption>{label}</figcaption>
      <svg viewBox="0 0 640 200" role="img" aria-label={label}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="74"
              x2="625"
              y1={20 + t * 150}
              y2={20 + t * 150}
              stroke="#374139"
            />
            <text x="4" y={25 + t * 150} fill="#b9c5ba" fontSize="12">
              {(max - t * span).toExponential(1)}
            </text>
          </g>
        ))}
        {series.map((s, index) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color || ["#d7ff3f", "#f3a388", "#a6b9ff"][index % 3]}
            strokeWidth="2"
            strokeDasharray={index ? "5 3" : undefined}
            points={s.values
              .map(
                (v, i) =>
                  `${74 + (i / Math.max(1, s.values.length - 1)) * 551},${170 - ((transform(v) - min) / span) * 150}`,
              )
              .join(" ")}
          />
        ))}
        <text x="74" y="194" fill="#b9c5ba" fontSize="12">
          {xStart}
        </text>
        <text x="580" y="194" fill="#b9c5ba" fontSize="12">
          {xEnd}
        </text>
      </svg>
      <div className="lab-legend">
        {series.map((s, i) => (
          <span
            key={s.name}
            style={{
              color: s.color || ["#d7ff3f", "#f3a388", "#a6b9ff"][i % 3],
            }}
          >
            {s.name}
          </span>
        ))}
      </div>
    </figure>
  );
}
