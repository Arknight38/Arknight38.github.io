import { clamp } from "../dsp/biquad.js";
import { SAMPLE_RATE } from "../dsp/signals.js";
const COLORS = {
  background: "#141a17",
  grid: "#354138",
  muted: "#a9b6a9",
  input: "#80b9ee",
  output: "#d7ff3f",
  response: "#ffb577",
};
function chart(surface, minY, maxY, xTicks, yTicks) {
  const { ctx, width, height, dpr } = surface;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  const plot = {
    x: 48,
    y: 16,
    w: Math.max(1, width - 66),
    h: Math.max(1, height - 52),
  };
  ctx.font = "12px system-ui";
  ctx.lineWidth = 1;
  for (const [fraction, label] of xTicks) {
    const x = plot.x + fraction * plot.w;
    ctx.strokeStyle = COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(x, plot.y);
    ctx.lineTo(x, plot.y + plot.h);
    ctx.stroke();
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign =
      fraction === 0 ? "left" : fraction === 1 ? "right" : "center";
    ctx.fillText(label, x, height - 12);
  }
  for (const value of yTicks) {
    const y = plot.y + ((maxY - value) / (maxY - minY)) * plot.h;
    ctx.strokeStyle = COLORS.grid;
    ctx.beginPath();
    ctx.moveTo(plot.x, y);
    ctx.lineTo(plot.x + plot.w, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(String(value), plot.x - 9, y + 4);
  }
  return { ...plot, minY, maxY };
}
function path(ctx, values, plot, color) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x, plot.y, plot.w, plot.h);
  ctx.clip();
  ctx.beginPath();
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = color;
  for (let i = 0; i < values.length; i++) {
    const x = plot.x + (i / (values.length - 1)) * plot.w,
      y = plot.y + ((plot.maxY - values[i]) / (plot.maxY - plot.minY)) * plot.h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}
const frequencyTicks = (width) =>
  width < 420
    ? [
        [0, "0 Hz"],
        [0.5, "256"],
        [1, "512 Hz"],
      ]
    : [
        [0, "0 Hz"],
        [0.25, "128"],
        [0.5, "256"],
        [0.75, "384"],
        [1, "512 Hz"],
      ];
export function drawScope(surface, engine) {
  const capture = engine.scope.window(
    engine.settings,
    engine.scopeMode || "stable",
  );
  let peak = 1;
  for (let i = 0; i < capture.input.length; i++)
    peak = Math.max(
      peak,
      Math.abs(capture.input[i]),
      engine.settings.filterOn ? Math.abs(capture.output[i]) : 0,
    );
  const range = Math.ceil(peak * 1.15 * 2) / 2;
  const plot = chart(
    surface,
    -range,
    range,
    [
      [0, "0 ms"],
      [0.5, "125"],
      [1, "249 ms"],
    ],
    [-range, 0, range],
  );
  path(surface.ctx, capture.input, plot, COLORS.input);
  if (engine.settings.filterOn)
    path(surface.ctx, capture.output, plot, COLORS.output);
}
export function drawSpectrum(surface, engine) {
  const plot = chart(
    surface,
    -90,
    20,
    frequencyTicks(surface.width),
    [-90, -60, -30, 0, 20],
  );
  const ctx = surface.ctx,
    binWidth = plot.w / engine.spectrum.length;
  for (let i = 0; i < engine.spectrum.length; i++) {
    const v = clamp(engine.spectrum[i], -90, 20),
      h = ((v + 90) / 110) * plot.h;
    ctx.fillStyle = COLORS.output;
    ctx.fillRect(
      plot.x + i * binWidth,
      plot.y + plot.h - h,
      Math.max(1, binWidth * 0.72),
      h,
    );
    const peak = clamp(engine.peaks[i], -90, 20),
      y = plot.y + ((20 - peak) / 110) * plot.h;
    ctx.fillStyle = COLORS.response;
    ctx.fillRect(plot.x + i * binWidth, y, Math.max(1, binWidth * 0.72), 2);
  }
}
export function drawResponse(surface, engine) {
  const plot = chart(
    surface,
    -60,
    30,
    frequencyTicks(surface.width),
    [-60, -30, 0, 30],
  );
  path(surface.ctx, engine.response, plot, COLORS.response);
  if (engine.settings.source === "noise") return;
  const frequency = engine.generator.currentFrequency;
  const x = plot.x + (frequency / (SAMPLE_RATE / 2)) * plot.w;
  const ctx = surface.ctx;
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "#b8c0b0";
  ctx.beginPath();
  ctx.moveTo(x, plot.y);
  ctx.lineTo(x, plot.y + plot.h);
  ctx.stroke();
  ctx.setLineDash([]);
}
export function drawSpectrogram(surface, engine) {
  const plot = chart(
    surface,
    0,
    -10,
    frequencyTicks(surface.width),
    [-10, -5, 0],
  );
  const ctx = surface.ctx,
    rowHeight = plot.h / 80,
    binWidth = plot.w / engine.spectrum.length;
  for (let row = 0; row < engine.history.length; row++) {
    const values = engine.history[row],
      y = plot.y + (80 - engine.history.length + row) * rowHeight;
    for (let bin = 0; bin < values.length; bin++) {
      const v = clamp((values[bin] + 90) / 90, 0, 1);
      ctx.fillStyle = `hsl(${235 - v * 180} ${35 + v * 50}% ${9 + v * 62}%)`;
      ctx.fillRect(plot.x + bin * binWidth, y, binWidth + 0.4, rowHeight + 0.4);
    }
  }
}
export const RENDERERS = {
  scope: drawScope,
  spectrum: drawSpectrum,
  response: drawResponse,
  spectrogram: drawSpectrogram,
};
