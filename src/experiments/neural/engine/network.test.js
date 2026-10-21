import { describe, expect, test } from "vitest";
import { Network, binaryLoss } from "./network.js";
import { makeDataset } from "./datasets.js";

describe("explicit backpropagation", () => {
  for (const activation of ["tanh", "sigmoid", "relu"])
    test(`${activation} gradients agree with central finite differences through two hidden layers`, () => {
      const net = new Network({ hidden: [3, 2], activation, seed: 19 });
      const points = [
        { x: 0.37, y: -0.82, label: 1 },
        { x: -0.61, y: 0.22, label: 0 },
      ];
      const analytic = net.gradients(points).grads,
        epsilon = 1e-5;
      net.layers.forEach((layer, l) => {
        for (const field of ["w", "b"])
          for (let i = 0; i < layer[field].length; i++) {
            const original = layer[field][i];
            layer[field][i] = original + epsilon;
            const plus = net.evaluate(points).loss;
            layer[field][i] = original - epsilon;
            const minus = net.evaluate(points).loss;
            layer[field][i] = original;
            expect(analytic[l][field][i]).toBeCloseTo(
              (plus - minus) / (2 * epsilon),
              6,
            );
          }
      });
    });
  test("a hidden layer learns XOR while a linear model retains irreducible loss", () => {
    const points = makeDataset(),
      nonlinear = new Network(),
      linear = new Network({ hidden: [] });
    nonlinear.train(points, 0.08, 3000);
    linear.train(points, 0.08, 3000);
    expect(nonlinear.evaluate(points).accuracy).toBe(1);
    expect(nonlinear.evaluate(points).loss).toBeLessThan(0.02);
    expect(linear.evaluate(points).loss).toBeGreaterThan(0.69);
  });
  test("seeds reproduce the complete training trajectory", () => {
    const a = new Network({ seed: 7 }),
      b = new Network({ seed: 7 });
    const points = makeDataset();
    a.train(points, 0.1, 40);
    b.train(points, 0.1, 40);
    expect(a.layers).toEqual(b.layers);
    expect(new Network({ seed: 8 }).layers).not.toEqual(
      new Network({ seed: 7 }).layers,
    );
  });
  test("a single-sample update follows the displayed negative gradient", () => {
    const net = new Network(),
      point = makeDataset()[0];
    const { grads } = net.gradients([point]),
      before = net.layers[0].w[0],
      loss = net.evaluate([point]).loss;
    net.applySample(grads, 0.01);
    expect(net.layers[0].w[0]).toBeCloseTo(before - 0.01 * grads[0].w[0], 12);
    expect(net.evaluate([point]).loss).toBeLessThan(loss);
    expect(net.sampleUpdates).toBe(1);
    expect(net.epochs).toBe(0);
  });
  test("logit-space loss stays finite for extreme predictions", () => {
    expect(binaryLoss(1000, 0)).toBe(1000);
    expect(binaryLoss(-1000, 1)).toBe(1000);
    expect(binaryLoss(1000, 1)).toBe(0);
    expect(binaryLoss(-1000, 0)).toBe(0);
  });
  test("circles and spirals have reproducible, balanced held-out splits", () => {
    for (const kind of ["circles", "spiral"]) {
      const points = makeDataset(kind, 5);
      expect(points).toEqual(makeDataset(kind, 5));
      const held = points.filter((p) => p.test);
      expect(held.length).toBe(points.length / 5);
      expect(held.filter((p) => p.label === 0).length).toBe(
        held.filter((p) => p.label === 1).length,
      );
      expect(
        points.every((p) => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1),
      ).toBe(true);
    }
  });
});

describe("Adam optimizer and spiral preset", () => {
  test("bias correction preserves constant-gradient step sizes across batches", () => {
    const net = new Network({ hidden: [] });
    const grads = net.layers.map((l) => ({
      w: new Float64Array(l.w.length).fill(2),
      b: new Float64Array(l.b.length).fill(2),
    }));
    const before = net.layers[0].w[0];
    net.applyAdam(grads, 0.1);
    net.applyAdam(grads, 0.1);
    expect(net.layers[0].w[0]).toBeCloseTo(before - 0.2, 8);
    expect(net.layers[0].b[0]).toBeCloseTo(-0.2, 8);
    expect(net.optimizerStep).toBe(2);
  });
  test("the visible spiral preset fits training and held-out points without changing the dataset", async () => {
    const { SPIRAL_PRESET: preset } = await import("./presets.js");
    const { depth, width, activation, seed } = preset.config;
    const net = new Network({
      hidden: Array(depth).fill(width),
      activation,
      seed,
    });
    const points = makeDataset("spiral", seed),
      original = structuredClone(points);
    net.train(
      points.filter((p) => !p.test),
      preset.rate,
      1000,
      preset.optimizer,
    );
    expect(net.evaluate(points.filter((p) => !p.test)).accuracy).toBe(1);
    expect(
      net.evaluate(points.filter((p) => p.test)).accuracy,
    ).toBeGreaterThanOrEqual(0.95);
    expect(net.evaluate(points.filter((p) => !p.test)).loss).toBeLessThan(0.01);
    expect(points).toEqual(original);
  });
  test("animation-frame batch boundaries do not reset Adam moments", () => {
    const a = new Network(),
      b = new Network(),
      points = makeDataset();
    a.train(points, 0.01, 100, "adam");
    for (let i = 0; i < 10; i++) b.train(points, 0.01, 10, "adam");
    expect(a.layers).toEqual(b.layers);
    expect(b.optimizerStep).toBe(100);
    b.applySample(b.gradients([points[0]]).grads, 0.01);
    expect(b.moments).toBeNull();
    expect(b.optimizerStep).toBe(0);
    b.train(points, 0.01, 1, "adam");
    expect(b.optimizerStep).toBe(1);
    b.train(points, 0.01, 1, "sgd");
    expect(b.moments).toBeNull();
  });
});
