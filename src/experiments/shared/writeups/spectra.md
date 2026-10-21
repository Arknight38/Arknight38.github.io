## Overview

SPECTRA connects three views of one system: a signal changing over time, its frequency content, and the poles and zeros that shape a digital filter. The browser application is a port of an original Khan Academy / ProcessingJS project, with the signal generator, radix-2 FFT, and second-order filter separated from their rendering code.

The plots share actual computed samples. Moving a zero changes the filter coefficients, the filtered waveform, and the measured spectrum; the response curve independently evaluates the same coefficient set. The point of the workstation is making those relationships inspectable rather than presenting an animated waveform with unrelated controls.

## Start with a frequency cancellation

Load **Remove the 96 Hz tone**. The input contains tones at 32 Hz and 96 Hz. The preset places a conjugate zero pair at the angle corresponding to 96 Hz, with radius one, and a pole pair nearby inside the unit circle.

1. Compare the blue input and lime output in the oscilloscope. The output should lose the faster ripple contributed by the second tone.
2. Find the 96 Hz bin in the FFT. Its reduction is the measured consequence of the filter, while the response panel shows the designed notch.
3. Bypass the filter to compare against the original input, then reactivate it.
4. Move the zero angle away from 96 Hz. The tone returns as the cancellation moves elsewhere.

The default scope is phase-stabilized so this change can be studied without the waveform racing sideways. Pause holds the source capture while leaving the filter controls usable. The **Resonance at 128 Hz** preset provides a different experiment: broadband noise excites a narrow band emphasized by poles near the unit circle.

## Turning poles and zeros into a biquad

The z-plane edits conjugate pairs, preserving real coefficients. For a pair at radius r and angle θ, expanding the two factors produces a quadratic with a middle coefficient of −2r cos(θ) and a final coefficient of r².

The unnormalized numerator and denominator construction appears directly in `spectra/dsp/biquad.js`:

```javascript
let b0 = 1,
  b1 = -2 * zeroR * Math.cos(zeroA),
  b2 = zeroR ** 2;
const a1 = -2 * poleR * Math.cos(poleA),
  a2 = poleR ** 2;
```

The transfer function is `(b0 + b1 z⁻¹ + b2 z⁻²) / (1 + a1 z⁻¹ + a2 z⁻²)`. The implementation normally rescales the numerator for unit DC gain. When the numerator is effectively zero at DC, it retains the raw numerator instead of dividing by that zero.

Pole radius controls how persistent the recursive response becomes; moving a pole closer to the unit circle sharpens resonance. A zero on the unit circle creates an exact cancellation at its angle. The interface constrains pole radii below one and moves both members of a conjugate pair together.

## Filtering actual samples

The time-domain implementation retains two previous inputs and two previous outputs. Each new sample evaluates the difference equation:

```javascript
const raw = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
```

Source: `spectra/dsp/biquad.js`, excerpt from `Biquad.sample`.

Those state variables give the filter memory. The response curve is not used to paint an approximate output: the waveform comes from this recurrence, and its FFT is calculated afterward. This creates two independent ways to investigate the same system—an analytic frequency response and a measured response to generated input.

A numerical guard limits the displayed output to ±20 and reports when that guard activates. Large-gain configurations should therefore be interpreted with that status in mind: a limited waveform no longer represents the unconstrained linear filter. Changing coefficients clears filter state and reprocesses the captured input, giving paused inspection an immediate result.

## FFT bins, windowing, and amplitude

The simulation samples at 1024 Hz and analyzes 256 samples at a time. That gives 4 Hz bin spacing and a Nyquist frequency of 512 Hz. The displayed spectrum contains the nonnegative half of the transform, including DC and Nyquist.

Before the FFT, samples are multiplied by a Hann window. This reduces the discontinuity at the capture boundaries and spreads less energy into distant bins when the capture does not contain an integer number of cycles. It also changes amplitude, so the implementation normalizes by the window sum.

The one-sided amplitude conversion in `spectra/dsp/fft.js` is:

```javascript
const factor = i === 0 || i === n / 2 ? 1 : 2;
result[i] = toDb((factor * Math.hypot(re[i], im[i])) / windowSum);
```

Doubling interior bins accounts for their negative-frequency counterparts; DC and Nyquist remain unpaired. Values are expressed in decibels relative to unit peak amplitude. Bin spacing is a property of this capture size, not a promise that arbitrary neighboring tones can always be distinguished simply because their frequencies differ by 4 Hz.

## A stable scope without slowing the system

The scope keeps a separate 4096-sample display history. Periodic sources select a complete window aligned to a consistent source phase. Dual tones use their common repeat frequency; input and output use the same start time, preserving the filter's relative phase shift.

**Slow drift** gradually moves that display phase by 2% of a common cycle per simulated second. Noise and chirp do not have a fixed repeating phase, so they use real held captures refreshed twice per second. Fractional window starts are interpolated from the recorded samples.

This is a presentation choice. The generator, filter, FFT, and spectrogram continue on their existing sample clock. The stable view does not lower the signal frequencies or replace the output with a synthetic drawing. Immediately after reset, enough history must accumulate to choose a phase-aligned window.

## Reading the spectrogram and source behavior

The spectrogram adds a slice every 128 samples, or 125 ms. Its bounded history holds 80 rows, corresponding to up to ten seconds. Frequency runs horizontally, newer time appears at the bottom, and color represents magnitude from −90 to 0 dB. A fixed tone forms a vertical feature; the chirp moves across frequency as it sweeps.

Source choices expose different aspects of the filter. A sine isolates one frequency, dual tones show selective cancellation, and noise probes a broad range at once. Square and sawtooth generators introduce harmonics and are intentionally unbandlimited, matching the original experiment. Harmonics above Nyquist can alias into the visible band.

The application produces no audio. The sample rate is chosen for this visual experiment, and its frequencies and time axes should be read in that context. Background or offscreen SPECTRA views stop advancing rather than accumulating an invisible backlog.

## Concepts explored and verification

The project joins complex-plane geometry, recursive difference equations, Fourier analysis, window normalization, and sample-time scheduling. These concepts meet at observable checks: a unit-circle zero should suppress its tone, and the transform of an impulse response should agree with the analytic transfer function.

Tests compare the FFT with a direct DFT, recover a known sine amplitude, verify notch rejection, and check that different animation-frame increments produce the same samples. Separate scope tests establish phase stability without modifying FFT data. The distinction between DSP state and display state is part of the implementation, not just its folder structure.

## Things to do next

Useful extensions include selectable capture lengths, explicit trigger controls, and a bandlimited oscillator comparison. Averaging could make noise spectra easier to interpret, while a visible impulse-response view would connect the recurrence to its frequency response more directly. Those additions should retain the same rule: each plot must correspond to a defined computation and a clearly labeled time or frequency scale.
