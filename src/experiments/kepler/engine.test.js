import { expect, test } from "vitest";
import {
  accelerations,
  diagnostics,
  integrate,
  preset,
  OrbitSystem,
  forecast,
  compare,
} from "./engine.js";
test("pair forces preserve linear momentum and use the matching softened potential", () => {
  const b = [
      { id: 0, mass: 2, x: -1, y: 0, vx: 0, vy: 0 },
      { id: 1, mass: 3, x: 1, y: 0, vx: 0, vy: 0 },
    ],
    a = accelerations(b);
  expect(2 * a[0].x + 3 * a[1].x).toBeCloseTo(0, 13);
  const h = 1e-5,
    plus = b.map((v) => ({ ...v })),
    minus = b.map((v) => ({ ...v }));
  plus[0].x += h;
  minus[0].x -= h;
  const force =
    -(diagnostics(plus).potential - diagnostics(minus).potential) / (2 * h);
  expect(force).toBeCloseTo(2 * a[0].x, 8);
});
test("leapfrog keeps a softened circular binary bound and conserves angular momentum", () => {
  const s = new OrbitSystem();
  const e = s.initial.energy,
    l = s.initial.angular;
  s.step(5000);
  expect(Math.abs((diagnostics(s.bodies).energy - e) / e)).toBeLessThan(1e-4);
  expect(diagnostics(s.bodies).angular).toBeCloseTo(l, 10);
  expect(Math.hypot(s.bodies[0].x, s.bodies[0].y)).toBeCloseTo(0.5, 3);
});
test("Euler drifts more than leapfrog and RK4 at the same step size", () => {
  const result = compare(preset(), 0.01, 1000);
  expect(Math.abs(result[1].values.at(-1))).toBeGreaterThan(
    Math.abs(result[0].values.at(-1)) * 100,
  );
  expect(Math.abs(result[2].values.at(-1))).toBeLessThan(1e-5);
});
test("forecast does not advance the system and all integrators are finite at overlap", () => {
  const s = new OrbitSystem();
  const initial = JSON.stringify(s.bodies);
  expect(forecast(s, 12)[0]).toHaveLength(12);
  expect(JSON.stringify(s.bodies)).toBe(initial);
  const b = preset().map((v) => ({ ...v, x: 0, y: 0 }));
  for (const method of ["euler", "leapfrog", "rk4"])
    expect(
      integrate(b, 0.001, method).every((v) => Number.isFinite(v.vx)),
    ).toBe(true);
});
