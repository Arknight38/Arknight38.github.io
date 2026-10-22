## Overview

RESONANCE evolves a classical two-dimensional wave field. Each grid cell stores a scalar displacement, and neighboring cells determine how that displacement changes. The image comes from the calculated field: interference and diffraction are consequences of the update rule and geometry, rather than animated textures.

The default medium has 96 × 96 cells over a unit square. The model is a constant-speed scalar wave equation with damping, prescribed point emitters, and fixed-displacement obstacles. It is not a quantum simulation, a fluid solver, or a full acoustic model with density, pressure, and impedance changes.

Medium contains the evolving field and obstacle tools. Emitters exposes positions, frequency, amplitude, and phase. Measurements separates the probe history and frequency analysis from editing. Switching views pauses the solver but retains the field and probe samples. The numeric history remains available until the probe moves, the field is cleared, or a medium parameter changes.

## Implementation scope

The grid solver, source injection, obstacle rasterization, boundary sponge, probe history, Hann window, and direct DFT are implemented in JavaScript in this project. The field is rendered cell by cell through Canvas; its propagation patterns do not come from a physics library or prerecorded animation. React supplies the interface. Frequency analysis uses a small direct DFT, while SPECTRA's separate implementation uses an FFT.

## Two time levels and a spatial grid

The undamped mathematical model is the scalar wave equation:

```text
∂²u/∂t² = c²(∂²u/∂x² + ∂²u/∂y²)
```

Here u is displacement and c is the propagation speed. Centered finite differences replace the time derivative with `(u_next − 2u + u_previous) / dt²` and each spatial derivative with its three-point neighbor difference divided by dx². Combining them gives a five-point spatial stencil and two retained time levels:

```text
u_next[x,y] = 2u[x,y] − u_previous[x,y]
            + (c dt / dx)² (u[x−1,y] + u[x+1,y]
                           + u[x,y−1] + u[x,y+1] − 4u[x,y])
```

For smooth resolved solutions, these centered differences are second-order approximations in time and space. Obstacles and driven cells impose additional constraints on that update.

The solver retains current, previous, and next displacement arrays. Interior cells use a five-point Laplacian: the four axial neighbors minus four times the center. Uniform grid spacing is `dx = 1 / (size − 1)`.

For an undamped cell, the update has the form:

```javascript
next[i] = 2 * u[i] - previous[i] + r2 * lap;
```

The implemented damped form is:

```javascript
next[i] = (2 * u[i] - (1 - q) * previous[i] + r2 * lap) / (1 + q);
```

Source: `resonance/engine.js`, inside `step`. Here `r2` is the squared Courant number and `q = gamma × dt`. The damped equation is `u_tt + 2 gamma u_t = c² ∇²u`; centering the first time derivative produces the `(1 − q)` numerator coefficient and `(1 + q)` denominator. The sponge increases gamma near the boundary.

The arrays rotate after each step, avoiding a new field allocation for every simulated instant. Fixed edges and obstacle cells remain zero. A pulse initializes equal displacements at the current and previous levels, representing an approximately stationary initial deformation rather than an imposed directional velocity.

The scalar discretization resolves finite wavelengths. Features only a few cells wide can show grid dispersion, and a point source has grid-dependent behavior. These are limitations of the model's spatial resolution rather than evidence of an effect in an ideal continuous medium.

## Choosing a stable timestep

The explicit two-dimensional scheme requires `c × dt / dx ≤ 1 / sqrt(2)` for the equal-spacing five-point stencil. RESONANCE fixes that ratio at 0.4 and derives `dt` from the selected wave speed and grid spacing. Raising wave speed therefore reduces the timestep instead of silently crossing the stability boundary.

With 96 cells across the unit domain, dx = 1/95. At c = 1, the limit is approximately dt ≤ 0.007443; the implemented dt is 0.4/95 ≈ 0.004211. At c = 3, dt becomes approximately 0.001404. A higher speed therefore advances less simulated time per step. The interface reports both dt and the Courant number so that dependency remains visible.

The condition controls stability of this stencil; satisfying it does not guarantee small phase error, adequate wavelength resolution, or accurate obstacle geometry. Exceeding it allows some grid modes to grow numerically even without a physical source. The lab derives dt rather than offering an unstable setting as normal operation.

Changing speed, damping, or boundary treatment clears the field and probe history. Reusing the previous time level after changing its time interval would give it an inconsistent velocity interpretation. Clearing is a simple, visible way to start a new numerical experiment.

Steps per frame controls simulation throughput separately from the physical timestep. The displayed time advances by the actual integrated timesteps. Hidden browser documents suspend the animation clock, so returning to the page does not attempt to simulate an unbounded backlog. The [University of Illinois wave-equation module](https://heath.cs.illinois.edu/iem/pde/wavecfl/) provides background on why explicit wave schemes require a timestep restriction; this laboratory uses the two-dimensional stencil above.

## Emitters and interference

A driven emitter prescribes sinusoidal displacement at one interior cell after the stencil update. Its value is amplitude multiplied by `sin(2π × frequency × time + phase)`. Emitters therefore inject energy through an imposed displacement, rather than applying a force to a modeled mechanical source.

The Two emitters preset begins with equal frequencies and phases. In Emitters, change one phase and compare the resulting field. The superposition pattern develops through propagation across the grid; there is no separate interference formula drawing bands on the canvas.

Sources can be added with the canvas tool or at the probe using a button. Coordinate inputs provide a keyboard alternative. The model permits eight emitters, rejects placement on obstacles or outer edges, and prevents two emitters from silently occupying the same cell. Painting a wall over an emitter removes that source.

## Walls, openings, and boundaries

Drawing a wall fixes its cells at zero displacement. Erasing restores those cells to the medium. Dragging previews a straight segment and release fills the full line between its endpoints, including intermediate cells. Thickness selects a one-, three-, or five-cell square brush around that line. A click places a segment using the selected length and horizontal or vertical direction, rather than a single isolated cell. Buttons at the probe provide the same placement and erasure without a pointer gesture. Segments clip at the interior boundary; they never write beyond the field arrays.

The Double opening preset places a driven source on one side of a barrier with two gaps. Waves passing through the gaps spread into the region behind the barrier. The finite grid sets both the gap geometry and the resolved wavelengths, so changing emitter frequency can change the observed pattern.

The Fixed reflective edge option holds the domain boundary at zero. The Damped edge option adds a sponge layer near the border. Its damping gradually increases toward the edge to reduce outgoing reflections, but it is not a perfectly matched layer or an exact nonreflecting boundary condition. The Driven cavity preset uses fixed boundaries and a low-frequency central source as a starting point for observing the response of an enclosed domain.

## Probe measurements and frequency bins

A probe records displacement at one selected cell after every solver step. Its history is bounded to 512 samples. Moving it clears that history so a single plot does not combine measurements from different locations.

Frequency analysis uses the latest 256 samples, removes their mean, and applies a Hann window. A direct discrete Fourier transform produces a one-sided amplitude spectrum. This is a bounded DFT, not an FFT implementation. Its frequency axis uses the current sample interval: bin k has frequency `k / (256 × dt)`. The display reports the strongest bin and the bin spacing rather than implying arbitrary frequency precision.

Window-gain correction scales a sinusoid on an exact bin back to its amplitude. The analysis test constructs such a sinusoid and verifies both its peak frequency and amplitude. Frequencies between bins spread across neighboring bins, so the strongest-bin readout should be interpreted at the displayed resolution.

## Display and energy diagnostics

Signed displacement uses lime and coral for opposite signs. Displacement squared displays an instantaneous squared value; it is not labeled as time-averaged intensity. Color gain changes the rendering scale without changing the field, and values outside that color range are clipped only for display.

The energy readout combines a velocity estimate from successive time levels with finite spatial differences. It is a useful field diagnostic, not an exactly conserved discrete invariant. Emitters add energy, ordinary damping and the sponge remove it, and fixed obstacles constrain the field. Tests check a quiet field, pulse symmetry, fixed walls, source phase, bounded probe history, stable timestep selection, spectral calibration, and reduced reflected energy with a sponge.

## A geometry problem: a wall that looked like a pixel

The initial obstacle button wrote one cell. That was a valid fixed-displacement constraint, but it did not match the visible idea of placing a wall. A visitor needed to make a long stroke just to construct a useful barrier.

Wall placement now rasterizes a complete segment on release, with a visible preview and selectable thickness. A click uses an explicit length and direction; the probe controls provide the same operation through the keyboard. The model still stores a binary cell mask. Every covered cell clears current, previous, and next displacement, avoiding a leftover value when a new wall is placed through an existing wave. Tests verify a multi-cell barrier, clipping at the field boundary, zero displacement on the barrier after propagation, and complete erasure.

## Further work

Larger grids, spatially varying materials, better absorbing boundaries, and automatic frequency sweeps would extend the current model. An FFT could replace the small DFT if longer probe histories become useful. Each extension should preserve a clear distinction between the physical equation, its numerical approximation, and the color image used to inspect it.
