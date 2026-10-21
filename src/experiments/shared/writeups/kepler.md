## Overview

KEPLER integrates a small Newtonian gravitational system in two dimensions. Bodies carry mass, position, and velocity; the same state drives the orbital view, force vectors, predicted paths, and conservation measurements. The default binary begins in an approximately circular configuration, while the planetary and three-body presets provide less symmetric starting points.

The simulation uses normalized units with G = 1. It is intended for examining the behavior of numerical methods and interacting systems, rather than reproducing an astronomical ephemeris. Masses are softened point particles: they pass through one another, and the engine does not implement physical radii, impacts, merging, tides, or relativity.

System holds initial conditions and body editing. Orbits separates the view and integration controls from editing. Conservation contains measured energy and momentum, and Integrators runs three independent comparisons from a shared state. Switching views pauses the live simulation and keeps its state. The writeup is a separate page so it does not compete with the orbital plane.

## Setting up an orbital system

Start with Binary stars and run a few orbits. Both bodies move; there is no fixed central star in the force calculation. Fit bodies adjusts the viewing radius without changing their coordinates or velocities. Trails retain up to 600 observed positions per body, while the optional dashed paths integrate the current state forward for 180 timesteps.

The planetary preset contains a much heavier central body and two lighter companions. Its velocities are approximate circular starting conditions, not an exact analytic solution of the interacting three-body system. The initial center-of-mass position and velocity are removed from each preset to avoid a distracting overall drift.

In System, select a body through the selector or by clicking near it. Mass and coordinate inputs provide a keyboard alternative to selecting on the canvas. An added body starts at rest, so setting a velocity before running is usually useful. The Spawn at click tool determines position only; it does not infer a circular velocity.

Every edit pauses motion and establishes a fresh measurement baseline. Removing a body changes the physical system and its energy, so comparing the edited result against the old baseline would be misleading. Reset system restores the most recently established initial conditions. Reloading a preset restores its original arrangement.

## Pairwise acceleration and softening

For every unordered pair, the engine calculates a displacement and applies equal-and-opposite forces. Accelerations differ when masses differ because acceleration divides force by the receiving body's mass. The pair loop uses a softened inverse-distance factor:

```javascript
const scale = 1 / Math.pow(dx * dx + dy * dy + epsilon * epsilon, 1.5);
a[i].x += bodies[j].mass * dx * scale;
a[j].x -= bodies[i].mass * dx * scale;
```

Source: `kepler/engine.js`, inside `accelerations`; the y components use the same rule.

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

Integrators runs 1,000 timesteps per method from copies of the current bodies. It leaves the live state unchanged. This controls the initial conditions and simulated duration rather than comparing three animations that happen to run at different speeds. Changing the timestep changes the simulated duration of that comparison as well as its resolution.

Tests check pair-force balance, potential/force consistency, a bound circular binary, angular-momentum preservation, and the relative energy drift of Euler, leapfrog, and RK4. They also verify that forecasting does not advance the original system and that softened overlap remains finite.

## Further work

Adaptive timesteps would help resolve close encounters, but introducing them into a symplectic method requires care. Collision models, explicit units, and barycentric camera tracking are separate extensions. The current laboratory keeps the force model and numerical methods small enough that their behavior can be inspected directly.
