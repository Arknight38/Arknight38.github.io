import { binaryLoss } from "./engine/network.js";

const fmt = (value) =>
  Math.abs(value) > 0 && Math.abs(value) < 0.0001
    ? value.toExponential(2)
    : value.toFixed(4);
const percent = (value) => `${(value * 100).toFixed(1)}%`;
const STAGES = ["Prediction", "Loss", "Gradient", "Weight update"];

export default function TracePanel({
  trace,
  network,
  selected,
  onSelect,
  train,
  sampleId,
  onSample,
  onStart,
  onNext,
  optimizer,
}) {
  const li = selected.layer,
    ni = selected.neuron;
  const layer = network.layers[li];
  const index = ni * layer.inputs;
  const name =
    li === network.layers.length - 1
      ? "Output neuron"
      : `Hidden layer ${li + 1}, neuron ${ni + 1}`;
  const source = li === 0 ? "input x₁" : `hidden layer ${li}, neuron 1`;
  const gradient = trace?.gradient.grads[li].w[index];
  const before = trace?.weights[li].w[index];
  const loss = trace && binaryLoss(trace.pass.logit, trace.point.label);
  const afterLoss =
    trace?.after && binaryLoss(trace.after.pass.logit, trace.point.label);
  return (
    <section className="neural-panel neural-trace">
      <header>
        <div>
          <span className="eyebrow">04 / SINGLE-SAMPLE UPDATE</span>
          <h2>One point, one learning update</h2>
        </div>
      </header>
      <div className="neural-trace-controls">
        <label>
          Training sample
          <select
            value={
              train.some((p) => p.id === Number(sampleId))
                ? sampleId
                : train[0].id
            }
            onChange={(event) => onSample(Number(event.target.value))}
          >
            {train.map((point) => (
              <option key={point.id} value={point.id}>
                #{point.id + 1} · ({point.x.toFixed(2)}, {point.y.toFixed(2)}) ·
                class {point.label}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onStart}>
          {trace ? "Restart trace" : "Start trace"}
        </button>
      </div>
      {!trace ? (
        <p className="neural-trace-empty">
          Choose a point and start. Each step shows what the network calculates
          before changing any weights.
        </p>
      ) : (
        <>
          <div className="neural-trace-sample" aria-label="Captured sample">
            <div>
              <span>Input coordinates</span>
              <strong>
                ({trace.point.x.toFixed(2)}, {trace.point.y.toFixed(2)})
              </strong>
            </div>
            <div>
              <span>Expected answer</span>
              <strong>Class {trace.point.label}</strong>
            </div>
            <div>
              <span>Network’s answer before update</span>
              <strong>Class {Number(trace.pass.probability >= 0.5)}</strong>
            </div>
          </div>
          <ol className="neural-trace-stages" aria-label="Update steps">
            {STAGES.map((name, index) => (
              <li
                key={name}
                className={trace.stage >= index ? "is-reached" : ""}
                aria-current={trace.stage === index ? "step" : undefined}
              >
                <span>0{index + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          <div className="neural-trace-detail" aria-live="polite">
            <h3>
              {
                [
                  "What does the network predict?",
                  "How wrong is that prediction?",
                  "Which way should a weight move?",
                  "What changed after the update?",
                ][trace.stage]
              }
            </h3>
            {trace.stage === 0 && (
              <>
                <div
                  className="neural-probability-bar"
                  role="meter"
                  aria-label="Predicted probability of class 1"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={trace.pass.probability * 100}
                >
                  <i style={{ width: percent(trace.pass.probability) }} />
                </div>
                <div className="neural-probability-labels">
                  <span>Class 0 · {percent(1 - trace.pass.probability)}</span>
                  <span>Class 1 · {percent(trace.pass.probability)}</span>
                </div>
                <p>
                  The network assigns {percent(trace.pass.probability)}{" "}
                  probability to class 1. This point’s known label is class{" "}
                  {trace.point.label}.
                </p>
              </>
            )}
            {trace.stage === 1 && (
              <>
                <strong className="neural-trace-value">
                  {fmt(loss)} <small>sample loss</small>
                </strong>
                <p>
                  The probability assigned to the correct class is{" "}
                  {percent(
                    trace.point.label
                      ? trace.pass.probability
                      : 1 - trace.pass.probability,
                  )}
                  . Cross-entropy turns that into a loss: lower means a better
                  prediction for this point.
                </p>
              </>
            )}
            {trace.stage === 2 && (
              <>
                <p className="neural-connection-label">
                  {source} → {name.toLowerCase()} · incoming weight 1
                </p>
                <dl className="neural-trace-calculation">
                  <div>
                    <dt>Current weight</dt>
                    <dd>{fmt(before)}</dd>
                  </div>
                  <div>
                    <dt>Loss gradient</dt>
                    <dd>{fmt(gradient)}</dd>
                  </div>
                  <div>
                    <dt>Planned change</dt>
                    <dd>{fmt(-trace.rate * gradient)}</dd>
                  </div>
                </dl>
                <p>
                  {gradient > 0
                    ? "Increasing this weight would locally increase the loss, so gradient descent moves it down."
                    : gradient < 0
                      ? "Increasing this weight would locally decrease the loss, so gradient descent moves it up."
                      : "This weight has zero gradient for the captured sample, so this update leaves it unchanged."}{" "}
                  The change is −learning rate × gradient. No weights have
                  changed yet.
                </p>
              </>
            )}
            {trace.stage === 3 && (
              <>
                <dl className="neural-trace-calculation">
                  <div>
                    <dt>Sample loss</dt>
                    <dd>
                      {fmt(loss)} → {fmt(afterLoss)}
                    </dd>
                  </div>
                  <div>
                    <dt>Probability of class 1</dt>
                    <dd>
                      {percent(trace.pass.probability)} →{" "}
                      {percent(trace.after.pass.probability)}
                    </dd>
                  </div>
                  <div>
                    <dt>Inspected weight</dt>
                    <dd>
                      {fmt(before)} → {fmt(trace.after.weights[li].w[index])}
                    </dd>
                  </div>
                </dl>
                <p>
                  All weights and biases received one update using this sample.{" "}
                  {afterLoss < loss
                    ? "Its loss decreased."
                    : afterLoss > loss
                      ? "Its loss increased for this step."
                      : "Its measured loss stayed the same."}{" "}
                  A full training epoch uses all training samples instead.
                </p>
              </>
            )}
          </div>
          <details className="neural-trace-math">
            <summary>Inspect the neuron and equations</summary>
            <label className="neural-trace-neuron">
              Trace neuron
              <select
                value={`${li}:${ni}`}
                onChange={(event) => {
                  const [layer, neuron] = event.target.value
                    .split(":")
                    .map(Number);
                  onSelect({ layer, neuron });
                }}
              >
                {network.layers.flatMap((layer, l) =>
                  Array.from({ length: layer.size }, (_, n) => (
                    <option key={`${l}:${n}`} value={`${l}:${n}`}>
                      {l === network.layers.length - 1
                        ? "Output"
                        : `Hidden ${l + 1}`}{" "}
                      / neuron {n + 1}
                    </option>
                  )),
                )}
              </select>
            </label>
            <p>
              {source} → {name.toLowerCase()}. The weight shown is this neuron’s
              first incoming connection.
            </p>
            <p className="neural-trace-equation">
              {trace.stage === 0
                ? `z = ${fmt(trace.pass.logit)} → sigmoid(z) = ${fmt(trace.pass.probability)}`
                : trace.stage === 1
                  ? `L = −y log(p) − (1−y) log(1−p) = ${fmt(loss)}`
                  : trace.stage === 2
                    ? `∂L/∂w₁ = ${fmt(gradient)}`
                    : `w₁: ${fmt(before)} → ${fmt(trace.after.weights[li].w[index])}`}
            </p>
            {trace.stage >= 2 && (
              <p className="neural-trace-equation">
                {fmt(before)} − {trace.rate} × ({fmt(gradient)}) ={" "}
                {fmt(before - trace.rate * gradient)}
              </p>
            )}
          </details>
          <div className="neural-trace-action">
            <button className="neural-primary" onClick={onNext}>
              {
                [
                  "Next: loss",
                  "Next: gradients",
                  "Apply single-sample update",
                  "Trace again",
                ][trace.stage]
              }
            </button>
            <span>
              {trace.stage < 3
                ? "Weights stay fixed until Apply."
                : "One update applied."}
            </span>
          </div>
        </>
      )}
      <p className="neural-trace-method">
        This walkthrough uses plain gradient descent. Epoch training currently
        uses {optimizer === "adam" ? "Adam" : "gradient descent"}; applying a
        trace update clears its optimizer memory.
      </p>
    </section>
  );
}
