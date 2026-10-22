export const BASE = 0x1000;
export const SIZE = 1024;
export const HEAP_START = 64;
export const HEAP_END = 768;
export const address = (n) =>
  `0x${n.toString(16).toUpperCase().padStart(4, "0")}`;
export const hexByte = (n) => n.toString(16).toUpperCase().padStart(2, "0");
export class MemorySpace {
  constructor() {
    this.bytes = new Uint8Array(SIZE);
    this.blocks = [
      {
        id: 0,
        address: BASE,
        size: 8,
        requested: 8,
        kind: "global",
        label: "roots",
        alive: true,
        pointers: [0, 4],
      },
    ];
    this.nextId = 1;
  }
  snapshot() {
    return {
      bytes: this.bytes.slice(),
      blocks: structuredClone(this.blocks),
      nextId: this.nextId,
    };
  }
  restore(snapshot) {
    this.bytes = snapshot.bytes.slice();
    this.blocks = structuredClone(snapshot.blocks);
    this.nextId = snapshot.nextId;
  }
  owner(at, size = 1) {
    if (
      !Number.isInteger(at) ||
      !Number.isInteger(size) ||
      size < 1 ||
      at < BASE ||
      at + size > BASE + SIZE
    )
      throw new Error("Address range is outside the simulated process.");
    const block = this.blocks.find(
      (b) => b.alive && at >= b.address && at + size <= b.address + b.requested,
    );
    if (!block)
      throw new Error(
        `Invalid access at ${address(at)}: no live object owns this range.`,
      );
    return block;
  }
  read(at, size = 4) {
    this.owner(at, size);
    return this.bytes.slice(at - BASE, at - BASE + size);
  }
  write(at, bytes) {
    const block = this.owner(at, bytes.length);
    const before = this.read(at, bytes.length);
    this.bytes.set(bytes, at - BASE);
    return { block, before: [...before], after: [...bytes] };
  }
}
export class HeapAllocator {
  constructor(memory) {
    this.memory = memory;
  }
  gaps() {
    let cursor = BASE + HEAP_START;
    const gaps = [];
    for (const b of this.memory.blocks
      .filter((b) => b.alive && b.kind === "heap")
      .sort((a, b) => a.address - b.address)) {
      if (b.address > cursor)
        gaps.push({ address: cursor, size: b.address - cursor });
      cursor = b.address + b.size;
    }
    if (cursor < BASE + HEAP_END)
      gaps.push({ address: cursor, size: BASE + HEAP_END - cursor });
    return gaps;
  }
  allocate(requested, label, pointers = []) {
    if (
      !Number.isInteger(requested) ||
      requested < 1 ||
      requested > HEAP_END - HEAP_START
    )
      throw new Error("Allocation size must fit inside the heap.");
    if (
      pointers.some((p) => !Number.isInteger(p) || p < 0 || p + 4 > requested)
    )
      throw new Error("A pointer field must fit inside its object.");
    const size = Math.ceil(requested / 8) * 8;
    const gap = this.gaps().find((g) => g.size >= size);
    if (!gap) throw new Error(`No contiguous heap gap fits ${size} bytes.`);
    const block = {
      id: this.memory.nextId++,
      address: gap.address,
      size,
      requested,
      label,
      kind: "heap",
      alive: true,
      pointers: [...pointers],
    };
    this.memory.bytes.fill(
      0,
      block.address - BASE,
      block.address - BASE + size,
    );
    this.memory.blocks.push(block);
    return block;
  }
  free(id) {
    const block = this.memory.blocks.find(
      (b) => b.id === id && b.kind === "heap",
    );
    if (!block?.alive)
      throw new Error("Cannot free an unknown or already released allocation.");
    block.alive = false;
    return block;
  }
}
export class StackManager {
  constructor(memory) {
    this.memory = memory;
  }
  push(label, argument) {
    const frames = this.memory.blocks.filter(
      (b) => b.alive && b.kind === "stack",
    );
    const top = Math.min(BASE + SIZE, ...frames.map((b) => b.address));
    if (top - 16 < BASE + HEAP_END)
      throw new Error("The modeled stack is full.");
    const block = {
      id: this.memory.nextId++,
      address: top - 16,
      size: 16,
      requested: 16,
      kind: "stack",
      label,
      argument,
      alive: true,
      pointers: [],
    };
    this.memory.bytes.fill(0, top - 16 - BASE, top - BASE);
    this.memory.blocks.push(block);
    return block;
  }
  pop() {
    const frame = this.memory.blocks
      .filter((b) => b.alive && b.kind === "stack")
      .sort((a, b) => a.address - b.address)[0];
    if (!frame) throw new Error("Cannot return from an empty stack.");
    frame.alive = false;
    return frame;
  }
}
export function encode(value, type = "u32") {
  const bytes = new Uint8Array(4),
    view = new DataView(bytes.buffer);
  if (type === "f32") view.setFloat32(0, value, true);
  else if (type === "i32") view.setInt32(0, value, true);
  else view.setUint32(0, value, true);
  return [...bytes];
}
