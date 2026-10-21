export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function coefficients({ poleR, poleA, zeroR, zeroA }) {
  let b0 = 1,
    b1 = -2 * zeroR * Math.cos(zeroA),
    b2 = zeroR ** 2;
  const a1 = -2 * poleR * Math.cos(poleA),
    a2 = poleR ** 2;
  const top = b0 + b1 + b2,
    bottom = 1 + a1 + a2;
  // Retain the original DC normalization; a DC zero uses the raw numerator.
  if (Math.abs(top) > 1e-5) {
    const gain = bottom / top;
    b0 *= gain;
    b1 *= gain;
    b2 *= gain;
  }
  return { b0, b1, b2, a1, a2 };
}
export function magnitude(c, w) {
  const nr = c.b0 + c.b1 * Math.cos(w) + c.b2 * Math.cos(2 * w);
  const ni = -c.b1 * Math.sin(w) - c.b2 * Math.sin(2 * w);
  const dr = 1 + c.a1 * Math.cos(w) + c.a2 * Math.cos(2 * w);
  const di = -c.a1 * Math.sin(w) - c.a2 * Math.sin(2 * w);
  return Math.sqrt((nr * nr + ni * ni) / Math.max(1e-16, dr * dr + di * di));
}
export class Biquad {
  constructor(c) {
    this.coefficients = c;
    this.reset();
  }
  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.limited = false;
  }
  sample(x) {
    const { b0, b1, b2, a1, a2 } = this.coefficients;
    const raw =
      b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
    const y = Number.isFinite(raw) ? raw : 0;
    this.limited ||= !Number.isFinite(raw) || Math.abs(y) > 20;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = clamp(y, -1000, 1000);
    return clamp(y, -20, 20);
  }
}
