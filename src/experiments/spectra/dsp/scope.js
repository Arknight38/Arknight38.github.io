import { SAMPLE_RATE } from "./signals.js";
const CAPACITY = 4096;
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
// Display-only history. FFT input, sample clock and filter state stay untouched.
export class ScopeCapture {
  constructor(length = 256) {
    this.length = length;
    this.input = new Float64Array(CAPACITY);
    this.output = new Float64Array(CAPACITY);
    this.first = 0;
    this.end = 0;
    this.cache = null;
  }
  push(input, output, sampleIndex) {
    this.input[sampleIndex % CAPACITY] = input;
    this.output[sampleIndex % CAPACITY] = output;
    this.end = sampleIndex + 1;
    this.first = Math.max(this.first, this.end - CAPACITY);
  }
  seed(input, output, first) {
    this.first = this.end = first;
    this.cache = null;
    for (let i = 0; i < input.length; i++)
      this.push(input[i], output[i], first + i);
  }
  window(settings, mode = "stable") {
    const periodic = !["noise", "chirp"].includes(settings.source);
    const key = `${settings.source}/${settings.f1}/${settings.f2}/${mode}`;
    // Nonperiodic signals have no repeatable phase: show fresh real captures at 2 Hz.
    const bucket = Math.floor(this.end / (SAMPLE_RATE / 2));
    if (!periodic && this.cache?.key === key && this.cache.bucket === bucket)
      return this.cache;
    let start = this.end - this.length;
    if (periodic) {
      const frequency =
        settings.source === "dual"
          ? gcd(settings.f1, settings.f2)
          : settings.f1;
      const period = SAMPLE_RATE / frequency;
      const phase =
        mode === "slow" ? (((this.end / SAMPLE_RATE) * 0.02) % 1) * period : 0;
      // Latest complete capture with a consistent absolute source phase.
      start = Math.floor((start - 1 - phase) / period) * period + phase;
      start = Math.max(this.first, start);
    }
    start = Math.max(this.first, Math.min(start, this.end - this.length));
    const read = (ring) =>
      Float64Array.from({ length: this.length }, (_, i) => {
        const position = start + i,
          index = Math.floor(position),
          fraction = position - index;
        return (
          ring[index % CAPACITY] * (1 - fraction) +
          ring[Math.min(index + 1, this.end - 1) % CAPACITY] * fraction
        );
      });
    const result = {
      input: read(this.input),
      output: read(this.output),
      start,
      key,
      bucket,
    };
    this.cache = result;
    return result;
  }
}
