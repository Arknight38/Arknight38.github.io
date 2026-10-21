## Overview

Neural Lab makes a small classifier's computation visible. Two input coordinates pass through a configurable dense network to produce the probability of class one. The main plot evaluates that network across a plane, neuron tiles expose intermediate responses, and a learning trace opens one labeled sample's update into separate stages.

The implementation uses explicit JavaScript mathematics rather than a hosted model or a machine-learning framework. Forward propagation, analytic gradients, binary cross-entropy, and both optimizers live independently of the React interface. Training changes the weights used by every visualization; the boundary is not a prerecorded demonstration.

## Three experiments and what to look for

**XOR** starts with four corners. Opposite corners share a class, so one straight boundary cannot separate them. Train the default hidden network, then remove its hidden layer and compare the loss. This is a small representation problem: every corner is a training example, so 100% accuracy is not a generalization benchmark.

**Concentric circles** asks for a closed boundary. Inspect how several hidden responses combine into an output that distinguishes an inner ring from an outer ring. Hollow markers are held out from epoch training, making them a separate check on the learned boundary.

**Two spirals** needs a winding separation. Selecting it loads a verified starting point: two hidden layers with eight tanh neurons each, Adam, learning rate 0.01, and seed 42. Press **Train** and allow roughly 1,000 epochs. The preset reload button restores both the original point cloud and that configuration after experiments with other settings.

Use the canvas tools to add, move, or remove samples. Coordinate sliders and the sample selector provide keyboard alternatives. Edits pause training, retain the current weights, and restart loss history; architecture changes reset the weights. Up to 160 points keep the interactive workload bounded.

## Forward propagation through dense layers

A neuron forms a weighted sum of the preceding layer's activations, adds a bias, and applies an activation function. A hidden layer therefore transforms the representation available to the next layer rather than simply drawing another separator directly on the input.

The inner calculation in `neural/engine/network.js` is:

```javascript
z[j] = layer.b[j];
for (let k = 0; k < layer.inputs; k++)
  z[j] += layer.w[j * layer.inputs + k] * activations[l][k];
```

Weights are stored in flat `Float64Array` buffers, with each output neuron's incoming weights occupying one contiguous row. The engine retains preactivations and activations for each layer. The same forward-pass data supports the neuron inspector and the backward calculation.

Hidden layers can use tanh, sigmoid, or ReLU. The output always uses sigmoid, turning its logit into a number between zero and one. With no hidden layer, this is logistic classification with a single affine separator. Hidden nonlinearities let combinations of features form curved boundaries.

## Reading neurons, weights, and the decision field

The main field evaluates a 65 × 65 probability grid. Marching squares interpolates where neighboring samples cross probability 0.5 to draw the white decision contour. A coarse grid is a rendering approximation of the current network, not another model being fitted to it.

Each neuron tile evaluates one activation over the same input domain using a 20 × 20 grid. A first-layer tanh neuron often resembles a soft split of the plane; later neurons combine those responses into more complex regions. Selecting a tile reveals its weights, bias, preactivation z, and activation at the current probe coordinate.

Color scales depend on what is being displayed. Tanh maps −1 through +1 from coral to lime. Sigmoid and output probability use zero through one. ReLU is unbounded, so its tile uses `a / (1 + a)` for color while the numeric inspector retains the actual activation. The diagram's edge color represents weight sign, and thickness represents magnitude.

The probe can move independently of the data. Inspecting a location does not add a training example or assign it a label. This makes it possible to investigate a region between samples without changing the problem being learned.

## Binary cross-entropy without unstable logarithms

For a target y and predicted probability p, binary cross-entropy is `−y log(p) − (1−y) log(1−p)`. It penalizes confident wrong predictions more strongly than uncertain ones. The displayed loss is averaged over the relevant sample set.

Calculating that expression directly from rounded probabilities can encounter `log(0)`. The engine instead uses the output logit:

```javascript
Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)));
```

Source: `neural/engine/network.js`, expression returned by `binaryLoss`.

This equivalent form remains finite for extreme logits without replacing the objective with an arbitrary probability clamp. The loss chart uses a logarithmic vertical scale to show improvement across several orders of magnitude. Its plotting range is limited for readability; the numeric loss remains the actual computed value.

## Backpropagation and one visible update

Sigmoid output paired with binary cross-entropy gives a compact output derivative: `p − y`. The implementation starts there and propagates error backward through the weighted connections, multiplying by each hidden activation's derivative.

The output error and weight-gradient accumulation are visible in these excerpts:

```javascript
let delta = Float64Array.of(pass.probability - point.label);
```

```javascript
grads[l].w[j * layer.inputs + k] +=
  (delta[j] * pass.activations[l][k]) / points.length;
```

Source: `neural/engine/network.js`, separate excerpts from `gradients`.

Dividing each contribution by the batch size produces the mean gradient. Epoch training uses all training points for one update. The **Follow the gradient** panel deliberately uses one selected training sample: prediction, loss, the inspected neuron's gradient, then a plain gradient-descent update `w ← w − ηg`.

The trace snapshots its forward pass, gradient, rate, and old weights before applying the update once. That allows the final stage to show an actual before-and-after weight. It remains a plain gradient-descent example even when epoch training uses Adam; applying it clears Adam's accumulated moments so subsequent training does not reuse stale optimizer state.

## Why Adam helps the spiral

The original XOR starter can remain near a simple separator on the spiral. More epochs alone do not make a small representation become a good winding boundary, and plain gradient descent can progress slowly even with a larger network.

Adam retains a first moment of the gradient and a second moment of its square for each weight and bias. It corrects the initial zero-state bias and scales the update by the square root of the corrected second moment. Neural Lab uses β₁ = 0.9, β₂ = 0.999, and ε = 10⁻⁸.

The moment updates in `neural/engine/network.js` are:

```javascript
m[i] = 0.9 * m[i] + 0.1 * g;
v[i] = 0.999 * v[i] + 0.001 * g * g;
```

Those buffers persist across animation-frame batches. Resetting them every frame would make training depend on how the browser groups work. Switching optimizers clears their memory while retaining weights; resetting the network starts everything fresh.

The following measured results use the original seed-42 spiral: 80 training points and 20 held-out points. They compare complete configurations, not an isolated optimizer benchmark.

| Configuration                                  | Epochs | Training accuracy | Held-out accuracy |
| ---------------------------------------------- | -----: | ----------------: | ----------------: |
| One 4-neuron tanh layer, gradient descent 0.08 | 10,000 |               65% |               60% |
| Two 8-neuron tanh layers, gradient descent 0.5 | 10,000 |              100% |               80% |
| Two 8-neuron tanh layers, Adam 0.01            |  1,000 |              100% |              100% |

The tested Adam preset reaches training loss about 0.00329 and held-out loss about 0.04056 at 1,000 epochs. Edited points and other seeds can behave differently; the numbers establish a reproducible example rather than a universal guarantee.

## Reproducibility, held-out data, and display timing

Seeded initialization makes a reset repeatable. Xavier-style uniform initialization is used for tanh and sigmoid paths, while ReLU hidden layers use a He-style range. Biases start at zero. The supported network has two inputs, up to two hidden layers of eight neurons, and one output.

Circle and spiral generators mark a balanced fifth of their samples as held out. Those points are excluded from epoch gradients and the trace selector. Their loss and accuracy evaluate the same current model without updating it. The split is a fixed illustrative sample, not a broad statistical study.

Training runs in bounded animation-frame batches and publishes visual updates at about 10 Hz. The speed setting is a target number of epochs per second, not a promise of device throughput. Hidden tabs stop accumulating training time. The loss chart retains its latest 400 observations so an extended session does not grow history without limit.

## Concepts explored and verification

The central ideas are representation learning, the chain rule, numerical stability, optimization state, and the difference between fitting examples and evaluating held-out ones. Their implementation is small enough to compare different explanations of the same result: a gradient value, a changing weight, a neuron response, and the final boundary.

Tests compare analytic gradients against central finite differences through two hidden layers for tanh, sigmoid, and ReLU. They also verify XOR versus a linear model, seeded trajectories, extreme logits, single-sample descent, Adam bias correction, and optimizer-state continuity across batch boundaries. A spiral regression uses the same preset exposed in the interface and evaluates training and held-out points separately.

## Things to do next

Useful extensions include batch-size controls, a visual comparison of optimizer updates, and validation across multiple dataset seeds. A signal-classification experiment could connect these representations to DSP—for example, learning from measured spectral features while retaining a separate unseen-signal evaluation. Any new view should expose an actual activation, gradient, or measurement rather than add motion unrelated to the computation.
