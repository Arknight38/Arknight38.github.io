export function writeFieldPixels(pixels, values, walls, gain, display) {
  for (let i = 0; i < values.length; i++) {
    const at = i * 4,
      u = values[i];
    if (walls[i]) {
      pixels[at] = 208;
      pixels[at + 1] = 216;
      pixels[at + 2] = 207;
    } else if (display === "square") {
      const v = Math.min(1, u * u * gain);
      pixels[at] = Math.round(20 + 190 * v);
      pixels[at + 1] = Math.round(29 + 200 * v);
      pixels[at + 2] = 45;
    } else {
      const v = Math.max(-1, Math.min(1, u * gain));
      pixels[at] = Math.round(22 + (v < 0 ? -v * 184 : v * 40));
      pixels[at + 1] = Math.round(32 + (v > 0 ? v * 189 : -v * 40));
      pixels[at + 2] = Math.round(24 + (v < 0 ? -v * 101 : v * 6));
    }
    pixels[at + 3] = 255;
  }
}
export function createFieldRenderer(size) {
  const surface = document.createElement("canvas");
  surface.width = surface.height = size;
  const bufferContext = surface.getContext("2d", { alpha: false });
  const image = bufferContext.createImageData(size, size);
  return (ctx, w, h, field, gain, display, preview, wallWidth) => {
    const cw = w / size,
      ch = h / size;
    writeFieldPixels(image.data, field.u, field.walls, gain, display);
    bufferContext.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(surface, 0, 0, w, h);
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
