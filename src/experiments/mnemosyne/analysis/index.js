import { BASE, SIZE, HEAP_END, HEAP_START } from "../engine/MemorySpace.js";
export function interpretations(memory, at) {
  const offset = at - BASE;
  if (!Number.isInteger(offset) || offset < 0 || offset + 4 > SIZE) return null;
  const view = new DataView(
    memory.bytes.buffer,
    memory.bytes.byteOffset + offset,
    4,
  );
  const bytes = [...memory.bytes.slice(offset, offset + 4)];
  return {
    bytes,
    unsigned: view.getUint32(0, true),
    integer: view.getInt32(0, true),
    float: view.getFloat32(0, true),
    text: bytes
      .map((v) => (v >= 32 && v <= 126 ? String.fromCharCode(v) : "·"))
      .join(""),
  };
}
export function pointerEdges(memory) {
  const live = memory.blocks.filter((b) => b.alive),
    edges = [];
  for (const block of live)
    for (const offset of block.pointers) {
      const value = interpretations(memory, block.address + offset)?.unsigned;
      const target = live.find(
        (b) => value >= b.address && value < b.address + b.requested,
      );
      const old = memory.blocks.find(
        (b) =>
          !b.alive && value >= b.address && value < b.address + b.requested,
      );
      edges.push({
        from: block.id,
        offset,
        value,
        to: target?.id ?? null,
        status:
          value === 0
            ? "null"
            : target
              ? "live"
              : old
                ? "released"
                : "unmapped",
      });
    }
  return edges;
}
export function allocationAnalysis(memory) {
  const live = memory.blocks.filter((b) => b.alive),
    heap = live.filter((b) => b.kind === "heap"),
    edges = pointerEdges(memory);
  const reached = new Set(
    live.filter((b) => b.kind !== "heap").map((b) => b.id),
  );
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges)
      if (reached.has(e.from) && e.to !== null && !reached.has(e.to)) {
        reached.add(e.to);
        changed = true;
      }
  }
  let cursor = BASE + HEAP_START;
  const gaps = [];
  for (const b of [...heap].sort((a, b) => a.address - b.address)) {
    if (b.address > cursor) gaps.push(b.address - cursor);
    cursor = b.address + b.size;
  }
  if (cursor < BASE + HEAP_END) gaps.push(BASE + HEAP_END - cursor);
  const free = gaps.reduce((a, b) => a + b, 0),
    largest = Math.max(0, ...gaps);
  return {
    heap,
    edges,
    unreachable: heap.filter((b) => !reached.has(b.id)),
    free,
    largest,
    fragmentation: free ? 1 - largest / free : 0,
    used: heap.reduce((s, b) => s + b.size, 0),
    requested: heap.reduce((s, b) => s + b.requested, 0),
    depth: live.filter((b) => b.kind === "stack").length,
  };
}
export function snapshotDiff(before, after) {
  const changes = [];
  for (let i = 0; i < SIZE; i++)
    if (before.memory.bytes[i] !== after.memory.bytes[i])
      changes.push({
        address: BASE + i,
        before: before.memory.bytes[i],
        after: after.memory.bytes[i],
      });
  const a = before.memory.blocks.filter((b) => b.alive),
    b = after.memory.blocks.filter((b) => b.alive);
  return {
    changes,
    created: b.filter((x) => !a.some((y) => y.id === x.id)),
    released: a.filter((x) => !b.some((y) => y.id === x.id)),
  };
}
