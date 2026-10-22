const alloc = (name, size = 8, pointers = [4]) => ({
  op: "allocate",
  name,
  size,
  pointers,
});
const write = (ref, offset, value, type = "u32") => ({
  op: "write",
  ref,
  offset,
  value,
  type,
});
const read = (ref, offset = 0) => ({ op: "read", ref, offset });
const linked = [];
for (let i = 0; i < 4; i++) {
  linked.push(alloc(`node${i}`), write(`node${i}`, 0, [42, 17, 93, 8][i]));
  linked.push(
    write(i ? `node${i - 1}` : "roots", i ? 4 : 0, { ref: `node${i}` }),
  );
}
for (let i = 0; i < 4; i++) linked.push(read(`node${i}`), read(`node${i}`, 4));
const recursive = [];
for (let n = 5; n >= 1; n--)
  recursive.push(
    { op: "call", name: `factorial(${n})`, ref: `frame${n}`, argument: n },
    write(`frame${n}`, 0, n),
  );
let result = 1;
for (let n = 1; n <= 5; n++) {
  result *= n;
  recursive.push(write(`frame${n}`, 4, result), {
    op: "return",
    value: result,
  });
}
recursive.push(write("roots", 4, 120));
export const EXAMPLES = {
  linked: {
    name: "Linked list",
    description:
      "Four eight-byte nodes are allocated, linked through stored addresses, and read in sequence.",
    operations: linked,
  },
  recursion: {
    name: "Recursive calls",
    description:
      "Five modeled stack frames accumulate arguments, then return factorial results in reverse order. No host recursion is executed.",
    operations: recursive,
  },
  fragmentation: {
    name: "Fragmentation & lifetimes",
    description:
      "A first-fit heap reuses holes. A later allocation gets the same address as a released object, with a different allocation identity.",
    operations: [
      alloc("bufferA", 128, []),
      write("roots", 0, { ref: "bufferA" }),
      alloc("bufferB", 128, []),
      alloc("bufferC", 128, []),
      alloc("bufferD", 128, []),
      write("bufferA", 0, 42),
      write("bufferC", 0, 93),
      { op: "free", ref: "bufferA" },
      write("roots", 0, 0),
      { op: "free", ref: "bufferC" },
      alloc("replacement", 96, []),
      write("replacement", 0, 17),
      write("roots", 0, { ref: "replacement" }),
      alloc("largeBuffer", 160, []),
      write("largeBuffer", 0, 255),
    ],
  },
  record: {
    name: "Interpreting a record",
    description:
      "The same sixteen bytes can be read as an integer, a float, text, or addresses. The interpretation requires a layout hypothesis.",
    operations: [
      alloc("record", 16, [12]),
      write("roots", 0, { ref: "record" }),
      write("record", 0, 42, "i32"),
      write("record", 4, 3.5, "f32"),
      { op: "write", ref: "record", offset: 8, bytes: [68, 83, 80, 0] },
      write("record", 12, 0),
      read("record", 0),
      read("record", 4),
      read("record", 8),
      read("record", 12),
    ],
  },
};
