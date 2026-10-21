// ARK1 compatibility requires retaining the C++ vector order when weights tie.
export const MAX_BYTES = 512 * 1024;
export function buildModel(bytes) {
  if (bytes.length > MAX_BYTES)
    throw new Error("Choose a file of 512 KiB or less.");
  const frequencies = new Uint32Array(256);
  for (const byte of bytes) frequencies[byte]++;
  const nodes = [];
  for (let symbol = 0; symbol < 256; symbol++)
    if (frequencies[symbol])
      nodes.push({
        id: nodes.length,
        symbol,
        weight: frequencies[symbol],
        left: -1,
        right: -1,
        active: true,
      });
  const leafCount = nodes.length,
    merges = [];
  while (true) {
    let first = -1,
      second = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].active) continue;
      if (first === -1 || nodes[i].weight < nodes[first].weight) {
        second = first;
        first = i;
      } else if (second === -1 || nodes[i].weight < nodes[second].weight)
        second = i;
    }
    if (second === -1) break;
    nodes[first].active = false;
    nodes[second].active = false;
    const parent = {
      id: nodes.length,
      symbol: null,
      weight: nodes[first].weight + nodes[second].weight,
      left: first,
      right: second,
      active: true,
    };
    nodes.push(parent);
    merges.push({
      left: first,
      right: second,
      parent: parent.id,
      weight: parent.weight,
    });
  }
  const codes = new Map(),
    root = nodes.length - 1;
  const walk = (id, code) => {
    const node = nodes[id];
    if (node.left < 0) {
      codes.set(node.symbol, code);
      return;
    }
    walk(node.left, code + "0");
    walk(node.right, code + "1");
  };
  if (root >= 0) walk(root, "");
  let bitLength = 0,
    entropy = 0;
  for (const [byte, code] of codes) {
    bitLength += frequencies[byte] * code.length;
    const p = frequencies[byte] / bytes.length;
    entropy -= p * Math.log2(p);
  }
  return {
    bytes,
    frequencies,
    nodes,
    merges,
    codes,
    root,
    leafCount,
    bitLength,
    entropy,
  };
}
export function packPayload(model) {
  const payload = new Uint8Array(Math.ceil(model.bitLength / 8));
  let cursor = 0;
  for (const byte of model.bytes)
    for (const bit of model.codes.get(byte)) {
      if (bit === "1") payload[cursor >> 3] |= 1 << (7 - (cursor & 7));
      cursor++;
    }
  return payload;
}
export function archive(model, filename = "input.txt") {
  const name = new TextEncoder().encode(filename);
  if (name.length > 65535) throw new Error("Filename is too long.");
  const payload = packPayload(model),
    headerBytes = 16 + name.length + model.leafCount * 9;
  const bytes = new Uint8Array(headerBytes + payload.length),
    view = new DataView(bytes.buffer);
  bytes.set([65, 82, 75, 49]);
  view.setUint16(4, model.leafCount, true);
  view.setUint16(6, name.length, true);
  bytes.set(name, 8);
  let cursor = 8 + name.length;
  for (let byte = 0; byte < 256; byte++)
    if (model.frequencies[byte]) {
      bytes[cursor++] = byte;
      view.setBigUint64(cursor, BigInt(model.frequencies[byte]), true);
      cursor += 8;
    }
  view.setBigUint64(cursor, BigInt(model.bitLength), true);
  bytes.set(payload, cursor + 8);
  return { bytes, headerBytes, payloadBytes: payload.length };
}
export function decodeArchive(bytes) {
  const invalid = () => {
    throw new Error("This ARK1 file is incomplete or inconsistent.");
  };
  if (bytes.length < 16 || String.fromCharCode(...bytes.slice(0, 4)) !== "ARK1")
    throw new Error(
      "Choose an ARK1 archive created by this experiment or the original C++ compressor.",
    );
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    count = view.getUint16(4, true),
    nameLength = view.getUint16(6, true);
  if (count > 256 || 8 + nameLength + count * 9 + 8 > bytes.length) invalid();
  const filename =
    new TextDecoder()
      .decode(bytes.slice(8, 8 + nameLength))
      .split(/[\\/]/)
      .pop() || "decoded.bin";
  let cursor = 8 + nameLength,
    total = 0;
  const frequencies = new Uint32Array(256),
    seen = new Set();
  for (let i = 0; i < count; i++) {
    const byte = bytes[cursor++],
      freq = view.getBigUint64(cursor, true);
    cursor += 8;
    if (seen.has(byte) || freq === 0n || freq > BigInt(MAX_BYTES)) invalid();
    seen.add(byte);
    frequencies[byte] = Number(freq);
    total += Number(freq);
    if (total > MAX_BYTES)
      throw new Error("The expanded file exceeds the 512 KiB limit.");
  }
  const bitCount = view.getBigUint64(cursor, true);
  cursor += 8;
  if (
    bitCount > BigInt((bytes.length - cursor) * 8) ||
    bitCount > BigInt(MAX_BYTES * 255)
  )
    invalid();
  // Rebuild from sorted byte frequencies, preserving the native tie-breaking rule.
  const reference = new Uint8Array(total);
  let offset = 0;
  for (let i = 0; i < 256; i++) {
    reference.fill(i, offset, offset + frequencies[i]);
    offset += frequencies[i];
  }
  const model = buildModel(reference);
  if (BigInt(model.bitLength) !== bitCount) invalid();
  const payloadLength = Math.ceil(Number(bitCount) / 8);
  if (cursor + payloadLength !== bytes.length) invalid();
  if (
    Number(bitCount) % 8 &&
    payloadLength &&
    bytes[bytes.length - 1] & ((1 << (8 - (Number(bitCount) % 8))) - 1)
  )
    invalid();
  const output = new Uint8Array(total);
  if (count === 1) output.fill([...seen][0]);
  else if (count > 1) {
    let node = model.root,
      index = 0;
    for (let i = 0; i < Number(bitCount); i++) {
      node =
        (bytes[cursor + (i >> 3)] >> (7 - (i & 7))) & 1
          ? model.nodes[node].right
          : model.nodes[node].left;
      if (node < 0) invalid();
      if (model.nodes[node].left < 0) {
        if (index >= total) invalid();
        output[index++] = model.nodes[node].symbol;
        node = model.root;
      }
    }
    if (index !== total || node !== model.root) invalid();
  }
  const actual = new Uint32Array(256);
  for (const byte of output) actual[byte]++;
  if (actual.some((freq, i) => freq !== frequencies[i])) invalid();
  return { bytes: output, filename };
}
export function symbolLabel(byte) {
  if (byte === 32) return "SPACE";
  if (byte === 10) return "LF";
  if (byte === 13) return "CR";
  if (byte === 9) return "TAB";
  return byte >= 33 && byte <= 126
    ? String.fromCharCode(byte)
    : `0x${byte.toString(16).padStart(2, "0").toUpperCase()}`;
}
export function forestAt(model, step) {
  const active = new Set(Array.from({ length: model.leafCount }, (_, i) => i));
  for (let i = 0; i < step; i++) {
    const m = model.merges[i];
    active.delete(m.left);
    active.delete(m.right);
    active.add(m.parent);
  }
  return [...active].sort(
    (a, b) => model.nodes[a].weight - model.nodes[b].weight || a - b,
  );
}
