# SILICON

Original educational ISA: four eight-bit registers, 256 shared program/data bytes, three-byte instructions. The lower 192 bytes hold assembled programs; 0xC0–0xFF map to 64 pixels. This is not a model of any commercial processor.

Assembler validation is line-specific. Labels are byte addresses. Fetch/decode/execute/writeback are explicit; execute creates a pending transaction, and writeback alone commits it. ADD uses the same full-adder records shown by the bit table. Z updates for arithmetic, compare, logic and shifts; C updates for addition, subtraction/no-borrow and shifts. Other instructions retain flags. HLT commits normally. The latest 200 complete microstep snapshots support undo, including pending writes.

Run stops on faults, halt, or a fetch-stage breakpoint. Memory edits pause, restart fetch and clear undo. Rendering never executes code on the host. Tests cover encoding, microstep commitment, undo, ALU carry chains, loops, faults and the complete framebuffer example. The instruction set and teaching-stage model are documented at `/lab/silicon/writeup`.
