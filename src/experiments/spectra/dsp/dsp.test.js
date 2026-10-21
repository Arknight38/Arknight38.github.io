import { describe, test, expect } from "vitest";
import { fft, spectrum } from "./fft.js";
import { Biquad, coefficients, magnitude } from "./biquad.js";
import { SignalGenerator, SAMPLE_RATE, SOURCES } from "./signals.js";
import { SpectraEngine, DEFAULTS, PRESETS, FFT_SIZE } from "./engine.js";

describe("ported radix-2 FFT", () => {
  test("matches a direct DFT for a nontrivial complex input", () => {
    const real = [0.2, -0.4, 0.8, 0.1, -0.7, 0.3, 0.9, -0.2],
      imag = [0.1, 0.2, -0.1, 0.3, 0.6, 0, -0.2, 0.5];
    const re = Float64Array.from(real),
      im = Float64Array.from(imag);
    fft(re, im);
    for (let k = 0; k < 8; k++) {
      let expectedRe = 0,
        expectedIm = 0;
      for (let n = 0; n < 8; n++) {
        const angle = (-2 * Math.PI * k * n) / 8;
        expectedRe += real[n] * Math.cos(angle) - imag[n] * Math.sin(angle);
        expectedIm += real[n] * Math.sin(angle) + imag[n] * Math.cos(angle);
      }
      expect(re[k]).toBeCloseTo(expectedRe, 11);
      expect(im[k]).toBeCloseTo(expectedIm, 11);
    }
  });
  test("Hann-normalized spectrum recovers a known sine amplitude and bin", () => {
    const samples = Float64Array.from(
      { length: 256 },
      (_, i) => 0.8 * Math.sin((2 * Math.PI * 32 * i) / 1024),
    );
    const bins = spectrum(samples);
    expect(bins.indexOf(Math.max(...bins))).toBe(8);
    expect(bins[8]).toBeCloseTo(20 * Math.log10(0.8), 2);
    expect(bins.length).toBe(129);
  });
  test("rejects invalid FFT buffers", () => {
    expect(() => fft(new Float64Array(7), new Float64Array(7))).toThrow(
      RangeError,
    );
  });
});
describe("pole/zero biquad", () => {
  test("normalizes gain at DC and cancels a unit-circle zero", () => {
    const c = coefficients(DEFAULTS);
    expect(magnitude(c, 0)).toBeCloseTo(1, 12);
    expect(magnitude(c, DEFAULTS.zeroA)).toBeLessThan(1e-10);
  });
  test("time-domain impulse agrees with the analytic transfer function", () => {
    const c = coefficients({ ...DEFAULTS, poleR: 0.95 });
    const filter = new Biquad(c),
      impulse = Array.from({ length: 4096 }, (_, i) =>
        filter.sample(i === 0 ? 1 : 0),
      );
    for (const omega of [0.1, 0.6, 1.2, 2.7]) {
      let real = 0,
        imag = 0;
      impulse.forEach((v, n) => {
        real += v * Math.cos(omega * n);
        imag -= v * Math.sin(omega * n);
      });
      expect(Math.hypot(real, imag)).toBeCloseTo(magnitude(c, omega), 8);
    }
  });
  test("DC zeros do not produce NaN coefficients", () => {
    const c = coefficients({ ...DEFAULTS, zeroA: 0, zeroR: 1 });
    expect(Object.values(c).every(Number.isFinite)).toBe(true);
    expect(magnitude(c, 0)).toBe(0);
  });
});
describe("signal generation and streaming engine", () => {
  test("all six original sources generate finite bounded samples", () => {
    for (const [source] of SOURCES) {
      const generator = new SignalGenerator(() => 0.25);
      for (let i = 0; i < 4096; i++) {
        const v = generator.sample({ ...DEFAULTS, source });
        expect(Number.isFinite(v)).toBe(true);
        expect(Math.abs(v)).toBeLessThanOrEqual(1);
      }
    }
  });
  test("samples follow simulation time independently of display update size", () => {
    const a = new SpectraEngine(),
      b = new SpectraEngine();
    a.advance(1);
    for (let i = 0; i < 128; i++) b.advance(1 / 128);
    expect(a.sampleCount).toBe(FFT_SIZE + SAMPLE_RATE);
    expect(b.sampleCount).toBe(a.sampleCount);
    expect(Array.from(b.input)).toEqual(Array.from(a.input));
    expect(Array.from(b.output)).toEqual(Array.from(a.output));
    expect(a.history.length).toBe(9);
  });
  test("the notch preset actually removes the 96 Hz tone", () => {
    const engine = new SpectraEngine(PRESETS.notch.settings);
    engine.advance(2);
    const before = spectrum(engine.input),
      after = spectrum(engine.output);
    expect(after[24]).toBeLessThan(before[24] - 40);
    expect(after[8]).toBeGreaterThan(before[8] - 3);
  });
  test("bypass measures the input and parameter edits do not advance the capture", () => {
    const engine = new SpectraEngine();
    const sampleCount = engine.sampleCount;
    engine.configure({ ...DEFAULTS, filterOn: false, poleR: 0.7 });
    expect(engine.sampleCount).toBe(sampleCount);
    expect(Array.from(engine.spectrum)).toEqual(
      Array.from(spectrum(engine.input)),
    );
    expect(engine.history.length).toBe(1);
  });
  test("spectrogram history is bounded to ten seconds and reset restores defaults", () => {
    const engine = new SpectraEngine();
    engine.advance(12);
    expect(engine.history.length).toBe(80);
    engine.reset();
    expect(engine.settings).toEqual(DEFAULTS);
    expect(engine.history.length).toBe(1);
  });
  test("large gain is guarded and reported rather than poisoning the plots", () => {
    const engine = new SpectraEngine({
      ...DEFAULTS,
      zeroA: 0.004,
      poleR: 0.98,
      source: "sine",
    });
    engine.advance(1);
    expect(
      [...engine.output, ...engine.spectrum, ...engine.response].every(
        Number.isFinite,
      ),
    ).toBe(true);
    expect(Math.max(...engine.output.map(Math.abs))).toBeLessThanOrEqual(20);
    expect(engine.filter.limited).toBe(true);
  });
});
