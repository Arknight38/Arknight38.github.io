export const METHODS = {
  leapfrog: "Leapfrog / velocity Verlet",
  euler: "Forward Euler",
  rk4: "Runge–Kutta 4",
};
export const SOFTENING = 0.025;
export function accelerations(bodies, epsilon = SOFTENING) {
  const a = bodies.map(() => ({ x: 0, y: 0 }));
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x,
        dy = bodies[j].y - bodies[i].y;
      const scale = 1 / Math.pow(dx * dx + dy * dy + epsilon * epsilon, 1.5);
      a[i].x += bodies[j].mass * dx * scale;
      a[i].y += bodies[j].mass * dy * scale;
      a[j].x -= bodies[i].mass * dx * scale;
      a[j].y -= bodies[i].mass * dy * scale;
    }
  return a;
}
export function diagnostics(bodies, epsilon = SOFTENING) {
  let kinetic = 0,
    potential = 0,
    angular = 0,
    px = 0,
    py = 0;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
    angular += b.mass * (b.x * b.vy - b.y * b.vx);
    px += b.mass * b.vx;
    py += b.mass * b.vy;
    for (let j = 0; j < i; j++)
      potential -=
        (b.mass * bodies[j].mass) /
        Math.sqrt(
          (b.x - bodies[j].x) ** 2 + (b.y - bodies[j].y) ** 2 + epsilon ** 2,
        );
  }
  return { kinetic, potential, energy: kinetic + potential, angular, px, py };
}
export function integrate(
  bodies,
  dt,
  method = "leapfrog",
  epsilon = SOFTENING,
) {
  if (!Object.hasOwn(METHODS, method) || !(dt > 0 && Number.isFinite(dt)))
    throw new Error("Choose a valid integrator and positive timestep.");
  const a = accelerations(bodies, epsilon);
  if (method === "euler")
    return bodies.map((b, i) => ({
      ...b,
      x: b.x + dt * b.vx,
      y: b.y + dt * b.vy,
      vx: b.vx + dt * a[i].x,
      vy: b.vy + dt * a[i].y,
    }));
  if (method === "leapfrog") {
    const next = bodies.map((b, i) => ({
      ...b,
      x: b.x + dt * b.vx + 0.5 * dt * dt * a[i].x,
      y: b.y + dt * b.vy + 0.5 * dt * dt * a[i].y,
    }));
    const a2 = accelerations(next, epsilon);
    return next.map((b, i) => ({
      ...b,
      vx: b.vx + 0.5 * dt * (a[i].x + a2[i].x),
      vy: b.vy + 0.5 * dt * (a[i].y + a2[i].y),
    }));
  }
  const derivative = (state) => {
    const acc = accelerations(state, epsilon);
    return state.map((b, i) => ({
      x: b.vx,
      y: b.vy,
      vx: acc[i].x,
      vy: acc[i].y,
    }));
  };
  const offset = (k, h) =>
    bodies.map((b, i) => ({
      ...b,
      x: b.x + h * k[i].x,
      y: b.y + h * k[i].y,
      vx: b.vx + h * k[i].vx,
      vy: b.vy + h * k[i].vy,
    }));
  const k1 = derivative(bodies),
    k2 = derivative(offset(k1, dt / 2)),
    k3 = derivative(offset(k2, dt / 2)),
    k4 = derivative(offset(k3, dt));
  return bodies.map((b, i) => {
    const next = { ...b };
    for (const key of ["x", "y", "vx", "vy"])
      next[key] +=
        (dt / 6) * (k1[i][key] + 2 * k2[i][key] + 2 * k3[i][key] + k4[i][key]);
    return next;
  });
}
function centered(bodies) {
  const total = bodies.reduce((s, b) => s + b.mass, 0);
  const center = { x: 0, y: 0, vx: 0, vy: 0 };
  for (const b of bodies)
    for (const k of Object.keys(center)) center[k] += (b.mass * b[k]) / total;
  return bodies.map((b, id) => ({
    ...b,
    id,
    ...Object.fromEntries(
      Object.keys(center).map((k) => [k, b[k] - center[k]]),
    ),
  }));
}
export const PRESETS = {
  binary: "Binary stars",
  planets: "Planetary system",
  three: "Three-body encounter",
};
export function preset(kind = "binary") {
  if (kind === "planets")
    return centered([
      { mass: 1, x: 0, y: 0, vx: 0, vy: 0 },
      { mass: 0.001, x: 1, y: 0, vx: 0, vy: 1 },
      { mass: 0.003, x: 1.8, y: 0, vx: 0, vy: Math.sqrt(1 / 1.8) },
    ]);
  if (kind === "three")
    return centered([
      { mass: 1, x: -0.8, y: 0, vx: 0.2, vy: -0.45 },
      { mass: 1, x: 0.8, y: 0, vx: -0.2, vy: 0.45 },
      { mass: 0.7, x: 0, y: 1.1, vx: 0.45, vy: -0.2 },
    ]);
  const v = Math.sqrt(1 / (1 + SOFTENING ** 2) ** 1.5 / 2);
  return centered([
    { mass: 1, x: -0.5, y: 0, vx: 0, vy: -v },
    { mass: 1, x: 0.5, y: 0, vx: 0, vy: v },
  ]);
}
export class OrbitSystem {
  constructor(bodies = preset(), method = "leapfrog", dt = 0.005) {
    this.method = method;
    this.dt = dt;
    this.reset(bodies);
  }
  reset(bodies) {
    if (
      !bodies.length ||
      bodies.length > 12 ||
      bodies.some(
        (b) =>
          !(b.mass > 0) ||
          ![b.mass, b.x, b.y, b.vx, b.vy].every(Number.isFinite),
      )
    )
      throw new Error(
        "Use 1–12 bodies with finite coordinates and positive masses.",
      );
    this.bodies = bodies.map((b) => ({ ...b }));
    this.time = 0;
    this.initial = diagnostics(this.bodies);
    this.history = [];
    this.trails = new Map();
    this.record();
  }
  configure(patch) {
    if (patch.method) this.method = patch.method;
    if (patch.dt) this.dt = patch.dt;
  }
  record() {
    const d = diagnostics(this.bodies);
    this.history.push({ time: this.time, ...d });
    this.history = this.history.slice(-500);
    for (const b of this.bodies) {
      const t = this.trails.get(b.id) || [];
      t.push({ x: b.x, y: b.y });
      this.trails.set(b.id, t.slice(-600));
    }
  }
  step(count = 1) {
    for (let k = 0; k < count; k++) {
      const next = integrate(this.bodies, this.dt, this.method);
      if (next.some((b) => ![b.x, b.y, b.vx, b.vy].every(Number.isFinite)))
        throw new Error("Numerical overflow. Reset or reduce the timestep.");
      this.bodies = next;
      this.time += this.dt;
    }
    this.record();
  }
}
export function forecast(system, steps = 180) {
  let bodies = system.bodies.map((b) => ({ ...b }));
  const paths = bodies.map(() => []);
  for (let i = 0; i < steps; i++) {
    bodies = integrate(bodies, system.dt, system.method);
    bodies.forEach((b, j) => paths[j].push({ x: b.x, y: b.y }));
  }
  return paths;
}
export function compare(bodies, dt, steps = 1000) {
  const baseline = diagnostics(bodies).energy,
    scale = Math.abs(baseline) || 1;
  return Object.keys(METHODS).map((method) => {
    let state = bodies.map((b) => ({ ...b }));
    const values = [0];
    for (let k = 0; k < steps; k++) {
      state = integrate(state, dt, method);
      if (k % 10 === 9)
        values.push((diagnostics(state).energy - baseline) / scale);
    }
    return { name: METHODS[method], values };
  });
}
