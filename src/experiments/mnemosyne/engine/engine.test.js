import { expect, test } from "vitest";
import {
  MemorySpace,
  HeapAllocator,
  StackManager,
  BASE,
  HEAP_START,
  SIZE,
  encode,
} from "./MemorySpace.js";
import { ProcessRuntime } from "./ProcessRuntime.js";
import {
  allocationAnalysis,
  interpretations,
  pointerEdges,
  snapshotDiff,
} from "../analysis/index.js";

test("first-fit reuses aligned holes with new identities and bounds payload access", () => {
  const m = new MemorySpace(),
    h = new HeapAllocator(m);
  const a = h.allocate(9, "a"),
    b = h.allocate(16, "b");
  expect(a.address).toBe(BASE + HEAP_START);
  expect(a.size).toBe(16);
  expect(b.address).toBe(a.address + 16);
  m.write(a.address, encode(42));
  expect(() => m.write(a.address + 8, encode(99))).toThrow();
  h.free(a.id);
  expect(() => m.read(a.address)).toThrow();
  expect(m.bytes[a.address - BASE]).toBe(42);
  const c = h.allocate(8, "replacement");
  expect(c.address).toBe(a.address);
  expect(c.id).not.toBe(a.id);
  expect(m.read(c.address)).toEqual(new Uint8Array(4));
  expect(() => h.free(a.id)).toThrow();
});
test("fragmentation can prevent a request despite enough total free bytes", () => {
  const m = new MemorySpace(),
    h = new HeapAllocator(m);
  const blocks = Array.from({ length: 5 }, (_, i) =>
    h.allocate(128, String(i)),
  );
  h.free(blocks[0].id);
  h.free(blocks[2].id);
  h.free(blocks[4].id);
  const stats = allocationAnalysis(m);
  expect(stats.free).toBe(448);
  expect(stats.largest).toBe(192);
  const before = m.snapshot();
  expect(() => h.allocate(200, "too large")).toThrow(/contiguous/);
  expect(m.snapshot()).toEqual(before);
  h.free(blocks[1].id);
  expect(h.allocate(256, "coalesced gap").address).toBe(BASE + HEAP_START);
});
test("stack grows downward, returns in LIFO order, and rejects overflow", () => {
  const m = new MemorySpace(),
    s = new StackManager(m);
  const a = s.push("outer", 5),
    b = s.push("inner", 4);
  expect(a.address).toBe(BASE + SIZE - 16);
  expect(b.address).toBe(a.address - 16);
  expect(s.pop().id).toBe(b.id);
  expect(s.pop().id).toBe(a.id);
  expect(() => s.pop()).toThrow();
  for (let i = 0; i < 16; i++) s.push("frame", i);
  expect(() => s.push("overflow", 17)).toThrow(/full/);
});
test("linked nodes are reconstructed from stored little-endian pointers", () => {
  const r = new ProcessRuntime("linked");
  r.finish();
  expect(r.status).toBe("complete");
  let at = interpretations(r.memory, BASE).unsigned;
  const values = [];
  while (at) {
    values.push(interpretations(r.memory, at).unsigned);
    at = interpretations(r.memory, at + 4).unsigned;
  }
  expect(values).toEqual([42, 17, 93, 8]);
  expect([...r.memory.bytes.slice(64, 72)]).toEqual([
    42, 0, 0, 0, 72, 16, 0, 0,
  ]);
  expect(allocationAnalysis(r.memory).unreachable).toHaveLength(0);
  expect(pointerEdges(r.memory).at(-1).status).toBe("null");
});
test("record interpretations use the same bytes for integer, float and text", () => {
  const r = new ProcessRuntime("record");
  r.finish();
  const at = interpretations(r.memory, BASE).unsigned;
  expect(interpretations(r.memory, at).integer).toBe(42);
  expect(interpretations(r.memory, at + 4).float).toBe(3.5);
  expect(interpretations(r.memory, at + 8).text).toBe("DSP·");
  expect(interpretations(r.memory, BASE + SIZE - 1)).toBeNull();
});
test("recursion unwinds all frames and records its peak depth and result", () => {
  const r = new ProcessRuntime("recursion");
  r.finish();
  expect(r.peakDepth).toBe(5);
  expect(allocationAnalysis(r.memory).depth).toBe(0);
  expect(interpretations(r.memory, BASE + 4).unsigned).toBe(120);
  expect(r.events.filter((e) => e.kind === "call")).toHaveLength(5);
  expect(r.events.filter((e) => e.kind === "return")).toHaveLength(5);
});
test("replay restores bytes, ownership, control state, counters and future results", () => {
  const r = new ProcessRuntime("fragmentation");
  r.finish();
  const end = r.snapshot(),
    length = r.recorder.records.length;
  r.seek(6);
  expect(r.snapshot()).toEqual(r.recorder.records[6].state);
  expect(r.pc).toBe(6);
  expect(
    r.memory.blocks.filter((b) => b.alive && b.kind === "heap"),
  ).toHaveLength(4);
  r.finish();
  expect(r.snapshot()).toEqual(end);
  expect(r.recorder.records).toHaveLength(length);
  r.seek(0);
  expect(r.memory.blocks).toHaveLength(1);
  expect(r.accesses.every((v) => v === 0)).toBe(true);
});
test("snapshot diff distinguishes replacement ownership even at a reused address", () => {
  const r = new ProcessRuntime("fragmentation");
  for (let i = 0; i < 6; i++) r.step();
  const before = r.snapshot();
  for (let i = 0; i < 5; i++) r.step();
  const after = r.snapshot(),
    diff = snapshotDiff(before, after);
  const old = diff.released.find((b) => b.label === "bufferA"),
    replacement = diff.created.find((b) => b.label === "replacement");
  expect(replacement.address).toBe(old.address);
  expect(replacement.id).not.toBe(old.id);
  r.finish();
  expect(allocationAnalysis(r.memory).unreachable.map((b) => b.label)).toEqual([
    "bufferB",
    "bufferD",
    "largeBuffer",
  ]);
});
test("invalid accesses roll back state and capture a fault without a write", () => {
  const r = new ProcessRuntime("linked");
  r.step();
  // Force a released symbolic reference while leaving adjacent storage valid.
  r.heap.free(r.refs.node0);
  const bytes = r.memory.bytes.slice();
  r.step();
  expect(r.status).toBe("fault");
  expect(r.events.at(-1).kind).toBe("fault");
  expect(r.memory.bytes).toEqual(bytes);
  expect(r.events.filter((e) => e.kind === "write")).toHaveLength(0);
});
test("pointer resolution reports null, released and unmapped targets without guessing scalar fields", () => {
  const m = new MemorySpace(),
    h = new HeapAllocator(m);
  m.blocks[0].pointers = [0];
  expect(pointerEdges(m)[0].status).toBe("null");
  const b = h.allocate(8, "target", []);
  m.write(BASE, encode(b.address));
  h.free(b.id);
  expect(pointerEdges(m)[0].status).toBe("released");
  m.write(BASE, encode(999));
  m.write(BASE + 4, encode(BASE));
  expect(pointerEdges(m)).toHaveLength(1);
  expect(pointerEdges(m)[0].status).toBe("unmapped");
});

test("a symbolic access cannot cross into an adjacent live object", () => {
  const r = new ProcessRuntime();
  Object.defineProperty(r, "program", {
    value: [
      { op: "allocate", name: "a", size: 8, pointers: [] },
      { op: "allocate", name: "b", size: 8, pointers: [] },
      { op: "write", ref: "a", offset: 8, value: 99 },
    ],
  });
  r.step();
  r.step();
  const before = r.memory.bytes.slice();
  r.step();
  expect(r.status).toBe("fault");
  expect(r.fault).toMatch(/bounds/);
  expect(r.memory.bytes).toEqual(before);
});
test("identity comparison detects replacement even when no bytes change", () => {
  const r = new ProcessRuntime(),
    a = r.heap.allocate(8, "old", []),
    before = r.snapshot();
  r.heap.free(a.id);
  const b = r.heap.allocate(8, "new", []),
    diff = snapshotDiff(before, r.snapshot());
  expect(a.address).toBe(b.address);
  expect(diff.changes).toHaveLength(0);
  expect(diff.created.map((x) => x.id)).toEqual([b.id]);
  expect(diff.released.map((x) => x.id)).toEqual([a.id]);
});
