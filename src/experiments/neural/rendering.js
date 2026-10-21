const ZERO = "#f3a388",
  ONE = "#d7ff3f";
export function probabilityColor(p) {
  return `rgb(${Math.round(105 + p * 15)} ${Math.round(48 + p * 95)} ${Math.round(46 - p * 12)})`;
}
export function decisionDraw(network, points, probe, selected, showTest) {
  return (ctx, width, height) => {
    const pad = 34,
      w = width - 2 * pad,
      h = height - 2 * pad,
      n = 64;
    const px = (x) => pad + ((x + 1) / 2) * w,
      py = (y) => pad + ((1 - y) / 2) * h;
    ctx.fillStyle = "#151b16";
    ctx.fillRect(0, 0, width, height);
    const grid = Array.from({ length: n + 1 }, () => new Float64Array(n + 1));
    for (let y = 0; y <= n; y++)
      for (let x = 0; x <= n; x++)
        grid[y][x] = network.forward([
          (x / n) * 2 - 1,
          1 - (y / n) * 2,
        ]).probability;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = probabilityColor(grid[y][x]);
        ctx.fillRect(
          pad + (x / n) * w,
          pad + (y / n) * h,
          w / n + 0.5,
          h / n + 0.5,
        );
        // Marching squares: interpolate p=0.5 crossings on each cell edge.
        const corners = [
            [x, y],
            [x + 1, y],
            [x + 1, y + 1],
            [x, y + 1],
          ],
          crossings = [];
        for (let e = 0; e < 4; e++) {
          const [ax, ay] = corners[e],
            [bx, by] = corners[(e + 1) % 4],
            a = grid[ay][ax],
            b = grid[by][bx];
          if (a < 0.5 !== b < 0.5) {
            const t = (0.5 - a) / (b - a);
            crossings.push([
              pad + ((ax + (bx - ax) * t) / n) * w,
              pad + ((ay + (by - ay) * t) / n) * h,
            ]);
          }
        }
        ctx.strokeStyle = "#f0f4d4";
        ctx.lineWidth = 1.25;
        for (let e = 0; e + 1 < crossings.length; e += 2) {
          ctx.beginPath();
          ctx.moveTo(...crossings[e]);
          ctx.lineTo(...crossings[e + 1]);
          ctx.stroke();
        }
      }
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    for (const v of [-1, -0.5, 0, 0.5, 1]) {
      ctx.strokeStyle = "#ffffff1d";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px(v), pad);
      ctx.lineTo(px(v), pad + h);
      ctx.moveTo(pad, py(v));
      ctx.lineTo(pad + w, py(v));
      ctx.stroke();
      ctx.fillStyle = "#c4ceba";
      ctx.fillText(String(v), px(v), height - 10);
      ctx.fillText(String(v), 16, py(v) + 4);
    }
    for (const p of points) {
      if (p.test && !showTest) continue;
      ctx.beginPath();
      if (p.label) ctx.rect(px(p.x) - 5, py(p.y) - 5, 10, 10);
      else ctx.arc(px(p.x), py(p.y), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = p.test ? "#151b16" : p.label ? ONE : ZERO;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = p.label ? ONE : ZERO;
      ctx.stroke();
      if (selected === p.id) {
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), 10, 0, Math.PI * 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(probe.x) - 7, py(probe.y));
    ctx.lineTo(px(probe.x) + 7, py(probe.y));
    ctx.moveTo(px(probe.x), py(probe.y) - 7);
    ctx.lineTo(px(probe.x), py(probe.y) + 7);
    ctx.stroke();
  };
}
export function activationDraw(network, layer, neuron) {
  return (ctx, width, height) => {
    const n = 20;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const a = network.forward([
          ((x + 0.5) / n) * 2 - 1,
          1 - ((y + 0.5) / n) * 2,
        ]).activations[layer + 1][neuron];
        const p =
          network.activation === "tanh" && layer < network.layers.length - 1
            ? (a + 1) / 2
            : network.activation === "relu" && layer < network.layers.length - 1
              ? a / (1 + a)
              : a;
        ctx.fillStyle = probabilityColor(p);
        ctx.fillRect(
          (x / n) * width,
          (y / n) * height,
          width / n + 1,
          height / n + 1,
        );
      }
  };
}
export function lossDraw(history) {
  return (ctx, w, h) => {
    ctx.fillStyle = "#151b16";
    ctx.fillRect(0, 0, w, h);
    const left = 44,
      right = w - 15,
      top = 16,
      bottom = h - 28;
    const y = (v) =>
      top + (1 - (Math.log10(Math.max(v, 0.0001)) + 4) / 5) * (bottom - top);
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#b8c5af";
    for (const v of [1, 0.1, 0.01, 0.001]) {
      ctx.strokeStyle = "#35402f";
      ctx.beginPath();
      ctx.moveTo(left, y(v));
      ctx.lineTo(right, y(v));
      ctx.stroke();
      ctx.fillText(String(v), 3, y(v) + 4);
    }
    const start = history[0]?.step || 0,
      end = Math.max(start + 1, history.at(-1)?.step || 1);
    for (const key of ["train", "test"]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
      ctx.strokeStyle = key === "train" ? ONE : ZERO;
      ctx.lineWidth = 1.8;
      ctx.setLineDash(key === "test" ? [4, 4] : []);
      ctx.beginPath();
      let begun = false;
      for (const p of history) {
        if (p[key] == null) continue;
        const x = left + ((p.step - start) / (end - start)) * (right - left);
        if (!begun) {
          ctx.moveTo(x, y(p[key]));
          begun = true;
        } else ctx.lineTo(x, y(p[key]));
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#b8c5af";
    ctx.fillText(String(start), left, h - 8);
    ctx.textAlign = "right";
    ctx.fillText(`${end} updates`, right, h - 8);
  };
}
