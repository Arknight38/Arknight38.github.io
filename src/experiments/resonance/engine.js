export const GRID_SIZE = 96;
export const PRESETS = {
  interference: "Two emitters",
  slits: "Double opening",
  cavity: "Driven cavity",
  pulse: "Single pulse",
};
export class WaveField {
  constructor(kind = "interference", size = GRID_SIZE) {
    this.size = size;
    this.dx = 1 / (size - 1);
    this.c = 1;
    this.courant = 0.4;
    this.damping = 0.08;
    this.boundary = "sponge";
    this.reset(kind);
  }
  configure(patch) {
    Object.assign(this, patch);
    this.clearWaves();
  }
  setProbe(x, y) {
    this.probe = { x, y };
    this.history = [];
  }
  removeSource(id) {
    this.sources = this.sources.filter((s) => s.id !== id);
  }
  updateSource(id, patch) {
    const source = this.sources.find((s) => s.id === id);
    if (!source) return;
    const next = { ...source, ...patch };
    if (
      next.x < 1 ||
      next.y < 1 ||
      next.x >= this.size - 1 ||
      next.y >= this.size - 1 ||
      this.walls[next.y * this.size + next.x]
    )
      throw new Error("Move the emitter to a free interior cell.");
    if (
      this.sources.some((s) => s.id !== id && s.x === next.x && s.y === next.y)
    )
      throw new Error("An emitter already occupies that cell.");
    Object.assign(source, next);
  }
  get dt() {
    return (this.courant * this.dx) / this.c;
  }
  reset(kind = "interference") {
    const n = this.size;
    this.u = new Float64Array(n * n);
    this.previous = new Float64Array(n * n);
    this.next = new Float64Array(n * n);
    this.walls = new Uint8Array(n * n);
    this.time = 0;
    this.steps = 0;
    this.history = [];
    this.probe = { x: Math.round(0.7 * (n - 1)), y: Math.round(0.5 * (n - 1)) };
    this.sources =
      kind === "pulse"
        ? []
        : [
            {
              id: 0,
              x: Math.round(0.25 * (n - 1)),
              y: Math.round(0.4 * (n - 1)),
              frequency: 6,
              amplitude: 0.7,
              phase: 0,
            },
            {
              id: 1,
              x: Math.round(0.25 * (n - 1)),
              y: Math.round(0.6 * (n - 1)),
              frequency: 6,
              amplitude: 0.7,
              phase: 0,
            },
          ];
    this.boundary = kind === "cavity" ? "reflect" : "sponge";
    if (kind === "slits") {
      this.sources = [
        {
          id: 0,
          x: Math.round(0.18 * (n - 1)),
          y: Math.round(0.5 * (n - 1)),
          frequency: 6,
          amplitude: 0.7,
          phase: 0,
        },
      ];
      const x = Math.round((n - 1) / 2);
      for (let y = 1; y < n - 1; y++)
        if (Math.abs(y / n - 0.4) > 0.035 && Math.abs(y / n - 0.6) > 0.035)
          this.wall(x, y, true);
    }
    if (kind === "cavity")
      this.sources = [
        {
          id: 0,
          x: Math.round((n - 1) / 2),
          y: Math.round((n - 1) / 2),
          frequency: Math.SQRT2 / 2,
          amplitude: 0.3,
          phase: 0,
        },
      ];
    if (kind === "pulse")
      this.pulse(Math.round((n - 1) / 2), Math.round((n - 1) / 2));
  }
  wall(x, y, on = true) {
    const n = this.size;
    if (x < 1 || y < 1 || x >= n - 1 || y >= n - 1) return;
    const index = y * n + x;
    this.walls[index] = +on;
    if (on) {
      this.u[index] = this.previous[index] = this.next[index] = 0;
      this.sources = this.sources.filter((s) => s.x !== x || s.y !== y);
    }
  }
  paint(x1, y1, x2, y2, on = true, width = 1) {
    const length = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= length; i++)
      for (let dy = -Math.floor(width / 2); dy <= Math.floor(width / 2); dy++)
        for (let dx = -Math.floor(width / 2); dx <= Math.floor(width / 2); dx++)
          this.wall(
            Math.round(x1 + ((x2 - x1) * i) / length) + dx,
            Math.round(y1 + ((y2 - y1) * i) / length) + dy,
            on,
          );
  }
  pulse(x, y, amplitude = 0.8) {
    const n = this.size;
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const xx = x + dx,
          yy = y + dy;
        if (xx < 1 || yy < 1 || xx >= n - 1 || yy >= n - 1) continue;
        const index = yy * n + xx;
        if (this.walls[index]) continue;
        const value = amplitude * Math.exp(-(dx * dx + dy * dy) / 5);
        this.u[index] += value;
        this.previous[index] += value;
      }
  }
  addSource(x, y) {
    if (this.sources.length >= 8) throw new Error("Use up to eight emitters.");
    if (
      x < 1 ||
      y < 1 ||
      x >= this.size - 1 ||
      y >= this.size - 1 ||
      this.walls[y * this.size + x]
    )
      throw new Error("Place emitters inside the medium, away from walls.");
    if (this.sources.some((s) => s.x === x && s.y === y))
      throw new Error("An emitter already occupies that cell.");
    const id = Math.max(-1, ...this.sources.map((s) => s.id)) + 1;
    this.sources.push({ id, x, y, frequency: 6, amplitude: 0.7, phase: 0 });
    return id;
  }
  clearWaves() {
    this.u.fill(0);
    this.previous.fill(0);
    this.next.fill(0);
    this.history = [];
    this.time = 0;
    this.steps = 0;
  }
  coefficients() {
    const key = [
      this.size,
      this.dx,
      this.c,
      this.courant,
      this.damping,
      this.boundary,
    ].join(":");
    if (this._coefficientKey !== key) {
      const n = this.size,
        dt = this.dt;
      const previous = new Float64Array(n * n),
        inverse = new Float64Array(n * n);
      for (let y = 1; y < n - 1; y++)
        for (let x = 1; x < n - 1; x++) {
          const i = y * n + x,
            edge = Math.min(x, y, n - 1 - x, n - 1 - y);
          const gamma =
            this.damping +
            (this.boundary === "sponge"
              ? 20 * Math.max(0, 1 - edge / 12) ** 2
              : 0);
          const q = gamma * dt;
          previous[i] = 1 - q;
          inverse[i] = 1 / (1 + q);
        }
      this._coefficientKey = key;
      this._coefficients = { previous, inverse };
    }
    return this._coefficients;
  }
  step(count = 1) {
    const n = this.size,
      dt = this.dt,
      r2 = this.courant ** 2;
    const coefficients = this.coefficients();
    for (let k = 0; k < count; k++) {
      this.next.fill(0);
      for (let y = 1; y < n - 1; y++)
        for (let x = 1; x < n - 1; x++) {
          const i = y * n + x;
          if (this.walls[i]) continue;
          const lap =
            this.u[i - 1] +
            this.u[i + 1] +
            this.u[i - n] +
            this.u[i + n] -
            4 * this.u[i];
          this.next[i] =
            (2 * this.u[i] -
              coefficients.previous[i] * this.previous[i] +
              r2 * lap) *
            coefficients.inverse[i];
        }
      this.time += dt;
      for (const source of this.sources) {
        const i = source.y * n + source.x;
        if (!this.walls[i])
          this.next[i] =
            source.amplitude *
            Math.sin(2 * Math.PI * source.frequency * this.time + source.phase);
      }
      const old = this.previous;
      this.previous = this.u;
      this.u = this.next;
      this.next = old;
      this.steps++;
      const value = this.u[this.probe.y * n + this.probe.x];
      if (!Number.isFinite(value))
        throw new Error("Field overflow. Clear the waves and reduce forcing.");
      this.history.push(value);
      if (this.history.length > 512) this.history.shift();
    }
  }
  measure() {
    let kinetic = 0,
      potential = 0,
      max = 0;
    const n = this.size,
      dt = this.dt;
    for (let y = 1; y < n - 1; y++)
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        if (this.walls[i]) continue;
        const v = (this.u[i] - this.previous[i]) / dt;
        kinetic += 0.5 * v * v * this.dx ** 2;
        potential +=
          0.5 *
          this.c ** 2 *
          ((this.u[i + 1] - this.u[i]) ** 2 + (this.u[i + n] - this.u[i]) ** 2);
        max = Math.max(max, Math.abs(this.u[i]));
      }
    return { energy: kinetic + potential, max };
  }
}
export function probeSpectrum(values, dt) {
  const n = 256;
  if (values.length < n) return [];
  const data = values.slice(-n),
    mean = data.reduce((s, v) => s + v, 0) / n;
  const bins = [];
  for (let k = 0; k <= n / 2; k++) {
    let re = 0,
      im = 0;
    for (let j = 0; j < n; j++) {
      const v =
          (data[j] - mean) *
          (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (n - 1))),
        angle = (2 * Math.PI * k * j) / n;
      re += v * Math.cos(angle);
      im -= v * Math.sin(angle);
    }
    bins.push({
      frequency: k / (n * dt),
      amplitude:
        ((k > 0 && k < n / 2 ? 2 : 1) * Math.hypot(re, im)) / ((n - 1) / 2),
    });
  }
  return bins;
}
