import { Biquad, coefficients, magnitude } from "./biquad.js";
import { spectrum, toDb } from "./fft.js";
import { SAMPLE_RATE, SignalGenerator } from "./signals.js";
import { ScopeCapture } from "./scope.js";
export const FFT_SIZE = 256;
export const DEFAULTS = Object.freeze({
  source: "dual",
  f1: 32,
  f2: 96,
  poleR: 0.85,
  poleA: Math.PI / 4,
  zeroR: 1,
  zeroA: Math.PI / 2,
  filterOn: true,
});
export const PRESETS = {
  original: { label: "Original SPECTRA", settings: DEFAULTS },
  notch: {
    label: "Remove the 96 Hz tone",
    settings: {
      ...DEFAULTS,
      poleR: 0.8,
      poleA: (Math.PI * 2 * 96) / SAMPLE_RATE,
      zeroA: (Math.PI * 2 * 96) / SAMPLE_RATE,
    },
  },
  resonance: {
    label: "Resonance at 128 Hz",
    settings: {
      ...DEFAULTS,
      source: "noise",
      poleR: 0.96,
      poleA: Math.PI / 4,
      zeroR: 0.7,
    },
  },
  sweep: {
    label: "Sweep through a notch",
    settings: {
      ...DEFAULTS,
      source: "chirp",
      poleR: 0.85,
      poleA: Math.PI / 2,
      zeroA: Math.PI / 2,
    },
  },
};
export class SpectraEngine {
  constructor(settings = DEFAULTS) {
    this.reset(settings);
  }
  reset(settings = DEFAULTS) {
    this.settings = { ...settings };
    this.generator = new SignalGenerator();
    this.filter = new Biquad(coefficients(settings));
    this.inputRing = new Float64Array(FFT_SIZE);
    this.outputRing = new Float64Array(FFT_SIZE);
    this.input = new Float64Array(FFT_SIZE);
    this.output = new Float64Array(FFT_SIZE);
    this.scope = new ScopeCapture(FFT_SIZE);
    this.position = 0;
    this.sampleCount = 0;
    this.fraction = 0;
    this.sinceHistory = 0;
    this.history = [];
    this.peaks = new Float64Array(FFT_SIZE / 2 + 1).fill(-120);
    this.generate(FFT_SIZE);
    this.analyze();
    this.addHistory();
  }
  configure(settings) {
    const sourceChanged =
      settings.source !== this.settings.source ||
      settings.f1 !== this.settings.f1 ||
      settings.f2 !== this.settings.f2;
    this.settings = { ...settings };
    if (sourceChanged) {
      this.reset(settings);
      return;
    }
    this.filter.coefficients = coefficients(settings);
    this.filter.reset();
    // Re-evaluate the captured window even when the transport is paused.
    for (let i = 0; i < FFT_SIZE; i++) {
      const index = (this.position + i) % FFT_SIZE;
      this.outputRing[index] = this.filter.sample(this.inputRing[index]);
    }
    this.history = [];
    this.peaks.fill(-120);
    this.sinceHistory = 0;
    this.analyze();
    this.scope.seed(this.input, this.output, this.sampleCount - FFT_SIZE);
    this.addHistory();
  }
  generate(count) {
    for (let i = 0; i < count; i++) {
      const x = this.generator.sample(this.settings);
      this.inputRing[this.position] = x;
      this.outputRing[this.position] = this.filter.sample(x);
      this.scope.push(x, this.outputRing[this.position], this.sampleCount);
      this.position = (this.position + 1) % FFT_SIZE;
      this.sampleCount++;
    }
  }
  advance(seconds) {
    this.fraction += seconds * SAMPLE_RATE;
    let count = Math.floor(this.fraction);
    this.fraction -= count;
    // Fixed sample-time spectrogram hops, independent of monitor refresh rate.
    while (count > 0) {
      const block = Math.min(count, 128 - this.sinceHistory);
      this.generate(block);
      this.sinceHistory += block;
      count -= block;
      if (this.sinceHistory >= 128) {
        this.analyze();
        this.addHistory();
        this.sinceHistory = 0;
      }
    }
    this.analyze();
    const decay = seconds * 16;
    for (let i = 0; i < this.peaks.length; i++)
      this.peaks[i] = Math.max(this.spectrum[i], this.peaks[i] - decay);
  }
  analyze() {
    for (let i = 0; i < FFT_SIZE; i++) {
      const index = (this.position + i) % FFT_SIZE;
      this.input[i] = this.inputRing[index];
      this.output[i] = this.outputRing[index];
    }
    this.spectrum = spectrum(this.settings.filterOn ? this.output : this.input);
    this.response = Float64Array.from({ length: 129 }, (_, i) =>
      toDb(magnitude(this.filter.coefficients, (Math.PI * i) / 128)),
    );
    this.rms = Math.sqrt(
      (this.settings.filterOn ? this.output : this.input).reduce(
        (sum, x) => sum + x * x,
        0,
      ) / FFT_SIZE,
    );
  }
  addHistory() {
    this.history.push(Float64Array.from(this.spectrum));
    if (this.history.length > 80) this.history.shift();
  }
}
