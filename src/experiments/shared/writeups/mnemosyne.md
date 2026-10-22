## Overview

MNEMOSYNE follows a small modeled process through its memory operations. Allocations, stack frames, pointer fields, and byte values share one address space. The map, trace, interpreted structures, and analysis pages are different views of that state, rather than independent visual demonstrations.

The four programs construct a linked list, build and unwind recursive stack frames, create holes in a first-fit heap, and populate a record with integer, floating-point, text, and pointer fields. Each step performs one explicit operation. Playback can move backward through captured states, including released objects and earlier values of memory.

The model is deliberately bounded: 1 KiB of bytes, fixed regions, 32-bit little-endian pointer values, and a short sequence of instrumented operations. It does not attach to another program, execute a compiled binary, emulate a native instruction set, or infer arbitrary C++ object layouts. SILICON examines CPU execution; this laboratory examines ownership and data movement after memory operations have been identified.

## Implementation scope

The byte-addressable memory space, first-fit allocator, stack manager, process runtime, execution recorder, pointer resolver, reachability analysis, snapshot comparison, and access counters are implemented in this project. React handles the interface and SVG draws the memory cells. There is no external memory-profiler engine underneath the views.

The engine lives outside React. `MemorySpace` validates ownership and reads or writes bytes. `HeapAllocator` chooses gaps and tracks object lifetimes. `StackManager` reserves and releases frames in LIFO order. `ProcessRuntime` interprets demonstration operations and records their effects. Analysis functions consume the same memory objects or captured snapshots without advancing execution.

That separation is useful for verification. Tests can fill a heap, replay a program, compare snapshots, or decode a pointer without creating a browser window. A visual result is then supported by the same calculation that a test can inspect directly.

## A byte-addressable process model

The address space begins at 0x1000 and ends at 0x13FF. The first 64 bytes are reserved for globals, the next 704 for heap allocations, and the final 256 for stack frames. The current programs use an eight-byte global object: the first word is a declared pointer root and the second stores scalar output.

| Region | Range | Model |
| --- | --- | --- |
| Globals | 0x1000–0x103F | Fixed reserved region, with an eight-byte root/output object |
| Heap | 0x1040–0x12FF | First-fit, eight-byte-aligned allocations |
| Stack | 0x1300–0x13FF | Sixteen-byte frames growing toward lower addresses |

A block records its address, requested payload, reserved size, allocation ID, region, declared pointer offsets, and lifetime. Requests are rounded up to eight bytes. The payload bound remains the requested size: padding is visible but cannot be read through the object's checked memory interface. Regions are fixed, so heap and stack cannot grow into one another.

Allocation zero-initializes its reserved range. Freeing changes ownership while retaining the bytes. This lets the map distinguish unallocated space containing old data from a currently live object. Reading those old bytes through a released object is rejected; inspecting their physical representation in the viewer does not execute a modeled read.

## Allocation, holes, and fragmentation

The allocator sorts live heap blocks by address and derives the gaps between them. It chooses the first gap large enough for the aligned request. Released adjacent regions naturally form a larger derived gap; no separate free-list nodes need to be merged.

The central choice is:

```javascript
const size = Math.ceil(requested / 8) * 8;
const gap = this.gaps().find(g => g.size >= size);
```

The fragmentation program allocates four 128-byte buffers, frees alternating buffers, and places a 96-byte replacement in the first hole. Its address matches the first buffer's address, but its allocation ID is different. A later 160-byte buffer fits in the trailing gap rather than either smaller interior hole.

Analysis separates requested payload from reserved heap bytes. Its external-fragmentation metric is `1 − largest_free_gap / total_free_heap`, defined as zero when no free bytes remain. This is a description of this allocator's free-space distribution, not a universal measure of allocator quality. A request may fail despite enough total free space if no single gap is large enough.

The allocator does not model native headers, page tables, arenas, size classes, or concurrent allocation. Those mechanisms could change both placement and overhead. The displayed results describe the implemented first-fit policy.

## From a stored address to a linked list

Every linked-list node has an explicit eight-byte layout: a four-byte unsigned value at offset zero and a four-byte pointer at offset four. The first node contains 42; the next contains 17. The global head field holds the first node's address.

After the second node has been linked, the first node begins:

```text
0x1040: 2A 00 00 00 48 10 00 00
         value = 42   next = 0x1048
```

The pointer is evidence in the byte array, not an edge stored separately for drawing. The resolver decodes each declared pointer field, looks for a live object containing its value, and marks it as live, null, released, or unmapped. An interior pointer can resolve to the containing object; a zero word is treated as null.

The Structures page lists each field's owning allocation, byte offset, raw bytes, decoded destination, and resolved object. Selecting an edge opens its destination in Memory. The same sixteen-byte record can also be read as signed integers, unsigned integers, IEEE 754 binary32 values, printable ASCII, or an address hypothesis. Its float 3.5 is stored as `00 00 60 40`; its text field contains `44 53 50 00`, or DSP followed by a zero byte.

Pointer offsets are supplied by the demonstration schema. The viewer does not decide that an arbitrary integer is a pointer because it resembles an address. Choosing an address interpretation changes the displayed hypothesis without silently adding a graph edge.

## Function calls and stack ownership

The recursive demonstration models factorial calls from five down to one. Each call reserves a sixteen-byte frame below the previous frame and writes its argument into that frame. Returns release frames in reverse order. Intermediate products are written into their corresponding frames before each return; the final scalar result, 120, is stored in the global output word.

A call event records the frame's address, size, identity, and function label. A return event records the released frame and returned value. Stack depth and peak depth come from the live frame list, not a separate animation counter.

The frames are a teaching convention. Sixteen bytes do not claim to reproduce a real compiler's ABI, return address, saved registers, alignment, or optimization decisions. The demonstration's calls are explicit runtime operations; JavaScript does not recursively call factorial on behalf of the simulated stack.

## Instrumented events and access history

Every successful operation yields one trace event. Writes record the prior and replacement bytes. Reads record the returned bytes. Allocation and free events record the object identity and extent; call and return events record stack-frame lifetimes. Each event also identifies the responsible modeled operation.

A write uses ownership checks before changing the shared byte array:

```javascript
const block = this.owner(at, bytes.length);
const before = this.read(at, bytes.length);
this.bytes.set(bytes, at - BASE);
```

The runtime also checks the operation's offset against its named object's requested payload. This prevents an out-of-bounds operation from being accepted merely because a neighboring object owns the target address. If an operation faults, its partial changes are rolled back and a fault event is recorded.

Filtering by allocation ID preserves a particular lifetime even when the address is reused. Selecting Show bytes restores the snapshot immediately after that event and highlights its address range in Memory. Its event number and the historical-state label remain visible. Next event replays the retained future rather than executing a second copy of the operation. Selecting a byte, address, or live object pauses playback and disables automatic following so inspection stays at the chosen location.

Access counts increment for instrumented read and write bytes. Inspection through the interface does not count as program activity. Hotspots are address-based, so activity from successive owners of one address accumulates; the allocation-filtered trace remains the way to distinguish those lifetimes.

## Snapshot recording and replay

The recorder stores the initial state and a full snapshot after each operation. A snapshot contains bytes, allocation metadata, the next allocation ID, program position, symbolic references, access counters, status, and peak measurements. Backward playback therefore restores ownership and control state along with the visible data.

Seeking into history restores a copy of a captured state. Next first replays any already-recorded future states; only at the end of recorded history does it execute a new operation. Inspection cannot fork or mutate a historical execution. Reset starts a separate run of the selected demonstration.

Full snapshots make this bounded version straightforward to verify. A production profiler would need a different storage strategy for millions of events, such as deltas with periodic checkpoints. These examples contain at most a few dozen operations, and the display does not imply unbounded trace capture.

## Reachability and allocation identity

Analysis starts from live global and stack objects, follows their declared pointer fields, and marks the reachable heap objects. Remaining live heap objects are reported as unreachable candidates. An unlinked object during list construction may be temporary; the end-of-program state is a more useful checkpoint. Missing layout information can also make a genuinely used allocation appear unreachable.

Snapshot comparison separately reports changed bytes, newly live identities, and released identities. This avoids a particularly important ambiguity: freeing an object and allocating a replacement at the same address is a lifetime change even if their byte contents happen to match. Comparing only addresses or only bytes would lose that evidence.

The replacement buffer provides a concrete case. Allocation #1 and its replacement occupy 0x1040 at different times. The byte map follows the current owner, the trace can isolate either allocation ID, and a snapshot diff can report one object released and another created. A raw pointer containing 0x1040, however, resolves to the current owner; bytes alone cannot reveal whether the original program intended an earlier lifetime. That limitation is kept explicit rather than claiming general use-after-free detection.

## Verification and further work

Engine tests check aligned first-fit placement, failed allocation without partial mutation, gap recovery, object bounds, double free, invalid accesses, stack LIFO order, and stack overflow. The linked-list test follows the actual stored addresses and checks its values. Record tests verify integer, float, and text interpretations from known bytes. Replay tests restore historical bytes, identities, counters, and program position, then verify that forward playback reproduces the retained result.

Analysis tests check fragmentation, reachability, address reuse, and snapshot identity changes. UI tests check timeline stepping, view preservation, trace-to-memory navigation, scenario resets, and structure interpretation. These checks establish the modeled contracts; they do not validate compatibility with a native allocator or executable format.

Possible extensions include delta recording, user-authored operations, additional structure schemas, and instrumented WebAssembly. Running compiled code would require a new execution and instrumentation contract. It would not turn the existing schema-driven pointer interpretation into automatic recovery of arbitrary native types.
