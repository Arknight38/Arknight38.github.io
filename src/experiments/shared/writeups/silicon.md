## Overview

SILICON is an original, deliberately small eight-bit computer. It has four general-purpose registers, 256 bytes of shared program/data memory, a program counter, zero and carry flags, and a fixed three-byte instruction format. The assembler, execution engine, memory viewer, and pixel display all operate on the same byte array.

This is not an emulator for an existing processor. Its four execution stages are an inspectable teaching sequence rather than a claim about physical clock timing. No external assembly is executed on the host machine: programs are parsed into bytes and interpreted by the JavaScript CPU model.

Computer opens on a running pixel program, with the upper 64 bytes displayed as an image and register bits shown alongside it. Program contains the source editor and encoded listing. Execution exposes registers, the datapath, flags, and the adder. Memory displays every addressable byte. Switching views pauses execution without discarding registers or memory.

## Implementation scope

The instruction set, two-pass assembler, instruction decoder, CPU state machine, ripple-carry adder, execution snapshots, and RAM-to-pixel mapping are implemented in this project. React provides the interface; the browser runs the JavaScript model. There is no external CPU emulator or assembler underneath the controls. The datapath uses SVG and the pixel display reads the same RAM array exposed in Memory.

## From assembly to a visible pixel

This complete program colors the upper-left pixel:

```text
LDI R0, 90
ST R0, 0xC0
HLT
```

The assembler produces the following bytes. Decimal 90 is hexadecimal 5A; address C0 is decimal 192.

| Byte address | Assembly | Encoded bytes |
| --- | --- | --- |
| 00 | LDI R0, 90 | 01 00 5A |
| 03 | ST R0, 0xC0 | 0C 00 C0 |
| 06 | HLT | FF 00 00 |

At PC = 00, fetch reads `01 00 5A`. Decode identifies LDI, register zero, and immediate 90. Execute creates a pending register result; writeback changes R0 to 90 and PC to 03. At that point the pixel is still black because no display byte has changed.

The next instruction fetches `0C 00 C0`. Execute constructs a pending store with address 192 and value 90. Only its writeback changes RAM[192]. Computer maps that byte to column one, row one and applies the deterministic color palette. HLT then stops the machine at its own writeback. This sequence is tested at the microstep level: neither fetch, decode, nor execute may color the pixel early.

To follow it interactively, paste the three lines into Program, choose Assemble & load, and open Execution. Next cycle advances through each of the four stages; Computer and Memory show the result of the same committed store. Switching views pauses the model.

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

The framebuffer example loads a pointer with 0xC0, stores through STX, increments the pointer, and loops until it wraps to zero. Its 64 stores fill every display address. Program-driven pixel changes happen when the corresponding store commits at writeback. The same values remain available in the Memory view for manual inspection or editing.

## Visual programs and direct interaction

The opening XOR weave program repeatedly combines a framebuffer address with a changing counter, shifts the result, and stores it into that address. Its texture is calculated by the same CPU that runs hand-written assembly:

```text
frame: MOV R0, R1
XOR R0, R3
SHL R0
STX R0, R1
ADD R1, R2
JNZ frame
```

R1 traverses addresses 192–255. On wrapping to zero, the surrounding program advances R3, reloads the framebuffer base address, and starts another pass. Each pass changes the resulting color bytes. Moving pixel instead clears the old address before writing the next, while Color sweep increments the color and address counters together. These are continuously executing assembly programs rather than animations drawn over the CPU display.

The last committed store retains its address, byte value, and instruction count. The display highlights that pixel and translates the address into a row and column. Register lamps show the bits of the actual four registers. The Computer view batches complete instructions for useful visual speed; Execution advances one stage per clock tick so fetch, decode, execute, and writeback remain distinguishable.

Draw pixels pauses the CPU and enables direct interaction with the display. A chosen color byte is written into the corresponding RAM address using the same memory-edit operation as the Memory page. This restarts fetch, clears undo history, and preserves registers. Resuming execution lets the loaded program overwrite those pixels again. The interaction exposes the relationship between an image and its stored bytes without requiring an assembly edit.

## An execution-visibility problem

Advancing a whole instruction on every animation tick always returned the machine to the fetch boundary before React displayed it. Registers and memory changed correctly, but the diagram appeared to remain at fetch. For a visitor trying to follow an instruction, the accurate state was still an unhelpful explanation.

Execution now advances one microstep per tick, so the pending result and the eventual writeback can be inspected separately. Computer retains instruction batching because pixel programs need higher throughput to form an image. Both views operate on the same CPU; the difference is how many steps occur between display updates. Tests distinguish the pending store from committed RAM and confirm that undo restores the pre-writeback state.

## Verification and next steps

Tests cover assembly validation, label resolution, writeback timing, undo, arithmetic carry chains, branch execution, fault recovery, and all 64 framebuffer writes. A future gate-level view could extend the existing full-adder model, but the current ALU is not represented as a complete gate-level CPU. Stack operations, interrupts, and a larger address space would require explicit additions to the instruction-set contract rather than hidden special cases.
