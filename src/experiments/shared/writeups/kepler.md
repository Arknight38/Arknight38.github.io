## Overview

KEPLER integrates a small Newtonian gravitational system in two dimensions. Bodies carry mass, position, and velocity; the same state drives the orbital view, force vectors, predicted paths, and conservation measurements. The opening planetary system is generated from a seed. Binary, planetary, three-body, and orbital-swarm families vary their masses, phases, spacing, and starting velocities while using the same force model.

The simulation uses normalized units with G = 1. It is intended for examining the behavior of numerical methods and interacting systems, rather than reproducing an astronomical ephemeris. Masses are softened point particles: they pass through one another, and the engine does not implement physical radii, impacts, merging, tides, or relativity.

System holds initial conditions and body editing. Orbits separates the view and integration controls from editing. Conservation contains measured energy and momentum, and Integrators runs three independent comparisons from a shared state. Switching views pauses the live simulation and keeps its state. The writeup is a separate page so it does not compete with the orbital plane.

## Implementation scope

The pair-force calculation, softened potential, velocity-Verlet, forward-Euler and RK4 integrators, seeded initial-condition generator, trajectory prediction, and energy/momentum diagnostics are implemented in JavaScript here. Canvas renders those calculated positions and histories. React manages the controls; there is no external orbital solver behind the animation.

## Setting up an orbital system

Start with Binary stars and run a few orbits. Both bodies move; there is no fixed central star in the force calculation. Fit bodies adjusts the viewing radius without changing their coordinates or velocities. Trails retain up to 600 observed positions per body, while the optional dashed paths integrate the current state forward for 180 timesteps.

The generated planetary family contains a much heavier central body and five lighter companions; the swarm increases that to ten companions. Its velocities are approximate circular starting conditions, not an exact analytic solution of the interacting three-body system. The initial center-of-mass position and velocity are removed from each preset to avoid a distracting overall drift.

With Select nearest body active, select a body through the selector or by clicking near it. Mass and coordinate inputs provide a keyboard alternative to selecting on the canvas. An added body starts at rest, so setting a velocity before running is usually useful. The Spawn at click tool determines position only; it does not infer a circular velocity.

Every edit pauses motion and establishes a fresh measurement baseline. Removing a body changes the physical system and its energy, so comparing the edited result against the old baseline would be misleading. Reset system restores the most recently established initial conditions. The seed identifies a generated arrangement; entering the same seed and family reconstructs the same bodies. New system advances the seed, while Reset system replays the most recently established conditions. Randomness belongs to setup, not to the numerical force calculation.

## Launching and comparing initial conditions

The default canvas tool launches a new body. Pointer-down records its position; dragging previews a line, and release converts that displacement into initial velocity. A line one distance unit long supplies one velocity unit in its direction. The preview is an input vector, not an orbital prediction. A small default mass keeps a launched body from immediately dominating a planetary system, and its mass and velocity remain editable afterward.

The line gesture establishes a new measurement baseline before integration resumes. The numerical solver remains deterministic for the chosen bodies, method, and timestep. This distinction makes it possible to explore different encounters and still reproduce an interesting one. Steps per frame changes how quickly simulated time passes on screen without changing the physical timestep.

The seeded generator starts from an unsigned 32-bit state:

```javascript
state = (Math.imul(1664525, state) + 1013904223) >>> 0;
return state / 4294967296;
```

This small reproducible generator selects initial conditions; it is not intended for cryptography or statistical research. Generated planetary velocities approximate circular motion around the central mass with a small variation. They do not guarantee long-term stability after mutual perturbations or a newly launched body.

## Pairwise acceleration and softening

For every unordered pair, the engine calculates a displacement and applies equal-and-opposite forces. Accelerations differ when masses differ because acceleration divides force by the receiving body's mass. The pair loop uses a softened inverse-distance factor:

```javascript
const scale = 1 / Math.pow(dx * dx + dy * dy + epsilon * epsilon, 1.5);
a[i].x += bodies[j].mass * dx * scale;
a[j].x -= bodies[i].mass * dx * scale;
```

The y components use the same rule.

The fixed softening length is 0.025 distance units. It removes the singularity at zero separation and makes overlapping bodies numerically defined. It also changes the physical model at small separations; close approaches should not be interpreted as unsoftened point-mass scattering.

Energy diagnostics use the matching potential, `−m_i m_j / sqrt(r² + epsilon²)`. Using an unsoftened potential beside softened accelerations would report an apparent energy error even if the integration were otherwise consistent. A numerical derivative test checks that this potential produces the implemented force.

## Leapfrog, Euler, and RK4

The default integrator is velocity Verlet, a time-centered form of leapfrog. It advances positions using current acceleration, evaluates acceleration at the new positions, and combines both accelerations for the velocity update:

```javascript
xNext = x + dt * vx + 0.5 * dt * dt * ax;
vxNext = vx + 0.5 * dt * (ax + axNext);
```

These expressions summarize the corresponding position and velocity updates in `integrate`.

Forward Euler uses the current velocity to advance position and the current acceleration to advance velocity. It is useful here because its accumulated orbital error is easy to compare with the other methods. RK4 evaluates four derivatives and combines them with the usual 1:2:2:1 weights. All three methods use the same acceleration function, timestep, and initial state in a comparison.

Higher local order and long-term conservation are different properties. Leapfrog preserves a symplectic structure for this position-dependent force, but it does not conserve the displayed energy exactly. RK4 can have much smaller short-term error while showing different long-time behavior. The discussion of these distinctions in [MIT's Numerical Algorithms text](https://people.csail.mit.edu/jsolomon/share/book/numerical_book_sub2.pdf) provides useful background.

## Trails, predictions, and vectors

A trail records the trajectory already calculated by the live engine. A predicted path is a separate integration from the current state using the current method and timestep. Prediction does not move the live system, and it is not an analytic solution or a confidence interval. In a sensitive three-body encounter, nearby initial conditions can produce different later paths.

The vector selector distinguishes acceleration from net gravitational force. Force multiplies acceleration by the selected body's mass, so the two overlays can look different in a system with unequal masses. Lengths share an automatically chosen scale to remain visible; the overlay is a relative visualization rather than an arrow measured in screen pixels per force unit.

## Measuring numerical drift

Conservation displays kinetic energy, softened potential energy, total energy, angular momentum about the origin, and both linear-momentum components. The graphs retain 500 observations and show energy change relative to the baseline and absolute angular-momentum change.

Integrators runs each method at timesteps 0.005, 0.02, and 0.1 for the same ten time units. It uses copies of either the current system or a fixed circular-binary reference, leaving the live state unchanged. The finer timestep takes more steps to reach the same endpoint; increasing dt does not secretly extend the experiment. The table reports signed final energy change and the largest absolute energy change measured at every integration step, normalized by the magnitude of initial energy.

Tests check pair-force balance, potential/force consistency, a bound circular binary, angular-momentum preservation, and the relative energy drift of Euler, leapfrog, and RK4. They also verify that forecasting does not advance the original system and that softened overlap remains finite.

## Experiment: an unsuitable method or timestep

Open Integrators, select Circular binary reference, and run the comparison. The fixed reference has two unit masses, separation one, and circular velocities calculated for the softened force. It separates numerical error from complicated encounters. Select a plotted timestep to compare the three methods, then use the table to compare timestep sizes.

The following values are calculated by the engine for ten simulation time units. They are percentages of |E(0)|, with positive values meaning the numerical system gained total energy.

| Method | dt | Final energy change | Largest absolute change |
| --- | --- | --- | --- |
| Forward Euler | 0.005 | +14.4683% | 14.4683% |
| Forward Euler | 0.02 | +34.1507% | 34.1507% |
| Forward Euler | 0.1 | +57.5877% | 57.5877% |
| Leapfrog | 0.005 | +3.1453e-8% | 6.2184e-8% |
| Leapfrog | 0.1 | +0.004890% | 0.009659% |
| RK4 | 0.1 | −0.002222% | 0.002222% |

For this reference, even the fine Euler run adds substantial energy, making an otherwise bound orbit expand artificially. Coarsening leapfrog increases its error by orders of magnitude. Its final error can also be smaller than an intermediate excursion, which is why the maximum-error column matters. RK4's smaller error here does not establish long-term symplectic behavior or guarantee accuracy in a close encounter. Different initial conditions can have a different error scale.

## A reproducibility problem

The first setup repeatedly loaded the same arrangement. That made numerical comparisons reproducible, but gave visitors little variation between experiments. Injecting random forces during integration would create variety at the cost of changing the model and invalidating conservation measurements.

The revised design confines randomness to initial conditions and exposes its seed. New system changes that seed; Reset restores the chosen bodies. Removing center-of-mass position and velocity keeps a generated system centered without forcing its central star to remain fixed. Tests check that equal seeds reproduce equal bodies, different seeds change them, and generated systems begin with effectively zero net momentum.

## Further work

Adaptive timesteps would help resolve close encounters, but introducing them into a symplectic method requires care. Collision models, explicit units, and barycentric camera tracking are separate extensions. The current laboratory keeps the force model and numerical methods small enough that their behavior can be inspected directly.
