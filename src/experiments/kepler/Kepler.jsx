import { useState } from "react";
import Workspace from "../shared/Workspace.jsx";
import LabCanvas from "../shared/LabCanvas.jsx";
import HistoryPlot from "../shared/HistoryPlot.jsx";
import useLabClock from "../shared/useLabClock.js";
import {
  OrbitSystem,
  METHODS,
  PRESETS,
  preset,
  diagnostics,
  accelerations,
  forecast,
  compare,
} from "./engine.js";
const TABS = [
  ["system", "System", "Bodies and initial conditions"],
  ["orbits", "Orbits", "Motion and forces"],
  ["conservation", "Conservation", "Energy and momentum"],
  ["compare", "Integrators", "Same initial conditions"],
];
const COLORS = [
  "#d7ff3f",
  "#f3a388",
  "#a8baff",
  "#e7a2db",
  "#8edbd0",
  "#e5cf91",
];
const num = (n) =>
  Math.abs(n) < 1e-4 && n !== 0 ? n.toExponential(3) : n.toFixed(5);
function orbitDraw(system, extent, selected, trails, vectors, predictions) {
  return (ctx, w, h) => {
    const pad = 30,
      scale = (Math.min(w, h) - 2 * pad) / (2 * extent),
      px = (x) => w / 2 + x * scale,
      py = (y) => h / 2 - y * scale;
    ctx.fillStyle = "#131a16";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#2f3930";
    ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) {
      ctx.beginPath();
      ctx.moveTo(px((k * extent) / 4), pad);
      ctx.lineTo(px((k * extent) / 4), h - pad);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, py((k * extent) / 4));
      ctx.lineTo(w - pad, py((k * extent) / 4));
      ctx.stroke();
    }
    const path = (points, color, dashed = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1 : 1.5;
      ctx.setLineDash(dashed ? [4, 5] : []);
      points.forEach((p, i) =>
        i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y)),
      );
      ctx.stroke();
      ctx.setLineDash([]);
    };
    system.bodies.forEach((body, index) => {
      if (trails)
        path(system.trails.get(body.id) || [], COLORS[index % COLORS.length]);
      if (predictions?.[index])
        path(predictions[index], COLORS[index % COLORS.length], true);
    });
    const acc = accelerations(system.bodies),
      lengths = acc.map(
        (a, i) =>
          Math.hypot(a.x, a.y) *
          (vectors === "force" ? system.bodies[i].mass : 1),
      ),
      largest = Math.max(...lengths, 1e-10);
    system.bodies.forEach((body, index) => {
      const x = px(body.x),
        y = py(body.y),
        color = COLORS[index % COLORS.length],
        radius = Math.max(4, Math.min(14, 5 + Math.log10(body.mass + 1) * 6));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      if (body.id === selected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.font = "13px system-ui";
      ctx.fillText(`B${body.id + 1}`, x + radius + 8, y - 8);
      if (vectors !== "off") {
        const a = acc[index],
          norm = Math.hypot(a.x, a.y) || 1,
          len = (lengths[index] / largest) * Math.min(w, h) * 0.13,
          dx = (a.x / norm) * len,
          dy = (-a.y / norm) * len;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        const angle = Math.atan2(dy, dx);
        ctx.lineTo(
          x + dx - 7 * Math.cos(angle - 0.4),
          y + dy - 7 * Math.sin(angle - 0.4),
        );
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(
          x + dx - 7 * Math.cos(angle + 0.4),
          y + dy - 7 * Math.sin(angle + 0.4),
        );
        ctx.stroke();
      }
    });
    ctx.fillStyle = "#b8c5b8";
    ctx.font = "12px system-ui";
    ctx.fillText(
      `−${extent.toFixed(1)} … +${extent.toFixed(1)} distance units`,
      15,
      h - 10,
    );
  };
}
export default function Kepler() {
  const [system] = useState(() => new OrbitSystem()),
    [, revision] = useState(0),
    [view, setView] = useState("system"),
    [running, setRunning] = useState(false),
    [kind, setKind] = useState("binary"),
    [selected, setSelected] = useState(0),
    [extent, setExtent] = useState(2.5),
    [trails, setTrails] = useState(true),
    [prediction, setPrediction] = useState(false),
    [vectors, setVectors] = useState("off"),
    [tool, setTool] = useState("select"),
    [error, setError] = useState(""),
    [comparison, setComparison] = useState(null),
    [initial, setInitial] = useState(() => preset());
  const refresh = () => revision((n) => n + 1),
    d = diagnostics(system.bodies),
    body = system.bodies.find((b) => b.id === selected) || system.bodies[0];
  const updateBodies = (bodies) => {
    setRunning(false);
    try {
      system.reset(bodies);
      setInitial(bodies.map((b) => ({ ...b })));
      setComparison(null);
      setError("");
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  const step = () => {
    try {
      system.step(4);
      refresh();
    } catch (e) {
      setRunning(false);
      setError(e.message);
    }
  };
  useLabClock(running, step);
  const future = prediction ? forecast(system) : null;
  const load = (key) => {
    setKind(key);
    setSelected(0);
    updateBodies(preset(key));
    setExtent(key === "planets" ? 2.5 : 2);
  };
  const edit = (field, value) => {
    if (value === "" || !Number.isFinite(Number(value))) return;
    updateBodies(
      system.bodies.map((b) =>
        b.id === body.id ? { ...b, [field]: Number(value) } : b,
      ),
    );
  };
  const add = (x = 1.2, y = 0.5) => {
    if (system.bodies.length >= 12) {
      setError("Use up to twelve bodies.");
      return;
    }
    const id = Math.max(...system.bodies.map((b) => b.id)) + 1;
    updateBodies([...system.bodies, { id, mass: 0.05, x, y, vx: 0, vy: 0 }]);
    setSelected(id);
  };
  const click = (event) => {
    const r = event.currentTarget.getBoundingClientRect(),
      scale = (Math.min(r.width, r.height) - 60) / (2 * extent),
      x = (event.clientX - r.left - r.width / 2) / scale,
      y = -(event.clientY - r.top - r.height / 2) / scale;
    if (tool === "add" && view === "system") add(x, y);
    else {
      let nearest = system.bodies[0];
      for (const b of system.bodies)
        if (
          Math.hypot(b.x - x, b.y - y) <
          Math.hypot(nearest.x - x, nearest.y - y)
        )
          nearest = b;
      setSelected(nearest.id);
    }
  };
  const canvas = (
    <LabCanvas
      label="Orbital plane. Select bodies by clicking or use the body selector and coordinate inputs."
      draw={orbitDraw(system, extent, selected, trails, vectors, future)}
      onPointerDown={click}
    />
  );
  const controls = (
    <div className="lab-toolbar">
      <button className="lab-primary" onClick={() => setRunning((v) => !v)}>
        {running ? "Pause" : "Run"}
      </button>
      <button
        onClick={() => {
          setRunning(false);
          step();
        }}
      >
        Step 4 timesteps
      </button>
      <button onClick={() => updateBodies(initial)}>Reset system</button>
      <button
        onClick={() =>
          setExtent(
            Math.max(
              0.5,
              ...system.bodies.map(
                (b) => Math.max(Math.abs(b.x), Math.abs(b.y)) + 0.4,
              ),
            ),
          )
        }
      >
        Fit bodies
      </button>
    </div>
  );
  return (
    <Workspace
      id="kepler"
      name="KEPLER"
      number="004 / ORBITAL MECHANICS"
      description="Newtonian orbits, numerical integration, and conservation measurements."
      tabs={TABS}
      view={view}
      onView={(v) => {
        setRunning(false);
        setView(v);
      }}
      summary={
        <>
          <span>{system.bodies.length} bodies</span>
          <span>
            Time <b>{system.time.toFixed(3)}</b>
          </span>
          <span>
            Δt <b>{system.dt}</b>
          </span>
          <span>{METHODS[system.method]}</span>
          <span>{running ? "Running" : "Paused"}</span>
        </>
      }
    >
      {error && (
        <p role="alert" className="lab-error">
          {error}
        </p>
      )}
      {(view === "system" || view === "orbits") && (
        <>
          {controls}
          <div className="lab-grid">
            <div>
              {canvas}
              <p className="lab-hint">
                G = 1 · softened point masses · no collision merging. Distance,
                mass, and time use simulation units.
              </p>
            </div>
            <aside className="lab-stack">
              <div className="lab-card">
                <h2>
                  {view === "system"
                    ? "Bodies and initial conditions"
                    : "View and integration"}
                </h2>
                <div className="lab-controls">
                  <label>
                    Preset
                    <select value={kind} onChange={(e) => load(e.target.value)}>
                      {Object.entries(PRESETS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Integrator
                    <select
                      value={system.method}
                      onChange={(e) => {
                        system.configure({ method: e.target.value });
                        updateBodies(system.bodies);
                      }}
                    >
                      {Object.entries(METHODS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Timestep
                    <input
                      type="number"
                      min="0.0005"
                      max="0.02"
                      step="0.0005"
                      value={system.dt}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= 0.0005 && v <= 0.02) {
                          system.configure({ dt: v });
                          updateBodies(system.bodies);
                        }
                      }}
                    />
                  </label>
                  <label>
                    View radius
                    <input
                      type="range"
                      min=".5"
                      max="12"
                      step=".1"
                      value={extent}
                      onChange={(e) => setExtent(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    Vectors
                    <select
                      value={vectors}
                      onChange={(e) => setVectors(e.target.value)}
                    >
                      <option value="off">Off</option>
                      <option value="acceleration">Acceleration</option>
                      <option value="force">Net gravitational force</option>
                    </select>
                  </label>
                  <label className="lab-check">
                    <input
                      type="checkbox"
                      checked={trails}
                      onChange={(e) => setTrails(e.target.checked)}
                    />
                    Orbital trails
                  </label>
                  <label className="lab-check">
                    <input
                      type="checkbox"
                      checked={prediction}
                      onChange={(e) => setPrediction(e.target.checked)}
                    />
                    Predicted paths
                  </label>
                </div>
                <p className="lab-hint">
                  Dashed paths integrate the current state forward for 180
                  steps. Vector lengths share an automatic scale. Changing an
                  integrator or timestep restarts measurements from the current
                  state.
                </p>
              </div>
              {view === "system" && (
                <div className="lab-card">
                  <h3>Edit a body</h3>
                  <div className="lab-controls">
                    <label>
                      Selected body
                      <select
                        value={body.id}
                        onChange={(e) => setSelected(Number(e.target.value))}
                      >
                        {system.bodies.map((b) => (
                          <option key={b.id} value={b.id}>
                            Body {b.id + 1}
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
                        <option value="select">Select nearest body</option>
                        <option value="add">Spawn at click</option>
                      </select>
                    </label>
                    {[
                      ["mass", "Mass"],
                      ["x", "Position x"],
                      ["y", "Position y"],
                      ["vx", "Velocity x"],
                      ["vy", "Velocity y"],
                    ].map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="number"
                          step=".05"
                          min={key === "mass" ? 0.001 : undefined}
                          value={body[key]}
                          onChange={(e) => edit(key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="lab-toolbar" style={{ marginTop: 18 }}>
                    <button onClick={() => add()}>Add body</button>
                    <button
                      disabled={system.bodies.length === 1}
                      onClick={() => {
                        updateBodies(
                          system.bodies.filter((b) => b.id !== body.id),
                        );
                        setSelected(
                          system.bodies.find((b) => b.id !== body.id).id,
                        );
                      }}
                    >
                      Remove body
                    </button>
                  </div>
                  <p className="lab-hint">
                    Edits pause motion and establish a new energy baseline.
                    Added bodies start at rest; set velocity before running.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
      {view === "conservation" && (
        <>
          <h2>Mechanical energy and angular momentum</h2>
          {controls}
          <div className="lab-grid">
            <div className="lab-stack">
              <HistoryPlot
                label="Relative energy change · (E − E₀) / max(|E₀|, 10⁻⁹)"
                series={[
                  {
                    name: METHODS[system.method],
                    values: system.history.map(
                      (h) =>
                        (h.energy - system.initial.energy) /
                        Math.max(Math.abs(system.initial.energy), 1e-9),
                    ),
                  },
                ]}
              />
              <HistoryPlot
                label="Angular momentum change · L − L₀"
                series={[
                  {
                    name: "Angular momentum drift",
                    values: system.history.map(
                      (h) => h.angular - system.initial.angular,
                    ),
                  },
                ]}
              />
            </div>
            <div className="lab-card">
              <dl className="lab-readouts">
                {[
                  ["Kinetic energy", d.kinetic],
                  ["Potential energy", d.potential],
                  ["Total energy", d.energy],
                  ["Angular momentum", d.angular],
                  ["Momentum x", d.px],
                  ["Momentum y", d.py],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{num(value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="lab-hint">
                The potential uses the same softening as the force calculation.
                The latest 500 observations are retained. Numerical drift is
                distinct from an actual exchange of energy between bodies.
              </p>
            </div>
          </div>
        </>
      )}
      {view === "compare" && (
        <>
          <h2>Compare methods from the same state</h2>
          <div className="lab-toolbar">
            <button
              className="lab-primary"
              onClick={() => setComparison(compare(system.bodies, system.dt))}
            >
              Run comparison
            </button>
            <span className="lab-hint">
              1,000 timesteps per method · Δt {system.dt} · the live system is
              unchanged
            </span>
          </div>
          {comparison ? (
            <HistoryPlot
              label="Relative total-energy change over equal simulation time"
              series={comparison}
            />
          ) : (
            <p className="lab-hint">
              Run a comparison to calculate three independent trajectories from
              the current masses, positions, and velocities.
            </p>
          )}
          <p className="lab-hint">
            Forward Euler is included as a baseline. Leapfrog is time-centered
            and symplectic for this position-dependent force; RK4 has higher
            local order but does not share that symplectic structure. Close
            encounters still require smaller timesteps.
          </p>
        </>
      )}
    </Workspace>
  );
}
