import LabNavigation from "../shared/LabNavigation.jsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { Network, binaryLoss } from "./engine/network.js";
import { SPIRAL_PRESET } from "./engine/presets.js";
import { DATASETS, makeDataset } from "./engine/datasets.js";
import { CanvasPlot, NetworkDiagram } from "./Plots.jsx";
import { decisionDraw, activationDraw, lossDraw } from "./rendering.js";
import "./neural.css";
const DEFAULT = { depth: 1, width: 4, activation: "tanh", seed: 42 };
const create = (c) =>
  new Network({
    hidden: Array(c.depth).fill(c.width),
    activation: c.activation,
    seed: c.seed,
  });
const fmt = (n) =>
  Number.isFinite(n)
    ? Math.abs(n) < 0.0001 && n !== 0
      ? n.toExponential(2)
      : n.toFixed(4)
    : "—";
function record(network, points) {
  return {
    step: network.epochs + network.sampleUpdates,
    train: network.evaluate(points.filter((p) => !p.test))?.loss ?? 0,
    test: network.evaluate(points.filter((p) => p.test))?.loss ?? null,
  };
}
export default function NeuralLab() {
  const [config, setConfig] = useState(DEFAULT),
    [dataset, setDataset] = useState("xor");
  const [network, setNetwork] = useState(() => create(DEFAULT)),
    [points, setPoints] = useState(() => makeDataset());
  const [running, setRunning] = useState(false),
    [rate, setRate] = useState(0.08),
    [speed, setSpeed] = useState(240);
  const [optimizer, setOptimizer] = useState("sgd");
  const [revision, setRevision] = useState(0),
    [history, setHistory] = useState(() => [record(network, points)]);
  const [probe, setProbe] = useState({ x: 0.65, y: 0.65 }),
    [selected, setSelected] = useState({ layer: 0, neuron: 0 });
  const [selectedPoint, setSelectedPoint] = useState(3),
    [tool, setTool] = useState("probe"),
    [showTest, setShowTest] = useState(true);
  const [sampleId, setSampleId] = useState(0),
    [trace, setTrace] = useState(null),
    [notice, setNotice] = useState(
      "Ready. Train the four XOR corners, then compare with a linear model.",
    );
  const drag = useRef(null);
  const train = points.filter((p) => !p.test),
    test = points.filter((p) => p.test);
  const trainingMetrics = network.evaluate(train),
    testMetrics = network.evaluate(test),
    pass = network.forward([probe.x, probe.y]);
  const layer = network.layers[selected.layer],
    a = pass.activations[selected.layer + 1][selected.neuron],
    z = pass.preactivations[selected.layer][selected.neuron];
  const refresh = () => {
    setRevision((v) => v + 1);
    setHistory((h) => [...h, record(network, points)].slice(-400));
  };
  const reset = (
    nextConfig = config,
    nextKind = dataset,
    nextPoints = null,
  ) => {
    setRunning(false);
    setTrace(null);
    const net = create(nextConfig),
      data = nextPoints || makeDataset(nextKind, nextConfig.seed);
    setConfig(nextConfig);
    setDataset(nextKind);
    setNetwork(net);
    setPoints(data);
    setHistory([record(net, data)]);
    setRevision((v) => v + 1);
    setSelected({ layer: 0, neuron: 0 });
    setSampleId(data.find((p) => !p.test).id);
    setSelectedPoint(null);
    setProbe({ x: 0.65, y: 0.65 });
    setNotice(
      nextConfig.depth === 0
        ? "Linear model: one affine separator, no hidden layer."
        : "Fresh seeded weights. Training is paused.",
    );
  };
  const loadSpiral = () => {
    reset(SPIRAL_PRESET.config, "spiral");
    setOptimizer(SPIRAL_PRESET.optimizer);
    setRate(SPIRAL_PRESET.rate);
    setNotice(
      "Spiral preset loaded: two 8-neuron tanh layers, Adam, learning rate 0.01, seed 42. Press Train; the boundary usually takes shape within 1,000 epochs.",
    );
  };
  useEffect(() => {
    if (!running) return;
    let frame,
      last = 0,
      credit = 0,
      lastPaint = 0;
    const run = (time) => {
      frame = requestAnimationFrame(run);
      if (document.hidden) {
        last = 0;
        credit = 0;
        return;
      }
      const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
      last = time;
      credit += dt * speed;
      const count = Math.min(40, Math.floor(credit));
      credit -= count;
      try {
        if (count)
          network.train(
            points.filter((p) => !p.test),
            rate,
            count,
            optimizer,
          );
      } catch (error) {
        setRunning(false);
        setNotice(error.message);
        return;
      }
      if (time - lastPaint > 100) {
        setRevision((v) => v + 1);
        setHistory((h) => [...h, record(network, points)].slice(-400));
        lastPaint = time;
      }
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [running, network, points, rate, speed, optimizer]);
  const edit = (data) => {
    if (!data.some((p) => !p.test)) {
      setNotice("Keep at least one training sample.");
      return;
    }
    setRunning(false);
    setTrace(null);
    setPoints(data);
    setHistory([record(network, data)]);
    setRevision((v) => v + 1);
    setNotice(
      "Data edited. Weights retained; loss history restarted. Train to continue.",
    );
  };
  const add = (label) => {
    if (points.length >= 160) {
      setNotice("The interactive canvas is limited to 160 points.");
      return;
    }
    const id = Math.max(-1, ...points.map((p) => p.id)) + 1;
    edit([...points, { id, ...probe, label, test: false }]);
    setSelectedPoint(id);
    setSampleId(id);
  };
  const location = (e) => {
    const r = e.currentTarget.getBoundingClientRect(),
      w = r.width - 68,
      h = r.height - 68;
    return {
      x: Math.max(-1, Math.min(1, ((e.clientX - r.left - 34) / w) * 2 - 1)),
      y: Math.max(-1, Math.min(1, 1 - ((e.clientY - r.top - 34) / h) * 2)),
    };
  };
  const pointerDown = (e) => {
    const p = location(e);
    setProbe(p);
    const nearest = points
      .filter((p) => showTest || !p.test)
      .reduce(
        (best, q) => {
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          return d < best.d ? { d, point: q } : best;
        },
        { d: 0.09, point: null },
      ).point;
    if (tool.startsWith("add")) {
      if (points.length >= 160) {
        setNotice("The canvas is limited to 160 points.");
        return;
      }
      const id = Math.max(-1, ...points.map((q) => q.id)) + 1;
      edit([
        ...points,
        { ...p, id, label: tool === "add1" ? 1 : 0, test: false },
      ]);
      setSelectedPoint(id);
      return;
    }
    if (nearest) {
      setSelectedPoint(nearest.id);
      setProbe({ x: nearest.x, y: nearest.y });
      if (!nearest.test) setSampleId(nearest.id);
      if (tool === "erase") {
        edit(points.filter((q) => q.id !== nearest.id));
        setSelectedPoint(null);
      }
      if (tool === "move") {
        setRunning(false);
        drag.current = nearest.id;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } else setSelectedPoint(null);
  };
  const pointerMove = (e) => {
    if (drag.current == null) return;
    const p = location(e);
    setProbe(p);
    edit(points.map((q) => (q.id === drag.current ? { ...q, ...p } : q)));
  };
  const endDrag = () => {
    drag.current = null;
  };
  const toggleTrain = () => {
    setTrace(null);
    setRunning((v) => !v);
  };
  const oneEpoch = () => {
    setRunning(false);
    setTrace(null);
    network.train(train, rate, 1, optimizer);
    refresh();
  };
  const startTrace = () => {
    setRunning(false);
    const point = train.find((p) => p.id === Number(sampleId)) || train[0];
    setProbe({ x: point.x, y: point.y });
    setSelectedPoint(point.id);
    setTrace({
      stage: 0,
      point,
      pass: network.forward([point.x, point.y]),
      gradient: network.gradients([point]),
      rate,
      weights: network.layers.map((l) => ({
        w: Array.from(l.w),
        b: Array.from(l.b),
      })),
    });
  };
  const nextTrace = () => {
    if (!trace || trace.stage === 3) {
      startTrace();
      return;
    }
    if (trace.stage === 2) {
      network.applySample(trace.gradient.grads, trace.rate);
      refresh();
      setNotice(
        "One sample gradient-descent update applied. Optimizer memory cleared; epoch training uses the selected optimizer on all training points.",
      );
    }
    setTrace({ ...trace, stage: trace.stage + 1 });
  };
  const inspectedPoint = points.find((p) => p.id === selectedPoint);
  const weights = Array.from(
    layer.w.slice(
      selected.neuron * layer.inputs,
      (selected.neuron + 1) * layer.inputs,
    ),
  );
  return (
    <div className="neural-lab" data-revision={revision} id="neural-experiment">
      <header className="neural-heading">
        <div>
          <Link className="neural-back" to="/lab">
            <ArrowLeft size={15} /> Lab notebook
          </Link>
          <div className="eyebrow">EXPERIMENT 003 / LEARNING SYSTEMS</div>
          <h1>
            Neural<span>Lab</span>
            <i>∇</i>
          </h1>
          <p>A small network. Every weight, visible.</p>
        </div>
        <div className="neural-transport">
          <span className={running ? "neural-live" : ""}>
            {running ? "● TRAINING" : "Ⅱ PAUSED"}
          </span>
          <button className="neural-primary" onClick={toggleTrain}>
            {running ? <Pause size={17} /> : <Play size={17} />}{" "}
            {running ? "Pause" : "Train"}
          </button>
          <button onClick={oneEpoch}>
            <StepForward size={17} /> Step epoch
          </button>
          <button onClick={() => reset(config, dataset, points)}>
            <RotateCcw size={16} /> Reset weights
          </button>
        </div>
      </header>
      <LabNavigation lab="neural" />
      <div className="neural-intro">
        <span>01 / START WITH A QUESTION</span>
        <p>
          {dataset === "spiral"
            ? "Can a network follow a winding boundary? Compare plain gradient descent with Adam, then inspect the hidden features that bend the plane."
            : "Can a network separate opposite corners? Train XOR, then remove the hidden layer. Watch what a straight line cannot learn."}
        </p>
      </div>
      <div className="neural-config" aria-label="Network configuration">
        <label>
          Experiment
          <select
            value={dataset}
            onChange={(e) =>
              e.target.value === "spiral"
                ? loadSpiral()
                : reset(config, e.target.value)
            }
          >
            {Object.entries(DATASETS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hidden layers
          <select
            value={config.depth}
            onChange={(e) =>
              reset(
                { ...config, depth: Number(e.target.value) },
                dataset,
                points,
              )
            }
          >
            <option value={0}>None / linear model</option>
            <option value={1}>1 hidden layer</option>
            <option value={2}>2 hidden layers</option>
          </select>
        </label>
        <label>
          Neurons per layer
          <select
            value={config.width}
            disabled={!config.depth}
            onChange={(e) =>
              reset(
                { ...config, width: Number(e.target.value) },
                dataset,
                points,
              )
            }
          >
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          Hidden activation
          <select
            disabled={!config.depth}
            value={config.activation}
            onChange={(e) =>
              reset({ ...config, activation: e.target.value }, dataset, points)
            }
          >
            <option value="tanh">tanh</option>
            <option value="relu">ReLU</option>
            <option value="sigmoid">Sigmoid</option>
          </select>
        </label>
        <label>
          Optimizer
          <select
            value={optimizer}
            onChange={(e) => {
              setOptimizer(e.target.value);
              network.resetOptimizer();
              setTrace(null);
              setNotice(
                "Optimizer changed. Weights retained; moment estimates cleared. Adam generally needs a smaller learning rate than plain gradient descent.",
              );
            }}
          >
            <option value="sgd">Gradient descent</option>
            <option value="adam">Adam</option>
          </select>
        </label>
        <label>
          Learning rate
          <input
            type="number"
            min="0.001"
            max="1"
            step="0.01"
            value={rate}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= 0.001 && v <= 1) {
                setRate(v);
                setTrace(null);
              }
            }}
          />
        </label>
        <label>
          Seed
          <input
            type="number"
            min="0"
            max="999999"
            value={config.seed}
            onChange={(e) => {
              if (e.target.value === "") return;
              reset(
                {
                  ...config,
                  seed: Math.max(
                    0,
                    Math.min(999999, Math.floor(Number(e.target.value))),
                  ),
                },
                dataset,
                points,
              );
            }}
          />
        </label>
      </div>
      {dataset === "spiral" && (
        <aside className="neural-preset-note" aria-label="Spiral guidance">
          <p>
            <strong>A harder boundary.</strong> The tested starting point is 2 ×
            8 tanh neurons, Adam, and a 0.01 learning rate. Train for about
            1,000 epochs, then compare the held-out points. The preset restores
            the original seed-42 spiral.
          </p>
          <button onClick={loadSpiral}>Reload spiral preset</button>
        </aside>
      )}
      <div className="neural-workspace">
        <section className="neural-field neural-panel">
          <header>
            <div>
              <span className="eyebrow">02 / DECISION FIELD</span>
              <h2>Learning a boundary.</h2>
            </div>
            <span className="neural-equation">p(class 1 | x₁, x₂)</span>
          </header>
          <div className="neural-field-tools">
            <label>
              Canvas tool
              <select value={tool} onChange={(e) => setTool(e.target.value)}>
                <option value="probe">Probe / inspect</option>
                <option value="move">Move a point</option>
                <option value="add0">Add class 0</option>
                <option value="add1">Add class 1</option>
                <option value="erase">Erase a point</option>
              </select>
            </label>
            <label className="neural-check">
              <input
                type="checkbox"
                checked={showTest}
                onChange={(e) => setShowTest(e.target.checked)}
              />{" "}
              Show held-out points
            </label>
          </div>
          <CanvasPlot
            className="neural-decision-canvas"
            label="Decision boundary with class 0 circles and class 1 squares. Use coordinate controls below as a keyboard alternative."
            draw={decisionDraw(network, points, probe, selectedPoint, showTest)}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
          <div className="neural-legend">
            <span className="class-zero">● Class 0</span>
            <span className="class-one">■ Class 1</span>
            <span>Hollow = held out</span>
            <span>White line = p 0.5</span>
          </div>
          <div className="neural-probe-controls">
            <label>
              x₁{" "}
              <input
                aria-label="Probe x1"
                type="range"
                min="-1"
                max="1"
                step=".01"
                value={probe.x}
                onChange={(e) =>
                  setProbe({ ...probe, x: Number(e.target.value) })
                }
              />
              <output>{probe.x.toFixed(2)}</output>
            </label>
            <label>
              x₂{" "}
              <input
                aria-label="Probe x2"
                type="range"
                min="-1"
                max="1"
                step=".01"
                value={probe.y}
                onChange={(e) =>
                  setProbe({ ...probe, y: Number(e.target.value) })
                }
              />
              <output>{probe.y.toFixed(2)}</output>
            </label>
          </div>
          <div className="neural-point-editor">
            <label>
              Sample
              <select
                aria-label="Selected data point"
                value={selectedPoint ?? ""}
                onChange={(e) => {
                  const p = points.find((p) => p.id === Number(e.target.value));
                  if (p) {
                    setSelectedPoint(p.id);
                    setProbe({ x: p.x, y: p.y });
                    if (!p.test) setSampleId(p.id);
                  }
                }}
              >
                <option value="">Choose a point</option>
                {points.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id + 1} · class {p.label}
                    {p.test ? " · held out" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => add(0)}>Add 0 at probe</button>
            <button onClick={() => add(1)}>Add 1 at probe</button>
            <button
              disabled={!inspectedPoint}
              onClick={() =>
                edit(
                  points.map((p) =>
                    p.id === selectedPoint ? { ...p, ...probe } : p,
                  ),
                )
              }
            >
              Move selected here
            </button>
            <button
              disabled={
                !inspectedPoint || (!inspectedPoint.test && train.length === 1)
              }
              onClick={() => {
                edit(points.filter((p) => p.id !== selectedPoint));
                setSelectedPoint(null);
              }}
            >
              Remove selected
            </button>
          </div>
        </section>
        <aside
          className="neural-inside neural-panel"
          aria-label="Network internals"
        >
          <header>
            <div>
              <span className="eyebrow">03 / INSIDE THE NETWORK</span>
              <h2>Features take shape.</h2>
            </div>
          </header>
          <p className="neural-hint">
            Each tile is one neuron's response across the same input plane.
            Select a tile or node to inspect its calculation.
          </p>
          <NetworkDiagram
            network={network}
            pass={pass}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="neural-weight-key">
            <span>− coral</span>
            <span>+ lime</span>
            <span>Thicker line = larger |weight|</span>
          </div>
          {network.layers.map((l, li) => (
            <div className="neural-layer" key={li}>
              <h3>
                {li === network.layers.length - 1
                  ? "Output probability"
                  : `Hidden layer ${li + 1}`}
              </h3>
              <div className="neural-neurons">
                {Array.from({ length: l.size }, (_, ni) => (
                  <button
                    aria-pressed={
                      selected.layer === li && selected.neuron === ni
                    }
                    key={ni}
                    onClick={() => setSelected({ layer: li, neuron: ni })}
                  >
                    <CanvasPlot
                      label={`${li === network.layers.length - 1 ? "Output" : `Layer ${li + 1} neuron ${ni + 1}`} activation map`}
                      draw={activationDraw(network, li, ni)}
                    />
                    <span>
                      {li === network.layers.length - 1 ? "P(1)" : `N${ni + 1}`}
                      <b>{fmt(pass.activations[li + 1][ni])}</b>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="neural-hint">
            {config.activation === "tanh"
              ? "Hidden tiles: coral −1 → lime +1."
              : config.activation === "relu"
                ? "Hidden tiles: brightness follows a/(1+a), so unbounded ReLU values remain visible."
                : "Hidden tiles: coral 0 → lime 1."}{" "}
            Output: coral 0 → lime 1.
          </p>
          <div className="neural-inspector">
            <h3>
              {selected.layer === network.layers.length - 1
                ? "Output neuron"
                : `Hidden ${selected.layer + 1} / neuron ${selected.neuron + 1}`}
            </h3>
            <p className="neural-formula">
              z = Σ wᵢaᵢ + b{" "}
              <span>
                →{" "}
                {selected.layer === network.layers.length - 1
                  ? "sigmoid"
                  : config.activation}
                (z)
              </span>
            </p>
            <div className="neural-numbers">
              <span>
                z <strong>{fmt(z)}</strong>
              </span>
              <span>
                activation <strong>{fmt(a)}</strong>
              </span>
              <span>
                bias <strong>{fmt(layer.b[selected.neuron])}</strong>
              </span>
            </div>
            <div className="neural-weight-values">
              {weights.map((w, i) => (
                <span key={i}>
                  w{i + 1} <b>{fmt(w)}</b>
                </span>
              ))}
            </div>
            <p>
              Probe prediction:{" "}
              <strong
                className={pass.probability >= 0.5 ? "class-one" : "class-zero"}
              >
                class {Number(pass.probability >= 0.5)}
              </strong>{" "}
              · P(1) {(pass.probability * 100).toFixed(1)}%
            </p>
          </div>
        </aside>
      </div>
      <div className="neural-bottom">
        <section className="neural-panel neural-learning">
          <header>
            <div>
              <span className="eyebrow">04 / THE LEARNING CURVE</span>
              <h2>Error, measured.</h2>
            </div>
          </header>
          <div className="neural-metrics">
            <div>
              <span>Training loss</span>
              <strong>{fmt(trainingMetrics.loss)}</strong>
            </div>
            <div>
              <span>Training accuracy</span>
              <strong>{Math.round(trainingMetrics.accuracy * 100)}%</strong>
            </div>
            <div>
              <span>Full epochs</span>
              <strong>{network.epochs.toLocaleString()}</strong>
            </div>
            <div>
              <span>Parameters</span>
              <strong>{network.parameterCount}</strong>
            </div>
          </div>
          <CanvasPlot
            className="neural-loss-canvas"
            label="Binary cross-entropy history on a logarithmic scale. Lime training loss; dashed coral held-out loss."
            draw={lossDraw(history)}
          />
          <div className="neural-legend">
            <span className="class-one">Training / {train.length} points</span>
            {testMetrics && (
              <span className="class-zero">
                Held out / {test.length} points ·{" "}
                {Math.round(testMetrics.accuracy * 100)}% accuracy
              </span>
            )}
            <span>Binary cross-entropy · log scale</span>
          </div>
          <label className="neural-speed">
            Training speed{" "}
            <input
              type="range"
              min="30"
              max="1500"
              step="30"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <output>{speed} epochs/s target</output>
          </label>
          <p className="neural-hint">
            {dataset === "xor"
              ? "All four XOR corners are training samples; this is a representation test, not a generalization benchmark."
              : "Hollow samples are held out from epoch training. Editing can change the original split."}{" "}
            History retains the latest 400 observations.{" "}
            {network.sampleUpdates > 0 &&
              `${network.sampleUpdates} additional single-sample updates.`}
          </p>
        </section>
        <section className="neural-panel neural-trace">
          <header>
            <div>
              <span className="eyebrow">05 / ONE UPDATE, OPENED UP</span>
              <h2>Follow the gradient.</h2>
            </div>
          </header>
          <p>
            Walk one labeled training sample through prediction, loss,
            backpropagation, and a plain gradient-descent update. Epoch training
            uses {optimizer === "adam" ? "Adam" : "gradient descent"} on the
            mean gradient of all training samples. A manual trace update clears
            Adam’s accumulated moments.
          </p>
          <div className="neural-trace-controls">
            <label>
              Training sample
              <select
                value={
                  train.some((p) => p.id === Number(sampleId))
                    ? sampleId
                    : train[0].id
                }
                onChange={(e) => {
                  setSampleId(Number(e.target.value));
                  setTrace(null);
                }}
              >
                {train.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id + 1} · ({p.x.toFixed(2)}, {p.y.toFixed(2)}) →{" "}
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={startTrace}>Start trace</button>
          </div>
          <ol className="neural-trace-stages">
            {["Predict", "Measure loss", "Backpropagate", "Update"].map(
              (name, i) => (
                <li
                  className={trace && trace.stage >= i ? "is-reached" : ""}
                  key={name}
                >
                  <span>0{i + 1}</span>
                  {name}
                </li>
              ),
            )}
          </ol>
          {!trace ? (
            <p className="neural-trace-empty">
              Pause time and inspect one real update. Select a neuron above to
              follow its incoming weight.
            </p>
          ) : (
            <div className="neural-trace-detail">
              <p>
                Sample #{trace.point.id + 1}: target <b>{trace.point.label}</b>{" "}
                · prediction <b>{fmt(trace.pass.probability)}</b>
              </p>
              <p className="neural-trace-equation">
                {trace.stage === 0
                  ? `z = ${fmt(trace.pass.logit)} → sigmoid(z) = ${fmt(trace.pass.probability)}`
                  : trace.stage === 1
                    ? `L = −y log(p) − (1−y) log(1−p) = ${fmt(binaryLoss(trace.pass.logit, trace.point.label))}`
                    : trace.stage === 2
                      ? `∂L/∂w₁ = ${fmt(trace.gradient.grads[selected.layer].w[selected.neuron * layer.inputs])}`
                      : `w₁: ${fmt(trace.weights[selected.layer].w[selected.neuron * layer.inputs])} → ${fmt(network.layers[selected.layer].w[selected.neuron * layer.inputs])}`}
              </p>
              <p>
                {trace.stage === 0
                  ? "The output is a probability, calculated from the current weights."
                  : trace.stage === 1
                    ? "Binary cross-entropy measures disagreement with this sample’s label."
                    : trace.stage === 2
                      ? "The chain rule carries the output error backward to each weight. The displayed gradient belongs to the inspected neuron."
                      : `Applied w ← w − ${trace.rate} × gradient. The field and measured loss now reflect the new weights.`}
              </p>
              <button className="neural-primary" onClick={nextTrace}>
                {
                  [
                    "Next: loss",
                    "Next: gradients",
                    "Apply single-sample update",
                    "Trace again",
                  ][trace.stage]
                }
              </button>
            </div>
          )}
        </section>
      </div>
      <p className="neural-notice" role="status" aria-label="Training status">
        {notice}
      </p>
    </div>
  );
}
