import { useRef, useState } from "react";
import Workspace from "../shared/Workspace.jsx";
import LabCanvas from "../shared/LabCanvas.jsx";
import HistoryPlot from "../shared/HistoryPlot.jsx";
import useLabClock from "../shared/useLabClock.js";
import { WaveField, PRESETS, probeSpectrum } from "./engine.js";
const TABS = [
  ["medium", "Medium", "Waves and obstacles"],
  ["sources", "Emitters", "Position, frequency, phase"],
  ["measure", "Measurements", "Probe and frequency analysis"],
];
function fieldDraw(field, gain, display, preview, wallWidth) {
  return (ctx, w, h) => {
    const n = field.size,
      cw = w / n,
      ch = h / n;
    ctx.fillStyle = "#101813";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = y * n + x,
          u = field.u[i],
          v = Math.max(-1, Math.min(1, u * gain));
        ctx.fillStyle = field.walls[i]
          ? "#d0d8cf"
          : display === "square"
            ? `rgb(${Math.round(20 + 190 * Math.min(1, u * u * gain))} ${Math.round(29 + 200 * Math.min(1, u * u * gain))} 45)`
            : `rgb(${Math.round(22 + (v < 0 ? -v * 184 : v * 40))} ${Math.round(32 + (v > 0 ? v * 189 : -v * 40))} ${Math.round(24 + (v < 0 ? -v * 101 : v * 6))})`;
        ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5);
      }
    if (preview) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, wallWidth * cw);
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo((preview.start.x + 0.5) * cw, (preview.start.y + 0.5) * ch);
      ctx.lineTo((preview.end.x + 0.5) * cw, (preview.end.y + 0.5) * ch);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.font = "13px system-ui";
    ctx.lineWidth = 1.5;
    field.sources.forEach((s) => {
      const x = (s.x + 0.5) * cw,
        y = (s.y + 0.5) * ch;
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillText(`S${s.id + 1}`, x + 9, y - 7);
    });
    const p = field.probe;
    ctx.strokeStyle = "#a9bdff";
    ctx.beginPath();
    ctx.moveTo((p.x + 0.5) * cw - 8, (p.y + 0.5) * ch);
    ctx.lineTo((p.x + 0.5) * cw + 8, (p.y + 0.5) * ch);
    ctx.moveTo((p.x + 0.5) * cw, (p.y + 0.5) * ch - 8);
    ctx.lineTo((p.x + 0.5) * cw, (p.y + 0.5) * ch + 8);
    ctx.stroke();
  };
}
export default function Resonance() {
  const [field] = useState(() => new WaveField()),
    [, revision] = useState(0),
    [view, setView] = useState("medium"),
    [kind, setKind] = useState("interference"),
    [running, setRunning] = useState(false),
    [tool, setTool] = useState("probe"),
    [wallWidth, setWallWidth] = useState(3),
    [wallLength, setWallLength] = useState(24),
    [wallDirection, setWallDirection] = useState("horizontal"),
    [preview, setPreview] = useState(null),
    [gain, setGain] = useState(2),
    [display, setDisplay] = useState("displacement"),
    [selected, setSelected] = useState(0),
    [steps, setSteps] = useState(8),
    [error, setError] = useState("");
  const drag = useRef(null),
    refresh = () => revision((v) => v + 1),
    metrics = field.measure(),
    source = field.sources.find((s) => s.id === selected) || field.sources[0];
  const safely = (fn) => {
    try {
      fn();
      setError("");
      refresh();
    } catch (e) {
      setError(e.message);
      setRunning(false);
    }
  };
  const advance = () => safely(() => field.step(steps));
  useLabClock(running, advance);
  const load = (key) => {
    setRunning(false);
    field.reset(key);
    setKind(key);
    setSelected(0);
    setError("");
    refresh();
  };
  const coordinates = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        1,
        Math.min(
          field.size - 2,
          Math.floor(((e.clientX - r.left) / r.width) * field.size),
        ),
      ),
      y: Math.max(
        1,
        Math.min(
          field.size - 2,
          Math.floor(((e.clientY - r.top) / r.height) * field.size),
        ),
      ),
    };
  };
  const down = (e) => {
    const p = coordinates(e);
    if (tool === "probe") {
      field.setProbe(p.x, p.y);
      refresh();
    } else if (tool === "source")
      safely(() => setSelected(field.addSource(p.x, p.y)));
    else if (tool === "pulse") safely(() => field.pulse(p.x, p.y));
    else {
      setRunning(false);
      drag.current = { start: p, end: p };
      e.currentTarget.setPointerCapture(e.pointerId);
      setPreview({ start: p, end: p });
      refresh();
    }
  };
  const segmentEnd = (start) => ({
    x: start.x + (wallDirection === "horizontal" ? wallLength - 1 : 0),
    y: start.y + (wallDirection === "vertical" ? wallLength - 1 : 0),
  });
  const move = (e) => {
    if (!drag.current) return;
    const p = coordinates(e);
    drag.current.end = p;
    setPreview({ start: drag.current.start, end: p });
  };
  const finish = (e) => {
    if (!drag.current) return;
    const start = drag.current.start;
    const p = coordinates(e);
    const end = p.x === start.x && p.y === start.y ? segmentEnd(start) : p;
    field.paint(start.x, start.y, end.x, end.y, tool === "wall", wallWidth);
    drag.current = null;
    setPreview(null);
    refresh();
  };
  const controls = (
    <div className="lab-toolbar">
      <button className="lab-primary" onClick={() => setRunning((v) => !v)}>
        {running ? "Pause" : "Run"}
      </button>
      <button
        onClick={() => {
          setRunning(false);
          advance();
        }}
      >
        Step field
      </button>
      <button
        onClick={() => {
          setRunning(false);
          field.clearWaves();
          refresh();
        }}
      >
        Clear waves
      </button>
      <button onClick={() => load(kind)}>Reset preset</button>
    </div>
  );
  const spectrum =
      view === "measure" ? probeSpectrum(field.history, field.dt) : [],
    peak = spectrum.length
      ? spectrum.reduce((a, b) => (a.amplitude > b.amplitude ? a : b))
      : null;
  const probeControls = (
    <div className="lab-controls">
      {["x", "y"].map((key) => (
        <label key={key}>
          Probe {key} (cell)
          <input
            type="number"
            min="1"
            max={field.size - 2}
            value={field.probe[key]}
            onChange={(e) => {
              const v = Math.round(Number(e.target.value));
              if (v >= 1 && v < field.size - 1) {
                field.setProbe(
                  key === "x" ? v : field.probe.x,
                  key === "y" ? v : field.probe.y,
                );
                refresh();
              }
            }}
          />
        </label>
      ))}
    </div>
  );
  return (
    <Workspace
      id="resonance"
      name="RESONANCE"
      number="006 / WAVE PHYSICS"
      description="A two-dimensional wave field with driven sources, obstacles, and probe measurements."
      tabs={TABS}
      view={view}
      onView={(v) => {
        setRunning(false);
        setView(v);
      }}
      summary={
        <>
          <span>
            {field.size} × {field.size} cells
          </span>
          <span>
            Time <b>{field.time.toFixed(3)}</b>
          </span>
          <span>
            Δt <b>{field.dt.toFixed(5)}</b>
          </span>
          <span>
            Courant <b>{field.courant}</b>
          </span>
          <span>{field.sources.length} emitters</span>
          <span>
            {field.walls.reduce((sum, cell) => sum + cell, 0)} wall cells
          </span>
          <span>{running ? "Running" : "Paused"}</span>
        </>
      }
    >
      {error && (
        <p role="alert" className="lab-error">
          {error}
        </p>
      )}
      {controls}
      {(view === "medium" || view === "sources") && (
        <div className="lab-grid">
          <div>
            <LabCanvas
              label="Wave field. Click to probe, create emitters or pulses; drag to draw or erase walls. Coordinate controls provide keyboard alternatives."
              draw={fieldDraw(field, gain, display, preview, wallWidth)}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={() => {
                drag.current = null;
                setPreview(null);
              }}
            />
            <p className="lab-hint">
              Positive displacement is lime, negative is coral. White cells are
              fixed walls. White circles mark driven emitters; the blue cross is
              the measurement probe.
            </p>
          </div>
          <aside className="lab-stack">
            <div className="lab-card">
              <h2>
                {view === "medium" ? "Medium and display" : "Driven emitters"}
              </h2>
              <div className="lab-controls">
                <label>
                  Preset
                  <select value={kind} onChange={(e) => load(e.target.value)}>
                    {Object.entries(PRESETS).map(([k, name]) => (
                      <option key={k} value={k}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Canvas tool
                  <select
                    value={tool}
                    onChange={(e) => setTool(e.target.value)}
                  >
                    <option value="probe">Measure at point</option>
                    <option value="source">Add emitter</option>
                    <option value="pulse">Add pulse</option>
                    <option value="wall">Draw wall</option>
                    <option value="erase">Erase wall</option>
                  </select>
                </label>
                <label>
                  Boundary
                  <select
                    value={field.boundary}
                    onChange={(e) => {
                      setRunning(false);
                      field.configure({ boundary: e.target.value });
                      refresh();
                    }}
                  >
                    <option value="sponge">Damped edge / sponge</option>
                    <option value="reflect">Fixed reflective edge</option>
                  </select>
                </label>
                <label>
                  Display
                  <select
                    value={display}
                    onChange={(e) => setDisplay(e.target.value)}
                  >
                    <option value="displacement">Signed displacement</option>
                    <option value="square">Displacement squared</option>
                  </select>
                </label>
                <label>
                  Color gain
                  <input
                    type="range"
                    min=".5"
                    max="8"
                    step=".25"
                    value={gain}
                    onChange={(e) => setGain(Number(e.target.value))}
                  />
                </label>
                <label>
                  Steps per frame
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                  />
                  <output>{steps}</output>
                </label>
                {view === "medium" && (
                  <>
                    <label>
                      Wave speed
                      <input
                        type="number"
                        min=".25"
                        max="3"
                        step=".25"
                        value={field.c}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 0.25 && v <= 3) {
                            setRunning(false);
                            field.configure({ c: v });
                            refresh();
                          }
                        }}
                      />
                    </label>
                    <label>
                      Damping
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step=".02"
                        value={field.damping}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 0 && v <= 2) {
                            setRunning(false);
                            field.configure({ damping: v });
                            refresh();
                          }
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
              <p className="lab-hint">
                Changing medium parameters clears wave history. The sponge
                reduces edge reflections; it is not an exact open boundary. Hard
                walls and fixed edges hold displacement at zero.
              </p>
            </div>
            {view === "sources" && (
              <div className="lab-card">
                {source ? (
                  <>
                    <label>
                      Selected emitter
                      <select
                        value={source.id}
                        onChange={(e) => setSelected(Number(e.target.value))}
                      >
                        {field.sources.map((s) => (
                          <option key={s.id} value={s.id}>
                            Emitter {s.id + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="lab-controls" style={{ marginTop: 16 }}>
                      {[
                        ["x", "Cell x", 1, field.size - 2, 1],
                        ["y", "Cell y", 1, field.size - 2, 1],
                        ["frequency", "Frequency", 0.1, 12, 0.1],
                        ["amplitude", "Amplitude", 0.05, 1.5, 0.05],
                        ["phase", "Phase (radians)", -Math.PI, Math.PI, 0.1],
                      ].map(([key, label, min, max, step]) => (
                        <label key={key}>
                          {label}
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={source[key]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (v >= min && v <= max) {
                                setRunning(false);
                                safely(() =>
                                  field.updateSource(source.id, {
                                    [key]:
                                      key === "x" || key === "y"
                                        ? Math.round(v)
                                        : v,
                                  }),
                                );
                              }
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <button
                      style={{ marginTop: 18 }}
                      onClick={() => {
                        setRunning(false);
                        field.removeSource(source.id);
                        refresh();
                      }}
                    >
                      Remove emitter
                    </button>
                  </>
                ) : (
                  <p className="lab-hint">
                    No driven emitters. Add one at the probe or click with the
                    Add emitter tool.
                  </p>
                )}
                <div className="lab-toolbar" style={{ marginTop: 18 }}>
                  <button
                    onClick={() => {
                      setRunning(false);
                      safely(() =>
                        setSelected(
                          field.addSource(field.probe.x, field.probe.y),
                        ),
                      );
                    }}
                  >
                    Add emitter at probe
                  </button>
                </div>
                <p className="lab-hint">
                  Emitters prescribe sinusoidal displacement at a cell. Phase
                  differences produce interference without a precomputed visual
                  pattern.
                </p>
              </div>
            )}
            <div className="lab-card">
              <h3>Probe and obstacles</h3>
              <p className="lab-hint">
                Choose Draw wall, then drag a segment on the field. A click
                places the length below, starting at that point.
              </p>
              <div className="lab-controls">
                <label>
                  Wall length (cells)
                  <input
                    type="range"
                    min="4"
                    max="64"
                    value={wallLength}
                    onChange={(e) => setWallLength(Number(e.target.value))}
                  />
                  <output>{wallLength}</output>
                </label>
                <label>
                  Wall thickness
                  <select
                    value={wallWidth}
                    onChange={(e) => setWallWidth(Number(e.target.value))}
                  >
                    <option value="1">1 cell</option>
                    <option value="3">3 cells</option>
                    <option value="5">5 cells</option>
                  </select>
                </label>
                <label>
                  Wall direction
                  <select
                    value={wallDirection}
                    onChange={(e) => setWallDirection(e.target.value)}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </label>
              </div>
              {probeControls}
              <div className="lab-toolbar" style={{ marginTop: 18 }}>
                <button
                  onClick={() => {
                    setRunning(false);
                    const end = segmentEnd(field.probe);
                    field.paint(
                      field.probe.x,
                      field.probe.y,
                      end.x,
                      end.y,
                      true,
                      wallWidth,
                    );
                    refresh();
                  }}
                >
                  Place wall at probe
                </button>
                <button
                  onClick={() => {
                    setRunning(false);
                    const end = segmentEnd(field.probe);
                    field.paint(
                      field.probe.x,
                      field.probe.y,
                      end.x,
                      end.y,
                      false,
                      wallWidth,
                    );
                    refresh();
                  }}
                >
                  Erase segment at probe
                </button>
                <button
                  onClick={() =>
                    safely(() => field.pulse(field.probe.x, field.probe.y))
                  }
                >
                  Pulse at probe
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
      {view === "measure" && (
        <>
          <h2>Measurement at the probe</h2>
          <div className="lab-grid">
            <div className="lab-stack">
              <HistoryPlot
                label="Displacement over the latest 512 timesteps"
                series={[{ name: "Probe displacement", values: field.history }]}
              />
              {spectrum.length ? (
                <HistoryPlot
                  xStart="0"
                  xEnd={(1 / (2 * field.dt)).toFixed(1)}
                  label={`Hann-windowed DFT · 0–${(1 / (2 * field.dt)).toFixed(1)} cycles / time unit`}
                  series={[
                    {
                      name: "One-sided amplitude",
                      values: spectrum.map((bin) => bin.amplitude),
                    },
                  ]}
                />
              ) : (
                <p className="lab-hint">
                  Collect 256 timesteps at this probe for frequency analysis.
                  Moving the probe restarts its history.
                </p>
              )}
            </div>
            <div className="lab-card">
              <h3>Current measurements</h3>
              {probeControls}
              <dl className="lab-readouts" style={{ marginTop: 22 }}>
                <div>
                  <dt>Samples</dt>
                  <dd>{field.history.length} / 512</dd>
                </div>
                <div>
                  <dt>Peak frequency bin</dt>
                  <dd>{peak ? peak.frequency.toFixed(3) : "—"}</dd>
                </div>
                <div>
                  <dt>Field energy estimate</dt>
                  <dd>{metrics.energy.toExponential(3)}</dd>
                </div>
                <div>
                  <dt>Maximum |displacement|</dt>
                  <dd>{metrics.max.toFixed(4)}</dd>
                </div>
                <div>
                  <dt>Frequency resolution</dt>
                  <dd>{(1 / (256 * field.dt)).toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Sample interval</dt>
                  <dd>{field.dt.toFixed(5)}</dd>
                </div>
              </dl>
              <p className="lab-hint">
                The DFT uses the last 256 samples after mean removal and a Hann
                window. Frequency bins use the simulation timestep. Driving
                injects energy; damping and sponge boundaries remove it. This
                diagnostic is an estimate, not a conserved discrete invariant.
              </p>
            </div>
          </div>
        </>
      )}
    </Workspace>
  );
}
