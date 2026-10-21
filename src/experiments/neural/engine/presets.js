// Verified against the original spiral generator; held-out points stay excluded.
export const SPIRAL_PRESET = Object.freeze({
  config: Object.freeze({ depth: 2, width: 8, activation: "tanh", seed: 42 }),
  optimizer: "adam",
  rate: 0.01,
});
