import { seededRandom } from "./network.js";
export const DATASETS = {
  xor: "XOR / four corners",
  circles: "Concentric circles",
  spiral: "Two spirals",
};
export function makeDataset(kind = "xor", seed = 42) {
  if (kind === "xor")
    return [
      { x: -0.65, y: -0.65, label: 0 },
      { x: 0.65, y: -0.65, label: 1 },
      { x: -0.65, y: 0.65, label: 1 },
      { x: 0.65, y: 0.65, label: 0 },
    ].map((p, id) => ({ ...p, id, test: false }));
  const random = seededRandom(seed + 913),
    points = [];
  const perClass = kind === "spiral" ? 50 : 40;
  for (let label = 0; label < 2; label++)
    for (let i = 0; i < perClass; i++) {
      const t = i / perClass;
      const angle =
        kind === "spiral" ? t * Math.PI * 3 + label * Math.PI : t * Math.PI * 2;
      const radius = kind === "spiral" ? 0.08 + 0.78 * t : label ? 0.76 : 0.32;
      const jitter = () => (random() - 0.5) * 0.065;
      points.push({
        id: points.length,
        x: radius * Math.cos(angle) + jitter(),
        y: radius * Math.sin(angle) + jitter(),
        label,
        test: i % 5 === 0,
      });
    }
  return points;
}
