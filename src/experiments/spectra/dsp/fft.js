// Radix-2 Cooley–Tukey FFT, ported from SPECTRA 2.0's ProcessingJS source.
export function fft(re, im) {
  const n = re.length;
  if (n < 2 || n & (n - 1) || im.length !== n)
    throw new RangeError("FFT requires equal power-of-two buffers.");
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let length = 2; length <= n; length *= 2) {
    const angle = (-2 * Math.PI) / length;
    const cs = Math.cos(angle),
      sn = Math.sin(angle);
    for (let start = 0; start < n; start += length) {
      let wr = 1,
        wi = 0;
      for (let k = 0; k < length / 2; k++) {
        const u = start + k,
          v = u + length / 2;
        const tr = re[v] * wr - im[v] * wi,
          ti = re[v] * wi + im[v] * wr;
        re[v] = re[u] - tr;
        im[v] = im[u] - ti;
        re[u] += tr;
        im[u] += ti;
        const nextWr = wr * cs - wi * sn;
        wi = wr * sn + wi * cs;
        wr = nextWr;
      }
    }
  }
}
export const toDb = (value) => 20 * Math.log10(Math.max(value, 1e-6));
export function spectrum(samples) {
  const n = samples.length;
  const re = new Float64Array(n),
    im = new Float64Array(n);
  let windowSum = 0;
  for (let i = 0; i < n; i++) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    windowSum += window;
    re[i] = samples[i] * window;
  }
  fft(re, im);
  const result = new Float64Array(n / 2 + 1);
  for (let i = 0; i < result.length; i++) {
    const factor = i === 0 || i === n / 2 ? 1 : 2;
    result[i] = toDb((factor * Math.hypot(re[i], im[i])) / windowSum);
  }
  return result;
}
