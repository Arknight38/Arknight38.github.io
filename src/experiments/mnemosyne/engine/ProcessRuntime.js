import {
  MemorySpace,
  HeapAllocator,
  StackManager,
  BASE,
  encode,
  address,
} from "./MemorySpace.js";
import { EXAMPLES } from "../examples/index.js";
export class ExecutionRecorder {
  constructor(initial) {
    this.records = [{ state: initial, event: null }];
    this.cursor = 0;
  }
  append(state, event) {
    this.records.push({ state, event });
    this.cursor++;
  }
  get current() {
    return this.records[this.cursor];
  }
}
export class ProcessRuntime {
  constructor(example = "linked") {
    this.reset(example);
  }
  reset(example = this.example) {
    if (!EXAMPLES[example]) throw new Error("Unknown demonstration program.");
    this.example = example;
    this.memory = new MemorySpace();
    // Only the head slot is a pointer root; the second global stores scalar output.
    this.memory.blocks[0].pointers = [0];
    this.heap = new HeapAllocator(this.memory);
    this.stack = new StackManager(this.memory);
    this.pc = 0;
    this.refs = { roots: 0 };
    this.accesses = new Uint32Array(1024);
    this.status = "paused";
    this.fault = "";
    this.peakHeap = 0;
    this.peakDepth = 0;
    this.recorder = new ExecutionRecorder(this.snapshot());
  }
  snapshot() {
    return {
      memory: this.memory.snapshot(),
      pc: this.pc,
      refs: { ...this.refs },
      accesses: this.accesses.slice(),
      status: this.status,
      fault: this.fault,
      peakHeap: this.peakHeap,
      peakDepth: this.peakDepth,
    };
  }
  restore(state) {
    this.memory.restore(state.memory);
    this.pc = state.pc;
    this.refs = { ...state.refs };
    this.accesses = state.accesses.slice();
    this.status = state.status;
    this.fault = state.fault;
    this.peakHeap = state.peakHeap;
    this.peakDepth = state.peakDepth;
  }
  seek(index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.recorder.records.length
    )
      return;
    this.recorder.cursor = index;
    this.restore(this.recorder.current.state);
  }
  get events() {
    return this.recorder.records
      .slice(1, this.recorder.cursor + 1)
      .map((r) => r.event);
  }
  get program() {
    return EXAMPLES[this.example].operations;
  }
  block(ref) {
    const b = this.memory.blocks.find((b) => b.id === this.refs[ref]);
    if (!b?.alive) throw new Error(`Object ${ref} is not live.`);
    return b;
  }
  step() {
    if (this.recorder.cursor < this.recorder.records.length - 1) {
      this.seek(this.recorder.cursor + 1);
      return;
    }
    if (this.status === "complete" || this.status === "fault") return;
    const before = this.snapshot(),
      op = this.program[this.pc];
    let event;
    try {
      if (op.op === "allocate") {
        const b = this.heap.allocate(op.size, op.name, op.pointers);
        this.refs[op.name] = b.id;
        event = {
          kind: "allocate",
          address: b.address,
          size: b.size,
          allocationId: b.id,
          description: `Allocate ${b.requested} bytes for ${b.label}`,
        };
      } else if (op.op === "free") {
        const b = this.heap.free(this.block(op.ref).id);
        event = {
          kind: "free",
          address: b.address,
          size: b.size,
          allocationId: b.id,
          description: `Release ${b.label}`,
        };
      } else if (op.op === "call") {
        const b = this.stack.push(op.name, op.argument);
        this.refs[op.ref] = b.id;
        event = {
          kind: "call",
          address: b.address,
          size: b.size,
          allocationId: b.id,
          description: `Call ${op.name}; reserve a 16-byte frame`,
        };
      } else if (op.op === "return") {
        const b = this.stack.pop();
        event = {
          kind: "return",
          address: b.address,
          size: b.size,
          allocationId: b.id,
          description: `Return ${op.value} from ${b.label}`,
        };
      } else {
        const b = this.block(op.ref),
          at = b.address + op.offset;
        const length = op.bytes?.length || 4;
        if (
          !Number.isInteger(op.offset) ||
          op.offset < 0 ||
          op.offset + length > b.requested
        )
          throw new Error(`Access exceeds the bounds of ${op.ref}.`);
        if (op.op === "write") {
          const value =
            typeof op.value === "object"
              ? this.block(op.value.ref).address
              : op.value;
          const result = this.memory.write(
            at,
            op.bytes || encode(value, op.type),
          );
          event = {
            kind: "write",
            address: at,
            size: result.after.length,
            allocationId: b.id,
            before: result.before,
            after: result.after,
            description: `Write ${op.ref} + ${op.offset}`,
          };
        } else if (op.op === "read") {
          const bytes = this.memory.read(at, 4);
          event = {
            kind: "read",
            address: at,
            size: 4,
            allocationId: b.id,
            after: [...bytes],
            description: `Read ${op.ref} + ${op.offset}`,
          };
        } else throw new Error("Unknown operation.");
        for (let i = 0; i < event.size; i++) this.accesses[at - BASE + i]++;
      }
      this.pc++;
      this.status = this.pc === this.program.length ? "complete" : "paused";
      const live = this.memory.blocks.filter((b) => b.alive);
      this.peakHeap = Math.max(
        this.peakHeap,
        live.filter((b) => b.kind === "heap").reduce((s, b) => s + b.size, 0),
      );
      this.peakDepth = Math.max(
        this.peakDepth,
        live.filter((b) => b.kind === "stack").length,
      );
    } catch (error) {
      this.restore(before);
      this.fault = error.message;
      this.status = "fault";
      event = {
        kind: "fault",
        address: null,
        size: 0,
        allocationId: null,
        description: error.message,
      };
    }
    event = {
      ...event,
      index: this.recorder.records.length,
      operation: this.pc,
      responsible: op?.name || op?.ref || op?.op,
    };
    this.recorder.append(this.snapshot(), event);
  }
  finish() {
    for (
      let i = 0;
      i < 256 && this.status !== "complete" && this.status !== "fault";
      i++
    )
      this.step();
  }
}
export function operationText(op) {
  if (!op) return "Program finished";
  if (op.op === "allocate") return `allocate ${op.name} (${op.size} bytes)`;
  if (op.op === "write")
    return `write ${op.ref}+${op.offset} ← ${typeof op.value === "object" ? `&${op.value.ref}` : op.bytes ? '"DSP"' : op.value}`;
  if (op.op === "read") return `read ${op.ref}+${op.offset}`;
  if (op.op === "call") return `call ${op.name}`;
  if (op.op === "return") return `return ${op.value}`;
  return `free ${op.ref}`;
}
export { address };
