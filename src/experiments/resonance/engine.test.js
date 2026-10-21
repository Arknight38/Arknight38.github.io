import { expect, test } from "vitest";
import { WaveField, probeSpectrum } from "./engine.js";
test("a quiet field remains zero and the two-dimensional CFL limit is respected", () => {
  const f = new WaveField("pulse", 32);
  f.clearWaves();
  f.step(100);
  expect(f.u.every((v) => v === 0)).toBe(true);
  expect((f.c * f.dt) / f.dx).toBeLessThan(1 / Math.sqrt(2));
  f.configure({ c: 3 });
  expect((f.c * f.dt) / f.dx).toBeCloseTo(0.4, 12);
});
test("a centered pulse spreads symmetrically and walls stay fixed", () => {
  const f = new WaveField("pulse", 33);
  f.boundary = "reflect";
  f.damping = 0;
  f.step(10);
  const n = f.size;
  expect(f.u[16 * n + 12]).toBeCloseTo(f.u[16 * n + 20], 10);
  f.wall(16, 16, true);
  f.step(20);
  expect(f.u[16 * n + 16]).toBe(0);
  expect(f.previous[16 * n + 16]).toBe(0);
  expect(f.u.every(Number.isFinite)).toBe(true);
});
test("driven cells follow the source phase and probe history is bounded", () => {
  const f = new WaveField("interference", 32),
    source = f.sources[0];
  f.step(600);
  expect(f.u[source.y * f.size + source.x]).toBeCloseTo(
    source.amplitude *
      Math.sin(2 * Math.PI * source.frequency * f.time + source.phase),
    10,
  );
  expect(f.history).toHaveLength(512);
  f.setProbe(5, 5);
  expect(f.history).toHaveLength(0);
});
test("painting fills skipped cells and prevents an emitter inside a wall", () => {
  const f = new WaveField("pulse", 32);
  f.paint(4, 4, 20, 4, true);
  for (let x = 4; x <= 20; x++) expect(f.walls[4 * 32 + x]).toBe(1);
  expect(() => f.addSource(10, 4)).toThrow();
  f.wall(10, 4, false);
  expect(f.addSource(10, 4)).toBe(0);
  f.wall(10, 4, true);
  expect(f.sources).toHaveLength(0);
});
test("Hann DFT recovers the correct bin and amplitude from actual samples", () => {
  const dt = 0.01,
    n = 256,
    k = 8,
    frequency = k / (n * dt),
    values = Array.from({ length: n }, (_, i) =>
      Math.sin(2 * Math.PI * frequency * i * dt),
    );
  const bins = probeSpectrum(values, dt),
    peak = bins.reduce((a, b) => (a.amplitude > b.amplitude ? a : b));
  expect(peak.frequency).toBeCloseTo(frequency, 12);
  expect(peak.amplitude).toBeCloseTo(1, 3);
});
test("sponge boundaries remove more pulse energy than a closed undamped box", () => {
  const a = new WaveField("pulse", 32),
    b = new WaveField("pulse", 32);
  a.damping = b.damping = 0;
  b.boundary = "reflect";
  a.step(300);
  b.step(300);
  expect(a.measure().energy).toBeLessThan(b.measure().energy * 0.8);
});
