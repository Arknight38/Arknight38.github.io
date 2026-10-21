# RESONANCE

96×96 two-dimensional scalar wave field on a unit square. Five-point spatial stencil and centered two-level time integration, fixed Courant number 0.4, dt=0.4 dx/c. Damping uses the centered velocity term; fixed obstacles/edges hold displacement at zero. The optional sponge adds damping near the edge and is not an exact open boundary.

Up to eight sinusoidal emitters prescribe displacement. Pulses initialize equal current/previous displacement; wall painting clears covered values and removes covered sources. Medium configuration changes clear wave history to avoid inconsistent time levels. Probe history retains 512 samples. Its last 256 samples feed a mean-removed, Hann-windowed, gain-corrected direct DFT. Frequency bins use simulated dt. The energy readout is a finite-difference estimate, not an exactly conserved discrete invariant.

Tests cover the CFL limit, pulse symmetry, fixed walls, driven phase, probe history, interpolated wall painting, spectral calibration, and sponge energy removal. The model and its limitations are documented separately at `/lab/resonance/writeup`.
