export function fieldDraw(field, gain, display, preview, wallWidth) {
  return (ctx, w, h) => {
    const n = field.size,
      cw = w / n,
      ch = h / n;
    ctx.fillStyle = "#101813";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = y * n + x,
          u = field.u[i],
          v = Math.max(-1, Math.min(1, u * gain));
        ctx.fillStyle = field.walls[i]
          ? "#d0d8cf"
          : display === "square"
            ? `rgb(${Math.round(20 + 190 * Math.min(1, u * u * gain))} ${Math.round(29 + 200 * Math.min(1, u * u * gain))} 45)`
            : `rgb(${Math.round(22 + (v < 0 ? -v * 184 : v * 40))} ${Math.round(32 + (v > 0 ? v * 189 : -v * 40))} ${Math.round(24 + (v < 0 ? -v * 101 : v * 6))})`;
        ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5);
      }
    if (preview) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, wallWidth * cw);
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo((preview.start.x + 0.5) * cw, (preview.start.y + 0.5) * ch);
      ctx.lineTo((preview.end.x + 0.5) * cw, (preview.end.y + 0.5) * ch);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.font = "13px system-ui";
    ctx.lineWidth = 1.5;
    field.sources.forEach((s) => {
      const x = (s.x + 0.5) * cw,
        y = (s.y + 0.5) * ch;
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fillText(`S${s.id + 1}`, x + 9, y - 7);
    });
    const p = field.probe;
    ctx.strokeStyle = "#a9bdff";
    ctx.beginPath();
    ctx.moveTo((p.x + 0.5) * cw - 8, (p.y + 0.5) * ch);
    ctx.lineTo((p.x + 0.5) * cw + 8, (p.y + 0.5) * ch);
    ctx.moveTo((p.x + 0.5) * cw, (p.y + 0.5) * ch - 8);
    ctx.lineTo((p.x + 0.5) * cw, (p.y + 0.5) * ch + 8);
    ctx.stroke();
  };
}
