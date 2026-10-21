// Small dense network; all forward/backward calculations are explicit.
export function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const sigmoid = (x) =>
  x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
export function activate(z, kind) {
  if (kind === "relu") return Math.max(0, z);
  if (kind === "sigmoid") return sigmoid(z);
  return Math.tanh(z);
}
function derivative(z, a, kind) {
  if (kind === "relu") return z > 0 ? 1 : 0;
  if (kind === "sigmoid") return a * (1 - a);
  return 1 - a * a;
}
export function binaryLoss(logit, target) {
  return (
    Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)))
  );
}
export class Network {
  constructor({ hidden = [4], activation = "tanh", seed = 42 } = {}) {
    if (
      hidden.length > 2 ||
      hidden.some((n) => !Number.isInteger(n) || n < 1 || n > 8)
    )
      throw new RangeError("Use up to two hidden layers with 1–8 neurons.");
    this.activation = activation;
    this.shape = [2, ...hidden, 1];
    const random = seededRandom(seed);
    this.layers = this.shape.slice(1).map((size, i) => {
      const inputs = this.shape[i];
      const limit = Math.sqrt(
        6 /
          (activation === "relu" && i < hidden.length ? inputs : inputs + size),
      );
      return {
        inputs,
        size,
        w: Float64Array.from(
          { length: inputs * size },
          () => (random() * 2 - 1) * limit,
        ),
        b: new Float64Array(size),
      };
    });
    this.epochs = 0;
    this.sampleUpdates = 0;
    this.resetOptimizer();
  }
  forward(input) {
    const activations = [Float64Array.from(input)],
      preactivations = [];
    this.layers.forEach((layer, l) => {
      const z = new Float64Array(layer.size),
        a = new Float64Array(layer.size);
      for (let j = 0; j < layer.size; j++) {
        z[j] = layer.b[j];
        for (let k = 0; k < layer.inputs; k++)
          z[j] += layer.w[j * layer.inputs + k] * activations[l][k];
        a[j] =
          l === this.layers.length - 1
            ? sigmoid(z[j])
            : activate(z[j], this.activation);
      }
      preactivations.push(z);
      activations.push(a);
    });
    return {
      activations,
      preactivations,
      probability: activations.at(-1)[0],
      logit: preactivations.at(-1)[0],
    };
  }
  gradients(points) {
    if (!points.length)
      throw new RangeError("At least one training sample is required.");
    const grads = this.layers.map((l) => ({
      w: new Float64Array(l.w.length),
      b: new Float64Array(l.b.length),
    }));
    let loss = 0;
    for (const point of points) {
      const pass = this.forward([point.x, point.y]);
      loss += binaryLoss(pass.logit, point.label);
      let delta = Float64Array.of(pass.probability - point.label);
      for (let l = this.layers.length - 1; l >= 0; l--) {
        const layer = this.layers[l];
        for (let j = 0; j < layer.size; j++) {
          grads[l].b[j] += delta[j] / points.length;
          for (let k = 0; k < layer.inputs; k++)
            grads[l].w[j * layer.inputs + k] +=
              (delta[j] * pass.activations[l][k]) / points.length;
        }
        if (l > 0) {
          const next = new Float64Array(layer.inputs);
          for (let k = 0; k < layer.inputs; k++) {
            for (let j = 0; j < layer.size; j++)
              next[k] += layer.w[j * layer.inputs + k] * delta[j];
            next[k] *= derivative(
              pass.preactivations[l - 1][k],
              pass.activations[l][k],
              this.activation,
            );
          }
          delta = next;
        }
      }
    }
    return { grads, loss: loss / points.length };
  }
  apply(grads, rate) {
    if (!Number.isFinite(rate) || rate <= 0)
      throw new RangeError("Learning rate must be positive.");
    this.layers.forEach((layer, l) => {
      for (const field of ["w", "b"])
        for (let i = 0; i < layer[field].length; i++) {
          const next = layer[field][i] - rate * grads[l][field][i];
          if (!Number.isFinite(next))
            throw new Error(
              "Training became nonfinite. Reset with a smaller learning rate.",
            );
          layer[field][i] = next;
        }
    });
  }
  resetOptimizer() {
    this.optimizerKind = "sgd";
    this.optimizerStep = 0;
    this.moments = null;
  }
  applyAdam(grads, rate) {
    if (!Number.isFinite(rate) || rate <= 0)
      throw new RangeError("Learning rate must be positive.");
    if (!this.moments)
      this.moments = this.layers.map((layer) =>
        Object.fromEntries(
          ["w", "b"].map((field) => [
            field,
            {
              m: new Float64Array(layer[field].length),
              v: new Float64Array(layer[field].length),
            },
          ]),
        ),
      );
    const step = ++this.optimizerStep;
    const firstCorrection = 1 - 0.9 ** step,
      secondCorrection = 1 - 0.999 ** step;
    this.layers.forEach((layer, l) => {
      for (const field of ["w", "b"]) {
        const { m, v } = this.moments[l][field];
        for (let i = 0; i < layer[field].length; i++) {
          const g = grads[l][field][i];
          m[i] = 0.9 * m[i] + 0.1 * g;
          v[i] = 0.999 * v[i] + 0.001 * g * g;
          const next =
            layer[field][i] -
            (rate * (m[i] / firstCorrection)) /
              (Math.sqrt(v[i] / secondCorrection) + 1e-8);
          if (!Number.isFinite(next))
            throw new Error(
              "Training became nonfinite. Reset with a smaller learning rate.",
            );
          layer[field][i] = next;
        }
      }
    });
  }
  applySample(grads, rate) {
    this.apply(grads, rate);
    this.resetOptimizer();
    this.sampleUpdates++;
  }
  train(points, rate, count = 1, optimizer = "sgd") {
    if (!["sgd", "adam"].includes(optimizer))
      throw new RangeError("Unknown optimizer.");
    if (optimizer !== this.optimizerKind) {
      this.resetOptimizer();
      this.optimizerKind = optimizer;
    }
    for (let i = 0; i < count; i++) {
      const { grads } = this.gradients(points);
      if (optimizer === "adam") this.applyAdam(grads, rate);
      else this.apply(grads, rate);
      this.epochs++;
    }
  }
  evaluate(points) {
    if (!points.length) return null;
    let loss = 0,
      correct = 0;
    for (const p of points) {
      const f = this.forward([p.x, p.y]);
      loss += binaryLoss(f.logit, p.label);
      correct += Number(Number(f.probability >= 0.5) === p.label);
    }
    return { loss: loss / points.length, accuracy: correct / points.length };
  }
  get parameterCount() {
    return this.layers.reduce((n, l) => n + l.w.length + l.b.length, 0);
  }
}
