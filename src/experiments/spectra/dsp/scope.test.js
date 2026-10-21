import { expect, test } from "vitest";
import { SpectraEngine, DEFAULTS } from "./engine.js";
import { ScopeCapture } from "./scope.js";

test("phase-aligned periodic input stays still as the processing clock advances", () => {
  const engine = new SpectraEngine();
  engine.advance(2);
  const first = engine.scope.window(engine.settings);
  engine.advance(0.073);
  const second = engine.scope.window(engine.settings);
  expect(engine.sampleCount).toBeGreaterThan(2304);
  expect(first.start).not.toBe(second.start);
  for (let i = 0; i < 256; i++) {
    expect(first.input[i]).toBeCloseTo(second.input[i], 10);
    expect(first.output[i]).toBeCloseTo(second.output[i], 8);
  }
});
test("scope presentation never changes the FFT or sample clock", () => {
  const engine = new SpectraEngine();
  engine.advance(1);
  const before = {
    samples: engine.sampleCount,
    input: Array.from(engine.input),
    spectrum: Array.from(engine.spectrum),
  };
  engine.scope.window(engine.settings, "slow");
  expect(engine.sampleCount).toBe(before.samples);
  expect(Array.from(engine.input)).toEqual(before.input);
  expect(Array.from(engine.spectrum)).toEqual(before.spectrum);
});
test("scope windows preserve real samples and relative input/output phase", () => {
  const capture = new ScopeCapture(4);
  for (let i = 0; i < 24; i++) capture.push(i, i + 10, i);
  const frame = capture.window({ ...DEFAULTS, source: "sine", f1: 256 });
  expect(Array.from(frame.input)).toEqual([16, 17, 18, 19]);
  expect(Array.from(frame.output)).toEqual([26, 27, 28, 29]);
});
test("nonperiodic captures hold between refreshes and refresh at sample-time boundaries", () => {
  const engine = new SpectraEngine({ ...DEFAULTS, source: "noise" });
  const first = engine.scope.window(engine.settings);
  engine.advance(0.1);
  expect(engine.scope.window(engine.settings)).toBe(first);
  engine.advance(0.4);
  expect(engine.scope.window(engine.settings)).not.toBe(first);
});
test("filter changes replace captured output immediately, including while paused", () => {
  const engine = new SpectraEngine();
  engine.advance(1);
  engine.configure({ ...DEFAULTS, poleR: 0.6 });
  const frame = engine.scope.window(engine.settings);
  expect(Array.from(frame.output)).toEqual(Array.from(engine.output));
});
