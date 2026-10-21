# KEPLER

Two-dimensional softened Newtonian gravity, G=1, epsilon=0.025. Point masses have no collision or merging model. Velocity Verlet/leapfrog, forward Euler, and RK4 use the same acceleration function; diagnostics use its matching softened potential.

The UI bounds live systems to 12 bodies, trajectories to 600 observations/body, diagnostics to 500 samples, and predictions to 180 integration steps. Method comparisons copy the current state and integrate each method for 1,000 timesteps. Body edits establish a new baseline. Controls and the parent engine persist across workspace views; tab changes pause motion.

`engine.test.js` covers force/potential consistency, momentum, a circular binary, numerical drift, and nonmutating predictions. The separate article at `/lab/kepler/writeup` explains model assumptions and numerical limitations.
