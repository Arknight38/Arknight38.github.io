import { expect, test } from "vitest";
import {
  archive,
  buildModel,
  decodeArchive,
  forestAt,
  MAX_BYTES,
} from "./codec.js";
const encoder = new TextEncoder();
const GOLDEN =
  "41524b3105000b00666978747572652e62696e4106000000000000004202000000000000004401000000000000004e04000000000000005f01000000000000001c00000000000000c93f2e40";
const hex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
test("matches a golden archive produced by the original C++ functions byte for byte", () => {
  const model = buildModel(encoder.encode("BANANA_BANDANA")),
    packed = archive(model, "fixture.bin");
  expect(hex(packed.bytes)).toBe(GOLDEN);
  expect(model.bitLength).toBe(28);
  expect(packed.bytes.length).toBe(packed.headerBytes + packed.payloadBytes);
  expect(new TextDecoder().decode(decodeArchive(packed.bytes).bytes)).toBe(
    "BANANA_BANDANA",
  );
});
test("round trips empty, singleton, Unicode, all byte values, and deterministic binary data", () => {
  let seed = 7;
  const random = Uint8Array.from({ length: 8192 }, () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed >>> 24;
  });
  for (const bytes of [
    new Uint8Array(),
    new Uint8Array(500).fill(255),
    encoder.encode("hello 🦊 世界\n"),
    Uint8Array.from({ length: 256 }, (_, i) => i),
    random,
  ]) {
    const model = buildModel(bytes);
    expect(
      Array.from(decodeArchive(archive(model, "test.bin").bytes).bytes),
    ).toEqual(Array.from(bytes));
  }
});
test("singleton uses the original zero-bit code and frequency reconstructs the input", () => {
  const model = buildModel(encoder.encode("AAAAAAAA"));
  expect(model.codes.get(65)).toBe("");
  expect(model.bitLength).toBe(0);
  expect(model.merges.length).toBe(0);
  expect(Array.from(decodeArchive(archive(model).bytes).bytes)).toEqual(
    Array.from(encoder.encode("AAAAAAAA")),
  );
});
test("every non-singleton code is prefix-free and tree weights conserve byte count", () => {
  const model = buildModel(
    encoder.encode("abracadabra and a little bit of information"),
  );
  const codes = [...model.codes.values()];
  for (let i = 0; i < codes.length; i++)
    for (let j = 0; j < codes.length; j++)
      if (i !== j) expect(codes[j].startsWith(codes[i])).toBe(false);
  for (const merge of model.merges)
    expect(merge.weight).toBe(
      model.nodes[merge.left].weight + model.nodes[merge.right].weight,
    );
  expect(model.nodes[model.root].weight).toBe(model.bytes.length);
  expect(model.bitLength / model.bytes.length).toBeGreaterThanOrEqual(
    model.entropy - 1e-10,
  );
  expect(model.bitLength / model.bytes.length).toBeLessThan(model.entropy + 1);
});
test("forest steps preserve all input weight while removing one active root per merge", () => {
  const model = buildModel(encoder.encode("BANANA_BANDANA"));
  for (let step = 0; step <= model.merges.length; step++) {
    const forest = forestAt(model, step);
    expect(forest.length).toBe(model.leafCount - step);
    expect(forest.reduce((sum, id) => sum + model.nodes[id].weight, 0)).toBe(
      model.bytes.length,
    );
  }
  expect(forestAt(model, model.merges.length)).toEqual([model.root]);
});
test("ties follow native insertion order", () => {
  const model = buildModel(encoder.encode("ABCD"));
  expect(Object.fromEntries(model.codes)).toEqual({
    65: "00",
    66: "01",
    67: "10",
    68: "11",
  });
});
test("rejects truncated, corrupted, duplicate-table, and oversized archives", () => {
  const valid = archive(
    buildModel(encoder.encode("BANANA_BANDANA")),
    "x",
  ).bytes;
  for (let i = 0; i < valid.length; i++)
    expect(() => decodeArchive(valid.slice(0, i))).toThrow();
  const badMagic = valid.slice();
  badMagic[0] = 0;
  expect(() => decodeArchive(badMagic)).toThrow();
  const duplicate = valid.slice();
  duplicate[18] = duplicate[9];
  expect(() => decodeArchive(duplicate)).toThrow();
  const tooLarge = valid.slice();
  new DataView(tooLarge.buffer).setBigUint64(10, BigInt(MAX_BYTES + 1), true);
  expect(() => decodeArchive(tooLarge)).toThrow();
  const tail = new Uint8Array(valid.length + 1);
  tail.set(valid);
  expect(() => decodeArchive(tail)).toThrow();
  const padding = valid.slice();
  padding[padding.length - 1] |= 1;
  expect(() => decodeArchive(padding)).toThrow();
});
test("download names never retain path components from an archive", () => {
  const decoded = decodeArchive(
    archive(buildModel(encoder.encode("abc")), "../../example.txt").bytes,
  );
  expect(decoded.filename).toBe("example.txt");
});
test("enforces the input limit before building a tree", () => {
  expect(() => buildModel(new Uint8Array(MAX_BYTES + 1))).toThrow(/512 KiB/);
});
