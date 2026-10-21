export const SAMPLE_RATE = 1024;
export const SOURCES = [
  ["dual", "Dual tone"],
  ["sine", "Pure sine"],
  ["square", "Square"],
  ["saw", "Sawtooth"],
  ["chirp", "Chirp"],
  ["noise", "White noise"],
];
const TAU = Math.PI * 2;
export class SignalGenerator {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }
  reset() {
    this.phase1 = this.phase2 = this.sweepPos = 0;
    this.currentFrequency = 32;
  }
  sample({ source, f1, f2 }) {
    let value = 0,
      frequency = f1;
    if (source === "dual")
      value = 0.65 * Math.sin(this.phase1) + 0.3 * Math.sin(this.phase2);
    if (source === "sine") value = 0.8 * Math.sin(this.phase1);
    if (source === "square") value = Math.sin(this.phase1) >= 0 ? 0.75 : -0.75;
    if (source === "saw") value = 0.75 * (1 - (2 * this.phase1) / TAU);
    if (source === "chirp") {
      frequency = 20 + 400 * this.sweepPos;
      value = 0.75 * Math.sin(this.phase1);
      this.sweepPos = (this.sweepPos + 1 / (SAMPLE_RATE * 3)) % 1;
    }
    if (source === "noise") value = this.random() * 1.6 - 0.8;
    this.phase1 = (this.phase1 + (TAU * frequency) / SAMPLE_RATE) % TAU;
    this.phase2 = (this.phase2 + (TAU * f2) / SAMPLE_RATE) % TAU;
    this.currentFrequency = frequency;
    return value;
  }
}
