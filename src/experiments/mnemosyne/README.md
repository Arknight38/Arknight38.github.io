# MNEMOSYNE

A bounded, browser-local memory/dynamic-analysis laboratory. Shared Workspace tabs provide Memory, Trace, Structures, and Analysis; the separate writeup documents contracts and limitations.

- `engine/MemorySpace.js`: 1 KiB memory, fixed globals/heap/stack regions, aligned first-fit heap, checked payload access, LIFO frames.
- `engine/ProcessRuntime.js`: modeled operations, transactional faults, full snapshots, deterministic historical replay.
- `examples/`: linked list, recursive calls, fragmentation/address reuse, mixed-type record.
- `analysis/`: schema-driven little-endian pointer resolution, root reachability, identity-aware snapshot diff.

No process attachment, native instruction execution, or automatic type inference. Freed memory retains bytes; allocation zeroes its reserved range. Roots and pointer offsets are explicit schema information. Unreachable allocations are candidates, not a proof of native-code leaks.
