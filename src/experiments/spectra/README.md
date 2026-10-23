# SPECTRA browser port

Port of Saku Grossarth's SPECTRA 2.0 Khan Academy / ProcessingJS program. Open `/lab/spectra` from the Lab page. No ProcessingJS runtime, iframe, audio device, or external service is required.

## Preserved features

- Dual tone, pure sine, square, sawtooth, chirp, and white noise generators.
- 1024 Hz sample rate and 256-point radix-2 FFT.
- Conjugate pole and zero pairs with a real second-order IIR filter, including original DC normalization and protective limits.
- Input/output oscilloscope, spectrum with decaying peak hold, designed filter response, draggable z-plane, and scrolling spectrogram.
- Filter bypass, pause/run, reset, and original startup parameters.

## Port structure

- `dsp/fft.js`: pure in-place FFT and calibrated single-sided Hann-windowed spectrum.
- `dsp/biquad.js`: coefficients, analytic magnitude, and persistent filter state.
- `dsp/signals.js`: oscillators and source selection.
- `dsp/engine.js`: sample-time streaming, bounded history, spectrum, response, and preset definitions.
- `rendering/plots.js`: Canvas renderers, independent of React.
- `SpectraCanvas.jsx`: DPR-aware resize handling and canvas registration.
- `components/ZPlane.jsx`: touch/mouse input transformed through the SVG screen matrix. Numeric/range controls provide equivalent keyboard access.
- `Spectra.jsx`: transport, controls, one animation loop, visibility handling, and integration.

## Intentional changes from ProcessingJS

- Simulation advances at 1024 samples per second of active simulation time, instead of generating 256 samples per displayed frame. Long frame delays are capped at 100 ms; hidden/offscreen views do not catch up in the background.
- The spectrum uses the Hann window's actual coherent gain and includes the Nyquist bin. An on-bin amplitude-0.8 sine therefore measures about −1.94 dB relative to unit peak amplitude.
- Spectrogram slices arrive every 128 samples, with at most 80 slices (10 seconds). Parameter edits clear the history. Peak decay follows elapsed time.
- Square and sawtooth remain intentionally unbandlimited; aliasing is part of the original behavior. Sources changing frequency or type regenerate a capture so controls work while held.
- The original feedback guard of ±1000 and output guard of ±20 remain. A visible warning reports when the output guard has been used. The designed transfer curve describes the unclipped linear filter; a limited waveform will not exactly match that curve.
- Reduced-motion preference starts the capture held; Run remains an explicit choice.
- Signal, Filter, and Spectrogram views show only the relevant plots and controls. Switching views preserves the running engine, filter state, and spectrogram history.
- Focus workspace fills the viewport, keeps the active plots visible on desktop, and contains keyboard focus until Escape or Exit focus. Controls scroll independently when needed; narrow screens stack the plots and controls.

## Validation

`npx vitest run src/experiments/spectra/dsp/dsp.test.js src/app/App.test.jsx src/data/writeups/index.test.js`

Tests compare FFT results with a direct complex DFT, recover a known sine amplitude, compare impulse response with the analytic magnitude, verify notch attenuation, check sample-time invariance, exercise all sources, and verify bypass, bounded history, guards, reset, and existing portfolio content. Browser checks cover preset selection, pause/run, bypass, source-specific disabled controls, z-plane dragging, focus view, and 320/390/768/1440/2560px layouts without horizontal overflow.

## Stabilized oscilloscope

The scope has a separate 4096-sample display history (`dsp/scope.js`). Periodic sources choose the latest full window aligned to their absolute source phase. Dual tones use the common repeat frequency. Input and output share one start time, preserving relative filter phase. Fractional starts use linear interpolation of the same recorded samples. The optional slow mode drifts by 2% of a common cycle per simulated second. Noise/chirp have no stationary phase, so they display fresh real captures at 2 Hz. Changing filter parameters reseeds display history from the current reprocessed window, including while paused.

This display path does not change the generator, IIR, FFT, sample clock, or spectrogram hops. Tests verify stable periodic traces, paired input/output timing, nonperiodic hold cadence, immediate parameter edits, and unchanged FFT data.
