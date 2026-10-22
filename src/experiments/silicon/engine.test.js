import { expect, test } from "vitest";
import { CPU, assemble, PROGRAMS, fullAdder, ISA } from "./engine.js";
const run = (source) => {
  const cpu = new CPU(assemble(source).memory);
  for (let i = 0; i < 500 && !cpu.halted && !cpu.fault; i++) cpu.instruction();
  return cpu;
};
test("assembly resolves labels to byte addresses and validates input", () => {
  const p = assemble("start: LDI R0, 0xFF\nSUB R0, R0\nJZ start\nHLT");
  expect([...p.memory.slice(0, 3)]).toEqual([ISA.LDI, 0, 255]);
  expect(p.memory[7]).toBe(0);
  for (const code of [
    "LDI R4, 2",
    "LDI R0, 256",
    "JMP missing",
    "nope R0",
    "same: NOP\nsame: HLT",
  ])
    expect(() => assemble(code)).toThrow();
});
test("fetch, decode and execute do not commit registers; writeback does, undo restores", () => {
  const cpu = new CPU(assemble(PROGRAMS.add.source).memory);
  for (let i = 0; i < 3; i++) cpu.step();
  expect(cpu.regs[0]).toBe(0);
  expect(cpu.pending.regs[0]).toBe(5);
  cpu.step();
  expect(cpu.regs[0]).toBe(5);
  expect(cpu.pc).toBe(3);
  cpu.previous();
  expect(cpu.regs[0]).toBe(0);
  expect(cpu.phase).toBe(3);
  cpu.step();
  expect(cpu.regs[0]).toBe(5);
});
test("addition and countdown examples execute and halt", () => {
  expect(run(PROGRAMS.add.source).regs[0]).toBe(8);
  const loop = run(PROGRAMS.loop.source);
  expect(loop.halted).toBe(true);
  expect(loop.regs[0]).toBe(0);
  expect(loop.flags.z).toBe(true);
});
test("framebuffer program writes all 64 pixels through indirect stores", () => {
  const cpu = run(PROGRAMS.pixels.source);
  expect(cpu.halted).toBe(true);
  expect([...cpu.memory.slice(192)]).toEqual(
    Array.from({ length: 64 }, (_, i) => i + 1),
  );
});
test("ripple carry wraps at eight bits and reports every carry", () => {
  const sum = fullAdder(255, 1);
  expect(sum.result).toBe(0);
  expect(sum.carry).toBe(1);
  expect(sum.bits.every((bit) => bit.carryOut === 1)).toBe(true);
});
test("unknown instructions fault without committing state; memory edits restart fetch", () => {
  const cpu = new CPU();
  cpu.write(0, 254);
  cpu.step();
  cpu.step();
  expect(cpu.fault).toMatch(/Unknown opcode/);
  expect(cpu.pc).toBe(0);
  cpu.write(0, 255);
  expect(cpu.fault).toBe("");
  expect(cpu.phase).toBe(0);
  cpu.instruction();
  expect(cpu.halted).toBe(true);
});
test("subtraction flags, direct memory, logic and shifts use byte semantics", () => {
  const cpu = run(
    "LDI R0, 255\nLDI R1, 1\nADD R0, R1\nST R0, 100\nLDI R0, 8\nSHR R0\nSHL R0\nXOR R0, R1\nHLT",
  );
  expect(cpu.regs[0]).toBe(9);
  expect(cpu.memory[100]).toBe(0);
});

test("visual programs keep executing and produce changing pixels with tracked writes", () => {
  for (const key of ["weave", "scan", "spectrum"]) {
    const cpu = new CPU(assemble(PROGRAMS[key].source).memory);
    for (let i = 0; i < 1000; i++) cpu.instruction();
    expect(cpu.fault).toBe("");
    expect(cpu.halted).toBe(false);
    expect(cpu.memory.slice(192).some((v) => v !== 0)).toBe(true);
    expect(cpu.lastWrite.address).toBeGreaterThanOrEqual(192);
    const before = Array.from(cpu.memory.slice(192));
    for (let i = 0; i < 100; i++) cpu.instruction();
    expect(Array.from(cpu.memory.slice(192))).not.toEqual(before);
  }
});

test("assembly-to-pixel example commits the correct byte only at store writeback", () => {
  const program = assemble("LDI R0, 90\nST R0, 0xC0\nHLT");
  expect([...program.memory.slice(0, 9)]).toEqual([
    1, 0, 90, 12, 0, 192, 255, 0, 0,
  ]);
  const cpu = new CPU(program.memory);
  cpu.instruction();
  expect(cpu.regs[0]).toBe(90);
  expect(cpu.memory[192]).toBe(0);
  for (let i = 0; i < 3; i++) cpu.step();
  expect(cpu.pending.memory).toEqual({ address: 192, value: 90 });
  expect(cpu.memory[192]).toBe(0);
  cpu.step();
  expect(cpu.memory[192]).toBe(90);
  expect(cpu.lastWrite).toMatchObject({ address: 192, value: 90 });
  cpu.previous();
  expect(cpu.memory[192]).toBe(0);
});
