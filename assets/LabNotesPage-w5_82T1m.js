import{d as e,l as t,m as n,r,t as i}from"./jsx-runtime-BhOe2DHf.js";import{t as a}from"./writeup-layout-BjMXN8Zm.js";import{t as o}from"./LabNavigation-DA4thY5Y.js";var s=n(e(),1),c=i();function l({id:e,title:t,summary:n,content:i}){let o=(0,s.useMemo)(()=>i.split(/^## /m).filter(e=>e.trim()).map(t=>{let n=t.indexOf(`
`),r=t.slice(0,n).trim();return{title:r,body:t.slice(n+1).trim(),id:`${e}-notes-${r.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-|-$/g,``)}`}}),[i,e]),l=Math.ceil(i.trim().split(/\s+/).length/220);return(0,c.jsxs)(`article`,{className:`lab-writeup`,id:`${e}-writeup`,tabIndex:-1,"aria-labelledby":`${e}-writeup-title`,children:[(0,c.jsxs)(`header`,{className:`lab-writeup-heading`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsxs)(`div`,{className:`eyebrow`,children:[`THE EXPERIMENT, EXPLAINED / `,l,` MIN READ`]}),(0,c.jsx)(`h1`,{id:`${e}-writeup-title`,children:t}),(0,c.jsx)(`p`,{children:n})]}),(0,c.jsx)(r,{to:`/lab/${e}`,className:`lab-return`,children:`Open experiment ↗`})]}),(0,c.jsxs)(`div`,{className:`lab-writeup-layout`,children:[(0,c.jsx)(`div`,{className:`lab-writeup-sections`,children:o.map(e=>(0,c.jsxs)(`section`,{id:e.id,tabIndex:-1,className:`lab-writeup-section`,children:[(0,c.jsx)(`h2`,{children:e.title}),(0,c.jsx)(`div`,{className:`markdown writeup-prose`,children:(0,c.jsx)(a,{children:e.body})})]},e.id))}),(0,c.jsx)(`aside`,{className:`lab-writeup-rail`,children:(0,c.jsxs)(`nav`,{"aria-label":`${t} sections`,children:[(0,c.jsx)(`span`,{className:`eyebrow`,children:`IN THIS WRITEUP`}),(0,c.jsx)(`ol`,{children:o.map(e=>(0,c.jsx)(`li`,{children:(0,c.jsx)(`a`,{href:`#${e.id}`,children:e.title})},e.id))}),(0,c.jsx)(r,{className:`lab-return`,to:`/lab/${e}`,children:`Try it in the experiment ↗`})]})})]})]})}var u=(0,s.memo)(l),d={mnemosyne:{title:`Following memory through a running program`,summary:`Allocation lifetimes, byte representations, recorded execution, and the evidence behind pointer and leak analysis.`,content:`## Overview

MNEMOSYNE follows a small modeled process through its memory operations. Allocations, stack frames, pointer fields, and byte values share one address space. The map, trace, interpreted structures, and analysis pages are different views of that state, rather than independent visual demonstrations.

The four programs construct a linked list, build and unwind recursive stack frames, create holes in a first-fit heap, and populate a record with integer, floating-point, text, and pointer fields. Each step performs one explicit operation. Playback can move backward through captured states, including released objects and earlier values of memory.

The model is deliberately bounded: 1 KiB of bytes, fixed regions, 32-bit little-endian pointer values, and a short sequence of instrumented operations. It does not attach to another program, execute a compiled binary, emulate a native instruction set, or infer arbitrary C++ object layouts. SILICON examines CPU execution; this laboratory examines ownership and data movement after memory operations have been identified.

## Implementation scope

The byte-addressable memory space, first-fit allocator, stack manager, process runtime, execution recorder, pointer resolver, reachability analysis, snapshot comparison, and access counters are implemented in this project. React handles the interface and SVG draws the memory cells. There is no external memory-profiler engine underneath the views.

The engine lives outside React. \`MemorySpace\` validates ownership and reads or writes bytes. \`HeapAllocator\` chooses gaps and tracks object lifetimes. \`StackManager\` reserves and releases frames in LIFO order. \`ProcessRuntime\` interprets demonstration operations and records their effects. Analysis functions consume the same memory objects or captured snapshots without advancing execution.

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

\`\`\`javascript
const size = Math.ceil(requested / 8) * 8;
const gap = this.gaps().find(g => g.size >= size);
\`\`\`

The fragmentation program allocates four 128-byte buffers, frees alternating buffers, and places a 96-byte replacement in the first hole. Its address matches the first buffer's address, but its allocation ID is different. A later 160-byte buffer fits in the trailing gap rather than either smaller interior hole.

Analysis separates requested payload from reserved heap bytes. Its external-fragmentation metric is \`1 − largest_free_gap / total_free_heap\`, defined as zero when no free bytes remain. This is a description of this allocator's free-space distribution, not a universal measure of allocator quality. A request may fail despite enough total free space if no single gap is large enough.

The allocator does not model native headers, page tables, arenas, size classes, or concurrent allocation. Those mechanisms could change both placement and overhead. The displayed results describe the implemented first-fit policy.

## From a stored address to a linked list

Every linked-list node has an explicit eight-byte layout: a four-byte unsigned value at offset zero and a four-byte pointer at offset four. The first node contains 42; the next contains 17. The global head field holds the first node's address.

After the second node has been linked, the first node begins:

\`\`\`text
0x1040: 2A 00 00 00 48 10 00 00
         value = 42   next = 0x1048
\`\`\`

The pointer is evidence in the byte array, not an edge stored separately for drawing. The resolver decodes each declared pointer field, looks for a live object containing its value, and marks it as live, null, released, or unmapped. An interior pointer can resolve to the containing object; a zero word is treated as null.

The Structures page lists each field's owning allocation, byte offset, raw bytes, decoded destination, and resolved object. Selecting an edge opens its destination in Memory. The same sixteen-byte record can also be read as signed integers, unsigned integers, IEEE 754 binary32 values, printable ASCII, or an address hypothesis. Its float 3.5 is stored as \`00 00 60 40\`; its text field contains \`44 53 50 00\`, or DSP followed by a zero byte.

Pointer offsets are supplied by the demonstration schema. The viewer does not decide that an arbitrary integer is a pointer because it resembles an address. Choosing an address interpretation changes the displayed hypothesis without silently adding a graph edge.

## Function calls and stack ownership

The recursive demonstration models factorial calls from five down to one. Each call reserves a sixteen-byte frame below the previous frame and writes its argument into that frame. Returns release frames in reverse order. Intermediate products are written into their corresponding frames before each return; the final scalar result, 120, is stored in the global output word.

A call event records the frame's address, size, identity, and function label. A return event records the released frame and returned value. Stack depth and peak depth come from the live frame list, not a separate animation counter.

The frames are a teaching convention. Sixteen bytes do not claim to reproduce a real compiler's ABI, return address, saved registers, alignment, or optimization decisions. The demonstration's calls are explicit runtime operations; JavaScript does not recursively call factorial on behalf of the simulated stack.

## Instrumented events and access history

Every successful operation yields one trace event. Writes record the prior and replacement bytes. Reads record the returned bytes. Allocation and free events record the object identity and extent; call and return events record stack-frame lifetimes. Each event also identifies the responsible modeled operation.

A write uses ownership checks before changing the shared byte array:

\`\`\`javascript
const block = this.owner(at, bytes.length);
const before = this.read(at, bytes.length);
this.bytes.set(bytes, at - BASE);
\`\`\`

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
`},kepler:{title:`Integrating an orbital system`,summary:`Newtonian forces, softened encounters, and measured differences between numerical methods.`,content:`## Overview

KEPLER integrates a small Newtonian gravitational system in two dimensions. Bodies carry mass, position, and velocity; the same state drives the orbital view, force vectors, predicted paths, and conservation measurements. The opening planetary system is generated from a seed. Binary, planetary, three-body, and orbital-swarm families vary their masses, phases, spacing, and starting velocities while using the same force model.

The simulation uses normalized units with G = 1. It is intended for examining the behavior of numerical methods and interacting systems, rather than reproducing an astronomical ephemeris. Masses are softened point particles: they pass through one another, and the engine does not implement physical radii, impacts, merging, tides, or relativity.

System holds initial conditions and body editing. Orbits separates the view and integration controls from editing. Conservation contains measured energy and momentum, and Integrators runs three independent comparisons from a shared state. Switching views pauses the live simulation and keeps its state. The writeup is a separate page so it does not compete with the orbital plane.

## Implementation scope

The pair-force calculation, softened potential, velocity-Verlet, forward-Euler and RK4 integrators, seeded initial-condition generator, trajectory prediction, and energy/momentum diagnostics are implemented in JavaScript here. Canvas renders those calculated positions and histories. React manages the controls; there is no external orbital solver behind the animation.

## Setting up an orbital system

Start with Binary stars and run a few orbits. Both bodies move; there is no fixed central star in the force calculation. Fit bodies adjusts the viewing radius without changing their coordinates or velocities. Trails retain up to 600 observed positions per body, while the optional dashed paths integrate the current state forward for 180 timesteps.

The generated planetary family contains a much heavier central body and five lighter companions; the swarm increases that to ten companions. Its velocities are approximate circular starting conditions, not an exact analytic solution of the interacting three-body system. The initial center-of-mass position and velocity are removed from each preset to avoid a distracting overall drift.

With Select nearest body active, select a body through the selector or by clicking near it. Mass and coordinate inputs provide a keyboard alternative to selecting on the canvas. An added body starts at rest, so setting a velocity before running is usually useful. The Spawn at click tool determines position only; it does not infer a circular velocity.

Every edit pauses motion and establishes a fresh measurement baseline. Removing a body changes the physical system and its energy, so comparing the edited result against the old baseline would be misleading. Reset system restores the most recently established initial conditions. The seed identifies a generated arrangement; entering the same seed and family reconstructs the same bodies. New system advances the seed, while Reset system replays the most recently established conditions. Randomness belongs to setup, not to the numerical force calculation.

## Launching and comparing initial conditions

The default canvas tool launches a new body. Pointer-down records its position; dragging previews a line, and release converts that displacement into initial velocity. A line one distance unit long supplies one velocity unit in its direction. The preview is an input vector, not an orbital prediction. A small default mass keeps a launched body from immediately dominating a planetary system, and its mass and velocity remain editable afterward.

The line gesture establishes a new measurement baseline before integration resumes. The numerical solver remains deterministic for the chosen bodies, method, and timestep. This distinction makes it possible to explore different encounters and still reproduce an interesting one. Steps per frame changes how quickly simulated time passes on screen without changing the physical timestep.

The seeded generator starts from an unsigned 32-bit state:

\`\`\`javascript
state = (Math.imul(1664525, state) + 1013904223) >>> 0;
return state / 4294967296;
\`\`\`

This small reproducible generator selects initial conditions; it is not intended for cryptography or statistical research. Generated planetary velocities approximate circular motion around the central mass with a small variation. They do not guarantee long-term stability after mutual perturbations or a newly launched body.

## Pairwise acceleration and softening

For every unordered pair, the engine calculates a displacement and applies equal-and-opposite forces. Accelerations differ when masses differ because acceleration divides force by the receiving body's mass. The pair loop uses a softened inverse-distance factor:

\`\`\`javascript
const scale = 1 / Math.pow(dx * dx + dy * dy + epsilon * epsilon, 1.5);
a[i].x += bodies[j].mass * dx * scale;
a[j].x -= bodies[i].mass * dx * scale;
\`\`\`

Source: \`kepler/engine.js\`, inside \`accelerations\`; the y components use the same rule.

The fixed softening length is 0.025 distance units. It removes the singularity at zero separation and makes overlapping bodies numerically defined. It also changes the physical model at small separations; close approaches should not be interpreted as unsoftened point-mass scattering.

Energy diagnostics use the matching potential, \`−m_i m_j / sqrt(r² + epsilon²)\`. Using an unsoftened potential beside softened accelerations would report an apparent energy error even if the integration were otherwise consistent. A numerical derivative test checks that this potential produces the implemented force.

## Leapfrog, Euler, and RK4

The default integrator is velocity Verlet, a time-centered form of leapfrog. It advances positions using current acceleration, evaluates acceleration at the new positions, and combines both accelerations for the velocity update:

\`\`\`javascript
xNext = x + dt * vx + 0.5 * dt * dt * ax;
vxNext = vx + 0.5 * dt * (ax + axNext);
\`\`\`

These expressions summarize the corresponding position and velocity updates in \`integrate\`.

Forward Euler uses the current velocity to advance position and the current acceleration to advance velocity. It is useful here because its accumulated orbital error is easy to compare with the other methods. RK4 evaluates four derivatives and combines them with the usual 1:2:2:1 weights. All three methods use the same acceleration function, timestep, and initial state in a comparison.

Higher local order and long-term conservation are different properties. Leapfrog preserves a symplectic structure for this position-dependent force, but it does not conserve the displayed energy exactly. RK4 can have much smaller short-term error while showing different long-time behavior. The discussion of these distinctions in [MIT's Numerical Algorithms text](https://people.csail.mit.edu/jsolomon/share/book/numerical_book_sub2.pdf) provides useful background.

## Trails, predictions, and vectors

A trail records the trajectory already calculated by the live engine. A predicted path is a separate integration from the current state using the current method and timestep. Prediction does not move the live system, and it is not an analytic solution or a confidence interval. In a sensitive three-body encounter, nearby initial conditions can produce different later paths.

The vector selector distinguishes acceleration from net gravitational force. Force multiplies acceleration by the selected body's mass, so the two overlays can look different in a system with unequal masses. Lengths share an automatically chosen scale to remain visible; the overlay is a relative visualization rather than an arrow measured in screen pixels per force unit.

## Measuring numerical drift

Conservation displays kinetic energy, softened potential energy, total energy, angular momentum about the origin, and both linear-momentum components. The graphs retain 500 observations and show energy change relative to the baseline and absolute angular-momentum change.

Integrators runs each method at timesteps 0.005, 0.02, and 0.1 for the same ten time units. It uses copies of either the current system or a fixed circular-binary reference, leaving the live state unchanged. The finer timestep takes more steps to reach the same endpoint; increasing dt does not secretly extend the experiment. The table reports signed final energy change and the largest absolute energy change measured at every integration step, normalized by the magnitude of initial energy.

Tests check pair-force balance, potential/force consistency, a bound circular binary, angular-momentum preservation, and the relative energy drift of Euler, leapfrog, and RK4. They also verify that forecasting does not advance the original system and that softened overlap remains finite.

## Experiment: an unsuitable method or timestep

Open Integrators, select Circular binary reference, and run the comparison. The fixed reference has two unit masses, separation one, and circular velocities calculated for the softened force. It separates numerical error from complicated encounters. Select a plotted timestep to compare the three methods, then use the table to compare timestep sizes.

The following values are calculated by the engine for ten simulation time units. They are percentages of |E(0)|, with positive values meaning the numerical system gained total energy.

| Method | dt | Final energy change | Largest absolute change |
| --- | --- | --- | --- |
| Forward Euler | 0.005 | +14.4683% | 14.4683% |
| Forward Euler | 0.02 | +34.1507% | 34.1507% |
| Forward Euler | 0.1 | +57.5877% | 57.5877% |
| Leapfrog | 0.005 | +3.1453e-8% | 6.2184e-8% |
| Leapfrog | 0.1 | +0.004890% | 0.009659% |
| RK4 | 0.1 | −0.002222% | 0.002222% |

For this reference, even the fine Euler run adds substantial energy, making an otherwise bound orbit expand artificially. Coarsening leapfrog increases its error by orders of magnitude. Its final error can also be smaller than an intermediate excursion, which is why the maximum-error column matters. RK4's smaller error here does not establish long-term symplectic behavior or guarantee accuracy in a close encounter. Different initial conditions can have a different error scale.

## A reproducibility problem

The first setup repeatedly loaded the same arrangement. That made numerical comparisons reproducible, but gave visitors little variation between experiments. Injecting random forces during integration would create variety at the cost of changing the model and invalidating conservation measurements.

The revised design confines randomness to initial conditions and exposes its seed. New system changes that seed; Reset restores the chosen bodies. Removing center-of-mass position and velocity keeps a generated system centered without forcing its central star to remain fixed. Tests check that equal seeds reproduce equal bodies, different seeds change them, and generated systems begin with effectively zero net momentum.

## Further work

Adaptive timesteps would help resolve close encounters, but introducing them into a symplectic method requires care. Collision models, explicit units, and barycentric camera tracking are separate extensions. The current laboratory keeps the force model and numerical methods small enough that their behavior can be inspected directly.
`},silicon:{title:`Inside an eight-bit machine`,summary:`Instruction encoding, staged execution, an explicit ALU, and memory-mapped pixels.`,content:`## Overview

SILICON is an original, deliberately small eight-bit computer. It has four general-purpose registers, 256 bytes of shared program/data memory, a program counter, zero and carry flags, and a fixed three-byte instruction format. The assembler, execution engine, memory viewer, and pixel display all operate on the same byte array.

This is not an emulator for an existing processor. Its four execution stages are an inspectable teaching sequence rather than a claim about physical clock timing. No external assembly is executed on the host machine: programs are parsed into bytes and interpreted by the JavaScript CPU model.

Computer opens on a running pixel program, with the upper 64 bytes displayed as an image and register bits shown alongside it. Program contains the source editor and encoded listing. Execution exposes registers, the datapath, flags, and the adder. Memory displays every addressable byte. Switching views pauses execution without discarding registers or memory.

## Implementation scope

The instruction set, two-pass assembler, instruction decoder, CPU state machine, ripple-carry adder, execution snapshots, and RAM-to-pixel mapping are implemented in this project. React provides the interface; the browser runs the JavaScript model. There is no external CPU emulator or assembler underneath the controls. The datapath uses SVG and the pixel display reads the same RAM array exposed in Memory.

## From assembly to a visible pixel

This complete program colors the upper-left pixel:

\`\`\`text
LDI R0, 90
ST R0, 0xC0
HLT
\`\`\`

The assembler produces the following bytes. Decimal 90 is hexadecimal 5A; address C0 is decimal 192.

| Byte address | Assembly | Encoded bytes |
| --- | --- | --- |
| 00 | LDI R0, 90 | 01 00 5A |
| 03 | ST R0, 0xC0 | 0C 00 C0 |
| 06 | HLT | FF 00 00 |

At PC = 00, fetch reads \`01 00 5A\`. Decode identifies LDI, register zero, and immediate 90. Execute creates a pending register result; writeback changes R0 to 90 and PC to 03. At that point the pixel is still black because no display byte has changed.

The next instruction fetches \`0C 00 C0\`. Execute constructs a pending store with address 192 and value 90. Only its writeback changes RAM[192]. Computer maps that byte to column one, row one and applies the deterministic color palette. HLT then stops the machine at its own writeback. This sequence is tested at the microstep level: neither fetch, decode, nor execute may color the pixel early.

To follow it interactively, paste the three lines into Program, choose Assemble & load, and open Execution. Next cycle advances through each of the four stages; Computer and Memory show the result of the same committed store. Switching views pauses the model.

## Instruction format and assembly

Every instruction occupies three consecutive bytes. The first is an opcode; the next two hold register indices, immediate values, or addresses according to that opcode. Even NOP and HLT occupy three bytes. A normally advancing instruction therefore moves PC by three, with eight-bit wrapping, rather than incrementing an instruction index.

The smallest example is:

\`\`\`text
LDI R0, 5
LDI R1, 3
ADD R0, R1
HLT
\`\`\`

LDI places an immediate byte in a register. ADD writes its result back to its first operand, so the example leaves R0 equal to eight. The assembled bytes begin \`01 00 05\`, followed by \`01 01 03\`.

The assembler makes two passes. The first records labels and instruction addresses; the second resolves operands and emits bytes. Label references are byte addresses. Semicolon comments and hexadecimal immediates are supported. Invalid mnemonics, register indices, duplicate labels, missing operands, and values outside 0–255 produce a line-specific error.

Source programs are limited to the lower 192 bytes so assembly does not silently overwrite the framebuffer. That limit is a loader policy, not a restriction on what a running program can store. Program and data still share RAM, and the Memory view can demonstrate self-modifying code.

## Fetch, decode, execute, and writeback

Next cycle advances one microstep. Step instruction completes the current instruction, which may already be partially executed. The highlighted stage is the next stage that will run.

Fetch reads three bytes from the current PC into the instruction register. Decode validates the opcode and register fields and creates a human-readable instruction. Execute calculates a pending result. Writeback commits registers, flags, memory writes, and the next PC. HLT becomes effective at writeback.

The separation is visible in the engine:

\`\`\`javascript
this.pending = this.execute();
\`\`\`

Execute returns a result object instead of immediately replacing the architectural state. At writeback, register values are copied from that result:

\`\`\`javascript
this.regs.set(p.regs);
this.flags = p.flags;
this.pc = p.pc;
if (p.memory) this.memory[p.memory.address] = p.memory.value;
\`\`\`

Source: \`silicon/engine.js\`, excerpts from \`step\`.

This makes a distinction that would be hidden in an instruction-only emulator: an ALU result can exist before the destination register changes. Previous cycle restores a complete retained snapshot, including a pending operation, so undoing writeback returns to the state immediately before commitment. The most recent 200 microsteps are retained.

## Eight-bit arithmetic and the adder

Registers use \`Uint8Array\` storage. Addition and subtraction wrap to eight bits; the carry flag records overflow for addition and a no-borrow condition for subtraction. Zero is updated by arithmetic, comparisons, logic operations, and shifts. Loads, moves, and branches leave the existing flags unchanged. Logic operations update zero while preserving carry; shifts update the bit shifted out.

ADD is implemented by eight full-adder stages rather than calculating a display-only carry diagram afterward. Each stage records the two input bits, carry-in, sum, and carry-out. Its core equations are:

\`\`\`javascript
sum = x ^ y ^ carry;
next = (x & y) | (carry & (x ^ y));
\`\`\`

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

\`\`\`text
frame: MOV R0, R1
XOR R0, R3
SHL R0
STX R0, R1
ADD R1, R2
JNZ frame
\`\`\`

R1 traverses addresses 192–255. On wrapping to zero, the surrounding program advances R3, reloads the framebuffer base address, and starts another pass. Each pass changes the resulting color bytes. Moving pixel instead clears the old address before writing the next, while Color sweep increments the color and address counters together. These are continuously executing assembly programs rather than animations drawn over the CPU display.

The last committed store retains its address, byte value, and instruction count. The display highlights that pixel and translates the address into a row and column. Register lamps show the bits of the actual four registers. The Computer view batches complete instructions for useful visual speed; Execution advances one stage per clock tick so fetch, decode, execute, and writeback remain distinguishable.

Draw pixels pauses the CPU and enables direct interaction with the display. A chosen color byte is written into the corresponding RAM address using the same memory-edit operation as the Memory page. This restarts fetch, clears undo history, and preserves registers. Resuming execution lets the loaded program overwrite those pixels again. The interaction exposes the relationship between an image and its stored bytes without requiring an assembly edit.

## An execution-visibility problem

Advancing a whole instruction on every animation tick always returned the machine to the fetch boundary before React displayed it. Registers and memory changed correctly, but the diagram appeared to remain at fetch. For a visitor trying to follow an instruction, the accurate state was still an unhelpful explanation.

Execution now advances one microstep per tick, so the pending result and the eventual writeback can be inspected separately. Computer retains instruction batching because pixel programs need higher throughput to form an image. Both views operate on the same CPU; the difference is how many steps occur between display updates. Tests distinguish the pending store from committed RAM and confirm that undo restores the pre-writeback state.

## Verification and next steps

Tests cover assembly validation, label resolution, writeback timing, undo, arithmetic carry chains, branch execution, fault recovery, and all 64 framebuffer writes. A future gate-level view could extend the existing full-adder model, but the current ALU is not represented as a complete gate-level CPU. Stack operations, interrupts, and a larger address space would require explicit additions to the instruction-set contract rather than hidden special cases.
`},resonance:{title:`Waves on a numerical grid`,summary:`A finite-difference wave field with driven sources, fixed obstacles, and measured spectra.`,content:`## Overview

RESONANCE evolves a classical two-dimensional wave field. Each grid cell stores a scalar displacement, and neighboring cells determine how that displacement changes. The image comes from the calculated field: interference and diffraction are consequences of the update rule and geometry, rather than animated textures.

The default medium has 96 × 96 cells over a unit square. The model is a constant-speed scalar wave equation with damping, prescribed point emitters, and fixed-displacement obstacles. It is not a quantum simulation, a fluid solver, or a full acoustic model with density, pressure, and impedance changes.

Medium contains the evolving field and obstacle tools. Emitters exposes positions, frequency, amplitude, and phase. Measurements separates the probe history and frequency analysis from editing. Switching views pauses the solver but retains the field and probe samples. The numeric history remains available until the probe moves, the field is cleared, or a medium parameter changes.

## Implementation scope

The grid solver, source injection, obstacle rasterization, boundary sponge, probe history, Hann window, and direct DFT are implemented in JavaScript in this project. The field is rendered cell by cell through Canvas; its propagation patterns do not come from a physics library or prerecorded animation. React supplies the interface. Frequency analysis uses a small direct DFT, while SPECTRA's separate implementation uses an FFT.

## Two time levels and a spatial grid

The undamped mathematical model is the scalar wave equation:

\`\`\`text
∂²u/∂t² = c²(∂²u/∂x² + ∂²u/∂y²)
\`\`\`

Here u is displacement and c is the propagation speed. Centered finite differences replace the time derivative with \`(u_next − 2u + u_previous) / dt²\` and each spatial derivative with its three-point neighbor difference divided by dx². Combining them gives a five-point spatial stencil and two retained time levels:

\`\`\`text
u_next[x,y] = 2u[x,y] − u_previous[x,y]
            + (c dt / dx)² (u[x−1,y] + u[x+1,y]
                           + u[x,y−1] + u[x,y+1] − 4u[x,y])
\`\`\`

For smooth resolved solutions, these centered differences are second-order approximations in time and space. Obstacles and driven cells impose additional constraints on that update.

The solver retains current, previous, and next displacement arrays. Interior cells use a five-point Laplacian: the four axial neighbors minus four times the center. Uniform grid spacing is \`dx = 1 / (size − 1)\`.

For an undamped cell, the update has the form:

\`\`\`javascript
next[i] = 2 * u[i] - previous[i] + r2 * lap;
\`\`\`

The implemented damped form is:

\`\`\`javascript
next[i] = (2 * u[i] - (1 - q) * previous[i] + r2 * lap) / (1 + q);
\`\`\`

Source: \`resonance/engine.js\`, inside \`step\`. Here \`r2\` is the squared Courant number and \`q = gamma × dt\`. The damped equation is \`u_tt + 2 gamma u_t = c² ∇²u\`; centering the first time derivative produces the \`(1 − q)\` numerator coefficient and \`(1 + q)\` denominator. The sponge increases gamma near the boundary.

The arrays rotate after each step, avoiding a new field allocation for every simulated instant. Fixed edges and obstacle cells remain zero. A pulse initializes equal displacements at the current and previous levels, representing an approximately stationary initial deformation rather than an imposed directional velocity.

The scalar discretization resolves finite wavelengths. Features only a few cells wide can show grid dispersion, and a point source has grid-dependent behavior. These are limitations of the model's spatial resolution rather than evidence of an effect in an ideal continuous medium.

## Choosing a stable timestep

The explicit two-dimensional scheme requires \`c × dt / dx ≤ 1 / sqrt(2)\` for the equal-spacing five-point stencil. RESONANCE fixes that ratio at 0.4 and derives \`dt\` from the selected wave speed and grid spacing. Raising wave speed therefore reduces the timestep instead of silently crossing the stability boundary.

With 96 cells across the unit domain, dx = 1/95. At c = 1, the limit is approximately dt ≤ 0.007443; the implemented dt is 0.4/95 ≈ 0.004211. At c = 3, dt becomes approximately 0.001404. A higher speed therefore advances less simulated time per step. The interface reports both dt and the Courant number so that dependency remains visible.

The condition controls stability of this stencil; satisfying it does not guarantee small phase error, adequate wavelength resolution, or accurate obstacle geometry. Exceeding it allows some grid modes to grow numerically even without a physical source. The lab derives dt rather than offering an unstable setting as normal operation.

Changing speed, damping, or boundary treatment clears the field and probe history. Reusing the previous time level after changing its time interval would give it an inconsistent velocity interpretation. Clearing is a simple, visible way to start a new numerical experiment.

Steps per frame controls simulation throughput separately from the physical timestep. The displayed time advances by the actual integrated timesteps. Hidden browser documents suspend the animation clock, so returning to the page does not attempt to simulate an unbounded backlog. The [University of Illinois wave-equation module](https://heath.cs.illinois.edu/iem/pde/wavecfl/) provides background on why explicit wave schemes require a timestep restriction; this laboratory uses the two-dimensional stencil above.

## Emitters and interference

A driven emitter prescribes sinusoidal displacement at one interior cell after the stencil update. Its value is amplitude multiplied by \`sin(2π × frequency × time + phase)\`. Emitters therefore inject energy through an imposed displacement, rather than applying a force to a modeled mechanical source.

The Two emitters preset begins with equal frequencies and phases. In Emitters, change one phase and compare the resulting field. The superposition pattern develops through propagation across the grid; there is no separate interference formula drawing bands on the canvas.

Sources can be added with the canvas tool or at the probe using a button. Coordinate inputs provide a keyboard alternative. The model permits eight emitters, rejects placement on obstacles or outer edges, and prevents two emitters from silently occupying the same cell. Painting a wall over an emitter removes that source.

## Walls, openings, and boundaries

Drawing a wall fixes its cells at zero displacement. Erasing restores those cells to the medium. Dragging previews a straight segment and release fills the full line between its endpoints, including intermediate cells. Thickness selects a one-, three-, or five-cell square brush around that line. A click places a segment using the selected length and horizontal or vertical direction, rather than a single isolated cell. Buttons at the probe provide the same placement and erasure without a pointer gesture. Segments clip at the interior boundary; they never write beyond the field arrays.

The Double opening preset places a driven source on one side of a barrier with two gaps. Waves passing through the gaps spread into the region behind the barrier. The finite grid sets both the gap geometry and the resolved wavelengths, so changing emitter frequency can change the observed pattern.

The Fixed reflective edge option holds the domain boundary at zero. The Damped edge option adds a sponge layer near the border. Its damping gradually increases toward the edge to reduce outgoing reflections, but it is not a perfectly matched layer or an exact nonreflecting boundary condition. The Driven cavity preset uses fixed boundaries and a low-frequency central source as a starting point for observing the response of an enclosed domain.

## Probe measurements and frequency bins

A probe records displacement at one selected cell after every solver step. Its history is bounded to 512 samples. Moving it clears that history so a single plot does not combine measurements from different locations.

Frequency analysis uses the latest 256 samples, removes their mean, and applies a Hann window. A direct discrete Fourier transform produces a one-sided amplitude spectrum. This is a bounded DFT, not an FFT implementation. Its frequency axis uses the current sample interval: bin k has frequency \`k / (256 × dt)\`. The display reports the strongest bin and the bin spacing rather than implying arbitrary frequency precision.

Window-gain correction scales a sinusoid on an exact bin back to its amplitude. The analysis test constructs such a sinusoid and verifies both its peak frequency and amplitude. Frequencies between bins spread across neighboring bins, so the strongest-bin readout should be interpreted at the displayed resolution.

## Display and energy diagnostics

Signed displacement uses lime and coral for opposite signs. Displacement squared displays an instantaneous squared value; it is not labeled as time-averaged intensity. Color gain changes the rendering scale without changing the field, and values outside that color range are clipped only for display.

The energy readout combines a velocity estimate from successive time levels with finite spatial differences. It is a useful field diagnostic, not an exactly conserved discrete invariant. Emitters add energy, ordinary damping and the sponge remove it, and fixed obstacles constrain the field. Tests check a quiet field, pulse symmetry, fixed walls, source phase, bounded probe history, stable timestep selection, spectral calibration, and reduced reflected energy with a sponge.

## A geometry problem: a wall that looked like a pixel

The initial obstacle button wrote one cell. That was a valid fixed-displacement constraint, but it did not match the visible idea of placing a wall. A visitor needed to make a long stroke just to construct a useful barrier.

Wall placement now rasterizes a complete segment on release, with a visible preview and selectable thickness. A click uses an explicit length and direction; the probe controls provide the same operation through the keyboard. The model still stores a binary cell mask. Every covered cell clears current, previous, and next displacement, avoiding a leftover value when a new wall is placed through an existing wave. Tests verify a multi-cell barrier, clipping at the field boundary, zero displacement on the barrier after propagation, and complete erasure.

## Further work

Larger grids, spatially varying materials, better absorbing boundaries, and automatic frequency sweeps would extend the current model. An FFT could replace the small DFT if longer probe histories become useful. Each extension should preserve a clear distinction between the physical equation, its numerical approximation, and the color image used to inspect it.
`},spectra:{title:`Inside SPECTRA`,summary:`From poles and zeros to a measured waveform: the mathematics, implementation, and experiments behind the workstation.`,content:`## Overview

SPECTRA connects three views of one system: a signal changing over time, its frequency content, and the poles and zeros that shape a digital filter. The browser application is a port of an original Khan Academy / ProcessingJS project, with the signal generator, radix-2 FFT, and second-order filter separated from their rendering code.

The plots share actual computed samples. Moving a zero changes the filter coefficients, the filtered waveform, and the measured spectrum; the response curve independently evaluates the same coefficient set. The point of the workstation is making those relationships inspectable rather than presenting an animated waveform with unrelated controls.

## Start with a frequency cancellation

Load **Remove the 96 Hz tone**. The input contains tones at 32 Hz and 96 Hz. The preset places a conjugate zero pair at the angle corresponding to 96 Hz, with radius one, and a pole pair nearby inside the unit circle.

1. Compare the blue input and lime output in the oscilloscope. The output should lose the faster ripple contributed by the second tone.
2. Find the 96 Hz bin in the FFT. Its reduction is the measured consequence of the filter, while the response panel shows the designed notch.
3. Bypass the filter to compare against the original input, then reactivate it.
4. Move the zero angle away from 96 Hz. The tone returns as the cancellation moves elsewhere.

The default scope is phase-stabilized so this change can be studied without the waveform racing sideways. Pause holds the source capture while leaving the filter controls usable. The **Resonance at 128 Hz** preset provides a different experiment: broadband noise excites a narrow band emphasized by poles near the unit circle.

## Turning poles and zeros into a biquad

The z-plane edits conjugate pairs, preserving real coefficients. For a pair at radius r and angle θ, expanding the two factors produces a quadratic with a middle coefficient of −2r cos(θ) and a final coefficient of r².

The unnormalized numerator and denominator construction appears directly in \`spectra/dsp/biquad.js\`:

\`\`\`javascript
let b0 = 1,
  b1 = -2 * zeroR * Math.cos(zeroA),
  b2 = zeroR ** 2;
const a1 = -2 * poleR * Math.cos(poleA),
  a2 = poleR ** 2;
\`\`\`

The transfer function is \`(b0 + b1 z⁻¹ + b2 z⁻²) / (1 + a1 z⁻¹ + a2 z⁻²)\`. The implementation normally rescales the numerator for unit DC gain. When the numerator is effectively zero at DC, it retains the raw numerator instead of dividing by that zero.

Pole radius controls how persistent the recursive response becomes; moving a pole closer to the unit circle sharpens resonance. A zero on the unit circle creates an exact cancellation at its angle. The interface constrains pole radii below one and moves both members of a conjugate pair together.

## Filtering actual samples

The time-domain implementation retains two previous inputs and two previous outputs. Each new sample evaluates the difference equation:

\`\`\`javascript
const raw = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
\`\`\`

Source: \`spectra/dsp/biquad.js\`, excerpt from \`Biquad.sample\`.

Those state variables give the filter memory. The response curve is not used to paint an approximate output: the waveform comes from this recurrence, and its FFT is calculated afterward. This creates two independent ways to investigate the same system—an analytic frequency response and a measured response to generated input.

A numerical guard limits the displayed output to ±20 and reports when that guard activates. Large-gain configurations should therefore be interpreted with that status in mind: a limited waveform no longer represents the unconstrained linear filter. Changing coefficients clears filter state and reprocesses the captured input, giving paused inspection an immediate result.

## FFT bins, windowing, and amplitude

The simulation samples at 1024 Hz and analyzes 256 samples at a time. That gives 4 Hz bin spacing and a Nyquist frequency of 512 Hz. The displayed spectrum contains the nonnegative half of the transform, including DC and Nyquist.

Before the FFT, samples are multiplied by a Hann window. This reduces the discontinuity at the capture boundaries and spreads less energy into distant bins when the capture does not contain an integer number of cycles. It also changes amplitude, so the implementation normalizes by the window sum.

The one-sided amplitude conversion in \`spectra/dsp/fft.js\` is:

\`\`\`javascript
const factor = i === 0 || i === n / 2 ? 1 : 2;
result[i] = toDb((factor * Math.hypot(re[i], im[i])) / windowSum);
\`\`\`

Doubling interior bins accounts for their negative-frequency counterparts; DC and Nyquist remain unpaired. Values are expressed in decibels relative to unit peak amplitude. Bin spacing is a property of this capture size, not a promise that arbitrary neighboring tones can always be distinguished simply because their frequencies differ by 4 Hz.

## A stable scope without slowing the system

The scope keeps a separate 4096-sample display history. Periodic sources select a complete window aligned to a consistent source phase. Dual tones use their common repeat frequency; input and output use the same start time, preserving the filter's relative phase shift.

**Slow drift** gradually moves that display phase by 2% of a common cycle per simulated second. Noise and chirp do not have a fixed repeating phase, so they use real held captures refreshed twice per second. Fractional window starts are interpolated from the recorded samples.

This is a presentation choice. The generator, filter, FFT, and spectrogram continue on their existing sample clock. The stable view does not lower the signal frequencies or replace the output with a synthetic drawing. Immediately after reset, enough history must accumulate to choose a phase-aligned window.

## Reading the spectrogram and source behavior

The spectrogram adds a slice every 128 samples, or 125 ms. Its bounded history holds 80 rows, corresponding to up to ten seconds. Frequency runs horizontally, newer time appears at the bottom, and color represents magnitude from −90 to 0 dB. A fixed tone forms a vertical feature; the chirp moves across frequency as it sweeps.

Source choices expose different aspects of the filter. A sine isolates one frequency, dual tones show selective cancellation, and noise probes a broad range at once. Square and sawtooth generators introduce harmonics and are intentionally unbandlimited, matching the original experiment. Harmonics above Nyquist can alias into the visible band.

The application produces no audio. The sample rate is chosen for this visual experiment, and its frequencies and time axes should be read in that context. Background or offscreen SPECTRA views stop advancing rather than accumulating an invisible backlog.

## Concepts explored and verification

The project joins complex-plane geometry, recursive difference equations, Fourier analysis, window normalization, and sample-time scheduling. These concepts meet at observable checks: a unit-circle zero should suppress its tone, and the transform of an impulse response should agree with the analytic transfer function.

Tests compare the FFT with a direct DFT, recover a known sine amplitude, verify notch rejection, and check that different animation-frame increments produce the same samples. Separate scope tests establish phase stability without modifying FFT data. The distinction between DSP state and display state is part of the implementation, not just its folder structure.

## Things to do next

Useful extensions include selectable capture lengths, explicit trigger controls, and a bandlimited oscillator comparison. Averaging could make noise spectra easier to interpret, while a visible impulse-response view would connect the recurrence to its frequency response more directly. Those additions should retain the same rule: each plot must correspond to a defined computation and a clearly labeled time or frequency scale.
`},huffman:{title:`From bytes to an archive`,summary:`Follow the codebook, bit packing, and file-format decisions that make Code Loom work.`,content:`## Overview

Code Loom turns Huffman compression into a sequence that can be inspected: count bytes, merge the lightest trees, assign prefix-free codes, and pack those codes into a downloadable archive. The visualization and encoder share one model, so selecting a byte traces the code actually used in the file.

The browser port follows the original C++ compressor's vector-based merge order and ARK1 format. It accepts UTF-8 text or binary files up to 512 KiB and can decode an ARK1 archive locally. The aim is to show both the elegance of the coding algorithm and the less glamorous details required to store its result correctly.

## Try three very different inputs

Begin with **A repeating signal**, which contains enough repetition for the complete archive to be smaller than the input. Compare its encoded payload with its total archive size, then follow one common byte through the tree.

Next load **Equal frequencies**. With no dominant symbol, there is less opportunity to assign disproportionately short codes. Finally try **One unique symbol**: the archive can reconstruct the data from its frequency without storing a payload bit for every repeated byte.

**Input**, **Build tree**, **Trace codes**, and **Archive** organize the main compression workflow. **Output bytes** adds a paginated hex and ASCII view of the exact downloadable archive, with header and payload coloring. Selecting a byte shows its field, decimal value, and bits. Switching views preserves the source, construction step, and selected byte. Focus workspace expands the experiment; Escape returns to the page. Archive contains the complete size breakdown, download, and a separate decode operation.

In Build tree, use the zoom controls to fit the forest or inspect it at a readable scale. Use the merge controls to return to the initial forest and advance one merge at a time. The newest merge is highlighted. The codebook and bitstream always refer to the completed tree, even while the visualization is showing an earlier construction step. This keeps the archive representation stable while the building process is explored.

## Counting bytes instead of characters

Text first passes through \`TextEncoder\`, producing UTF-8 bytes. The histogram has 256 possible entries, independent of the language of the text. A multibyte character can therefore contribute to several byte frequencies; a byte code is not necessarily a character code.

The histogram construction in \`huffman/codec.js\` is deliberately small:

\`\`\`javascript
const frequencies = new Uint32Array(256);
for (const byte of bytes) frequencies[byte]++;
\`\`\`

Only nonzero frequencies become leaves. Each leaf carries its byte value, weight, and stable node ID. Binary input uses the same path without text decoding, so zero bytes and values above 127 are ordinary symbols rather than special cases.

This representation also limits the tree to at most 256 leaves. The input can contain hundreds of thousands of bytes without requiring one tree node per occurrence; occurrences affect weights and the later payload, not the alphabet's maximum size.

## Building the tree with deterministic merges

Each iteration finds the two active roots with the smallest weights and joins them beneath a new parent. The parent's weight is their sum; the children become inactive roots but remain in the node array for traversal and visualization.

The model retains every merge as a record with its child IDs and parent ID. Stepping backward and forward changes which construction stage is displayed rather than rerunning a different algorithm. The entire forest and completed code tree can therefore be derived from the same retained history.

Equal frequencies matter for compatibility. The selection loop uses strict less-than comparisons, leaving earlier vector entries ahead when weights tie. Leaves begin in byte order, and parents are appended. A decoder rebuilding from frequencies must reproduce that order or it can assign different bit patterns to the same bytes.

A priority queue could change construction cost, but replacing this vector search would also need to preserve tie behavior. With at most 256 symbols, matching the native format and making each merge visible are the more important properties of this port.

## Prefix-free codes and traced paths

Walking left appends zero; walking right appends one. Reaching a leaf records that path as its code. The implementation is:

\`\`\`javascript
if (node.left < 0) {
  codes.set(node.symbol, code);
  return;
}
walk(node.left, code + "0");
walk(node.right, code + "1");
\`\`\`

Source: \`huffman/codec.js\`, excerpt from the tree walk.

No leaf's path can be the prefix of another leaf's path, because a leaf has no children. That is what allows the decoder to consume concatenated bits without inserting a separator after each symbol. Reaching a leaf emits a byte and returns traversal to the root.

Selecting a codebook entry highlights its actual path. The searchable codebook opens a root-to-leaf path with each edge bit and node weight. The Bitstream preview shows the first 48 input bytes as individual code groups for readability, while the downloadable archive concatenates the full input's codes without those visual gaps.

## Packing bits into bytes

The payload buffer is allocated using the ceiling of the total bit count divided by eight. Bits are written most-significant first:

\`\`\`javascript
if (bit === "1") payload[cursor >> 3] |= 1 << (7 - (cursor & 7));
cursor++;
\`\`\`

Source: \`huffman/codec.js\`, inside \`packPayload\`.

The right shift chooses the destination byte, while the low three cursor bits choose a position inside that byte. The final partially used byte is zero-padded. Its padding is storage alignment, not additional encoded symbols; the archive's bit count tells decoding exactly where the payload ends.

This is where a string of zeroes and ones becomes an actual compressed representation. Saving the textual characters \`0\` and \`1\` would consume one byte per displayed bit and would not realize the bit-level savings shown by the algorithm.

## What ARK1 stores

The archive contains enough metadata to reconstruct the coding tree. Its integers are little-endian, while the bit order within payload bytes is most-significant first. Those are separate conventions.

| Field                 | Storage                                                     |
| --------------------- | ----------------------------------------------------------- |
| Magic                 | Four bytes: ARK1                                            |
| Unique-byte count     | Unsigned 16-bit integer                                     |
| UTF-8 filename length | Unsigned 16-bit integer                                     |
| Filename              | The stated number of bytes                                  |
| Frequency entries     | One byte value plus an unsigned 64-bit frequency per symbol |
| Payload bit count     | Unsigned 64-bit integer                                     |
| Payload               | Packed bits, padded to a whole byte                         |

The header-size calculation is \`16 + filenameBytes + 9 × uniqueBytes\`. Rebuilding from stored frequencies keeps the archive compatible with the original merge rule instead of introducing a separately serialized tree format.

## Payload savings versus complete-file savings

The interface separates original bytes, encoded payload bits, padded payload bytes, and the complete ARK1 archive. These answer different questions. A shorter code stream does not guarantee a smaller stored file because decoding metadata has a cost.

For the default repeating sample with the default \`message.txt\` filename, 816 input bytes become a 321-byte padded payload plus 117 bytes of metadata: a 438-byte archive, about 46.3% smaller overall. A shorter sample using the same alphabet can have similar coding efficiency yet grow after paying that header cost.

The entropy figure describes the observed byte-frequency distribution. Average code length describes this tree's payload cost per input byte. They can be close without including filename storage, the frequency table, or padding. Reading those values alongside total size avoids presenting an algorithmic ratio as a complete-file result.

## Edge cases and verification

An empty alphabet has no tree. A singleton alphabet has one leaf and a zero-length code; its stored frequency is sufficient to reproduce the repeated byte. Handling that case explicitly avoids traversing nonexistent child branches and fixes a native decoder edge case.

The decoder checks the magic, available lengths, symbol count, repeated entries, frequencies, and declared bit count before accepting an archive. A malformed input receives an error rather than being treated as an ordinary empty result. The browser's size limit applies to reconstructed output as well as input selection.

Tests cover binary and text round trips, deterministic merges, empty and singleton inputs, and malformed archives. Compatibility was also checked against the original C++ encoding path. The visible round-trip check compares decoded bytes with original bytes, preserving binary content rather than relying on a text rendering.

## Things to do next

A useful comparison would place this frequency-table format beside a canonical Huffman header and show how metadata changes the break-even point. Larger-file streaming and a different tree-construction data structure are separate extensions. Any format change should be versioned: an improved representation is not automatically compatible with an existing decoder merely because it still uses Huffman codes.
`},neural:{title:`Inside the learning loop`,summary:`Follow the computation behind the boundary: dense layers, gradients, optimizer state, and reproducible experiments.`,content:`## Overview

Neural Lab makes a small classifier's computation visible. Two input coordinates pass through a configurable dense network to produce the probability of class one. The main plot evaluates that network across a plane, neuron tiles expose intermediate responses, and a learning trace opens one labeled sample's update into separate stages.

The implementation uses explicit JavaScript mathematics rather than a hosted model or a machine-learning framework. Forward propagation, analytic gradients, binary cross-entropy, and both optimizers live independently of the React interface. Training changes the weights used by every visualization; the boundary is not a prerecorded demonstration.

The workspace separates **Data & model**, **Training**, **Network**, and **Gradient trace**. Set up samples and architecture in the first view, compare the boundary and loss in Training, and inspect one layer at a time in Network. Gradient trace keeps the sample’s coordinates and expected class visible while explaining prediction, loss, gradient direction, and one applied update. The final step compares the actual before/after loss and probability. Equations and the inspected connection are available in expandable details. The captured calculation stays available while moving between views. Switching views pauses training without resetting weights, optimizer state, or history. Focus workspace expands the interface; Escape returns to the page. The writeup remains separate from the experiment.

## Three experiments and what to look for

**XOR** starts with four corners. Opposite corners share a class, so one straight boundary cannot separate them. Train the default hidden network, then remove its hidden layer and compare the loss. This is a small representation problem: every corner is a training example, so 100% accuracy is not a generalization benchmark.

**Concentric circles** asks for a closed boundary. Inspect how several hidden responses combine into an output that distinguishes an inner ring from an outer ring. Hollow markers are held out from epoch training, making them a separate check on the learned boundary.

**Two spirals** needs a winding separation. Selecting it loads a verified starting point: two hidden layers with eight tanh neurons each, Adam, learning rate 0.01, and seed 42. Open **Training**, press **Train**, and allow roughly 1,000 epochs. The preset reload button restores both the original point cloud and that configuration after experiments with other settings.

Use the canvas tools to add, move, or remove samples. Coordinate sliders and the sample selector provide keyboard alternatives. Edits pause training, retain the current weights, and restart loss history; architecture changes reset the weights. Up to 160 points keep the interactive workload bounded.

## Forward propagation through dense layers

A neuron forms a weighted sum of the preceding layer's activations, adds a bias, and applies an activation function. A hidden layer therefore transforms the representation available to the next layer rather than simply drawing another separator directly on the input.

The inner calculation in \`neural/engine/network.js\` is:

\`\`\`javascript
z[j] = layer.b[j];
for (let k = 0; k < layer.inputs; k++)
  z[j] += layer.w[j * layer.inputs + k] * activations[l][k];
\`\`\`

Weights are stored in flat \`Float64Array\` buffers, with each output neuron's incoming weights occupying one contiguous row. The engine retains preactivations and activations for each layer. The same forward-pass data supports the neuron inspector and the backward calculation.

Hidden layers can use tanh, sigmoid, or ReLU. The output always uses sigmoid, turning its logit into a number between zero and one. With no hidden layer, this is logistic classification with a single affine separator. Hidden nonlinearities let combinations of features form curved boundaries.

## Reading neurons, weights, and the decision field

The main field evaluates a 65 × 65 probability grid. Marching squares interpolates where neighboring samples cross probability 0.5 to draw the white decision contour. A coarse grid is a rendering approximation of the current network, not another model being fitted to it.

Each neuron tile evaluates one activation over the same input domain using a 20 × 20 grid. A first-layer tanh neuron often resembles a soft split of the plane; later neurons combine those responses into more complex regions. Selecting a tile reveals its weights, bias, preactivation z, and activation at the current probe coordinate.

Color scales depend on what is being displayed. Tanh maps −1 through +1 from coral to lime. Sigmoid and output probability use zero through one. ReLU is unbounded, so its tile uses \`a / (1 + a)\` for color while the numeric inspector retains the actual activation. The diagram's edge color represents weight sign, and thickness represents magnitude.

The probe can move independently of the data. Inspecting a location does not add a training example or assign it a label. This makes it possible to investigate a region between samples without changing the problem being learned.

## Binary cross-entropy without unstable logarithms

For a target y and predicted probability p, binary cross-entropy is \`−y log(p) − (1−y) log(1−p)\`. It penalizes confident wrong predictions more strongly than uncertain ones. The displayed loss is averaged over the relevant sample set.

Calculating that expression directly from rounded probabilities can encounter \`log(0)\`. The engine instead uses the output logit:

\`\`\`javascript
Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)));
\`\`\`

Source: \`neural/engine/network.js\`, expression returned by \`binaryLoss\`.

This equivalent form remains finite for extreme logits without replacing the objective with an arbitrary probability clamp. The loss chart uses a logarithmic vertical scale to show improvement across several orders of magnitude. Its plotting range is limited for readability; the numeric loss remains the actual computed value.

## Backpropagation and one visible update

Sigmoid output paired with binary cross-entropy gives a compact output derivative: \`p − y\`. The implementation starts there and propagates error backward through the weighted connections, multiplying by each hidden activation's derivative.

The output error and weight-gradient accumulation are visible in these excerpts:

\`\`\`javascript
let delta = Float64Array.of(pass.probability - point.label);
\`\`\`

\`\`\`javascript
grads[l].w[j * layer.inputs + k] +=
  (delta[j] * pass.activations[l][k]) / points.length;
\`\`\`

Source: \`neural/engine/network.js\`, separate excerpts from \`gradients\`.

Dividing each contribution by the batch size produces the mean gradient. Epoch training uses all training points for one update. The **Follow the gradient** panel deliberately uses one selected training sample: prediction, loss, the inspected neuron's gradient, then a plain gradient-descent update \`w ← w − ηg\`.

The trace snapshots its forward pass, gradient, rate, and old weights before applying the update once. That allows the final stage to show an actual before-and-after weight. It remains a plain gradient-descent example even when epoch training uses Adam; applying it clears Adam's accumulated moments so subsequent training does not reuse stale optimizer state.

## Why Adam helps the spiral

The original XOR starter can remain near a simple separator on the spiral. More epochs alone do not make a small representation become a good winding boundary, and plain gradient descent can progress slowly even with a larger network.

Adam retains a first moment of the gradient and a second moment of its square for each weight and bias. It corrects the initial zero-state bias and scales the update by the square root of the corrected second moment. Neural Lab uses β₁ = 0.9, β₂ = 0.999, and ε = 10⁻⁸.

The moment updates in \`neural/engine/network.js\` are:

\`\`\`javascript
m[i] = 0.9 * m[i] + 0.1 * g;
v[i] = 0.999 * v[i] + 0.001 * g * g;
\`\`\`

Those buffers persist across animation-frame batches. Resetting them every frame would make training depend on how the browser groups work. Switching optimizers clears their memory while retaining weights; resetting the network starts everything fresh.

The following measured results use the original seed-42 spiral: 80 training points and 20 held-out points. They compare complete configurations, not an isolated optimizer benchmark.

| Configuration                                  | Epochs | Training accuracy | Held-out accuracy |
| ---------------------------------------------- | -----: | ----------------: | ----------------: |
| One 4-neuron tanh layer, gradient descent 0.08 | 10,000 |               65% |               60% |
| Two 8-neuron tanh layers, gradient descent 0.5 | 10,000 |              100% |               80% |
| Two 8-neuron tanh layers, Adam 0.01            |  1,000 |              100% |              100% |

The tested Adam preset reaches training loss about 0.00329 and held-out loss about 0.04056 at 1,000 epochs. Edited points and other seeds can behave differently; the numbers establish a reproducible example rather than a universal guarantee.

## Reproducibility, held-out data, and display timing

Seeded initialization makes a reset repeatable. Xavier-style uniform initialization is used for tanh and sigmoid paths, while ReLU hidden layers use a He-style range. Biases start at zero. The supported network has two inputs, up to two hidden layers of eight neurons, and one output.

Circle and spiral generators mark a balanced fifth of their samples as held out. Those points are excluded from epoch gradients and the trace selector. Their loss and accuracy evaluate the same current model without updating it. The split is a fixed illustrative sample, not a broad statistical study.

Training runs in bounded animation-frame batches and publishes visual updates at about 10 Hz. The speed setting is a target number of epochs per second, not a promise of device throughput. Hidden tabs stop accumulating training time. The loss chart retains its latest 400 observations so an extended session does not grow history without limit.

## Concepts explored and verification

The central ideas are representation learning, the chain rule, numerical stability, optimization state, and the difference between fitting examples and evaluating held-out ones. Their implementation is small enough to compare different explanations of the same result: a gradient value, a changing weight, a neuron response, and the final boundary.

Tests compare analytic gradients against central finite differences through two hidden layers for tanh, sigmoid, and ReLU. They also verify XOR versus a linear model, seeded trajectories, extreme logits, single-sample descent, Adam bias correction, and optimizer-state continuity across batch boundaries. A spiral regression uses the same preset exposed in the interface and evaluates training and held-out points separately.

## Things to do next

Useful extensions include batch-size controls, a visual comparison of optimizer updates, and validation across multiple dataset seeds. A signal-classification experiment could connect these representations to DSP—for example, learning from measured spectral features while retaining a separate unseen-signal evaluation. Any new view should expose an actual activation, gradient, or measurement rather than add motion unrelated to the computation.
`}};function f(){let{lab:e}=t(),n=d[e];return n?(0,c.jsxs)(`div`,{className:`lab-notes-page`,children:[(0,c.jsx)(r,{className:`lab-notes-back`,to:`/lab`,children:`← Lab notebook`}),(0,c.jsx)(o,{lab:e}),(0,c.jsx)(u,{id:e,...n})]}):(0,c.jsxs)(`section`,{className:`page-header`,children:[(0,c.jsx)(`h1`,{children:`Writeup not found.`}),(0,c.jsx)(r,{to:`/lab`,children:`Explore the lab`})]})}export{f as default};