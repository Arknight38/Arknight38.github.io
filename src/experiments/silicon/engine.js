export const ISA = {
  NOP: 0,
  LDI: 1,
  MOV: 2,
  ADD: 3,
  SUB: 4,
  AND: 5,
  OR: 6,
  XOR: 7,
  SHL: 8,
  SHR: 9,
  CMP: 10,
  LD: 11,
  ST: 12,
  LDX: 13,
  STX: 14,
  JMP: 15,
  JZ: 16,
  JNZ: 17,
  HLT: 255,
};
const NAMES = Object.fromEntries(Object.entries(ISA).map(([k, v]) => [v, k]));
const REGREG = new Set([
  "MOV",
  "ADD",
  "SUB",
  "AND",
  "OR",
  "XOR",
  "CMP",
  "LDX",
  "STX",
]);
const ONE = new Set(["SHL", "SHR"]),
  JUMP = new Set(["JMP", "JZ", "JNZ"]);
export const hex = (value) =>
  (value & 255).toString(16).toUpperCase().padStart(2, "0");
export function fullAdder(a, b) {
  let carry = 0,
    result = 0;
  const bits = [];
  for (let i = 0; i < 8; i++) {
    const x = (a >> i) & 1,
      y = (b >> i) & 1,
      sum = x ^ y ^ carry,
      next = (x & y) | (carry & (x ^ y));
    bits.push({ bit: i, a: x, b: y, carryIn: carry, sum, carryOut: next });
    result |= sum << i;
    carry = next;
  }
  return { result, carry, bits };
}
export function assemble(source) {
  const labels = Object.create(null),
    lines = [];
  let address = 0;
  for (const [i, text] of source.split(/\r?\n/).entries()) {
    let code = text.split(";")[0].trim();
    if (!code) continue;
    const label = code.match(/^([A-Za-z_]\w*):/);
    if (label) {
      const key = label[1].toUpperCase();
      if (Object.hasOwn(labels, key))
        throw new Error(`Line ${i + 1}: duplicate label ${key}.`);
      labels[key] = address;
      code = code.slice(label[0].length).trim();
    }
    if (!code) continue;
    lines.push({ line: i + 1, address, code });
    address += 3;
    if (address > 192)
      throw new Error(
        `Line ${i + 1}: program overlaps the framebuffer at 0xC0.`,
      );
  }
  const memory = new Uint8Array(256),
    listing = [];
  for (const item of lines) {
    const tokens = item.code.toUpperCase().replaceAll(",", " ").split(/\s+/),
      op = tokens.shift();
    if (!Object.hasOwn(ISA, op))
      throw new Error(`Line ${item.line}: unknown instruction ${op}.`);
    const fail = (message) => {
      throw new Error(`Line ${item.line}: ${message}`);
    };
    const reg = (token) => {
      if (!/^R[0-3]$/.test(token || "")) fail("Use registers R0–R3.");
      return Number(token[1]);
    };
    const byte = (token) => {
      const value = Object.hasOwn(labels, token)
        ? labels[token]
        : /^0X[\dA-F]+$|^\d+$/.test(token || "")
          ? Number(token)
          : NaN;
      if (!Number.isInteger(value) || value < 0 || value > 255)
        fail("Use a byte (0–255 / 0x00–0xFF) or a defined label.");
      return value;
    };
    let a = 0,
      b = 0,
      expected = 0;
    if (REGREG.has(op)) {
      expected = 2;
      if (tokens.length !== expected) fail(`${op} needs two registers.`);
      a = reg(tokens[0]);
      b = reg(tokens[1]);
    } else if (["LDI", "LD", "ST"].includes(op)) {
      expected = 2;
      if (tokens.length !== expected)
        fail(`${op} needs a register and byte/address.`);
      a = reg(tokens[0]);
      b = byte(tokens[1]);
    } else if (ONE.has(op)) {
      expected = 1;
      if (tokens.length !== expected) fail(`${op} needs one register.`);
      a = reg(tokens[0]);
    } else if (JUMP.has(op)) {
      expected = 1;
      if (tokens.length !== expected) fail(`${op} needs an address or label.`);
      a = byte(tokens[0]);
    } else if (tokens.length) fail(`${op} takes no operands.`);
    memory.set([ISA[op], a, b], item.address);
    listing.push({ ...item, op, bytes: [ISA[op], a, b] });
  }
  if (!lines.length) throw new Error("Enter at least one instruction.");
  return { memory, listing, labels };
}
export function decode(bytes) {
  const [opcode, a, b] = bytes,
    name = NAMES[opcode];
  if (!name) throw new Error(`Unknown opcode 0x${hex(opcode)}.`);
  if (
    (REGREG.has(name) && (a > 3 || b > 3)) ||
    (["LDI", "LD", "ST", ...ONE].includes(name) && a > 3)
  )
    throw new Error("Instruction has an invalid register operand.");
  return {
    name,
    a,
    b,
    text: REGREG.has(name)
      ? `${name} R${a}, R${b}`
      : ["LDI", "LD", "ST"].includes(name)
        ? `${name} R${a}, 0x${hex(b)}`
        : ONE.has(name)
          ? `${name} R${a}`
          : JUMP.has(name)
            ? `${name} 0x${hex(a)}`
            : name,
  };
}
export const PROGRAMS = {
  add: {
    name: "Add two values",
    source: "LDI R0, 5\nLDI R1, 3\nADD R0, R1\nHLT",
  },
  loop: {
    name: "Count down",
    source: "LDI R0, 10\nLDI R1, 1\nloop: SUB R0, R1\nJNZ loop\nHLT",
  },
  pixels: {
    name: "Fill the framebuffer",
    source:
      "LDI R0, 1\nLDI R1, 0xC0\nLDI R2, 1\nloop: STX R0, R1\nADD R0, R2\nADD R1, R2\nJNZ loop\nHLT",
  },
};
export class CPU {
  constructor(memory = new Uint8Array(256)) {
    this.initial = Uint8Array.from(memory);
    this.reset();
  }
  reset() {
    this.memory = Uint8Array.from(this.initial);
    this.regs = new Uint8Array(4);
    this.pc = 0;
    this.flags = { z: false, c: false };
    this.phase = 0;
    this.ir = null;
    this.decoded = null;
    this.pending = null;
    this.halted = false;
    this.fault = "";
    this.cycles = 0;
    this.instructions = 0;
    this.history = [];
    this.lastALU = null;
    this.active = "Ready";
  }
  snapshot() {
    return {
      memory: Uint8Array.from(this.memory),
      regs: Uint8Array.from(this.regs),
      pc: this.pc,
      flags: { ...this.flags },
      phase: this.phase,
      ir: this.ir && [...this.ir],
      decoded: this.decoded && { ...this.decoded },
      pending: this.pending && structuredClone(this.pending),
      halted: this.halted,
      fault: this.fault,
      cycles: this.cycles,
      instructions: this.instructions,
      lastALU: this.lastALU && structuredClone(this.lastALU),
      active: this.active,
    };
  }
  previous() {
    const saved = this.history.pop();
    if (saved) Object.assign(this, saved);
  }
  write(address, value) {
    if (
      !Number.isInteger(address) ||
      address < 0 ||
      address > 255 ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 255
    )
      throw new Error("Address and value must each fit in one byte.");
    this.memory[address] = value;
    this.phase = 0;
    this.ir = null;
    this.decoded = null;
    this.pending = null;
    this.history = [];
    this.halted = false;
    this.fault = "";
    this.active = "Memory edited; fetch restarted";
  }
  execute() {
    const { name, a, b } = this.decoded,
      regs = Array.from(this.regs),
      flags = { ...this.flags };
    let pc = (this.pc + 3) & 255,
      memory = null,
      halted = false,
      alu = null;
    const x = regs[a],
      y = regs[b];
    let result;
    if (name === "LDI") regs[a] = b;
    if (name === "MOV") regs[a] = y;
    if (name === "LD" || name === "LDX")
      regs[a] = this.memory[name === "LD" ? b : y];
    if (name === "ST" || name === "STX")
      memory = { address: name === "ST" ? b : y, value: x };
    if (name === "ADD") {
      const sum = fullAdder(x, y);
      result = sum.result;
      flags.c = !!sum.carry;
      alu = { name, a: x, b: y, ...sum };
    }
    if (name === "SUB" || name === "CMP") {
      result = (x - y) & 255;
      flags.c = x >= y;
      alu = { name, a: x, b: y, result };
    }
    if (name === "AND") result = x & y;
    if (name === "OR") result = x | y;
    if (name === "XOR") result = x ^ y;
    if (name === "SHL") {
      result = (x << 1) & 255;
      flags.c = !!(x & 128);
    }
    if (name === "SHR") {
      result = x >>> 1;
      flags.c = !!(x & 1);
    }
    if (result !== undefined) {
      flags.z = result === 0;
      if (name !== "CMP") regs[a] = result;
      if (!alu) alu = { name, a: x, b: y, result };
    }
    if (
      name === "JMP" ||
      (name === "JZ" && flags.z) ||
      (name === "JNZ" && !flags.z)
    )
      pc = a;
    if (name === "HLT") halted = true;
    return { regs, flags, pc, memory, halted, alu };
  }
  step() {
    if (this.halted || this.fault) return;
    this.history.push(this.snapshot());
    this.history = this.history.slice(-200);
    try {
      if (this.phase === 0) {
        this.ir = [
          this.memory[this.pc],
          this.memory[(this.pc + 1) & 255],
          this.memory[(this.pc + 2) & 255],
        ];
        this.active = `Read three bytes at 0x${hex(this.pc)}`;
      }
      if (this.phase === 1) {
        this.decoded = decode(this.ir);
        this.active = `Decode ${this.decoded.text}`;
      }
      if (this.phase === 2) {
        this.pending = this.execute();
        this.active = `Execute ${this.decoded.text}; result pending writeback`;
      }
      if (this.phase === 3) {
        const p = this.pending;
        this.regs.set(p.regs);
        this.flags = p.flags;
        this.pc = p.pc;
        this.halted = p.halted;
        if (p.memory) this.memory[p.memory.address] = p.memory.value;
        if (p.alu) this.lastALU = p.alu;
        this.instructions++;
        this.active = this.halted
          ? "HLT committed"
          : `${this.decoded.text} committed`;
        this.pending = null;
      }
      this.cycles++;
      this.phase = (this.phase + 1) % 4;
    } catch (error) {
      this.fault = error.message;
    }
  }
  instruction() {
    let count = 0;
    do {
      this.step();
      count++;
    } while (this.phase !== 0 && !this.halted && !this.fault && count < 4);
  }
}
