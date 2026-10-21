## Overview

SILICON is an original, deliberately small eight-bit computer. It has four general-purpose registers, 256 bytes of shared program/data memory, a program counter, zero and carry flags, and a fixed three-byte instruction format. The assembler, execution engine, memory viewer, and pixel display all operate on the same byte array.

This is not an emulator for an existing processor. Its four execution stages are an inspectable teaching sequence rather than a claim about physical clock timing. No external assembly is executed on the host machine: programs are parsed into bytes and interpreted by the JavaScript CPU model.

Program contains the source editor and encoded listing. Execution exposes registers, the datapath, flags, and the adder. Memory displays every addressable byte, and Framebuffer shows the upper 64 bytes as pixels. Switching views pauses execution without discarding registers or memory.

## Instruction format and assembly

Every instruction occupies three consecutive bytes. The first is an opcode; the next two hold register indices, immediate values, or addresses according to that opcode. Even NOP and HLT occupy three bytes. A normally advancing instruction therefore moves PC by three, with eight-bit wrapping, rather than incrementing an instruction index.

The smallest example is:

```text
LDI R0, 5
LDI R1, 3
ADD R0, R1
HLT
```

LDI places an immediate byte in a register. ADD writes its result back to its first operand, so the example leaves R0 equal to eight. The assembled bytes begin `01 00 05`, followed by `01 01 03`.

The assembler makes two passes. The first records labels and instruction addresses; the second resolves operands and emits bytes. Label references are byte addresses. Semicolon comments and hexadecimal immediates are supported. Invalid mnemonics, register indices, duplicate labels, missing operands, and values outside 0–255 produce a line-specific error.

Source programs are limited to the lower 192 bytes so assembly does not silently overwrite the framebuffer. That limit is a loader policy, not a restriction on what a running program can store. Program and data still share RAM, and the Memory view can demonstrate self-modifying code.

## Fetch, decode, execute, and writeback

Next cycle advances one microstep. Step instruction completes the current instruction, which may already be partially executed. The highlighted stage is the next stage that will run.

Fetch reads three bytes from the current PC into the instruction register. Decode validates the opcode and register fields and creates a human-readable instruction. Execute calculates a pending result. Writeback commits registers, flags, memory writes, and the next PC. HLT becomes effective at writeback.

The separation is visible in the engine:

```javascript
this.pending = this.execute();
```

Execute returns a result object instead of immediately replacing the architectural state. At writeback, register values are copied from that result:

```javascript
this.regs.set(p.regs);
this.flags = p.flags;
this.pc = p.pc;
if (p.memory) this.memory[p.memory.address] = p.memory.value;
```

Source: `silicon/engine.js`, excerpts from `step`.

This makes a distinction that would be hidden in an instruction-only emulator: an ALU result can exist before the destination register changes. Previous cycle restores a complete retained snapshot, including a pending operation, so undoing writeback returns to the state immediately before commitment. The most recent 200 microsteps are retained.

## Eight-bit arithmetic and the adder

Registers use `Uint8Array` storage. Addition and subtraction wrap to eight bits; the carry flag records overflow for addition and a no-borrow condition for subtraction. Zero is updated by arithmetic, comparisons, logic operations, and shifts. Loads, moves, and branches leave the existing flags unchanged. Logic operations update zero while preserving carry; shifts update the bit shifted out.

ADD is implemented by eight full-adder stages rather than calculating a display-only carry diagram afterward. Each stage records the two input bits, carry-in, sum, and carry-out. Its core equations are:

```javascript
sum = x ^ y ^ carry;
next = (x & y) | (carry & (x ^ y));
```

The bit table displays the records produced by that calculation, least significant bit first. For 255 + 1, each stage propagates a carry, the stored result is zero, and carry-out is one. SUB and CMP use byte subtraction; CMP updates flags without replacing the destination register.

The diagram shows the model's PC, memory, instruction register, register file, ALU, and flags. Highlighted blocks identify resources relevant to the next stage. It is a datapath view, not a transistor-level circuit or a pipelined processor.

## Branches and memory access

JMP always branches. JZ and JNZ branch according to the latched zero flag. The count-down example subtracts one, tests that flag, and jumps to a label until the register reaches zero. A breakpoint is checked before fetch, allowing automatic execution to stop before an instruction begins; manual stepping can then proceed past it.

LD and ST take a direct byte address. LDX and STX obtain the address from a register, with the data register as the first operand. This supports loops that walk memory without requiring an instruction for every address.

Memory edits pause the machine, abandon any pending instruction, restart fetch at the current PC, and clear undo history. The model keeps existing register values. Invalid instruction bytes fault during decoding and do not commit a register or memory result. Reset CPU restores the originally loaded program and clears execution state; Assemble & load establishes a new loaded program.

## Memory-mapped pixels

Addresses 0xC0 through 0xFF correspond to an 8 × 8 display in row-major order. Each pixel uses a byte. Zero is black; other values select colors through a deterministic palette. The display is therefore another interpretation of RAM, not a separate graphics state.

The framebuffer example loads a pointer with 0xC0, stores through STX, increments the pointer, and loops until it wraps to zero. Its 64 stores fill every display address. Pixels change only when the corresponding store commits at writeback. The same values remain available in the Memory view for manual inspection or editing.

## Verification and next steps

Tests cover assembly validation, label resolution, writeback timing, undo, arithmetic carry chains, branch execution, fault recovery, and all 64 framebuffer writes. A future gate-level view could extend the existing full-adder model, but the current ALU is not represented as a complete gate-level CPU. Stack operations, interrupts, and a larger address space would require explicit additions to the instruction-set contract rather than hidden special cases.
