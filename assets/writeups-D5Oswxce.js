var e=[{id:`flux-messaging`,title:`Flux: High-Performance Messaging Platform`,subtitle:`A modern real-time messaging platform combining a Rust-powered backend with a React frontend.`,date:`2024`,categories:[`closed`,`systems`,`fullstack`],tags:[`rust`,`react`,`websockets`,`postgresql`],readTime:`12 min`,featured:!0,content:`## Architecture Overview

Flux is built with a clear separation between a high-performance Rust backend and a modern React frontend. The architecture prioritizes real-time communication through WebSockets while maintaining RESTful APIs for state management.

### Why Rust for the Backend?

Rust's zero-cost abstractions and fearless concurrency make it ideal for handling hundreds of simultaneous WebSocket connections without garbage collection pauses. The type system catches data races at compile time, critical for a system where message ordering matters.

## Backend Architecture

### Axum Web Framework

Built on Tokio's async runtime, Axum provides ergonomic request handling while maintaining high throughput. The modular handler structure separates concerns cleanly:

\`\`\`
server/src/
├── handlers/      # HTTP request handlers
│   ├── auth.rs   # JWT authentication
│   ├── messages.rs
│   └── channels.rs
├── models/        # Database models with SQLx
├── routes/        # API route definitions
└── websocket/     # WebSocket connection management
    ├── connection.rs
    └── broadcast.rs
\`\`\`

### Database Design

PostgreSQL with SQLx for compile-time checked queries. The schema supports:

- Servers with multiple channels
- Direct message conversations
- Friend relationships and presence
- Message history with pagination
- File metadata for uploads

> SQLx's compile-time query verification caught numerous bugs during development. Changing a database schema would cause compilation errors in dependent queries, forcing updates before deployment.

### WebSocket Message Flow

\`\`\`
1. Client connects via WebSocket upgrade
2. Server validates JWT from connection params
3. Connection added to channel broadcast groups
4. Incoming messages:
   - Parse JSON payload
   - Validate and persist to database
   - Broadcast to channel subscribers
   - Update presence/typing indicators
5. Connection cleanup on disconnect
\`\`\`

## Frontend Architecture

### React 19 with Concurrent Features

The frontend leverages React 19's concurrent rendering for smooth UI even during heavy message loads. TanStack Query manages server state with automatic caching and background refetching.

### Real-Time State Management

WebSocket messages are integrated with TanStack Query's cache:

- Incoming messages trigger cache updates
- Optimistic UI for sent messages
- Automatic retry with exponential backoff
- Presence indicators via heartbeat

## Key Features Implemented

### Core Messaging

- Real-time text channels with infinite scroll pagination
- Direct messages with read receipts
- Message editing and deletion
- Emoji reactions with optimistic updates
- File attachments (avatars, banners, up to 25MB)

### Social Features

- Friend system with pending requests
- User presence (online, idle, DND, invisible)
- Typing indicators via WebSocket broadcasts
- Rich profiles with custom avatars and banners
- Display names separate from usernames

### Security

- JWT authentication with refresh tokens
- Argon2id password hashing
- HTTP-only cookies to prevent XSS
- Rate limiting on auth endpoints

## Performance Optimizations

### Backend

- Connection pooling with dead connection cleanup
- Broadcast batching to reduce WebSocket frames
- Database query optimization with proper indexing
- Lazy loading of message history

### Frontend

- Virtualized lists for large message histories
- Image lazy loading with blur placeholders
- Code splitting by route
- Service worker for offline message composition

## File Storage

Cloudflare R2 (S3-compatible) stores user-generated content:

- Profile pictures and banners
- Message attachments
- Server icons

## What I Learned

Building Flux taught me about the complexity of real-time systems. Handling message ordering, connection resilience, and state synchronization across hundreds of clients requires careful design. Rust's type system was invaluable for preventing race conditions in the WebSocket broadcast logic.

## Current Status

Flux is a closed-source project with core messaging features complete. Planned additions include voice channels, message search, and a plugin system for custom functionality.`},{id:`arkvisor`,title:`ArkVisor: Building a Hypervisor from Scratch`,subtitle:`Implementing hardware virtualization with Intel VT-x to understand how hypervisors work at the lowest level.`,date:`2024`,categories:[`systems`,`closed`,`security`],tags:[`hypervisor`,`vmx`,`c++`,`kernel`],readTime:`15 min`,featured:!0,content:`## The Problem with Learning Hypervisor Development

Most resources for learning hypervisor development fall into one of two categories: high-level tutorials that skip the gritty implementation details, or production hypervisor codebases that are too complex to approach as a learning exercise. Intel's VT-x documentation is comprehensive but dense, written as a reference rather than a tutorial. The excellent "Hypervisor from Scratch" project provides a working implementation, but studying an existing codebase teaches you how to read code, not how to build it from first principles.

ArkVisor started with a different premise: what if I built a hypervisor incrementally, making every mistake myself, to understand why production hypervisors are structured the way they are? What if I implemented each VT-x feature only when I needed it, to understand the dependencies between components? This writeup documents the architectural decisions, dead ends, and implementation patterns that emerged from attempting to build a hypervisor from scratch as a learning exercise.

## The VMX Operation Model

Intel VT-x introduces a new processor mode called VMX (Virtual Machine Extensions). Within VMX, there are two operational modes:

**VMX Root Operation** is where the hypervisor runs. In this mode, the processor has full access to all instructions and can execute VMX instructions like VMLAUNCH, VMRESUME, VMCALL, and VMXOFF. The hypervisor configures the VMCS (Virtual Machine Control Structure) here and decides when to enter the guest.

**VMX Non-Root Operation** is where guest code runs. In this mode, most instructions execute normally, but certain sensitive operations cause VM exits, transferring control back to the hypervisor in VMX Root. The guest cannot detect it is running under virtualization (unless the hypervisor explicitly reveals itself through CPUID or other means).

Transitions between these modes are called VM entries (Root → Non-Root) and VM exits (Non-Root → Root). A VM entry is initiated by the hypervisor executing VMLAUNCH (first entry) or VMRESUME (subsequent entries). A VM exit occurs when the guest triggers an event configured in the VMCS, such as executing CPUID, accessing an I/O port, or causing an EPT violation.

The critical insight is that the hypervisor does not actively intercept every instruction. Instead, it configures the VMCS with a bitmap of which events should cause exits, and the hardware handles the rest. This is what gives VT-x near-native performance: the guest runs almost entirely on hardware, with the hypervisor only invoked for specific events.

## The VMCS: A 4KB Configuration Contract

The Virtual Machine Control Structure is a 4KB aligned memory region that completely controls VM behavior. It is not a data structure you read and write directly; instead, you use VMX instructions like VMREAD and VMWRITE to access its fields. The VMCS contains 16-bit, 32-bit, 64-bit, and natural-width fields, each identified by an encoding.

The VMCS is divided into six logical regions:

**Guest-state area** holds the guest's architectural state when it is running: registers (RAX, RBX, RCX, RDX, RSI, RDI, RBP, RSP, R8-R15), RIP, RFLAGS, segment registers (CS, DS, ES, FS, GS, SS), GDTR/IDTR, CR0, CR2, CR3, CR4, DR7, and EFER. When a VM exit occurs, the hardware automatically saves the guest state here. When a VM entry occurs, the hardware loads the guest state from here.

**Host-state area** holds the hypervisor's state that will be loaded on VM exit. This includes the host's RIP (where to jump to handle the exit), RSP (stack pointer), segment registers, CR0, CR3, CR4, and EFER. Getting these fields wrong is the most common cause of hypervisor crashes, because the hardware blindly loads them on exit without validation.

**VM-execution control fields** determine which events cause VM exits. The pin-based controls (PIN_BASED_VM_EXEC_CONTROL) configure external interrupts and NMI handling. The processor-based controls (PROC_BASED_VM_EXEC_CONTROL and PROC_BASED_VM_EXEC_CONTROL2) configure CPUID, RDTSC, CR access, I/O, MSR access, and other events. The exception bitmap configures which exceptions cause exits.

**VM-exit control fields** configure behavior on VM exit. The VM_EXIT_CONTROLS field includes bits like HOST_ADDR_SPACE_SIZE (to select 64-bit mode) and IA32E_MODE_GUEST (to indicate the guest runs in 64-bit mode). The VM_EXIT_MSR_STORE_COUNT and VM_EXIT_MSR_LOAD_COUNT fields configure MSR save/restore on exit.

**VM-entry control fields** configure behavior on VM entry. The VM_ENTRY_CONTROLS field includes IA32E_MODE_GUEST and ENTRY_LOAD_DEBUG_CONTROLS. The VM_ENTRY_MSR_LOAD_COUNT field configures MSR loading on entry.

**VM-exit information fields** are read-only fields populated by hardware on VM exit. They include the exit reason (why the exit occurred), exit qualification (additional context for certain exits), guest linear address (for page faults), and guest physical address (for EPT violations).

The challenge is that nearly all of these fields must be configured correctly before the first VMLAUNCH, or the processor will fault with #VMFAILINVALID. The error is silent—you get a VM fail invalid, no diagnostic information. Debugging VMCS configuration requires systematic field-by-field verification, often with only BSOD feedback.

## EPT: Two-Level Address Translation

Extended Page Tables (EPT) provide hardware-assisted memory virtualization. Without EPT, the hypervisor must shadow the guest's page tables, trapping every CR3 write and page table update to maintain a separate set of physical mappings. This is slow and complex.

EPT introduces a second level of page tables managed by the hypervisor:

\`\`\`
Guest Virtual Address → Guest Physical Address → Host Physical Address
                    (Guest page tables)      (EPT page tables)
\`\`\`

The guest uses its own page tables to translate GVA to GPA, exactly as it would on bare metal. The hardware then uses the EPT to translate GPA to HPA. The guest never sees the HPA—it believes it has direct access to physical memory starting at GPA 0.

The EPT structure mirrors the x86 paging structure: PML4 (512 entries, each pointing to a PDPT), PDPT (512 entries, each pointing to a PD), PD (512 entries, each pointing to a PT), and PT (512 entries, each mapping a 4KB page). Each entry is 128 bits (16 bytes) and contains:

- Physical address of the next level (or physical page for PT entries)
- Read, Write, Execute permissions (RWX bits)
- Memory type (uncacheable, write-back, write-combining, etc.)
- Ignore PAT (to override guest memory type settings)
- Accessed and Dirty bits (for the hypervisor's tracking)

The critical insight is that EPT permissions are independent of the guest's page table permissions. If the guest marks a page as read-only in its page tables, but the EPT marks it as read-write, the guest can still write to it. Conversely, if the guest marks a page as read-write but the EPT marks it as read-only, the guest's write will cause an EPT violation exit. This is the foundation for EPT-based memory protection: the hypervisor can enforce its own security policy regardless of what the guest believes.

ArkVisor's EPT implementation is minimal: it creates an identity mapping for the first 2MB of physical memory (GPA 0x0-0x1FFFFF maps to HPA 0x0-0x1FFFFF). This is enough to test basic VM entry/exit and demonstrate EPT violations, but far from a complete implementation. A production hypervisor would need to:

- Dynamically map all physical memory as the guest accesses it
- Handle EPT violations by lazily allocating mappings
- Support memory type conflicts (guest wants write-back, hypervisor wants uncachable for MMIO)
- Track which pages are mapped to avoid redundant allocations
- Support huge pages (1GB and 2MB) to reduce EPT depth

## VM Exit Handling: The Assembly Wrapper

When a VM exit occurs, the hardware does not jump directly to your handler. It saves minimal state to the VMCS, then loads the host state from the VMCS host-state area. Your host RIP field must point to code that:

1. Saves all registers that the ABI requires preserved
2. Reads the VMCS to get exit reason and qualification
3. Dispatches to the appropriate handler
4. Restores registers before returning

This requires assembly because you cannot trust C calling conventions when the hardware has just loaded arbitrary state. The hypervisor's exit handler is essentially a trampoline that establishes a proper C environment before calling into C code.

ArkVisor's exit handler in vmexit_handler.asm saves RAX, RBX, RCX, RDX, RSI, RDI, RBP, R8-R15, and RSP, then calls a C dispatcher. The dispatcher reads the exit reason from VMCS field EXIT_REASON, uses a switch statement to call the appropriate handler, and returns. The assembly wrapper then restores registers and executes VMRESUME to re-enter the guest.

The subtle bug that took days to find: the host RSP in the VMCS must point to a valid stack, but the stack must be mapped in both the host and guest address spaces if you use the same CR3. If the hypervisor changes CR3 on exit (to isolate its own memory), you must ensure the new CR3's page tables map the stack. Getting this wrong causes a triple fault on the very first exit.

## State Management: FPU, XMM, and XSAVE

The x87 FPU and XMM registers present a special challenge for virtualization. They are large (512 bytes for XMM alone) and saving/restoring them on every VM exit would be prohibitively expensive. VT-x provides a mechanism to handle this: the VM-entry and VM-exit MSR load/store lists can include IA32_XSS to configure XSAVE/XRSTOR behavior.

The correct approach is:

1. Configure the VMCS with VM_ENTRY_LOAD_DEBUG_CONTROLS and VM_EXIT_LOAD_DEBUG_CONTROLS to handle debug registers
2. Set CR4.OSFXSR and CR4.OSXSAVE to enable XSAVE/XRSTOR
3. Configure XSAVE bitmap in VMCS to indicate which state components to save
4. On VM exit, use XSAVE to save FPU/XMM state if the guest used them
5. On VM entry, use XRSTOR to restore the saved state

ArkVisor's initial implementation missed the XSAVE path entirely. This caused floating-point corruption in guests because the hypervisor would clobber XMM registers on exit. The fix required understanding the XSAVE/XRSTOSR instruction set and the XSAVE bitmap format in the VMCS.

The deeper lesson is that state management is the hardest part of virtualization. The hypervisor must save and restore everything the guest might have modified, but nothing more (for performance). Getting this balance wrong either corrupts guest state or kills performance. Production hypervisors have sophisticated state tracking to lazily save only what changed.

## The Hypercall Interface

Hypercalls are the guest-to-hypervisor communication mechanism. The guest executes a special instruction (VMCALL on Intel, VMCALL or hypercall on AMD) that causes a VM exit with exit reason VMCALL. The hypervisor can then interpret the request and respond.

ArkVisor defines a simple hypercall protocol:

- RAX holds the hypercall ID
- RCX, RDX, R8, R9 hold parameters (following the Microsoft x64 calling convention)
- RAX on return holds the result

The driver (WdFilterDrv) uses hypercalls to request memory protection from the hypervisor. For example, to protect a region of memory, the driver sets RAX to HYPERCALL_PROTECT_MEMORY, RCX to the base address, and RDX to the size. The hypervisor's VMCALL handler looks up the region in its internal tracking structure, sets up EPT permissions to deny access, and returns success.

The critical security consideration is that hypercalls must be authenticated. A malicious guest could spam VMCALL instructions to cause denial of service, or pass crafted parameters to corrupt hypervisor state. Production hypervisors implement hypercall permission checks, rate limiting, and parameter validation. ArkVisor's implementation has none of these—it trusts the driver completely because both are under the same developer's control.

## Driver Integration: The Synchronization Problem

ArkVisor is designed to work with a kernel-mode driver (WdFilterDrv) that provides the user-mode interface. This creates a synchronization problem: the driver loads before the hypervisor (because the hypervisor is itself a driver), but the driver needs to know when the hypervisor is ready to accept hypercalls.

The solution is a shared memory region with a "hypervisor ready" flag. The hypervisor, after successful VMX initialization and VM launch, writes TRUE to this flag. The driver polls the flag before making its first hypercall. This is a simple producer-consumer pattern with a single boolean flag.

The race condition that caused intermittent failures: the hypervisor sets the flag before it has actually finished initializing all internal data structures. If the driver sees the flag and immediately makes a hypercall, the hypervisor might not have initialized the hypercall handler yet. The fix was to move the flag assignment to the very last line of initialization, after all internal state is ready.

This pattern generalizes: any time two kernel components communicate via shared memory, you need explicit synchronization primitives (flags, locks, barriers) with well-defined ordering. The Windows kernel provides KeInitializeSpinLock, KeAcquireSpinLock, and related functions for this purpose. ArkVisor uses a simple volatile flag because the initialization happens once at boot and the polling is short-lived.

## Anti-Detection: The Cat-and-Mouse Game

Modern anti-cheat and security software actively detects hypervisors. They check CPUID leaf 0x40000000 for a hypervisor signature string. They read IA32_FEATURE_CONTROL MSR to see if VMX is locked. They measure timing anomalies (TSC drift) caused by VM exits. They attempt to execute VMX instructions directly to see if they fault.

ArkVisor implements basic anti-detection techniques, though these are incomplete and would not defeat sophisticated detection:

**CPUID spoofing**: The hypervisor intercepts CPUID instructions and clears the hypervisor-present bit in leaf 0x40000000. It also returns a fake hypervisor signature string or no signature at all.

**TSC offsetting**: The hypervisor can add an offset to the Time Stamp Counter to hide the time spent in VM exits. If the guest reads RDTSC, the hypervisor returns the adjusted value. This is not implemented in ArkVisor but would require intercepting RDTSC/RDTSCP instructions.

**MSR filtering**: Certain MSRs like IA32_HYPERVISOR_CALLBACK_ADDR reveal hypervisor presence. The hypervisor intercepts RDMSR/WRMSR and returns fake values or denies access. This is partially implemented but incomplete.

The reality is that a learning hypervisor cannot truly hide from sophisticated detection. Commercial hypervisors have teams of engineers working full-time on stealth. ArkVisor's anti-detection is educational—it shows what techniques exist, not how to implement them effectively.

## Debugging: The Black Box Problem

Debugging a hypervisor is fundamentally different from debugging normal code because the hypervisor sits below the OS. You cannot use Visual Studio's debugger because the debugger itself runs under the hypervisor. You cannot use WinDbg because the hypervisor intercepts the debug interrupts. You are effectively flying blind.

ArkVisor's debugging strategy relied on three techniques:

**DebugView logging**: The hypervisor uses DbgPrint to output messages to the kernel debug stream. DebugView captures these messages and displays them in real-time. Every major operation logs its status: "VMX init: checking CPU support", "VMCS alloc: success at 0xFFFFF80012345000", "VM launch: entering guest". This is slow but effective.

**BSOD analysis**: When the hypervisor crashes, Windows produces a crash dump. Analyzing the dump with WinDbg can reveal the faulting instruction and register state. The challenge is that the crash might be in the guest (caused by bad VMCS state) or in the hypervisor (caused by a bug), and distinguishing the two requires careful analysis of the RIP and CR3 values.

**Minimal changes**: Because debugging is so hard, I made one change at a time and tested immediately. Adding a new VMCS field? Test. Adding a new exit handler? Test. This slow, methodical approach is the only way to make progress when each bug requires a reboot and crash dump analysis.

The one debugging breakthrough was discovering that VMX provides a VMCS shadowing feature for certain fields. When shadowing is enabled, the hardware automatically saves/restores fields like CR0 and CR4 on exit/entry, reducing the hypervisor's bookkeeping. Enabling shadowing fixed several state corruption bugs that I had been chasing for weeks.

## Implementation Status

ArkVisor is explicitly a learning project, not a production hypervisor. The current implementation represents about 30% of a minimal Type-1 hypervisor. The following components are complete:

**VMX detection and initialization**: The code checks CPUID leaf 0x1 for VMX support, reads IA32_FEATURE_CONTROL MSR to ensure VMX is enabled, allocates the VMCS region with MmAllocateContiguousMemory (ensuring 4KB alignment), and executes VMXON to enter VMX root operation. This works reliably on Intel VT-x CPUs.

**VMCS configuration**: The hypervisor configures all required VMCS fields: guest state (registers, segments, CRs), host state (RIP, RSP, segments, CRs), execution controls (pin-based, processor-based, exit controls, entry controls), and the MSR load/store lists. The configuration follows Intel's recommendations and has been validated against the VMCS state requirements in the SDM.

**VM entry/exit**: The hypervisor executes VMLAUNCH to enter the guest, handles VM exits through the assembly wrapper and C dispatcher, and executes VMRESUME to re-enter the guest. The exit handler currently supports CPUID, VMCALL, and HLT exits. Other exit reasons return to the host with an error log.

**EPT initialization**: The hypervisor allocates a 4KB EPT PML4, creates a single PDPT entry pointing to a PD, creates a single PD entry pointing to a PT, and fills the PT with 512 entries mapping the first 2MB of physical memory with RWX permissions. This is enough to demonstrate EPT but far from a complete implementation.

**Hypercall interface**: The VMCALL handler dispatches to a simple switch statement that currently supports a single hypercall (HYPERCALL_PROTECT_MEMORY). The handler logs the request and returns a success code. The actual memory protection logic is stubbed.

**Driver integration**: The hypervisor exports a function to get the shared memory region address and a flag indicating hypervisor readiness. The driver loads this address from the hypervisor's export table and polls the flag before making hypercalls.

The following components are partially implemented or stubbed:

**Multi-processor support**: The hypervisor initializes VMX on the BSP (bootstrap processor) only. The code has placeholders for DPC-based initialization on APs (application processors), but this is not implemented. Running on a multi-core system would cause the APs to continue running in VMX non-root mode without a hypervisor, leading to undefined behavior.

**EPT violation handling**: The hypervisor logs EPT violations but does not handle them. A complete implementation would analyze the violation (read vs write, execute vs data), allocate the missing EPT mapping, and retry the instruction. This requires complex page table management and is not implemented.

**VM exit handlers**: Only CPUID, VMCALL, and HLT exits are handled. Common exits like EPT violations, CR access, MSR access, I/O, and exceptions all fall through to the default handler, which logs and exits to the host. This means the hypervisor cannot run real guest code beyond trivial test programs.

**State save/restore**: The hypervisor saves/restores general-purpose registers but does not properly handle FPU/XMM state, debug registers, or performance counters. This would cause corruption in any guest that uses these features.

The following components are not implemented at all:

**Device emulation**: No virtual disk, network, keyboard, mouse, or other device emulation. The hypervisor cannot run a full guest OS because there is no way for the guest to interact with hardware.

**Interrupt injection**: The hypervisor cannot inject interrupts into the guest. This means timer interrupts, I/O interrupts, and software interrupts all fail. A guest OS would hang immediately.

**APIC virtualization**: The hypervisor does not virtualize the Local APIC or I/O APIC. This is required for multi-core operation and interrupt handling.

**Snapshot/checkpoint**: No ability to save guest state to disk and restore it later. This requires serializing the entire VMCS, EPT structures, and guest memory.

**Memory ballooning**: No ability to dynamically add or remove guest memory. This is required for overcommitment and memory management.

## Lessons Learned

The most important lesson is that hypervisor development requires a different mental model than normal software development. You are not just writing code; you are configuring hardware. The processor has specific expectations, and if you violate them, it faults silently. You cannot step through code with a debugger. You cannot add print statements to arbitrary locations (the guest might not have a console). You work in the dark, making incremental changes and hoping for the best.

The second lesson is that the Intel documentation, while comprehensive, is not a tutorial. It tells you what each field does, but not why you need to set it that way. It tells you the VMCS format, but not the common pitfalls. The only way to learn is to implement, crash, debug, and iterate. This is why building a hypervisor from scratch is valuable: you learn the pitfalls that documentation glosses over.

The third lesson is that state management is the hardest problem. Saving and restoring FPU state, handling page table updates, managing interrupt state, and ensuring consistency across VM exits all require careful bookkeeping. Production hypervisors have sophisticated state tracking systems that took years to develop. A learning hypervisor can skip some of this, but you still need to understand the problem space.

The fourth lesson is that virtualization is a layering violation. The hypervisor sits below the OS, but the OS expects to be at the lowest level. The OS makes assumptions about direct hardware access, about timing, about memory layout. The hypervisor must preserve these illusions while actually virtualizing everything. This tension between what the guest expects and what the hypervisor provides is the core challenge.

## Future Directions

If ArkVisor were to continue development, the priorities would be:

**Complete EPT implementation**: Dynamically map all physical memory on demand, handle EPT violations correctly, support memory type conflicts, and implement page table tracking. This is the foundation for running real guest code.

**Implement critical VM exit handlers**: EPT violations, CR access, MSR access, I/O, and exceptions are all required for a functional guest. Each handler requires understanding the associated hardware semantics and implementing the appropriate virtualization logic.

**Add multi-processor support**: Use DPCs to initialize VMX on all cores, handle inter-processor interrupts (IPIs), and ensure consistent state across cores. This is non-trivial because the hypervisor must coordinate initialization without deadlocking.

**Implement interrupt injection**: Parse the guest's interrupt descriptor table (IDT), inject timer interrupts periodically, handle I/O interrupts from virtualized devices, and manage interrupt masking. This requires understanding both x86 interrupt semantics and the guest OS's interrupt handling.

**Add basic device emulation**: Implement a virtual serial port for console output, a virtual disk for storage, and basic network emulation. This is a massive undertaking because each device requires emulating its register interface, command processing, and interrupt behavior.

However, the reality is that these features represent years of work. Existing open-source hypervisors like Xen, KVM, and the "Hypervisor from Scratch" reference implementation already have all of this. The value of continuing ArkVisor is diminishing as the learning curve shifts from "how does VT-x work" to "how do you emulate a PCI device." The former is unique to virtualization; the latter is general systems programming that can be learned elsewhere.

## Conclusion

ArkVisor is a learning project that successfully demonstrates the fundamentals of Intel VT-x: VMX operation, VMCS configuration, EPT memory virtualization, VM exit handling, and hypercall interfaces. It is not a complete hypervisor and was never intended to be. Its purpose is to provide a hands-on understanding of how hardware virtualization works at the lowest level.

The project revealed that hypervisor development is equal parts hardware configuration, systems programming, and debugging in the dark. It taught me to read the Intel SDM more carefully, to appreciate the complexity of state management, and to understand why commercial hypervisors are the way they are.

For anyone interested in learning hypervisor development, I recommend starting with a minimal implementation like ArkVisor: get VMX working, configure the VMCS, launch a guest, handle a few exits. Once you understand the basics, study production hypervisors to see how they handle the hard problems. The combination of building from scratch and studying existing code is the most effective learning path.

Understanding VT-x has been invaluable for reverse engineering and security research. Many anti-cheat systems use hypervisor-based techniques, and understanding how they work at the hardware level is essential for analyzing them. ArkVisor provided that foundation, and I hope this writeup helps others on the same journey.`},{id:`atlus`,title:`Atlus: A Unified IR Architecture for Binary Analysis`,subtitle:`Lessons from building a deterministically reproducible reverse engineering workbench with explicit invalidation and SQL-like query semantics.`,date:`2024-2026`,categories:[`tools`,`reverse-engineering`,`security`,`systems-programming`],tags:[`reverse-engineering`,`pe`,`c++`,`ir-design`,`incremental-analysis`,`dear-imgui`],readTime:`18 min`,featured:!0,content:`## The Problem with Traditional Reverse Engineering Tools

Most reverse engineering tools share a fundamental architectural flaw: they treat analysis outputs as transient projections of the binary rather than as derived truth that can be cached, invalidated, and reconstructed deterministically. When you rename a function in IDA Pro or add a comment in Ghidra, that metadata lives in a proprietary database format tightly coupled to the UI layer. When the binary changes, you lose that work. When you want to batch process 1000 samples, you cannot easily script the analysis because the UI and analysis are intertwined.

Atlus started with a different premise: what if we treated binary analysis like a compiler treats source code? What if we had an explicit intermediate representation (IR) with stable identities, explicit invalidation semantics, and a clean separation between analysis (the compiler backend) and presentation (the UI frontend)?

This writeup documents the architectural decisions, tradeoffs, and implementation patterns that emerged from attempting to build such a system.

## The Truth Hierarchy

The central insight guiding Atlus's design is that there are actually three distinct categories of state in a reverse engineering tool, and conflating them causes endless problems:

**Raw Binary Data** is the immutable source of truth. We never modify the original file. We parse it, analyze it, but the bytes on disk are sacrosanct.

**Intermediate Representation** is derived, cacheable, and invalidatable truth. Functions, basic blocks, instructions, cross-references, and type information all live here. The IR is content-addressed: identical bytes produce identical IR graphs. This enables session portability and regression testing.

**UI State** is purely transient projection. Scroll positions, panel visibility, current selections, and window layouts exist only to serve the user interface. They never drive analysis state.

This separation prevents the "UI-driven corruption" that plagues many tools, where accidental UI mutations leak into the analysis model and produce inconsistent results. It also enables batch processing: the same query API works whether you are clicking through the GUI or running a headless analysis pipeline.

## Why Content-Addressed Identity Matters

In traditional reverse engineering tools, functions and other entities are identified by their virtual address. This seems natural but breaks down immediately when you consider rebasing, ASLR, or analyzing multiple versions of the same binary. The same logical function exists at different addresses in different builds, making it impossible to track identity across time.

Atlus uses content-derived identity instead. Every IR entity carries a ContentHash, a 128-bit hash computed from the entity's semantic content. For a function, this might be a hash of its prologue bytes combined with its entry point characteristics. For a basic block, it is a hash of the instruction sequence. Two functions with identical ContentHashes are the same function, regardless of where they live in memory.

This has profound implications:

**Session files become portable.** You can save your analysis, rebase the binary, and reload the session. The IR entities will rebind to their new addresses by ContentHash lookup.

**Cross-version analysis becomes tractable.** When diffing two versions of a binary, functions with matching ContentHashes are instantly recognized as unchanged, regardless of reordering or inlining.

**Regression testing is automatic.** Identical inputs produce identical ContentHashes, which means identical IR graphs, which means testable analysis pipelines.

## The Invalidation Problem

Building the IR is only half the battle. The hard part is maintaining it when things change. If the user patches a single byte in the middle of a function, what needs to be recomputed? The instruction at that address certainly. The basic block containing it, probably. The control flow graph for the function, possibly. Cross-references from other functions that call this one, unlikely unless the patch changed a call target.

Most tools handle this ad-hoc, with implicit dependencies that lead to either over-invalidation (recomputing everything when a small change happens) or under-invalidation (stale analysis artifacts persisting after changes). Both are catastrophic for user trust.

Atlus formalizes invalidation through the PIPELINE_INVALIDATION_MATRIX, a document that specifies exactly which analysis stages are affected by each type of change. The matrix is not just documentation; it is executable code in the InvalidationEngine class. When a change occurs, the engine applies the matrix rules, computes the affected stages, and cascades invalidation through the dependency graph.

For example, when BinaryPatched is triggered at a specific address, the engine:
1. Finds all instructions in the affected range using the address index
2. Marks them Invalid (they will be recreated on next disassembly)
3. Marks their parent basic blocks NeedsRebuild
4. Marks their parent functions NeedsUpdate for CFG rebuilding
5. Propagates to callers only if the patch changed a call target

This deterministic invalidation means users never see stale data, and the system never wastes work recomputing unaffected analysis.

## Address Spaces: The Hidden Complexity

Binary formats conflate multiple coordinate systems. A PE file has file offsets (where bytes live on disk), RVAs (relative virtual addresses, relative to the image base), and virtual addresses (RVA + image base). ELF has similar complexity. When analyzing a loaded process or firmware with no headers, you have yet more conventions.

Most tools handle address translation implicitly, with ad-hoc conversion functions scattered throughout the codebase. This leads to bugs where you use a file offset where a virtual address was expected, or forget to apply rebasing when analyzing a dumped process.

Atlus formalizes this with the Address Space Model. There are five distinct address spaces: FileOffset, Section, RVA, Image, and Runtime. The SegmentMapping class provides bidirectional translation between FileOffset and RVA for each section. The BaseAddressModel handles the RVA to Image/Runtime translation with explicit rebasing support. The RelocationTable handles the fixups that occur when a binary is loaded at a non-preferred address.

This abstraction means the analysis pipeline is address-space-agnostic. The same code that builds a control flow graph for a PE file works for an ELF file or a raw firmware dump. Only the parsing stage changes; the IR and all downstream analysis remain identical.

## The Query Layer: SQL Over the IR Graph

Once you have a formal IR, you need a way to query it. Traditional tools require plugins to directly manipulate internal data structures, coupling them to implementation details that change between versions.

Atlus provides a Query Layer that offers SQL-like semantics over the IR graph. Instead of walking linked lists of functions and checking addresses manually, you write:

    QueryBuilder()
        .select_functions()
        .callers_of(target_function)
        .where(FunctionFilter{.is_leaf_function = true})
        .limit(100)
        .execute(binary, index)

The Query Layer is not just syntactic sugar. It enables:

**Optimization.** Complex queries can be rewritten to use indexes instead of full scans. The QueryPlanner analyzes the filter structure and chooses execution strategies.

**Caching.** Query results can be cached because the QueryContext tracks IR version numbers. If the underlying IR has not changed, the cached result is valid.

**Uniformity.** The same query works from the UI, from a CLI script, or from a plugin. All three use the same API, guaranteeing consistent behavior.

## Type System as Constraint Propagation

Type recovery in binary analysis is fundamentally a constraint satisfaction problem. A register loaded from a field offset suggests a struct type. A pointer passed to a known function like strlen suggests a string type. These constraints propagate through the control flow graph, meeting at merge points where types must be unified.

Atlus approaches this with a lattice-based type system. The BaseType lattice ranges from Unknown at the bottom through concrete types like Int32 and Pointer, up to specialized types like StringPtr and VTablePtr at the top. The meet operator defines how types combine: Int32 meet Pointer stays Pointer (pointers win over integers for external API compatibility), while Int32 meet UInt32 promotes to a generic integer.

The TypePropagation engine creates TypeVariables for every register and stack slot, then adds constraints from instruction semantics. A mov instruction from a stack slot to a register propagates the stack slot's type to the register. A call to a known function adds parameter type constraints. The engine iterates to a fixed point, widening types where necessary to ensure convergence.

This is early scaffolding in the current implementation, but the architecture is designed to support full type recovery in later phases without redesign.

## The Analysis Pipeline as a DAG

Analysis passes have dependencies. You cannot build a control flow graph until you have identified basic blocks. You cannot find cross-references until you have disassembled instructions. Most tools either run passes in a fixed order or let plugins register callbacks in an ad-hoc event system.

Atlus models analysis as a directed acyclic graph where nodes are analysis stages and edges are data dependencies. The AnalysisPipeline class performs a topological sort to determine execution order, then runs stages with caching and incremental support.

Each StageRunner declares its dependencies explicitly. The disassembly stage declares it needs the section mapping and function entry points. The CFG builder declares it needs basic blocks. The pipeline constructs a plan: ParsePE, MapSections, ScanFunctionEntries, DisassembleFunctions, BuildBasicBlocks, BuildCFG.

When a change occurs, the invalidation engine marks affected stages stale. On the next analysis run, the pipeline only recomputes what is necessary. If you changed a function name, no reanalysis runs. If you patched code in the middle of a function, only that function's disassembly, basic blocks, and CFG rerun. Dependencies like cross-references from callers are updated only if the patch actually changed call targets.

This incremental analysis is essential for large binaries. Reanalyzing a 100MB PE file from scratch takes seconds. Reanalyzing just the affected functions takes milliseconds.

## Indexing: Acceleration Without Authority

The IR is authoritative but not optimized for lookup. Finding all functions in an address range requires scanning the function list. Finding all cross-references to an address requires scanning all instructions.

The GlobalIndex provides acceleration structures: hash maps from addresses to entities, from names to symbols, from content hashes to functions. These indexes are strictly secondary. They can be rebuilt from the IR at any time. They store ContentHashes, not direct pointers, so they remain valid across reanalysis.

For very large binaries that exceed memory, the PersistentIndex provides an SQLite-backed index. It stores the same data as the GlobalIndex but on disk, with lazy loading and query result caching. The interface is identical, so code works with either without modification.

The key contract is that the index never becomes authoritative. If the index and IR disagree, the IR wins and the index is marked stale for rebuilding. This prevents the index corruption bugs that plagued early IDA versions.

## Four Levels of Diffing

Binary diffing is not a single operation. Different use cases need different abstraction levels.

At the byte level, we use a rolling hash algorithm (similar to rsync) to find aligned regions between two binaries. This is fast and catches all changes, but produces noisy results when code is merely reordered or when data addresses change due to rebasing.

At the section level, we compare PE sections structurally. If the .text section grew by 4KB, we report that. If a section was removed, we report that. This filters out alignment changes and padding differences.

At the function level, we align functions between binaries using a combination of address proximity (for unchanged regions) and content hashing (for reordered regions). Functions with identical ContentHashes are matched instantly. Functions with similar instruction sequences are scored and matched heuristically. This produces human-readable diffs: "Function sub_401000 changed at offset +0x45" rather than "Byte at 0x401045 changed from 0x89 to 0x8B".

At the signature level, we generate Array-of-Bytes signatures that match the changed code even across versions. For security researchers tracking malware evolution or game developers analyzing anti-cheat updates, these signatures are actionable intelligence: a single pattern that finds the same logic in 50 different builds.

## UI Architecture: Dear ImGui and State Separation

The UI is built on Dear ImGui, an immediate-mode GUI library that fits well with the IR architecture. In immediate mode, there is no persistent UI state to get out of sync with the analysis model. Each frame queries the IR and renders what is current.

Atlus provides 8 dockable panels: Hex View, Disassembly, Functions, Sections, Diff View, Signatures, Decompiler, and Strings. Users arrange these to match their workflow, and the layout persists to atlus_layout.ini.

The critical rule is that the UI never modifies IR directly. When a user renames a function in the UI, the UI calls Binary::rename_symbol(), which updates the IR, which triggers the invalidation engine, which marks the index stale, which causes the next query to return fresh data. The UI is a pure projection of IR state, never a driver of it.

This separation means the same Atlus core can drive a GUI, a CLI batch processor, or a JSON API server. All three use the same IR, same pipeline, same query layer. Only the presentation layer changes.

## Integration Points: LIEF, Zydis, Ghidra

Atlus is not a monolithic reimplementation of everything. It integrates specialized libraries where they excel.

LIEF (Library to Instrument Executable Formats) handles PE parsing. It provides robust, well-tested parsers for PE, ELF, and Mach-O with consistent APIs. Atlus uses LIEF to read headers, sections, imports, exports, and relocations, then populates its own IR with this data. The IR abstracts away format differences, so downstream analysis does not care whether the original file was a PE or ELF.

Zydis handles disassembly. It is a fast, accurate x86/x64 decoder with rich metadata about operands, memory accesses, and control flow. Atlus uses Zydis to decode instruction bytes into the IR's Instruction entities, extracting mnemonics, operands, and control flow flags (is_branch, is_call, is_return).

Ghidra provides decompilation through an async subprocess bridge. The GhidraDecompiler class spawns the Ghidra headless analyzer, streams function addresses to it, and receives C pseudocode back. The results are cached by function ContentHash, so decompiling the same function twice (even in different sessions) is instant.

## Implementation Status and Lessons

Phase 1 of Atlus (the foundation) is complete. PE parsing, disassembly, the four-level diff engine, pattern scanning, and the ImGui UI all work. You can load a binary, browse disassembly, compare two files, and generate signatures.

Phase 2 (the IR infrastructure) is partially complete. All the headers are written. The ir.h header defines complete entity structures. The ir_identity.h header defines ContentHash and IdentityVersion. The analysis_pipeline.h header defines the stage DAG. But the implementations are mostly stubs. The IR exists on paper but not yet in the running code.

The challenge has been integrating the new IR architecture with the existing working code without breaking functionality. The strategy is to incrementally replace legacy data structures with IR equivalents, one subsystem at a time.

The most important lesson from this process is that architecture cannot be retrofitted. The decision to build a formal IR with content-addressed identity and explicit invalidation had to be made early. If we had built a traditional "parse and project" tool first, retrofitting these concepts would require a complete rewrite.

The second lesson is that contracts must be executable. The PIPELINE_INVALIDATION_MATRIX is not just documentation; it is code. The CACHING_BOUNDARY_CONTRACT is not just guidelines; it is enforced by the cache key design. When contracts are only prose, they drift from reality. When they are code, they stay true.

## Future Directions

With the IR infrastructure complete, Atlus will gain:

**Incremental analysis.** Change a single function and only that function reanalyzes, not the whole binary.

**Session portability.** Save analysis on one machine, load on another, rebase the binary, and everything rebinds automatically.

**Plugin ecosystem.** The Query Layer provides a stable API. Plugins can query the IR without worrying about internal data structure changes.

**Multi-format support.** The same analysis pipeline works for PE, ELF, Mach-O, and raw firmware because the IR abstracts format details.

**Collaborative analysis.** Content-addressed identity means two analysts can work on the same binary and merge their symbol names, comments, and type definitions by ContentHash matching.

The core insight remains: treat binary analysis like compilation. Parse to IR, optimize, cache, invalidate, and present. The rest follows.`},{id:`ark-mt`,title:`ark-mt: A Game Analysis Toolkit for Marathon`,subtitle:`Lessons from building a kernel-assisted reverse engineering workbench for the Marathon game with layered memory access, pattern-driven discovery, and architectural separation between stealth and analysis.`,date:`2024-2026`,categories:[`tools`,`reverse-engineering`,`security`,`systems-programming`],tags:[`reverse-engineering`,`memory-analysis`,`c++`,`kernel-driver`,`pattern-scanning`,`game-research`,`dear-imgui`],readTime:`15 min`,featured:!0,content:`## The Problem with Traditional Game Analysis Tools

Most game analysis tools fall into two problematic categories: user-mode tools that struggle against modern anti-cheat, and kernel-level tools that sacrifice usability for privilege. Cheat Engine provides excellent scanning but is instantly detected. Kernel drivers provide undetected access but require cumbersome setup and lack coherent workflows. Neither addresses the fundamental architectural challenge: how do you build analysis tools that can operate at any privilege level while maintaining a consistent API and user experience?

ark-mt started as a toolkit for analyzing the Marathon game with a different premise: what if privilege escalation was an implementation detail, not an architectural constraint? What if the same code that scanned memory via ReadProcessMemory could transparently escalate to driver-assisted physical memory access when needed? What if pattern scanning, overlay rendering, and entity analysis all shared the same memory abstraction layer?

This writeup documents the architectural decisions, tradeoffs, and implementation patterns that emerged from building such a system.

## The Layered Memory Model

The central insight guiding ark-mt's design is that memory access exists on a spectrum of privilege and detection risk, and hardcoding any single layer limits tool flexibility:

**User-Mode Access** is the baseline. OpenProcess with appropriate rights, ReadProcessMemory/WriteProcessMemory for I/O. Works against unprotected processes. Instantly detected by any competent anti-cheat.

**Direct Syscall Layer** bypasses the NT user-mode stubs and calls kernel entry points directly. Same ultimate access, different detection signature. Still operates in user-mode address space.

**Driver-Assisted Access** elevates to kernel privilege. The driver translates virtual addresses to physical via page tables, reading physical memory directly. Undetectable from user-mode monitoring, but requires driver deployment and introduces kernel-mode risk.

**Physical Memory Access** is the ultimate fallback. When EPROCESS structures are hidden or CR3 manipulation obfuscates address translation, direct physical memory scanning finds process memory by pattern matching PE headers and pool allocations.

ark-mt's IMemoryReader interface abstracts all four layers. The same PatternScanner that finds an array-of-bytes signature can operate over user-mode handles, driver IOCTLs, or physical memory frames. Analysis code does not care which layer is active.

## Why Driver Abstraction Matters

Game protection evolves rapidly. One month your driver works; the next month the anti-cheat blacklists your device name or patches your IOCTL handler. Hardcoding driver dependencies creates brittle tools that break with every game update.

ark-mt formalizes driver access through the StealthCorMem abstraction layer. The interface is minimal:

    Initialize()
    ReadPhysicalMemory(pid, physAddr, buffer, size)
    TranslateVirtualAddress(pid, va)
    FindProcessDTB(pid)

Multiple driver implementations conform to this interface. CORMEM provides the reference implementation. Custom drivers plug in by implementing the same contract. Even a hypervisor-based backend fits the same interface.

This has operational implications:

**Tool longevity increases.** When one driver is detected, tools continue working by swapping implementations. No recompilation, no API changes.

**Testing becomes safe.** The same scanner.exe that searches for entity pointers via driver can run against test processes via ReadProcessMemory. Kernel debugging becomes optional for most development.

**Risk isolation improves.** The driver is purely I/O. All analysis logic, pattern matching, and decision-making lives in user-mode tools. A bug in entity discovery cannot crash the system because the driver has no entity concept.

## The Pattern-First Discovery Model

Traditional game analysis relies on static offsets distributed via forum posts and Discord servers. baseAddress + 0x1234567 for health, 0x1234568 for ammo. These offsets break every game update, sending analysts back to Cheat Engine to hunt for new values.

ark-mt inverts this model. Instead of distributing offsets, distribute patterns. Instead of 0x1234567, provide:

    48 8B 05 ?? ?? ?? ?? 48 85 C0 74 ?? 48 8B 80

This pattern finds the instruction loading the local player pointer via RIP-relative addressing. The ?? wildcards match the displacement bytes that change every build. The surrounding instruction bytes provide signature stability across versions.

The Pattern class formalizes this. Hex strings parse into byte arrays with mask bits indicating wildcards. The Scanner searches memory regions for matches, returning the absolute address where the pattern occurs. The AOBScan layer adds caching with automatic 30-second invalidation, reducing redundant memory reads when multiple tools query the same process.

**Discovery chains** compose patterns. Find the local player pointer, then scan the structure it points to for nested entity arrays. Find the view matrix by searching for float arrays with specific mathematical properties (orthonormal basis vectors, projection characteristics). Each discovery step produces addresses fed into the next pattern.

**Signature generation** reverses the process. Once you find the code accessing a value of interest, sigmaker.exe generates patterns matching that code. The --rip-disp flag masks the 4-byte relative displacement, producing signatures that survive rebasing.

## The Analysis Module Architecture

Marathon separates analysis into three categories: passive observation, active assistance, and automated behavior.

**Passive modules** read game state without modification. ESP (Extra Sensory Perception) reads entity positions, health values, and team affiliations, projecting them as overlays on the game screen. The overlay renders via GDI or DirectX 11 depending on bypass requirements. Streamproof bypasses capture the game frame before compositing, adding visualization without appearing in screen captures.

**Active modules** calculate but do not modify. Aim assistance reads entity positions, calculates angles between camera and target, and provides the resulting aim vector to the user. The actual input injection happens elsewhere (or not at all), keeping the analysis tool within read-only safety boundaries.

**Automated modules** form the highest risk tier. When fully automated, they read state, calculate responses, and inject inputs via SendInput, hardware interrupts, or driver-mediated HID manipulation. Marathon provides the analysis infrastructure but leaves input automation to external decisions.

The analysis_config.json file controls module activation. Each module declares its dependencies (requires local_player, requires entity_list) and the system validates prerequisites before activation. This prevents the confusing failures common in monolithic tools where ESP crashes because you forgot to enable the memory scanner first.

## Address Space Navigation

Modern games complicate address translation intentionally. Anti-debug techniques include:

- **Hidden EPROCESS structures** removed from the ActiveProcessLinks list
- **CR3 manipulation** changing page table bases per-thread
- **SectionBaseAddress hiding** via kernel callbacks
- **Allocation obfuscation** scattering game data across non-contiguous regions

Marathon addresses this through progressive fallback in the DriverManager:

1. **EPROCESS enumeration** via ActiveProcessLinks and SectionBaseAddress
2. **PEB module enumeration** for hidden process detection
3. **Full address space scanning** for MZ/PE headers when structures are hidden
4. **Physical memory frame scanning** when virtual translation fails

The FindProcessDTB algorithm does not assume EPROCESS visibility. It walks physical memory frames looking for page tables containing the target process's address space characteristics. Slow, but effective against aggressive hiding.

## The Toolset Philosophy

ark-mt provides twelve specialized tools rather than one monolithic GUI. Each tool does one thing well:

- **dumper.exe** - Offset discovery via logging and signature scanning
- **scanner.exe** - Value scanning (float, int, pointer patterns)
- **inspector.exe** - ReClass-style memory viewer with typed interpretations
- **entity_finder.exe** - Pointer array detection and transform matrix scanning
- **pointer_scanner.exe** - Pointer chain discovery via BFS depth-limited search
- **sigmaker.exe** - Pattern generation from code addresses
- **class_finder.exe** - VTable and RTTI structure discovery
- **xref_finder.exe** - String reference tracing with code cross-reference detection
- **memmap.exe** - Memory region mapping via VirtualQueryEx
- **thread_inspector.exe** - Thread analysis and stack inspection
- **camera_finder.exe** - View matrix, projection matrix, and FOV discovery
- **toolset_gui.exe** - ImGui frontend unifying tool access

This separation has practical benefits. scanner.exe runs against test processes during development. entity_finder.exe targets specific games without loading unrelated analysis code. The tools share the ProcessUtil helper library for PID resolution and output formatting, but each is independently deployable.

## Overlay Architecture: GDI vs DirectX

Visualization presents architectural tension. GDI overlays are simple, synchronous, and work with any window. DirectX overlays integrate into the game render loop, enabling 3D world-to-screen projection and shader-based effects. But DirectX hooking is detectable and version-sensitive.

ark-mt provides both via the GdiOverlay class. The overlay system:

1. **Discovers the target window** via title or class name matching
2. **Creates a layered transparent window** positioned over the target
3. **Renders via GDI or hooks the DirectX present chain** depending on configuration
4. **World-to-screen projects** 3D coordinates through view/projection matrices
5. **Clears state each frame** maintaining immediate-mode semantics

The streamproof_bypass module intercepts frame captures before compositing, ensuring overlays appear to the analyst but not to screen recording software. This works against Discord overlay detection, OBS capture, and in-game screenshot systems.

## The Research Types System

Game data has types that must be discovered, not assumed. The ResearchTypes header formalizes this discovery process:

- **Pointer chains** - Multi-level indirection common in game engines (local_player → player_array → entity → health)
- **Transform matrices** - 4x4 float arrays encoding position, rotation, scale
- **View projections** - Camera matrices combining view and projection transforms
- **Entity bounds** - AABB or OBB structures for hitbox calculations

The StructValidation template provides runtime type checking. Read a candidate address as multiple types (float, int32, pointer) and validate which interpretation produces sane values. Health reads as 0.0-100.0 float? Likely a float. Address space pointer? Likely an entity reference.

## Security and Stealth Architecture

Operating in protected environments requires defensive design:

**Handle pooling** pre-allocates process handles during initialization, before anti-cheat hooks are active. Later operations use pooled handles rather than fresh OpenProcess calls that trigger detection.

**Timing jitter** randomizes operation intervals. Memory reads do not occur at perfectly regular intervals; they cluster and disperse to evade heuristic timing analysis.

**IAT hooking** redirects imports through trampolines, obscuring which system functions the tools actually call.

**Syscall obfuscation** bypasses user-mode hooks by calling kernel entry points directly, but only when necessary. The Syscall class generates fresh syscall numbers per-boot rather than hardcoding values that change between Windows versions.

**Driver stealth** employs device name randomization, IRP hook evasion, and MSR manipulation where appropriate. The driver layer is intentionally thin; most logic remains in user-mode tools that are easier to update and less dangerous when buggy.

## The Manual Mapper

DLL injection via LoadLibrary is trivial and trivially detected. ark-mt's manual_mapper.exe bypasses this by:

1. **Allocating memory** in the target process
2. **Parsing the PE headers** of the DLL to inject
3. **Mapping sections** to appropriate addresses
4. **Processing relocations** for rebased addresses
5. **Resolving imports** via manually-loaded function pointers
6. **Calling the entry point** with DllMain simulation

The PEParser class handles format parsing. The ManualMapper handles injection mechanics. Combined, they allow core DLL deployment without touching LoadLibrary or CreateRemoteThread, bypassing the most common injection detection vectors.

## Implementation Status and Lessons

The current implementation is functional across multiple tiers:

**Complete and tested:**
- Core memory scanning (AOB, pattern matching)
- Driver interface abstraction (ArkDrv, CorDrv)
- All 12 research tools compile and run
- GDI overlay with world-to-screen projection
- Manual mapper for DLL injection
- Game Research Toolset GUI (ImGui + D3D11)

**Partially implemented:**
- DirectX 11 overlay hooking (scaffold present, needs game-specific testing)
- Some advanced stealth techniques (timing jitter functional, IAT hooks scaffolded)
- Full automated analysis modules (aimbot calculation present, input injection externalized)

**Key lessons learned:**

**Abstraction boundaries must be enforced.** The IMemoryReader interface works because every layer implements it completely. Partial implementations create leaks where high-level analysis code accidentally assumes user-mode capabilities. The interface is small enough to implement fully: read, write, query protection.

**Driver minimalism increases stability.** Early versions put too much logic in the kernel driver. Moving analysis to user-mode and keeping the driver as pure I/O transport dramatically reduced blue-screen frequency during development.

**Pattern stability is game-dependent.** Some games change instruction selection every build; others are stable for years. The pattern format with wildcards handles both, but signature maintenance remains ongoing work. The caching layer mitigates by reducing redundant rescans.

**GUI and CLI separation enables testing.** The ImGui frontend is convenient but optional. Every tool works from command line first, GUI second. This enables automated testing, CI integration, and headless operation when graphics are unavailable.

## Future Directions

ark-mt's architecture enables several planned enhancements:

**Unified entity database.** Content-addressed entity signatures enabling cross-game analysis. An entity structure found in one Unreal Engine 4 game provides hints for analysis of other UE4 titles.

**Collaborative offset sharing.** Encrypted offset sharing between trusted analysts without exposing raw memory addresses publicly. Patterns distribute publicly; discovered addresses distribute privately within trust networks.

**Hypervisor integration.** The StealthCorMem interface accepts hypervisor backends for analysis of even kernel-protected environments. The same tools run; only the memory transport layer changes.

**Automated pointer chain discovery.** Current pointer_scanner.exe uses BFS with depth limits. Future versions will employ probabilistic guidance, prioritizing chains matching known engine allocation patterns.

The core insight remains: separate privilege from analysis, separate discovery from action, and separate transport from interpretation. The rest follows.`},{id:`ark-drv`,title:`Ark-Drv: A Custom Kernel Driver for Game Memory Access`,subtitle:`Lessons from building a stealthy Windows kernel driver that replaces CORMEM with process memory allocation, VAD walking, and BattlEye evasion.`,date:`2024-2026`,categories:[`tools`,`reverse-engineering`,`security`,`kernel-development`],tags:[`windows-driver`,`kernel`,`wkd`,`battleye-evasion`,`physical-memory`,`vad-walking`,`manual-mapping`],readTime:`14 min`,featured:!0,content:`## The Problem with CORMEM

CORMEM is the de facto standard for kernel-assisted game memory access. It provides physical memory reads, virtual address translation, and process discovery via a single IOCTL interface. But it has critical limitations: no process memory allocation, no VAD enumeration, no kernel thread enumeration, and known device signatures that are likely in BattlEye's detection database. When you need to inject an overlay DLL into a protected game, CORMEM forces you to use VirtualAllocEx from user-mode, which is instantly visible to kernel-level anti-cheat monitoring.

Ark-Drv started with a different premise: what if we built a custom driver that provided full CORMEM parity plus the missing capabilities, while designing specifically to evade BattlEye's scanning routines? What if the driver name, IOCTL codes, and binary characteristics were all chosen to look like legitimate hardware rather than research tooling?

This writeup documents the architectural decisions, anti-detection strategies, and implementation patterns that emerged from building such a driver.

## The Stealth Design Philosophy

The central insight guiding Ark-Drv's design is that BattlEye actively scans for known signatures, and avoiding detection requires operating within the bounds of legitimate kernel behavior. Every design decision is evaluated against the question: would a legitimate hardware driver do this?

**Device Naming** uses "MsIoDrv" instead of research-tool names. This sounds like a generic Microsoft I/O driver, not a game analysis tool. The symbolic link is \\\\.\\MsIoDrv. No "CORMEM", no "KDMapper", no recognizable cheat terminology.

**IOCTL Code Selection** avoids known ranges. CORMEM uses 0x222000-0x222090. Public cheat drivers commonly use 0x9999 series. Ark-Drv uses FILE_DEVICE_UNKNOWN (0x22) with function codes 0x800-0x813 (legacy) and 0x900-0x913 (new). This overlaps with nothing in known signature databases.

**Pool Tag Obfuscation** prevents pool allocation fingerprinting. Instead of tags like "CORM" or "CHEA", Ark-Drv uses 'ltpM' (reversed "MtPl" for Marathon) and 'kart' for allocation tracking. These look like legitimate driver tags, not tool identifiers.

**String Hygiene** removes static detection vectors. Debug strings are stripped in release builds. Device names are XOR-encoded at runtime where feasible. No version strings, author names, or tool names appear in the binary. Running strings.exe on the compiled .sys reveals nothing suspicious.

**No Kernel Hooks** maintains clean driver behavior. Ark-Drv does not hook SSDT, IDT, or any kernel functions. It operates entirely through documented kernel APIs: MmMapIoSpace for physical memory, KeStackAttachProcess for process context, ZwAllocateVirtualMemory for memory allocation. This is indistinguishable from legitimate hardware driver behavior.

## Physical Memory Access Layer

Physical memory access is the foundation of all kernel-assisted memory operations. Ark-Drv provides this through IOCTL_READ_PHYSICAL and IOCTL_WRITE_PHYSICAL, which map physical address ranges into kernel virtual address space using MmMapIoSpaceEx (Windows 10+) or MmMapIoSpace (older builds).

The implementation is straightforward but dangerous: map the physical range, read or write bytes, unmap. The critical safety check is validating the address range before mapping. Mapping non-existent physical addresses causes system crashes. The driver enforces a 16MB maximum transfer size per IOCTL to prevent excessive memory consumption.

This layer enables all higher-level operations. Virtual address translation walks page tables by reading physical memory. Process enumeration scans EPROCESS structures via physical reads. Even process memory operations fall back to physical reads when KeStackAttachProcess fails.

## Virtual Address Translation

Translating virtual addresses to physical addresses requires walking the x86-64 page tables: PML4 → PDPT → PD → PT. Each level extracts 9 bits from the virtual address to index into the table, reads the physical address of the next level, and repeats until reaching the final physical page frame.

Ark-Drv implements this walk in the TranslateVirtualAddress function, handling all four page sizes: 4KB, 2MB large pages, 1GB huge pages, and unmapped pages. The walk reads each table entry via physical memory access, making it work even for hidden processes where DTB manipulation obfuscates the normal translation path.

The LinearToPhys function translates kernel virtual addresses using the system DTB, enabling EPROCESS and PEB address discovery. This is critical for finding processes that have hidden themselves from PsLoadedModuleList.

## Dynamic Offset Discovery

Windows kernel structure offsets change between versions. Hardcoding offsets like EPROCESS.SectionBaseAddress = 0x520 breaks when Windows updates. Ark-Drv solves this through dynamic discovery at driver initialization.

The DiscoverEPROCESSOffsets function walks the System EPROCESS looking for the PID field. It knows the System process has a well-known PID (typically 4), so it scans the first 2KB of the EPROCESS structure for a ULONG matching that value. Once found, it derives related offsets: PEB is typically at PID + 0x110, ActiveProcessLinks at a known constant offset.

This discovery happens once at DriverEntry. The discovered offsets are cached in global variables and used throughout the driver lifetime. If Windows updates and offsets shift, the driver recalculates them on the next load without code changes.

## Process Memory Allocation

The most critical capability missing from CORMEM is process memory allocation. Without it, manual DLL injection requires VirtualAllocEx from user-mode, which opens a process handle that BattlEye scans. Ark-Drv provides IOCTL_ALLOC_PROCESS_MEM, which allocates memory entirely from kernel mode.

The implementation uses KeStackAttachProcess to switch execution context to the target process, then calls ZwAllocateVirtualMemory with ZwCurrentProcess() as the target. After KeStackAttachProcess, ZwCurrentProcess() refers to the attached process, not the System process. The allocation lands in the target's address space with a proper VAD entry, making it indistinguishable from normal process behavior.

IOCTL_FREE_PROCESS_MEM provides cleanup. The driver tracks allocations in a linked list with spin-locked access, ensuring proper cleanup on driver unload. This tracking is necessary because manual mapping scenarios may require the driver to clean up allocations it made before self-unloading.

## VAD Walking: Replacing VirtualQueryEx

VirtualQueryEx from user-mode requires an OpenProcess handle, which BattlEye monitors. Ark-Drv provides IOCTL_QUERY_VAD, which walks the Virtual Address Descriptor tree from kernel mode without any handle.

The VAD tree is a self-balancing binary tree rooted at EPROCESS.VadRoot. Each MMVAD node describes a memory region: base address, size, type (private, mapped, image), protection flags, and module name for image regions. Walking this tree produces output equivalent to VirtualQueryEx, but entirely from kernel mode.

The implementation handles the version-dependent VAD offsets. Windows 10 20H2+ uses specific offsets for VadRoot, StartingVpn, EndingVpn, and VadFlags. Ark-Drv includes these offsets and validates them against the actual EPROCESS structure at runtime. Future Windows versions may require offset table updates.

This capability enables memmap.exe to build memory_map.json without any Win32 API calls, eliminating a major detection vector.

## Thread Enumeration

CreateToolhelp32Snapshot from user-mode opens a process handle and enumerates threads, both of which BattlEye monitors. Ark-Drv provides IOCTL_ENUM_THREADS, which walks EPROCESS.ThreadListHead from kernel mode.

EPROCESS contains a LIST_ENTRY linking all ETHREADs for the process. Each ETHREAD contains the thread ID (Cid.UniqueThread), start address (Win32StartAddress), and state (Tcb.State). Walking this list produces complete thread information without any user-mode handles.

The implementation handles ETHREAD offset discovery similarly to EPROCESS offsets. The driver discovers ThreadListHead offset by scanning the EPROCESS structure for patterns matching known thread list characteristics. This makes the driver resilient to Windows updates.

This capability enables thread_inspector.exe to analyze game threads without triggering handle-based detection.

## Module Enumeration

Module enumeration via the PEB is already implemented in the user-mode StealthCorMem layer, but Ark-Drv provides IOCTL_ENUM_MODULES for a kernel-side implementation that is faster and does not require DTB knowledge.

The kernel-side walk uses physical memory to read the target process's PEB, then walks the LDR_DATA_TABLE_ENTRY linked list to enumerate modules. This produces module names, base addresses, and sizes. The implementation is identical to the user-mode version but runs entirely in kernel mode.

IOCTL_GET_MODULE_BASE provides a convenience shortcut: given a PID and module name, return the base address directly. This is commonly used by tools that need to find the game's main module base for pattern scanning.

## Bulk Read Optimization

The BFS pointer scanner in pointer_scanner.exe needs to read many small memory regions efficiently. Making one IOCTL call per read introduces significant overhead. Ark-Drv provides IOCTL_READ_BULK, which accepts an array of (DirectoryTableBase, VirtualAddress, Size, OutputOffset) tuples and executes all reads in a single kernel transition.

The implementation iterates through the entries, translates each virtual address to physical via the provided DTB, reads the bytes, and copies them to the output buffer at the specified offset. This reduces user-kernel transitions from hundreds to one for a typical pointer chain scan.

This optimization is critical for performance. A depth-5 pointer chain scan might read 50 small regions. With individual IOCTLs, this is 50 transitions. With bulk read, it is one transition. The difference is noticeable in tool responsiveness.

## Self-Unload and Manual Mapping Support

Drivers loaded via kdmapper-style vulnerable driver exploitation are not registered in Windows' normal driver infrastructure. They do not appear in PsLoadedModuleList, have no service entry, and cannot be unloaded via sc.exe stop. This makes them invisible to BattlEye's driver enumeration, but also makes cleanup difficult.

Ark-Drv provides IOCTL_UNLOAD_DRIVER for self-unload. The driver checks if it owns the device object and symbolic link (created via normal load) or if it was manually mapped (detected by checking PsLoadedModuleList for its image base). If manually mapped, it calls ExFreePool on its image base to free the manually mapped memory. If normally loaded, it deletes the device and symbolic link.

The collision-tolerant device creation handles the case where a driver is loaded twice. When STATUS_OBJECT_NAME_COLLISION occurs on IoCreateDevice, the driver reuses the existing device object but wires its own dispatch table. This enables multiple driver instances to coexist, with each instance cleaning up only what it owns.

## Process Attachment Strategy

Ark-Drv supports two approaches to process memory operations: physical memory translation and process attachment.

Physical memory translation works by reading the target's DTB, translating virtual addresses to physical via page table walk, then reading physical memory. This works for any process, even hidden ones, but is slower for large contiguous regions.

Process attachment uses KeStackAttachProcess to switch execution context to the target process, then uses normal kernel APIs like ZwAllocateVirtualMemory and ZwReadVirtualMemory. This is faster and more reliable for large reads, but requires the target to be a normal visible process.

IOCTL_READ_PROCESS_MEM and IOCTL_WRITE_PROCESS_MEM use the attachment approach first, falling back to physical translation if attachment fails. This hybrid approach provides the best of both worlds: speed for normal processes, reliability for hidden ones.

## BattlEye Evasion Strategy

BattlEye's kernel component (BEDaisy.sys) and user-mode component (BEClient_x64.dll) together scan for:

- Loaded driver names and binary hashes against a signature database
- Device objects and symbolic links in the kernel namespace
- IOCTL code ranges that match known tools
- Kernel hooks (SSDT, IDT, inline hooks)
- Pool allocation tags that spell recognizable words
- Process handle tables for suspicious handles

Ark-Drv's evasion strategy addresses each:

**Driver name and hash:** Build from source, distribute only source code. The binary hash is unique to each build. Use "MsIoDrv" as the device name, which sounds like legitimate hardware.

**Device enumeration:** Load via kdmapper so the driver does not appear in PsLoadedModuleList. The driver is manually mapped into kernel memory, not registered as a normal driver.

**IOCTL fingerprint:** Use FILE_DEVICE_UNKNOWN (0x22) with function codes 0x900-0x913. This range does not overlap CORMEM (0x222xxx) or known public cheat drivers (0x9999).

**Kernel hooks:** Do not hook anything. Use only documented kernel APIs. No SSDT modification, no IDT modification, no inline hooks.

**Pool tags:** Use 'ltpM' and 'kart' instead of tool-related tags. These look like legitimate driver tags.

**Handle visibility:** Physical memory access does not require opening a process handle. Process attachment uses KeStackAttachProcess, which does not create a handle table entry.

## Implementation Status and Lessons

The current implementation is functional across multiple tiers:

**Complete and tested:**
- Physical memory read/write (IOCTL_READ_PHYSICAL, IOCTL_WRITE_PHYSICAL)
- Virtual address translation (IOCTL_TRANSLATE_VA, IOCTL_LINEAR_TO_PHYS)
- Process discovery (IOCTL_FIND_PROCESS_DTB, IOCTL_GET_EPROCESS_PA)
- Process memory allocation (IOCTL_ALLOC_PROCESS_MEM, IOCTL_FREE_PROCESS_MEM)
- Process memory read/write via attachment (IOCTL_READ_PROCESS_MEM, IOCTL_WRITE_PROCESS_MEM)
- VAD walking (IOCTL_QUERY_VAD, IOCTL_GET_VAD_REGION)
- Thread enumeration (IOCTL_ENUM_THREADS, IOCTL_GET_THREAD_START)
- Module enumeration (IOCTL_ENUM_MODULES, IOCTL_GET_MODULE_BASE)
- Bulk read optimization (IOCTL_READ_BULK)
- Self-unload support (IOCTL_UNLOAD_DRIVER)
- Dynamic EPROCESS offset discovery
- Manual mapping detection and cleanup
- Collision-tolerant device creation

**Partially implemented:**
- String obfuscation (device name XOR encoding scaffolded, not fully implemented)
- Windows version table for VAD/ETHREAD offsets (current offsets work for Win10 20H2+, may need updates)

**Key lessons learned:**

**Offset discovery is essential.** Hardcoded EPROCESS offsets break with Windows updates. The dynamic discovery pattern (scan for known PID, derive related offsets) works reliably and requires no maintenance across Windows versions.

**Manual mapping complicates cleanup.** Normally loaded drivers clean up via DriverUnload. Manually mapped drivers must free their own image base. The IsDriverInLoadedModuleList check distinguishes these cases and applies appropriate cleanup.

**IOCTL bulk operations matter for performance.** The bulk read optimization reduced pointer scanner runtime by 70% in testing. The overhead of user-kernel transitions is significant for operations that make many small reads.

**Pool tag choice affects detection.** Obvious pool tags like "CHEA" are trivial to scan for. Reversed tags like 'ltpM' or hardware-like tags are safer. The tag appears in kernel debuggers and scanning tools.

**No hooks is the safest strategy.** Early versions considered hooking ExAllocatePool for allocation tracking. This was abandoned because kernel hooks are a primary detection vector. The current linked list tracking with spin locks is slower but undetectable.

## Future Directions

Ark-Drv's architecture enables several planned enhancements:

**Hypervisor backend.** The StealthCorMem interface can accept a hypervisor-based memory transport for analysis of kernel-protected environments. Ark-Drv would remain the physical memory backend, with the hypervisor providing translation.

**VAD offset version table.** Current VAD offsets are hardcoded for Windows 10 20H2+. A version table keyed by build number would provide automatic offset selection for different Windows versions.

**String encryption.** Device names and IOCTL-related strings could be XOR-encoded at runtime to prevent static binary analysis. This adds complexity but makes string scanning ineffective.

**Process memory protection manipulation.** IOCTLs to change page protection (PAGE_EXECUTE_READWRITE) would enable shellcode execution without user-mode VirtualProtect calls. This is high-risk and requires careful implementation.

**Thread hijacking for code execution.** IOCTL_HIJACK_THREAD could set a thread's instruction pointer to execute injected code. This is already scaffolded in the legacy IOCTL range but not fully implemented due to detection concerns.

The core insight remains: operate within the bounds of legitimate kernel behavior. Use documented APIs, avoid hooks, choose innocuous names, and design for the specific anti-cheat's scanning patterns. The rest follows.`},{id:`wdfilterdrv`,title:`WdFilterDrv: Kernel-Mode Driver Development`,subtitle:`Building a Windows kernel-mode driver to understand OS internals at the lowest level.`,date:`2024`,categories:[`systems`,`closed`,`security`],tags:[`kernel`,`driver`,`c++`,`windows`],readTime:`14 min`,featured:!0,content:`## Overview

WdFilterDrv is a Windows kernel-mode driver built to understand how the operating system works at the lowest level. This is an **educational and research project** that explores kernel-mode driver development, cross-process memory operations, manual PE module mapping, shared memory communication, and HID input injection.

**Note: This project is incomplete and under active development.** Many features are implemented but may require additional testing, refinement, or are still in progress. The code should be considered experimental and used for educational purposes only.

## Why Kernel Development?

Kernel-mode code runs with the highest privileges (Ring 0), allowing:

- Direct hardware access
- Memory management control
- Process/thread manipulation
- System-wide hooking

This power comes with responsibility — bugs here crash the entire system.

## Build Process

### Prerequisites

- Windows Driver Kit (WDK) - Compatible with Visual Studio 2019/2022
- Windows SDK
- Test signing enabled (for development)

### Building the Driver

1. Open the Visual Studio solution in the \`WdFilterDrv/\` directory
2. Select the appropriate configuration (Debug/Release) and platform (x64)
3. Build the solution
4. The driver binary (.sys) will be output to the build directory

### Test Signing (Development Only)

To load unsigned drivers during development:

\`\`\`cmd
bcdedit /set testsigning on
bcdedit /set nointegritychecks on
\`\`\`

Reboot after running these commands. Remember to disable test signing before production use.

## Usage

### Loading the Driver

Use a driver loading utility or sc.exe:

\`\`\`cmd
sc create WdFilterDrv type= kernel binPath= C:\\path\\to\\WdFilterDrv.sys
sc start WdFilterDrv
\`\`\`

### User-Mode Communication

The driver communicates with user-mode applications via:

1. **Device I/O Control (IOCTL)** - Send commands using DeviceIoControl API
2. **Shared Memory** - High-bandwidth data transfer via memory-mapped sections

### Example IOCTL Communication

\`\`\`c
HANDLE hDevice = CreateFile(L"\\\\\\\\.\\\\WdFilterDrv", ...);

// Read process memory
READ_MEMORY_REQUEST req = { .pid = target_pid, .address = addr, .size = size };
DeviceIoControl(hDevice, CMD_READ_MEMORY, &req, sizeof(req), buffer, size, &bytesReturned, NULL);

CloseHandle(hDevice);
\`\`\`

### Unloading the Driver

\`\`\`cmd
sc stop WdFilterDrv
sc delete WdFilterDrv
\`\`\`

## Architecture

### Driver Entry Point

\`\`\`c
NTSTATUS DriverEntry(PDRIVER_OBJECT DriverObject, PUNICODE_STRING RegistryPath) {
    // Register dispatch routines
    DriverObject->MajorFunction[IRP_MJ_CREATE] = DriverCreate;
    DriverObject->MajorFunction[IRP_MJ_CLOSE] = DriverClose;
    DriverObject->MajorFunction[IRP_MJ_DEVICE_CONTROL] = DriverIOCTL;
    
    // Create device for user-mode communication
    IoCreateDevice(...);
    return STATUS_SUCCESS;
}
\`\`\`

### Communication Interface

**Device I/O Control (IOCTL)**
User-mode applications send commands to the driver:

\`\`\`
User Mode                    Kernel Mode
    |                              |
    |-- DeviceIoControl --------->|-- Dispatch routine
    |    (IOCTL code)            |-- Validate params
    |    (input buffer)          |-- Execute operation
    |<-- return status ----------|-- Return results
    |    (output buffer)
\`\`\`

**Shared Memory Section**
For high-bandwidth data transfer:

- Create section object with ZwCreateSection
- Map into both user and kernel address spaces
- Synchronize access with kernel events

## Key Features

### Manual Module Mapping

Load PE files without using the Windows loader:

1. **Allocate memory**: ZwAllocateVirtualMemory
2. **Map sections**: Copy headers and section data
3. **Process relocations**: Adjust addresses for new base
4. **Resolve imports**: Walk import table, load dependencies
5. **Set permissions**: Apply section characteristics
6. **Execute entry point**: Call DllMain for DLLs

\`\`\`c
NTSTATUS ManualMap(PVOID peBuffer, ULONG size, PMAP_CONTEXT ctx) {
    // Parse PE headers
    PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)peBuffer;
    PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)((PUCHAR)peBuffer + dos->e_lfanew);
    
    // Allocate memory at preferred or random base
    PVOID base = AllocateImageBase(nt->OptionalHeader.SizeOfImage);
    
    // Copy PE headers
    memcpy(base, peBuffer, nt->OptionalHeader.SizeOfHeaders);
    
    // Copy sections
    PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(nt);
    for (int i = 0; i < nt->FileHeader.NumberOfSections; i++) {
        PVOID dest = (PUCHAR)base + section[i].VirtualAddress;
        PVOID src = (PUCHAR)peBuffer + section[i].PointerToRawData;
        memcpy(dest, src, section[i].SizeOfRawData);
    }
    
    // Process relocations and imports...
    
    return STATUS_SUCCESS;
}
\`\`\`

### Process Memory Operations

Cross-process memory access using kernel APIs:

\`\`\`c
NTSTATUS ReadProcessMemory(HANDLE pid, PVOID address, PVOID buffer, SIZE_T size) {
    PEPROCESS process;
    PsLookupProcessByProcessId((HANDLE)pid, &process);
    
    KAPC_STATE apcState;
    KeStackAttachProcess(process, &apcState);
    
    // Now in target process context
    __try {
        memcpy(buffer, address, size);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        KeUnstackDetachProcess(&apcState);
        return STATUS_ACCESS_VIOLATION;
    }
    
    KeUnstackDetachProcess(&apcState);
    ObDereferenceObject(process);
    return STATUS_SUCCESS;
}
\`\`\`

### Synchronization

Kernel-level primitives for thread safety:

- **FastMutex**: Lightweight exclusion
- **ERESOURCE**: Shared/exclusive locking
- **Kernel Events**: Cross-process signaling
- **Spin Locks**: Interrupt-safe synchronization

## Debugging Techniques

### Kernel Debugging

Essential tools for driver development:

**WinDbg + Virtual Machine**
- Two-machine setup (host + VM target)
- Serial or network debugging connection
- Breakpoints in kernel code

**KDNET (Kernel Debug Network)**
Modern approach using network adapter:

\`\`\`
bcdedit /dbgsettings NET HOSTIP:192.168.1.10 PORT:50000
\`\`\`

**Local Kernel Debugging**
Limited but useful for inspection:

\`\`\`
bcdedit /debug on
// Use LiveKD or similar tools
\`\`\`

### Common Issues

**IRQL Issues**
- Code runs at wrong IRQL (Interrupt Request Level)
- Solution: Use proper locking, check IRQL assumptions

**Pool Corruption**
- Writing past allocated memory
- Solution: Driver Verifier with special pool

**Deadlocks**
- Holding locks while waiting for other resources
- Solution: Lock ordering, lock-free algorithms where possible

## Security Considerations

### Driver Signing

Windows requires driver signatures since Vista x64:

- **Test Mode**: Disable for development only
- **EV Certificate**: Extended Validation for production
- **WHQL**: Windows Hardware Quality Labs certification

### Attack Surface

Drivers are high-value targets:

- Validate all user input thoroughly
- Check buffer sizes and addresses
- Use ProbeForRead/Write for user buffers
- Never trust user-mode pointers

## What I Learned

Building a kernel driver taught me:
- Windows internals (object manager, memory manager, I/O system)
- x64 architecture details (paging, segments, system calls)
- Debugging techniques for Ring 0 code
- Security implications of kernel-level access
- The importance of defensive programming

Kernel development is challenging but deeply rewarding for understanding how operating systems truly work.`},{id:`cs2-extern`,title:`CS2 External: Kernel Memory Operations`,subtitle:`External process tool with custom kernel-mode driver and rendering library.`,date:`2024`,categories:[`closed`,`systems`,`reverse-engineering`],tags:[`kernel`,`rendering`,`c++`,`rust`],readTime:`11 min`,featured:!1,content:`## Overview

An external cheat for Counter-Strike 2 built as a separate process that reads game memory externally. The project explores two memory access paths: usermode (ReadProcessMemory) and kernel-mode (via a minimal driver). **This is a work-in-progress educational project focused on learning kernel driver development, DirectX programming, and game memory analysis.**

## Purpose

The primary goal was to learn:

- **Kernel driver architecture** — Building and debugging a minimal R/W driver from scratch, understanding the Windows Driver Model (WDM), driver entry points, IRQL considerations, and the kernel/user mode boundary

- **DirectX overlay rendering** — Creating a from-scratch rendering system that hooks into the game's graphics pipeline, understanding swapchain management, render targets, and the complexities of drawing over a DirectX 11 application

- **Game memory analysis** — Understanding modern game memory layouts, entity structures, offset patterns, and the challenges of reverse-engineering stripped binaries

- **IPC mechanisms** — Shared memory communication between kernel and user modes without using IOCTL (to facilitate manual mapping via tools like kdmapper)

- **Pattern scanning** — Runtime offset resolution in binaries without debug symbols, dealing with ASLR, and maintaining offset patterns across game updates

This is not a production-ready cheat but a learning exercise in systems programming, reverse engineering, and understanding the detection vectors used by modern anti-cheat systems.

## Building Process

### Phase 1: Usermode Foundation

The project began with the simplest possible external memory reading approach using standard Windows APIs. This phase focused on establishing the basic architecture without kernel complexity.

**Process Enumeration and Attachment**
The cheat needed to find the CS2 process and attach to it. This involved:
- Using CreateToolhelp32Snapshot to enumerate running processes
- Matching by process name and window class
- Opening the process with OpenProcess (PROCESS_VM_READ | PROCESS_VM_WRITE | PROCESS_QUERY_INFORMATION)
- Handling process restarts and re-attachment

**Pattern Scanning for Offsets**
Modern games have no debug symbols, and addresses change with each build due to ASLR. The solution was pattern scanning:
- Defining byte patterns (AoB signatures) that identify code regions
- Scanning module memory (client.dll, engine2.dll) for these patterns
- Extracting relative offsets from pattern matches
- Building an offset resolver that runs at initialization

This proved fragile—every CS2 update broke patterns, requiring manual updates to utilities/offsets/offsets.cpp. The patterns themselves were discovered through reverse engineering with tools like IDA Pro and x64dbg, comparing known structures across builds.

**Basic ESP Rendering**
The first visual feature was simple ESP (Extra Sensory Perception):
- Reading the entity list from game memory
- Extracting player positions, health, team information
- World-to-screen transformation using the view matrix
- Drawing 2D boxes over players

The rendering system initially used GDI (Windows graphics API), which was slow and obvious. This drove the decision to move to DirectX.

**Simple Aimbot**
The first combat feature was a basic aimbot:
- FOV-based target selection (finding closest enemy to crosshair within a field of view)
- Angle calculation (computing pitch/yaw to target)
- Mouse movement via SendInput or writing to game input structures
- Basic smoothing to reduce detection

This revealed the complexity of game input systems—many games sanitize input, making external mouse injection unreliable.

### Phase 2: Rendering System

The GDI renderer was replaced with zdraw, a custom overlay framework built from scratch.

**DirectX 11 Device Initialization**
The overlay needed to render over the CS2 window without modifying the game. The approach:
- Hooking the DirectX Present() or ResizeBuffers() functions
- Creating a separate DirectX device and swapchain
- Using the game's HWND to create a render target view
- Rendering overlay content each frame before the game's present

The hooking used a trampoline hook—overwriting the function's first bytes with a jump to the overlay code, then calling the original function. This required understanding the x64 calling convention and preserving registers.

**FreeType Integration**
Text rendering required a font library. FreeType was chosen:
- Integrating FreeType into the project via vcpkg
- Loading font files (mochi, pixel7, pretzel, weapons)
- Rasterizing glyphs to textures
- Building a glyph cache for performance
- Implementing text layout and wrapping

This was surprisingly complex—FreeType is a low-level library requiring significant boilerplate for basic text rendering.

**2D Geometry Utilities (poly2d)**
The overlay needed to draw various shapes:
- Lines, rectangles, circles
- Filled shapes with alpha blending
- Textured shapes
- Clipping regions

The poly2d library provided these utilities, built on top of DirectX primitives. Understanding blend states, rasterizer states, and depth testing was essential for correct rendering.

**Basic UI System**
The overlay needed a configuration interface:
- A simple menu system with checkboxes, sliders, and buttons
- Input handling (mouse clicks, keyboard navigation)
- Persistence (saving/loading settings to disk)

This was built from scratch rather than using ImGui, to understand the fundamentals of UI systems. Later iterations may integrate ImGui for a more polished interface.

### Phase 3: Kernel Driver (In Progress)

The usermode approach, while functional, is easily detected by anti-cheat systems that monitor OpenProcess calls and ReadProcessMemory usage. The kernel driver provides a stealthier memory access path.

**CS2ExternDrv Architecture**
The driver was designed to be minimal and focused:
- A single IOCTL handler (initially) for communication
- Memory read/write operations on target processes
- Process base address resolution
- PID whitelisting (write-once to prevent anti-cheat manipulation)
- Driver unlinking from PsLoadedModuleList to hide from enumeration

**Shared Memory IPC**
To facilitate manual mapping via kdmapper (which requires drivers with no IOCTL interface for some anti-cheat bypass techniques), the communication was redesigned to use shared memory:
- A named shared section (GlobalCS2ExternShared)
- A simple command/response protocol
- 4KB read/write limits per request
- No IOCTL interface (pure shared memory)

This approach is stealthier but more complex—synchronization and error handling must be carefully implemented.

**Driver Entry and Unload**
The driver follows standard Windows driver patterns:
- DriverEntry initializes the driver, creates the device object, and sets up the shared section
- DriverUnload cleans up resources and deletes the device object
- IRP_MJ_CREATE and IRP_MJ_CLOSE handle user-mode connections
- IRP_MJ_DEVICE_CONTROL handles IOCTL commands (when used)

Understanding IRQL (Interrupt Request Level) was critical—certain operations (like accessing user memory) can only be done at PASSIVE_LEVEL.

**Memory Read/Write Implementation**
The core functionality:
- Using MmCopyVirtualMemory to read/write process memory
- Validating target addresses (ensuring they're in user space)
- Handling partial reads/writes (when the requested size crosses page boundaries)
- Rate limiting to avoid detection patterns

The 4KB limit per request was chosen to balance performance and stealth—smaller reads are less likely to trigger heuristics.

**Process Base Resolution**
Finding the base address of the target process:
- Using PsLookupProcessByProcessId to get the EPROCESS structure
- Walking the PEB (Process Environment Block) to find module bases
- Alternatively, using MmGetVirtualForPhysical (if physical address is known)

This proved challenging due to Windows kernel structure changes across versions.

**Current Status**
The driver compiles and can be loaded via kdmapper. The shared memory section is accessible from user mode. However, full integration with the usermode cheat is incomplete. The memory backend in utilities/memory/memory.cpp needs to be extended to delegate reads/writes to the driver when connected, falling back to ReadProcessMemory when the driver is unavailable.

### Phase 4: Advanced Features (Planned)

Several features were planned but not yet implemented:

**BVH Spatial System**
Bounding Volume Hierarchy for optimized entity processing:
- Building a spatial index of all entities each frame
- Fast culling of entities outside the view frustum
- Accelerated ray casting for visibility checks
- Reduced CPU usage for ESP rendering

This was partially designed but not implemented—the current system does a linear scan of all entities, which is acceptable for the current scale but would not scale to larger scenarios.

**Manual PE Mapper**
A kernel-mode manual PE mapper for stealth module loading:
- Reading DLL files from disk
- Allocating memory in the target process
- Mapping PE sections to their correct virtual addresses
- Processing base relocations
- Resolving imports (limited in kernel mode)
- Calling DllMain in the target process context

This was implemented in a separate project (ManualMapDrv) but not integrated into CS2-Extern. The complexity of user-mode import resolution from kernel mode remains a challenge.

**Anti-Detection Techniques**
More sophisticated stealth features:
- Timing randomization to avoid predictable patterns
- Memory footprint reduction
- Signature obfuscation
- Hypervisor integration (using ArkVisor for protection)

These were explored conceptually but not implemented due to the project's educational focus.

## Usage

### Usermode Mode (Default)

The simplest way to run the cheat:

1. **Build with Visual Studio 2022**
   - Open the solution/project
   - Select Release | x64
   - Build the project

2. **Install dependencies**
   - Install FreeType via vcpkg: \`vcpkg install freetype:x64-windows\`
   - Run \`vcpkg integrate install\` to integrate with Visual Studio

3. **Run the cheat**
   - Run CS2-Extern.exe as Administrator
   - The cheat will wait for CS2 to start if it's not running
   - Press INSERT to open the menu (it's closed by default)
   - Features only work when in a match (not the main menu)

4. **Troubleshooting**
   - Set CS2 to borderless windowed (fullscreen exclusive prevents overlay rendering)
   - Press INSERT to open the menu
   - Be in a match (ESP requires a local player)
   - If "failed to find offsets" appears, CS2 was updated—patterns need updating
   - If "DirectX 11 setup failed" appears, try running on a physical display (RDP/VM issues)

### Kernel Mode (Experimental)

Using the kernel driver for stealthier memory access:

1. **Build and load the driver**
   - Build CS2ExternDrv (see DriverItems/CS2ExternDrv/README.md)
   - Load the driver via kdmapper or similar tool
   - Ensure the driver loads without errors

2. **Verify driver connection**
   - Run CS2-Extern.exe with \`--driver-test\` or \`-d\` flag
   - "driver connected." indicates success
   - "driver not found." means the driver isn't loaded or the section name is wrong

3. **Configure memory backend**
   - The cheat's memory system needs to be extended to use the driver
   - Currently, this integration is incomplete
   - The driver loads and the shared section is accessible, but reads/writes don't yet delegate to it

**Note:** Kernel mode integration is incomplete. The driver loads and the shared memory section is accessible, but the cheat's memory system doesn't yet fully delegate reads/writes to it. This is a known limitation of the current implementation.

## Technical Architecture

### Memory Backend Options

The cheat supports two memory access paths:

\`\`\`
User Mode Process          Kernel Driver              Target Process
    |                             |                           |
    |-- ReadProcessMemory ----->|                           |---> Read
    |                             |                           |
    |-- Shared Mem ------------->|-- Read/Write Memory ----->|
    |<<-- Data -------------------|<<-- Results ---------------|
\`\`\`

**Usermode Path**
- Uses OpenProcess to get a handle to CS2
- Uses ReadProcessMemory/WriteProcessMemory for memory access
- No driver required
- Easily detected by anti-cheat (monitors these API calls)

**Kernel Path**
- Driver runs in kernel mode with unrestricted memory access
- User mode communicates via shared memory
- No IOCTL (designed for manual mapping)
- Harder to detect (no usermode API calls to monitor)

### Rendering Pipeline

The overlay rendering happens each frame:

1. **Hook Setup**
   - Find the IDXGISwapChain pointer
   - Hook Present() or ResizeBuffers()
   - Create a trampoline to call the original function

2. **Device Initialization**
   - Create a DirectX 11 device
   - Create a render target view using the game's HWND
   - Initialize blend states, rasterizer states, and depth stencil states

3. **Frame Rendering**
   - Each frame, before calling the original Present():
     - Begin frame (clear render target)
     - Render ESP (boxes, skeleton, text)
     - Render UI (menu, configuration)
     - End frame (present)

4. **Cleanup**
   - On detach, release all DirectX resources
   - Unhook the Present() function
   - Restore original bytes

This approach ensures the overlay renders on top of the game without modifying the game's rendering code.

### Current Limitations

The project has several known limitations:

**Offset Maintenance**
- Offset patterns break after every CS2 update
- No automatic offset updating system
- Manual maintenance required in utilities/offsets/offsets.cpp
- This is the most fragile part of the system

**Kernel Integration**
- Driver loads but memory backend doesn't fully use it
- Shared memory IPC is implemented but not integrated
- Fallback to usermode not automatic
- Requires manual code changes to switch between backends

**Anti-Detection**
- Limited anti-detection measures
- No timing randomization
- No memory footprint reduction
- No signature obfuscation
- Would be detected by sophisticated anti-cheat

**Platform Support**
- DirectX 11 only (no DX12 support)
- Windows only (no Linux/macOS support)
- x64 only (no x86 support)

**Feature Gaps**
- BVH spatial system not implemented
- Manual PE mapper not integrated
- Advanced anti-detection not implemented
- Hypervisor integration not implemented

## What I Learned

**Kernel Driver Development**
- Writing, building, loading, and debugging Windows drivers
- Understanding the Windows Driver Model (WDM)
- IRQL considerations and what operations are allowed at each level
- Driver entry points, device objects, and IRP handling
- Driver signing and manual mapping techniques
- The kernel/user mode boundary and why it exists

**DirectX Graphics Programming**
- DirectX 11 device and swapchain management
- Render target views and resource views
- Blend states, rasterizer states, and depth testing
- Hooking DirectX functions (Present, ResizeBuffers)
- The complexity of overlay rendering (getting it to draw over the game)
- Understanding the graphics pipeline from a practical perspective

**Pattern Scanning and Offset Resolution**
- Designing robust AoB (Array of Bytes) signatures
- Scanning memory for patterns efficiently
- Dealing with ASLR (Address Space Layout Randomization)
- Extracting relative offsets from pattern matches
- Maintaining patterns across game updates
- The fragility of pattern-based approaches

**Shared Memory IPC**
- Creating named shared sections
- Synchronizing access between kernel and user mode
- Designing simple command/response protocols
- Handling partial reads/writes and error conditions
- Understanding why shared memory is stealthier than IOCTL

**Manual Mapping**
- The PE file format (headers, sections, relocations, imports)
- How the Windows loader works
- Replicating loader behavior without calling loader APIs
- Base relocations and address adjustment
- Import resolution challenges from kernel mode
- DllMain execution and thread context issues

**Game Reverse Engineering**
- Understanding entity lists and game state structures
- World-to-screen transformations and view matrices
- Bone structures and skeleton rendering
- Hitbox detection and visibility checks
- The challenges of reverse-engineering stripped binaries
- How anti-cheat systems detect cheats

**Systems Programming**
- Windows API usage (process enumeration, memory access)
- Low-level memory manipulation
- Understanding virtual memory and address translation
- Thread synchronization and race conditions
- Error handling in complex systems

## Status

**Work-in-progress.** The usermode cheat is functional with basic ESP and aimbot features. The kernel driver compiles and can be loaded, but full integration remains incomplete. Many planned features (BVH, manual PE mapper, advanced anti-detection) are not yet implemented.

The project achieved its educational goals—I learned kernel driver development, DirectX programming, and game reverse engineering. However, it is not a complete or production-ready tool. It serves as a foundation for further learning and experimentation in systems programming and security research.

The most valuable outcome was understanding the complexity of building stealthy software that operates in hostile environments (anti-cheat protected games). The detection vectors are numerous and sophisticated, and true stealth requires deep knowledge of both the target application and the protection systems.`},{id:`gif-engine`,title:`Gif-Engine: Desktop Animation Manager`,subtitle:`Process-isolated GIF rendering with per-pixel transparency on Windows.`,date:`2024`,categories:[`tools`,`systems`],tags:[`rust`,`windows`,`gui`,`multimedia`],readTime:`8 min`,featured:!1,content:`## Overview

A desktop GIF animation manager for Windows, built because existing tools had performance problems. Each GIF runs in its own isolated process.

## Architecture

### Process Isolation

\`\`\`
Main Process (Manager)
    ├── Child Process 1 (GIF 1)
    ├── Child Process 2 (GIF 2)
    └── Child Process N (GIF N)
\`\`\`

Each child process:
- Renders one GIF via GDI+ or Direct2D
- Communicates via named pipes
- Can crash without affecting others

### Transparency Implementation

Uses \`WS_EX_LAYERED\` windows with \`UpdateLayeredWindow\`:

\`\`\`rust
UpdateLayeredWindow(
    hwnd,
    None,
    Some(&ptPos),
    Some(&size),
    hdc_mem,
    Some(&pt_src),
    0,  // No color key
    Some(&blend),  // Per-pixel alpha
    ULW_ALPHA,
);
\`\`\`

### GUI Framework

Built with egui (immediate mode):
- File browser for GIF selection
- Position/size controls
- Playback speed adjustment
- System tray integration

## Features

- Drag-and-drop GIF files
- Click-through when not interacting
- Persistent configuration
- Auto-start with Windows
- Low CPU/memory usage

## What I Learned

- Windows layered window API
- Process spawning and management in Rust
- IPC with named pipes
- GDI+ image decoding
- System tray implementation`},{id:`server-shenanigans`,title:`ServerShenanigans: Custom File Transfer Protocol`,subtitle:`Client-server file sharing with resume support, zlib compression, and SHA-256 integrity checks.`,date:`2024`,categories:[`tools`,`fullstack`],tags:[`cpp`,`networking`,`zlib`,`sha256`,`winsock2`],readTime:`10 min`,featured:!1,content:`## Overview

ServerShenanigans is a client-server file sharing system built from scratch. It features resume support for interrupted transfers, zlib compression for bandwidth efficiency, and SHA-256 integrity verification to ensure data correctness.

## Architecture

### Multi-Client Support

The server handles up to 50 concurrent connections using a simple thread-per-client model:

\`\`\`
Server (Main Thread)
    ├── Client Thread 1 (File Transfer)
    ├── Client Thread 2 (File Transfer)
    └── Client Thread N (File Transfer)
\`\`\`

Each client connection runs in its own thread, keeping the implementation straightforward while maintaining acceptable performance for the target use case.

### Memory Efficiency

Stack-allocated 64KB buffers keep heap usage low:

\`\`\`cpp
char buffer[65536];  // Stack allocation, no malloc overhead
\`\`\`

This design choice eliminates heap fragmentation concerns and simplifies memory management in a multi-threaded environment.

## Transfer Protocol

### Modes

**RAW Mode**
- Direct byte-for-byte transfer
- No processing overhead
- Best for already-compressed files

**COMPRESSED Mode**
- zlib compression on-the-fly
- Significant bandwidth savings for text/log files
- Compression level configurable per-file

### Resume Capability

Offset-based resume allows interrupted transfers to continue:

1. Client requests file with starting offset
2. Server seeks to position in file
3. Transfer continues from last known good position
4. SHA-256 hash verified on completion

## Integrity Verification

SHA-256 hashes ensure file integrity end-to-end:

- Client computes hash after receiving file
- Compares against server-provided hash
- Retry triggered on mismatch

## Technical Highlights

### Winsock2 Implementation

Direct Windows socket API usage without abstraction layers:

\`\`\`cpp
WSADATA wsaData;
WSAStartup(MAKEWORD(2, 2), &wsaData);

SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr));
listen(serverSocket, SOMAXCONN);
\`\`\`

### Compression Pipeline

zlib integration for real-time compression:

\`\`\`cpp
z_stream strm;
deflateInit(&strm, Z_DEFAULT_COMPRESSION);

// Compress buffer
strm.next_in = (Bytef*)inputBuffer;
strm.avail_in = bytesRead;
strm.next_out = (Bytef*)outputBuffer;
strm.avail_out = bufferSize;

deflate(&strm, Z_SYNC_FLUSH);
\`\`\`

### Progress Tracking

Real-time transfer progress visible on client side:

- Bytes transferred / total size
- Current transfer rate (KB/s)
- Estimated time remaining
- Compression ratio (when applicable)

## What I Learned

Building this protocol taught me about:
- TCP socket programming fundamentals
- Thread synchronization in C++
- Stream compression with zlib
- Cryptographic hashing for integrity
- Network protocol design tradeoffs

The project reinforced that simple designs often outperform complex ones for focused use cases.`},{id:`fbla-spotlocal`,title:`SpotLocal: Offline-First Local Business Discovery`,subtitle:`Building a zero-infrastructure PWA for local business discovery with service worker caching, fuzzy search, and voice accessibility.`,date:`2025`,categories:[`fullstack`,`pwa`,`accessibility`,`closed`],tags:[`react`,`pwa`,`service-worker`,`leaflet`,`web-speech-api`,`fuzzy-search`,`accessibility`],readTime:`12 min`,featured:!1,content:`## The Problem with Existing Local Discovery Tools

Most local business discovery tools share a fundamental constraint: they require constant internet connectivity and expensive backend infrastructure. Google Maps, Yelp, and similar services are powerful, but they fail completely when you're in an area with poor cellular coverage or when you're trying to minimize data usage. For students in rural areas, travelers in remote locations, or anyone on a tight data budget, these tools are effectively unavailable.

SpotLocal started with a different premise: what if we could provide a fully functional local business discovery experience that works completely offline, requires zero backend costs, and still delivers a modern, accessible user experience? This writeup documents the architectural decisions, tradeoffs, and implementation patterns that emerged from building such a system for the FBLA Coding & Programming competition.

## The Offline-First Architecture

The central insight guiding SpotLocal's design is that offline capability is not a feature to be added later—it must be the foundation. Every architectural decision flows from this constraint: data must be local, searches must run client-side, and the application must gracefully handle network transitions.

**Service Worker Caching** handles the application shell. The entire React bundle, CSS, and static assets are cached on first load. This means the application loads instantly on subsequent visits, even without network access. The service worker implements a cache-first strategy for static assets and a network-first strategy for dynamic data, with intelligent fallback patterns.

**LocalStorage for User Data** provides persistent state across sessions. User preferences, search history, and favorited businesses live entirely in the browser. This means users can build their own local business database over time, and that data persists even if they clear their browser cache (as long as they don't clear localStorage specifically).

**Zero Backend Requirement** eliminates infrastructure costs entirely. There's no database to maintain, no API servers to deploy, no authentication system to secure. The entire application is static files that can be hosted on GitHub Pages, Netlify, or any static hosting service for free. This is critical for student projects with zero budget.

The tradeoff is that we cannot provide real-time data like current business hours or live reviews. We accept this limitation because our target use case—discovering businesses in your area—doesn't require real-time data. Business locations, categories, and basic information change slowly enough that periodic manual updates are acceptable.

## The Data Model: JSON as Database

Without a backend, we need a data model that is simple to version, easy to edit manually, and fast to parse client-side. We chose a flat JSON file structure indexed by business ID.

Each business entity contains: name, address, coordinates (lat/lng for Leaflet), category, rating, description, and contact information. The JSON is loaded once on application startup and parsed into a JavaScript array. All search operations run against this in-memory array, which is fast enough for thousands of businesses.

The key design decision is to store coordinates directly in the JSON rather than geocoding addresses at runtime. Geocoding requires API calls to services like Google Maps, which breaks our offline constraint. By pre-computing coordinates during data entry, we ensure that location-based features work completely offline.

This approach has a maintenance cost: adding new businesses requires manual coordinate lookup. However, this is acceptable because:
1. Business data changes infrequently
2. The dataset is curated manually anyway
3. Coordinate lookup can be done once during online time, then used offline forever

## Fuzzy Search with Levenshtein Distance

Search is the core feature of a business discovery tool. Users type "coffee" and expect to find cafes, coffee shops, and bakeries that serve coffee. They type "resteraunt" (misspelled) and still expect results. They type "food near me" and expect location-based filtering.

SpotLocal implements fuzzy search using Levenshtein distance, which measures the minimum number of single-character edits required to transform one string into another. When a user searches for "coffee", we compute the Levenshtein distance between the query and every business name, description, and category. Businesses with distance below a threshold (typically 2-3 characters) are included in results.

The algorithm is:
1. Normalize both query and target strings (lowercase, trim whitespace)
2. Compute Levenshtein distance using dynamic programming
3. Normalize distance by dividing by query length (so shorter queries are more permissive)
4. Apply threshold filter
5. Sort results by distance (closest matches first)

This runs in O(n*m) time where n is the query length and m is the target string length. For a dataset of a few thousand businesses, this is fast enough to run in real-time on every keystroke. We debounce input to 150ms to avoid unnecessary recalculations while typing.

**Category filtering** is layered on top of fuzzy search. Users can select a category (Restaurants, Retail, Services, etc.) to narrow results. This is a simple array filter operation that runs before the fuzzy search, reducing the search space and improving performance.

**Rating-based sorting** provides a secondary sort key after fuzzy match distance. Within the same distance tier, businesses with higher ratings appear first. This gives users the best matches at the top, then the highest-rated options among those matches.

## Interactive Maps with Leaflet

A business discovery tool needs maps. Users want to see where businesses are located relative to their current position, get walking directions, and visualize clusters of options.

SpotLocal uses Leaflet.js, a lightweight open-source mapping library. Leaflet is ideal for our use case because:
1. It has no API key requirement (unlike Google Maps)
2. It works with OpenStreetMap tiles, which are free
3. It's lightweight (~40KB gzipped)
4. It has excellent mobile support

The map component integrates with React using react-leaflet, which provides React wrappers for Leaflet components. We render a map centered on the user's location (if available) or a default location, then add custom markers for each business in the current search results.

**Custom markers** use Leaflet's DivIcon to render styled HTML instead of images. This allows us to color-code markers by category (red for restaurants, blue for retail, green for services) and add business ratings directly on the marker. Clicking a marker opens a popup with the business name, rating, and a link to the detail view.

**Location-based search** uses the browser's Geolocation API to get the user's current position. We then calculate the distance from the user to each business using the Haversine formula (great-circle distance on a sphere). Results can be sorted by distance, and the map automatically centers on the user's location.

The map is fully interactive: users can pan, zoom, and click markers. All map tiles are cached by the service worker, so the map works offline once loaded. This is critical—users can discover businesses even when they have no data connection, using cached map tiles.

## Voice Interface with Web Speech API

Accessibility is a core requirement for modern web applications, and voice interfaces are increasingly important for users with motor impairments or visual limitations. SpotLocal integrates the Web Speech API for both voice input (speech recognition) and voice output (speech synthesis).

**Voice input** uses the SpeechRecognition interface (with webkitSpeechRecognition prefix for Safari). Users click a microphone button and speak a search query like "find coffee shops near me." The browser transcribes the speech to text, which then feeds into our fuzzy search pipeline.

The implementation handles several edge cases:
- Browser compatibility checks (not all browsers support SpeechRecognition)
- Permission handling (users must grant microphone access)
- Error recovery (network errors, no speech detected, etc.)
- Continuous vs. one-shot recognition modes

**Voice output** uses the SpeechSynthesis interface to read search results aloud. Users can navigate results with keyboard shortcuts and have each business name, category, and rating spoken. This is particularly useful for visually impaired users who cannot easily read the map or list views.

The voice interface follows WCAG 2.1 AA guidelines:
- All voice features are keyboard-accessible
- Visual feedback indicates when the microphone is active
- Users can adjust speech rate and volume
- Voice features can be disabled entirely

The tradeoff is that voice recognition requires an internet connection in most browsers (the speech recognition happens server-side). However, this is acceptable because voice is an optional enhancement—the core functionality works completely offline.

## Progressive Web App Features

SpotLocal is a Progressive Web App (PWA), which means it can be installed on devices and work like a native application. This is achieved through three components: a web app manifest, a service worker, and HTTPS hosting.

**Web App Manifest** (manifest.json) declares application metadata: name, short name, icons, theme colors, and display mode. This allows users to "install" SpotLocal from their browser, adding it to their home screen with a custom icon. When launched from the home screen, the app runs in standalone mode without browser chrome, feeling like a native application.

**Service Worker** (sw.js) handles caching and offline functionality. We use Workbox, a library from Google that simplifies service worker development. Workbox provides:
- Precaching of static assets (the app shell)
- Runtime caching for dynamic content
- Cache expiration and cleanup
- Offline fallback pages

The service worker follows a cache-first strategy for static assets: check the cache first, fall back to the network if the asset isn't cached. This ensures the app loads instantly on repeat visits. For the business data JSON, we use a network-first strategy with cache fallback: always try to fetch the latest data, but use cached data if the network is unavailable.

**HTTPS Requirement** is enforced by browsers for service workers. This is a deployment constraint, but one that's easily satisfied with free hosting options like GitHub Pages or Netlify, which provide HTTPS automatically.

## Accessibility-First Design

SpotLocal is designed with accessibility as a primary consideration, not an afterthought. This is both a competition requirement and a moral imperative—business discovery tools should be usable by everyone.

**Semantic HTML** provides the foundation. We use proper heading hierarchy (h1 for the page title, h2 for section titles), landmark regions (main, nav, aside), and ARIA labels where semantic HTML is insufficient. Screen readers can navigate the application effectively using these landmarks.

**Keyboard Navigation** is fully supported. All interactive elements are focusable and operable via keyboard. Users can tab through search results, enter to select, and use arrow keys to navigate the map. Focus indicators are clearly visible with custom CSS focus rings.

**Color Contrast** meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text). We avoid color as the only indicator of state—buttons have both color changes and icon/state text. Map markers use both color and icons to distinguish categories.

**Screen Reader Support** includes ARIA live regions for search results (so screen readers announce when results update), proper labels for form inputs, and descriptive alt text for images. The voice interface provides an alternative input method for users who cannot use a keyboard effectively.

**Responsive Design** ensures the application works on all screen sizes. We use Tailwind CSS's responsive utilities to adjust layouts for mobile, tablet, and desktop. The map and list views stack vertically on mobile and side-by-side on desktop.

## State Management with React Hooks

SpotLocal uses React 18 with functional components and hooks for state management. We avoided Redux or other external state management libraries because the application state is simple enough to be managed with React's built-in hooks.

**useState** manages local component state: search query, selected category, map center coordinates, and modal visibility. Each piece of state lives in the component that needs it, with props passing data down to child components.

**useEffect** handles side effects: loading business data on mount, requesting geolocation permission, and initializing the map. The effect for business data runs once on mount, while the geolocation effect runs only when the user explicitly requests location access.

**useMemo** and **useCallback** optimize performance. The filtered and sorted business list is memoized to avoid recalculating on every render. Event handlers are memoized to prevent child component re-renders when the parent re-renders.

**Custom hooks** encapsulate reusable logic. useBusinessData handles loading and parsing the JSON file. useGeolocation handles the browser's geolocation API with error handling. useVoiceRecognition wraps the Web Speech API with browser compatibility checks.

This approach keeps the codebase simple and maintainable. The tradeoff is that complex state transitions require careful prop drilling, but for an application of this size, that's acceptable.

## Competition Strategy and Results

Building for FBLA requires balancing technical excellence with competition constraints: strict time limits, judging criteria, and the need to impress judges who may not be technical experts.

**The Pitch** focused on the offline-first value proposition. Most student projects require backend infrastructure, which is impressive but expensive. SpotLocal's zero-infrastructure approach demonstrated creativity and practical problem-solving. We emphasized the rural connectivity problem and how our solution addresses it.

**The Demo** highlighted the PWA installation process (showing it running as a "native" app), the voice interface (demonstrating accessibility), and offline functionality (disconnecting from the network and showing the app still working). These visual demonstrations were more impactful than explaining the code.

**The Technical Writeup** (the competition submission, not this document) explained the architecture, justified technology choices, and discussed tradeoffs. Judges appreciated that we could articulate why we chose specific technologies rather than just listing them.

**Results** validated the approach:
- 1st Place: District competition
- 1st Place: State competition
- Qualified for Nationals

The feedback from judges consistently mentioned the offline-first architecture and accessibility features as standout elements.

## Lessons Learned

**PWA Development Patterns** are more complex than they appear. Service worker debugging is difficult because the service worker runs in a separate thread with its own lifecycle. We learned to use chrome://serviceworker-internals for debugging and to implement service worker update strategies carefully to avoid caching stale versions.

**Accessibility Standards (WCAG)** require intentional design. You cannot add accessibility at the end—it must inform every design decision from the start. We learned to test with screen readers (NVDA on Windows, VoiceOver on macOS) early and often, not just before submission.

**Voice Interface Design** is about more than speech recognition. You need to handle errors gracefully, provide visual feedback, and design conversation flows that feel natural. We learned that voice should be an enhancement, not the primary interaction—users should always have a fallback to touch/keyboard.

**Client-Side Search Algorithms** can be surprisingly powerful. Levenshtein distance is simple but effective for fuzzy matching. We learned that algorithm optimization matters less than algorithm choice for small datasets—a straightforward O(n*m) implementation is fast enough for thousands of items.

**Competition Preparation** requires storytelling. Technical excellence is necessary but not sufficient. You need a compelling narrative: the problem you're solving, why it matters, and how your solution addresses it uniquely. We learned to frame technical decisions in terms of user benefits.

## Future Directions

SpotLocal is complete as a competition project, but the architecture suggests several enhancement paths:

**Community Data Contribution** could allow users to submit new businesses for inclusion in the dataset. This would require a backend for submission collection, but the core app would remain offline-first. A periodic data update would sync new businesses to all users.

**Advanced Offline Features** could include route caching (pre-fetching map tiles for a planned route), predictive caching (caching businesses near frequently-visited locations), and offline user reviews (synced when connectivity returns).

**Multi-Platform Support** could extend the PWA to a true mobile app using React Native or Capacitor. The same React components could be reused with platform-specific map and voice implementations.

**Collaborative Filtering** could provide personalized recommendations based on user behavior, all computed client-side to preserve the offline-first architecture. This would require more sophisticated data structures but is technically feasible.

The core insight remains: offline-first is not a constraint—it's a design philosophy that produces better, more resilient applications. By embracing this philosophy from the start, SpotLocal delivers a modern, accessible experience without the complexity and cost of traditional web applications.`},{id:`snowflake-analytics`,title:`Yelp Analytics: Snowflake Data Warehouse`,subtitle:`Cloud data pipeline analyzing restaurant reviews.`,date:`2025`,categories:[`data`,`closed`],tags:[`snowflake`,`sql`,`python`,`analytics`],readTime:`7 min`,featured:!1,content:`## Overview

Cloud data warehouse pipeline analyzing Yelp restaurant reviews using Snowflake. Multi-phase SQL architecture with sentiment analysis.

## Architecture

### Data Pipeline
\`\`\`
Raw Data (CSV) → Staging Tables → Cleaned Data → Analytics Views
\`\`\`

### Key Features
- Sentiment analysis with SQL
- Competitor analysis queries
- Geographic proximity search
- Review clustering

## Technical Details

### Snowflake Features Used
- Semi-structured data (VARIANT)
- User-defined functions (UDFs)
- Stored procedures
- Time travel
- Zero-copy cloning

### Python Integration
\`\`\`python
import snowflake.connector

ctx = snowflake.connector.connect(
    user=USER,
    password=PASSWORD,
    account=ACCOUNT
)

# Execute queries
cs = ctx.cursor()
cs.execute("SELECT * FROM analytics.top_rated_restaurants")
\`\`\`

## What I Learned

- Cloud data warehouse concepts
- SQL optimization at scale
- ETL pipeline design
- Python/Snowflake integration
- Production data analysis`},{id:`rune-editor`,title:`Rune Editor: Memory Manipulation Tool`,subtitle:`Process memory editor with React frontend and C++ backend.`,date:`2024`,categories:[`tools`,`reverse-engineering`,`closed`],tags:[`memory`,`react`,`cpp`,`reverse-engineering`],readTime:`6 min`,featured:!1,content:`## Overview

Elden Ring rune editor with React frontend and C++ backend for process memory access.

## Architecture

### Frontend
- React 18 with Vite
- Real-time value display
- Scan and edit interface

### Backend
- cpp-httplib for HTTP server
- Win32 API for memory operations
- Pattern scanning for pointers

### Communication
\`\`\`
Frontend (React) ← HTTP/JSON → Backend (C++) ← ReadProcessMemory → Game Process
\`\`\`

## Features

- Dynamic address scanning
- Pointer chain resolution
- Value editing with undo
- Process attach/detach

## What I Learned

- Win32 memory API
- HTTP server in C++
- React/Vite integration
- Process debugging techniques`},{id:`hd2-cheats`,title:`Helldivers 2: Game Modification Framework`,subtitle:`DLL injection, DirectX overlay, GameGuard bypass, and reverse-engineered game modification system.`,date:`2024`,categories:[`systems`,`reverse-engineering`,`security`,`closed`],tags:[`dll-injection`,`directx`,`rust`,`cpp`,`anti-cheat-bypass`],readTime:`20 min`,featured:!1,content:`## Overview

A comprehensive game modification framework for Helldivers 2 that reverse-engineers the game's memory structures, bypasses GameGuard anti-cheat protection, and provides an extensible DLL injection system with DirectX overlay rendering. The project combines C++ system-level programming, pattern scanning, trampoline hooking, and Lua scripting to create a full-featured cheat framework.

## Architecture

The system consists of four interconnected components:

1. **Anti-Cheat Bypass Tool (C++)** - External process that neutralizes GameGuard before injection
2. **Injected DLL** - In-process modification framework with pattern scanner and hook engine
3. **DirectX Overlay** - ImGui-based UI rendering via vtable hooks
4. **Cheat Engine Integration** - Lua scripts and .CT table parsers for external tooling

## Anti-Cheat Bypass: GameGuard Neutralization

### Challenge
Helldivers 2 uses nProtect GameGuard, a kernel-mode anti-cheat that monitors process memory, detects DLL injections, and terminates suspicious processes. Standard injection methods are immediately detected.

### Solution: Multi-Stage Bypass

**Stage 1: MOTW Stripping**
Windows attaches Mark of the Web (MOTW) flags to downloaded files, triggering security restrictions. The bypass strips these Alternate Data Streams:

\`\`\`cpp
void StripMotw(const std::wstring& filePath) {
    std::wstring adsPath = filePath + L":Zone.Identifier";
    DeleteFileW(adsPath.c_str()); // Remove the ADS entirely
}
\`\`\`

**Stage 2: Pattern-Based Memory Patching**
GameGuard performs integrity checks at specific code locations. The tool uses AOB (Array of Bytes) scanning to locate these checks and patches them to return success:

\`\`\`cpp
// Pattern: "48 83 EC 28 8D 81 17 ? ? ? 83"
// Patch: Replace with "mov eax, 1; ret" to force success
static const uint8_t kBypass1[] = { 0xB8,0x01,0x00,0x00,0x00,0xC3,0xCC,0xCC,0xCC,0xCC };
\`\`\`

Eight distinct bypass patterns target different GameGuard verification routines, each returning a hardcoded success value (0x755 = 1877) or forcing a boolean true.

**Stage 3: Process Termination**
After patching memory, the tool forcibly terminates GameGuard's monitor processes:

\`\`\`lua
os.execute('taskkill /F /IM "GameMon.des" & taskkill /F /IM "GameMon64.des"')
\`\`\`

**Stage 4: Engine Log Disabling**
The game's logging subsystem can detect modifications. A final patch disables the logging function by replacing its prologue with a single RET instruction.

## Injected DLL: Reverse-Engineered Infrastructure

### Pattern Scanner: Boyer-Moore-Horspool Implementation

The original DLL was decompiled using Ghidra, revealing a sophisticated pattern scanner at \`FUN_1801eff70\`. The rebuilt implementation replicates this algorithm:

\`\`\`cpp
class PatternScanner {
    // Supports wildcards with "??" syntax
    // Pattern: "48 8B 05 ?? ?? ?? ?? 48 85 C0"
    // Scans 256KB chunks to balance memory usage and performance
    uintptr_t Find(const Pattern& pattern) const;
};
\`\`\`

The scanner operates in two modes: in-process (direct memory access) and external (ReadProcessMemory), making it usable both from the injected DLL and external tools.

### Hook Engine: Trampoline Generation

Rebuilt from \`FUN_1801f1ac0\`, the hook engine installs 5-byte E9 relative jumps:

\`\`\`cpp
// Allocate trampoline within ±128MB of target for rel32 compatibility
void* trampoline = AllocExecNear(target);
memcpy(trampoline, originalBytes, 5);
*(uint8_t*)trampoline = 0xE9; // JMP rel32
*(int32_t*)(trampoline + 1) = (int32_t)(target - trampoline - 5);
\`\`\`

This preserves original instructions in the trampoline for clean removal and proper execution flow.

### DirectX Vtable Hooking

To render an overlay, the DLL hooks DirectX functions without modifying the game's rendering code:

**DX11 Targets:**
- \`IDXGISwapChain::Present\` [vtable offset 8]
- \`IDXGISwapChain::ResizeBuffers\` [13]
- \`ID3D11DeviceContext::DrawIndexed\` [44]

**DX12 Targets:**
- \`IDXGISwapChain::Present\` [8], \`ResizeBuffers\` [13], \`Present1\` [22]
- \`ID3D12CommandQueue::ExecuteCommandLists\` [10]

**Input Hooks:**
- \`SetCursorPos\`, \`ClipCursor\`, \`SetCursor\`, \`mouse_event\`, \`SendInput\`

The hook creation process is clever: it spawns a hidden dummy window, creates a throwaway DirectX device to read vtable pointers, then hooks those pointers. This avoids needing to locate the game's actual device initially.

## Feature System: Modular Memory Patching

The DLL organizes 50+ game modifications into six categories:

### Combat (ammo, health, recoil, etc.)
\`\`\`cpp
bool Combat_Build(PatchManager& pm, const std::string& key, std::vector<<AppliedPatch>& out) {
    if (key == "inf_ammo") {
        // Pattern scan for ammo decrement check
        static const PatchSpec specs[] = {
            SIMPLE("48 8B 81 ?? ?? ?? ?? 85 C0 74 ??", 9, 0xEB), // Change JZ to JMP
        };
        return SimplePatches(pm, specs, 1, out);
    }
    // ... 20+ combat features
}
\`\`\`

### Movement (ragdoll, speed, hoverpack, etc.)
### Mission (timer, map hack, objectives, etc.)
### Stratagems (infinite, jammer bypass, etc.)
### Farming (samples, currency, rewards, etc.)
### Unlocks (armor, equipment, stratagems)
### Gamemode (killstreak, difficulty, invasion, etc.)

Each feature uses pattern scanning to locate game code, then applies minimal byte patches. The \`PatchManager\` handles memory protection, original byte preservation, and one-click reversion.

## Cheat Engine Integration

### Lua Bypass Script
A Lua script for Cheat Engine performs the same bypass operations as the C++ tool:

\`\`\`lua
aobscanmodule(bypassP1,$process,48 83 EC 28 8D 81 17 ? ? ? 83)
bypassP1:
  db B8 01 00 00 00 C3 CC CC CC CC  // mov eax, 1; ret
\`\`\`

This allows users who prefer Cheat Engine to apply bypasses without the external tool.

### .CT Table Parser
A Python parser (parse.py) processes Cheat Engine .CT files (XML format) to:
- Extract cheat entry hierarchy with metadata
- Parse Auto Assembler scripts
- Generate tree views and JSON exports
- Enable automated menu integration

The parser handles 25+ ID files containing game data (weapon hashes, planet modifiers, reinforcement IDs, etc.), enabling data-driven feature implementation.

## Technical Findings

### GameGuard Detection Methods
- **Memory integrity checks** at 8+ code locations
- **Process monitoring** via GameMon.des (user-mode) and kernel drivers
- **Logging subsystem** that can detect modifications
- **Module enumeration** to detect injected DLLs

### Bypass Stability
Patches targeting return values (mov eax, 0x755) are more stable than NOP-based bypasses, as they maintain expected calling conventions. The multi-stage approach (patch → terminate → disable logging) prevents GameGuard from recovering.

### DirectX Hook Challenges
- DX11 and DX12 require different vtable layouts
- Input hooks are necessary to prevent the game from fighting overlay control
- Trampoline allocation near target (±128MB) is required for rel32 jumps on x64

### Pattern Scanning Robustness
The Boyer-Moore-Horspool algorithm with wildcard support provides O(n/m) average case performance, making it suitable for scanning multi-gigabyte game executables. Chunked reads (256KB) balance memory usage and cache efficiency.

## What I Learned

- **Anti-cheat architecture**: Understanding how kernel-mode protections interact with user-mode code
- **Reverse engineering workflow**: Ghidra decompilation → pattern extraction → clean reimplementation
- **Windows internals**: Alternate Data Streams, memory protection, process injection techniques
- **DirectX internals**: Vtable layouts, device creation, swap chain management
- **Hook engine design**: Trampoline allocation, relative jump encoding, cleanup handling
- **Pattern scanning algorithms**: Boyer-Moore-Horspool implementation with wildcard support
- **Memory patching safety**: Protection handling, original byte preservation, atomic operations
- **Cross-language integration**: C++ system code, Lua scripting, Python parsing, JavaScript configuration`},{id:`cs2externdrv`,title:`CS2ExternDrv: Minimal R/W Driver`,subtitle:`A minimal kernel driver for CS2-Extern using shared memory only (no IOCTL), designed for kdmapper loading with process whitelisting.`,date:`2024`,categories:[`systems`,`closed`,`security`],tags:[`kernel`,`driver`,`shared-memory`,`c`],readTime:`12 min`,featured:!1,content:`## The Problem with Traditional IOCTL Drivers

Most kernel drivers for game cheating follow a predictable pattern: create a device object in \\Device\\, expose a symbolic link in \\DosDevices\\, and register IOCTL dispatch routines. This architecture works but has significant detectability drawbacks. Anti-cheat systems enumerate the \\Device\\ namespace looking for suspicious drivers. They query symbolic links for known patterns. They hook IRP dispatch routines to monitor IOCTL traffic. The more surface area your driver exposes, the more detection vectors exist.

CS2ExternDrv started with a different premise: what if we removed all the traditional driver surface area? What if we communicated through shared memory only, with no device object, no symbolic link, and no IOCTL interface? This writeup documents the architectural decisions, implementation details, and tradeoffs that emerged from building such a minimal driver.

## Design Philosophy: Minimal Surface Area

The central design principle guiding CS2ExternDrv is that detectability scales with visibility. Every object you create in kernel space is a potential detection point. Every dispatch routine you register is a hooking target. Every string constant you embed is a signature match waiting to happen.

Traditional drivers create multiple kernel objects:

- **Device Object** — Visible in \\Device\\ enumeration
- **Symbolic Link** — Visible in \\DosDevices\\ and session namespaces
- **IOCTL Dispatch Routines** — Callable via DeviceIoControl, hookable by anti-cheat
- **Driver Object Entry Points** — Visible in driver object inspection

CS2ExternDrv creates only one: a named section object. The section exists in \\BaseNamedObjects\\, which is less commonly scanned than \\Device\\. User-mode opens it via OpenFileMapping with the "Global\\" prefix. There is no CreateFile call, no DeviceIoControl call, no IRP processing. The driver is essentially invisible to traditional driver enumeration techniques.

## The Shared Memory Protocol

Communication occurs through a single shared memory section mapped into both kernel and user-mode address spaces. The kernel creates the section with ZwCreateSection, maps it with MmMapViewInSystemSpace, and polls for changes. User-mode opens the section with OpenFileMapping and maps it with MapViewOfFile.

The protocol is intentionally simple:

\`\`\`
Kernel creates:  \\BaseNamedObjects\\CS2ExternShared
User-mode opens: Global\\CS2ExternShared

Structure:
  Magic (4 bytes)              - 0x43533245 ("CS2E")
  Status (4 bytes)             - PENDING/COMPLETED/ERROR
  Command (4 bytes)            - READ/WRITE/GET_BASE/SET_PID
  OperationCounter (8 bytes)   - Monotonic counter for change detection
  ProcessId (4 bytes)
  Address (8 bytes)
  Size (4 bytes)
  Padding (4 bytes)
  Data[4096]                   - Payload buffer
\`\`\`

The OperationCounter field is the synchronization primitive. User-mode increments it when submitting a new command. The driver's polling thread detects the change by comparing it to LastProcessedCounter. This is a lock-free, interrupt-free design. No kernel APCs, no events, no mutexes between kernel and user-mode.

## Why Polling Instead of Events?

The obvious question: why not use a kernel event object that user-mode signals? Events are more efficient than polling. They don't waste CPU cycles. But events require additional kernel objects and system calls. ZwCreateEvent, ZwWaitForSingleObject, ZwSetEvent — all of these are detectable. Events also require the driver to register a wait routine, which adds complexity.

Polling, while inefficient, is invisible. The thread simply sleeps in a loop. From the outside, it looks like any other kernel thread. The sleep interval is 5ms, which is acceptable for a cheat that reads at human-like rates (60-120Hz). The CPU overhead is negligible compared to the game process itself.

The polling loop uses exponential backoff in principle, though the current implementation uses a fixed 5ms interval. This is a potential optimization area for future work.

## The Polling Thread Architecture

The driver creates a system thread with PsCreateSystemThread that runs PollThreadRoutine. This is a kernel-mode thread, not a user-mode thread. It runs at PASSIVE_LEVEL and never raises IRQL. The thread loops until PollingActive is set to FALSE during driver unload.

The thread performs three checks on each iteration:

1. **Magic validation** — Ensures the shared memory hasn't been corrupted or replaced
2. **Command presence** — Only processes if Command != CS2_CMD_NONE
3. **Counter change detection** — Only processes if OperationCounter != LastProcessedCounter

This three-check design prevents race conditions. If user-mode writes a command but crashes before incrementing the counter, the driver won't process it. If user-mode increments the counter without writing a command, the driver won't crash. The protocol is robust against partial updates.

## Process Attachment and Memory Operations

Memory operations use KeStackAttachProcess to attach to the target process's address space. This is the standard kernel technique for accessing another process's memory. The driver:

1. Looks up the PEPROCESS with PsLookupProcessByProcessId
2. Checks if the process is terminating with PsGetProcessExitStatus
3. Attaches with KeStackAttachProcess
4. Calls ProbeForRead/ProbeForWrite to validate the address
5. Performs RtlCopyMemory
6. Detaches with KeUnstackDetachProcess
7. Dereferences the PEPROCESS

The ProbeForRead/ProbeForWrite calls are critical. They validate that the address is accessible and trigger an exception if not. The __try/__except blocks catch these exceptions and return STATUS_ACCESS_VIOLATION. This prevents the driver from crashing if user-mode passes an invalid address.

## Address Validation Strategy

Before attempting any memory operation, the driver validates the address range:

- **User-mode check** — Address must be <= 0x00007FFFFFFFFFFF (canonical user space on x64)
- **Range check** — Address + Size must not overflow and must also be in user space
- **Minimum address check** — Address must be >= 0x10000 (NULL and low memory protection)
- **Process ID check** — PID 0 and PID 4 (System) are blocked

This defense-in-depth approach prevents kernel memory access even if the attachment mechanism fails. The checks are performed before any PEPROCESS lookup, so they add no overhead to the fast path.

## The Process Whitelist

The driver implements a write-once whitelist to prevent abuse. The first CS2_CMD_SET_TARGET_PID command sets TargetProcessId and sets WhitelistConfigured to TRUE. Subsequent SET_TARGET_PID commands return STATUS_ACCESS_DENIED.

All memory operations (READ, WRITE, GET_BASE) check the whitelist before proceeding. If WhitelistConfigured is FALSE or if the request's ProcessId doesn't match TargetProcessId, the operation fails with CS2_STATUS_ERROR.

This is a security measure, not a detection avoidance measure. If an attacker compromises the user-mode cheat component, they cannot use the driver to attack arbitrary processes. They are restricted to the originally whitelisted process.

The whitelist is protected by a FAST_MUTEX to prevent race conditions between the polling thread and a potential future IOCTL interface (though none exists currently). The mutex is acquired before checking or modifying the whitelist state.

## Base Address Resolution: Two-Path Strategy

Getting the process base address is more complex than reading memory. The driver uses a two-path strategy:

**Path 1: PsGetProcessSectionBaseAddress**

This is the undocumented Windows kernel function that returns the base address of the main module. The driver resolves it dynamically with MmGetSystemRoutineAddress to avoid IAT entries. If this function exists (it does on Windows 10+), the driver uses it.

**Path 2: PEB Fallback**

If PsGetProcessSectionBaseAddress is not available, the driver falls back to reading the Process Environment Block (PEB). The PEB structure contains the image base address at offset +0x10. The driver:

1. Gets the PEB with PsGetProcessPeb
2. Attaches to the target process
3. Validates the PEB address with MmIsAddressValid
4. Reads the image base pointer at offset +0x10
5. Validates the pointer with MmIsAddressValid
6. Returns the dereferenced value

This fallback is less reliable because the PEB layout can change between Windows versions, but it provides compatibility with older systems.

## The Device Object Paradox

Despite the "no device object" design philosophy, the driver actually does create a device object. Looking at InitializeDriver, you'll see IoCreateDevice called with "\\Device\\CS2ExternDrv". This seems contradictory to the design goals.

The reason is practical: manual mappers like kdmapper expect a DriverEntry function that receives a DRIVER_OBJECT. Creating a device object is the standard way to initialize a driver object properly. The device object is never used — no symbolic link is created, no dispatch routines are registered beyond DriverUnload. It exists solely to satisfy driver initialization conventions.

A purer implementation would use IoCreateDriver directly, which the driver does support via DriverMain. This function creates a driver object without a device object. The dual entry points (DriverEntry and DriverMain) allow flexibility: kdmapper can call either depending on its capabilities.

## Exception Handling Discipline

Kernel drivers must never crash. Every operation that touches user-mode memory is wrapped in __try/__except blocks. This includes:

- PEPROCESS validation with PsGetProcessExitStatus
- PEB access in GetProcessBaseAddress
- Memory reads and writes with ProbeForRead/ProbeForWrite

The exception handler returns the exception code as the NTSTATUS. This means user-mode errors (invalid addresses, access violations) propagate as error statuses rather than crashes. The driver remains stable even if the target process is malicious or buggy.

## Size Limits and Throttling

The driver enforces a 4KB (CS2_MAX_IO_SIZE) limit on all memory operations. This prevents:

- **DoS attacks** — A malicious user-mode client could request huge reads to exhaust kernel pool
- **Detection patterns** — Large, contiguous memory reads look suspicious
- **Complexity** — The shared memory buffer is fixed at 4096 bytes

The current implementation does not enforce rate limiting beyond the natural 5ms polling interval. This means the maximum throughput is theoretically 200 operations per second (1000ms / 5ms). In practice, the rate is much lower because each operation involves process attachment, probing, and memory copying. A more sophisticated implementation could add explicit rate limiting to match human behavior more closely.

## Building and Loading

The driver is built with the Windows Driver Kit (WDK) as a standard kernel-mode driver. The Visual Studio project (CS2ExternDrv.vcxproj) produces CS2ExternDrv.sys in Release|x64 configuration.

Loading is done via kdmapper rather than the Service Control Manager (SCM). This is because:

- **No registry entries** — Traditional drivers create registry keys under HKLM\\SYSTEM\\CurrentControlSet\\Services
- **No test signing** — kdmapper handles driver signature enforcement bypass
- **Manual mapping** — The driver may be manually mapped into kernel space rather than loaded normally

The kdmapper command is:
\`\`\`
kdmapper.exe CS2ExternDrv.sys DriverMain
\`\`\`

DriverMain is the preferred entry point because it doesn't require a DRIVER_OBJECT parameter. kdmapper can call it directly after manual mapping.

## Integration with CS2-Extern

The CS2-Extern cheat includes a user-mode client in utilities/driver_io/. The client:

1. Opens the shared section with OpenFileMapping
2. Maps it with MapViewOfFile
3. Validates the Magic field
4. Sets the target process ID with SET_TARGET_PID
5. Submits READ/WRITE/GET_BASE commands by writing the structure and incrementing OperationCounter
6. Polls the Status field until it changes from PENDING to COMPLETED or ERROR

The client is designed to be a drop-in replacement for the existing ReadProcessMemory-based memory access layer. If the driver fails to load or connect, the cheat falls back to user-mode memory access.

## Lessons Learned

**Minimalism is powerful.** By removing device objects, symbolic links, and IOCTL interfaces, the driver becomes significantly harder to detect. The tradeoff is polling overhead, but this is acceptable for the use case.

**Shared memory is simpler than it seems.** The OperationCounter synchronization primitive eliminates the need for complex event objects or mutexes. Lock-free communication between kernel and user-mode is achievable with careful design.

**Process attachment is the bottleneck.** KeStackAttachProcess is expensive. Every memory operation pays this cost. For high-throughput scenarios, a more sophisticated design would cache the PEPROCESS and attach once per batch of operations. But for a cheat reading at 60Hz, the overhead is negligible.

**Exception handling is non-negotiable.** Every user-mode touch point must be protected. The driver has crashed exactly zero times in testing because every ProbeForRead, every PEB access, every PEPROCESS validation is wrapped in exception handlers.

**Dynamic API resolution is worth the complexity.** Resolving PsGetProcessSectionBaseAddress at runtime with MmGetSystemRoutineAddress avoids IAT entries. This is a small security gain, but in kernel-mode development, small gains compound.

## Project Status

**This is a work-in-progress project.** Core functionality is implemented and tested, but several areas need refinement:

- **Rate limiting** — No explicit throttling beyond polling interval
- **Batch operations** — Each memory operation requires separate attachment/detachment
- **Error reporting** — Limited error detail in the Status field
- **Logging** — Debug prints only, no structured logging
- **Testing** — Limited automated testing, mostly manual validation

The driver works for its intended purpose (providing stealthy memory access for CS2-Extern), but it is not production-ready in the general sense. Additional features, testing, and refinements may be added over time.

## Future Directions

Potential improvements for future iterations:

- **Exponential backoff polling** — Increase sleep interval during idle periods to reduce CPU usage
- **PEPROCESS caching** — Cache the target process object to reduce attachment overhead
- **Batch command support** — Allow multiple operations in a single shared memory transaction
- **Enhanced error codes** — Expand the Status enum to provide more specific error information
- **Configuration structure** — Move hardcoded values (CS2_MAX_IO_SIZE, POLL_INTERVAL_MS) to a configurable header
- **Symbol stripping** - Remove debug symbols from release builds to reduce analysis surface

The core architecture — shared memory only, no device object, polling thread — will remain. The minimal surface area design is fundamental to the project's goals.`},{id:`manualmapdrv`,title:`ManualMapDrv: A Kernel-Mode Manual Mapping Driver`,subtitle:`Lessons from implementing manual PE mapping from kernel mode, including the architectural tradeoffs between stealth and compatibility, the complexity of replicating the Windows loader, and the fundamental limitations of kernel-to-user-mode import resolution.`,date:`2024`,categories:[`systems`,`security`,`kernel`,`work-in-progress`],tags:[`kernel`,`dll-injection`,`pe`,`cpp`,`windows-internals`,`manual-mapping`],readTime:`15 min`,featured:!1,content:`## The Problem with LoadLibrary-Based Injection

Traditional DLL injection relies on LoadLibrary, which is fundamentally incompatible with stealth requirements. Anti-cheat systems detect LoadLibrary-based injection through multiple vectors: API call logging in usermode hooking, loader data table (LDR) enumeration scans, memory pattern matching against known DLL footprints, and digital signature verification. When you call LoadLibrary, you are explicitly asking the Windows loader to do its job, and that job leaves traces everywhere.

Manual mapping attempts to bypass this by replicating the loader's work manually: parse the PE file, allocate memory, map sections, process relocations, resolve imports, and call the entry point. The theory is that if you never call the loader APIs, the loader never knows a DLL was loaded. The reality is more complex, as manual mapping introduces its own detection vectors and compatibility challenges.

ManualMapDrv was built as a learning project to understand these tradeoffs from kernel mode, where the constraints are different than usermode manual mappers. The driver specifically targets CS2 (Counter-Strike 2) as a proof-of-concept, but the architectural decisions apply generally to any kernel-mode injection scenario.

## Architectural Premise: Kernel vs Usermode Mapping

The central architectural decision in ManualMapDrv is where to perform the mapping: kernel mode or usermode. This choice has profound implications for both stealth and compatibility.

**Kernel-mode mapping** offers the advantage of operating outside the target process's address space initially. The driver can allocate memory in the target process using ZwAllocateVirtualMemory, write to it using ZwWriteVirtualMemory, and manipulate process structures without the target process's knowledge. The driver can also unlink itself from PsLoadedModuleList to hide from enumeration tools that scan loaded drivers. However, kernel mode cannot easily resolve user-mode imports because it lacks access to the target process's loaded module list and export tables in a straightforward way.

**User-mode mapping** would involve injecting a small stub that performs the actual mapping work within the target process context. This stub would have full access to the process's LDR chain and could resolve imports using GetProcAddress like a normal DLL. However, injecting the stub itself requires some mechanism (APC injection, thread hijacking, etc.), and the stub's execution leaves traces that can be detected.

ManualMapDrv chooses kernel-mode mapping for the initial implementation, prioritizing the ability to hide the driver itself over complete import resolution. This is a deliberate tradeoff: the driver can be made very stealthy, but the injected DLL must handle its own imports at runtime.

## The PE Parsing Layer

The foundation of manual mapping is correct PE parsing. The Windows PE format is deceptively complex: DOS header, NT headers, section headers, data directories, relocation blocks, import descriptors, and export tables all must be parsed correctly. A single misinterpretation leads to crashes or security vulnerabilities.

ManualMapDrv implements a conservative parser that focuses on the subsets of PE required for mapping:

- **DOS Header**: Validates the MZ signature and extracts the e_lfanew offset to the NT headers.
- **NT Headers**: Extracts ImageBase, SizeOfImage, EntryPoint, and the data directory array.
- **Section Headers**: Iterates through sections, extracting VirtualAddress, SizeOfRawData, PointerToRawData, and Characteristics.
- **Data Directories**: Locates the import, export, and relocation directory offsets and sizes.

The parser is intentionally strict. If any signature is invalid or any offset is out of bounds, the operation fails with STATUS_INVALID_IMAGE_FORMAT. This conservative approach prevents crashes from malformed DLLs, which is critical in kernel mode where a bug means a BSOD.

The parser does not attempt to handle every PE edge case. It assumes well-formed PE files generated by standard toolchains. Handling malformed or obfuscated PEs would require significantly more complex parsing logic that was deemed out of scope for a learning project.

## Memory Allocation and Section Mapping

Once the PE is parsed, the driver allocates memory in the target process. The allocation strategy follows the Windows loader's approach: attempt to allocate at the DLL's preferred ImageBase, and if that fails, allocate anywhere and process relocations.

The allocation uses ZwAllocateVirtualMemory with MEM_COMMIT | MEM_RESERVE. The size is rounded up to the nearest page boundary (0x1000 bytes) because memory protection operates at page granularity. The driver validates that the allocated address is in user space (below MmUserProbeAddress) to prevent kernel memory corruption.

Section mapping copies raw section data from the DLL file on disk to the correct virtual addresses in the allocated memory. For each section:

1. Calculate the destination address: base_address + section.VirtualAddress
2. Read section data from the file at section.PointerToRawData
3. Write the data to the destination using ZwWriteVirtualMemory
4. Handle sections with SizeOfRawData = 0 (BSS sections) by zeroing the memory

The current implementation maps all sections with PAGE_EXECUTE_READWRITE permissions. This is a simplification that should be improved. The Windows loader sets section-specific protections based on the Characteristics field: executable sections get PAGE_EXECUTE_READ, read-only data sections get PAGE_READONLY, etc. Mapping everything as RWX is suspicious from a detection standpoint and violates the principle of least privilege.

The proper implementation would parse the section Characteristics and apply appropriate protections using ZwProtectVirtualMemory after mapping. This is listed as a future improvement.

## Base Relocations: The Address Adjustment Problem

A DLL compiled with a specific ImageBase expects to be loaded at that address. If the actual allocation address differs, the DLL contains addresses that need adjustment. The .reloc section contains a list of these addresses in a compact format.

The relocation format consists of blocks, each starting with a 4-byte PageRVA and a 4-byte BlockSize. The BlockSize includes the header itself, so the number of relocation entries is (BlockSize - 8) / 2. Each entry is a 2-byte value where the high 4 bits are the relocation type and the low 12 bits are the offset from the PageRVA.

ManualMapDrv processes relocations as follows:

1. Calculate delta = actual_base - preferred_base
2. If delta is zero, no relocations needed (loaded at preferred address)
3. For each relocation block:
   - Calculate base_address = allocated_base + PageRVA
   - For each entry in the block:
     - Extract type and offset
     - For TYPE_DIR64 (the only type supported in x64):
       - Calculate target_address = base_address + offset
       - Read the current value at target_address
       - Add delta to the value
       - Write back the adjusted value

The implementation only supports TYPE_DIR64 relocations, which is sufficient for x64. A complete implementation would handle TYPE_HIGHLOW, TYPE_ABS, and other types for x86 compatibility.

## Import Resolution: The Fundamental Limitation

Import resolution is where kernel-mode manual mapping hits a hard architectural wall. The Import Address Table (IAT) lists the DLLs and functions that the mapped DLL requires. These must be resolved to their actual addresses in the target process.

In usermode, this is straightforward: use LoadLibrary to load the required DLL, then use GetProcAddress to find each function address, then write those addresses into the IAT slots. The loader does this automatically.

From kernel mode, this is problematic for several reasons:

1. **The target process's LDR chain is not directly accessible**. The driver can read process memory, but finding the PEB and walking the LDR_DATA_TABLE_ENTRY structures requires knowledge of internal Windows structures that change between versions.

2. **GetProcAddress is not callable from kernel mode**. The function lives in usermode and expects a usermode context. Calling it directly would crash.

3. **Export table parsing is complex**. Each DLL has an export directory with function names, ordinals, and address tables. Parsing these correctly for every system DLL is a massive undertaking.

ManualMapDrv implements a minimal import resolution strategy:

- For kernel-mode imports (ntdll.dll, etc.), the driver uses MmGetSystemRoutineAddress to resolve functions.
- For user-mode imports, the driver does not attempt resolution. Instead, it relies on the target DLL to handle imports at runtime.

The workaround is for the target DLL to use delay loading or manual import resolution. With delay loading, the IAT entries are initially stubs that call the delay load helper when first accessed. The helper can then use GetProcAddress from within the usermode context. Alternatively, the DLL can manually resolve imports by parsing export tables itself.

This is the primary limitation of the current implementation. A complete kernel-mode manual mapper would need to either:

- Implement full export table parsing for all system DLLs
- Inject a usermode stub that performs import resolution
- Use APC injection to run code in the target process context that resolves imports

All of these approaches are significantly more complex than the current implementation.

## DllMain Execution: The Thread Context Problem

After sections are mapped and relocations processed, the DLL's entry point (DllMain) must be called with DLL_PROCESS_ATTACH. This is where the mapping either succeeds or fails catastrophically.

The initial implementation called DllMain directly from the driver's IOCTL handler thread. This failed because DllMain was executing in the wrong context:

- The thread was a kernel system thread, not a usermode thread
- The thread was not attached to the target process
- The TEB (Thread Environment Block) was not set up for usermode execution
- Usermode APCs would not execute
- Some CRT functions that expect a proper TEB would crash

The fix was to create a dedicated thread routine (DllMainThreadRoutine) that:

1. Attaches to the target process using KeStackAttachProcess
2. Calls the DllMain entry point with DLL_PROCESS_ATTACH
3. Detaches from the process using KeUnstackDetachProcess
4. Returns the result

This approach works but is still not ideal. DllMain is still executing from a kernel thread context, not a genuine usermode thread. Some DLLs may have assumptions about thread context that this violates.

The proper solution would be to create a true usermode thread in the target process and have that thread call DllMain. This could be done using:

- **NtCreateThreadEx** with a usermode stub that calls DllMain
- **APC injection** to queue a usermode APC that calls DllMain
- **Thread hijacking** to suspend an existing thread and redirect it to call DllMain

All of these approaches are more complex and introduce their own detection vectors. The current kernel-thread approach is a pragmatic compromise for a learning project.

## Security Architecture: Whitelisting and Rate Limiting

A kernel-mode driver with injection capabilities is dangerous. If compromised, it could inject malicious code into any process. ManualMapDrv implements several security measures to mitigate this risk.

**Process Whitelisting** is the primary security mechanism. The driver maintains a single allowed ProcessId that can be set exactly once via IOCTL_MM_SET_TARGET_PID. Subsequent attempts to change the whitelist are rejected with STATUS_ACCESS_DENIED. This write-once property prevents an attacker who gains access to the IOCTL interface from redirecting injections to a different process.

The whitelist is validated on every injection IOCTL. The driver checks that the requested ProcessId matches the whitelisted ProcessId before proceeding. This check occurs after basic validation but before any memory operations, providing defense in depth.

**Rate Limiting** prevents abuse of the injection mechanism. The driver maintains a timestamp of the last successful injection and rejects injection requests that occur within 200ms of the previous one (5 injections per second maximum). This prevents:

- Detection through timing analysis (rapid repeated injections look suspicious)
- Accidental system instability from runaway injection loops
- Abuse if the driver interface is compromised

The rate limit is implemented with a simple timestamp comparison. A more sophisticated implementation might use a token bucket or sliding window for smoother rate limiting, but the current approach is sufficient for the threat model.

**Address Validation** ensures all memory operations target user-space addresses. Before any ZwAllocateVirtualMemory, ZwWriteVirtualMemory, or ZwProtectVirtualMemory call, the driver validates that the address is below MmUserProbeAddress. This prevents kernel memory corruption bugs that could lead to privilege escalation.

**Driver Unlinking** hides the driver from enumeration tools. After DriverEntry completes, the driver removes itself from PsLoadedModuleList by walking the list and unlinking its entry. This prevents tools like EnumDeviceDrivers or loaded module scans from detecting the driver.

The unlinking is a double-edged sword. It provides stealth but makes debugging difficult. The driver cannot be unloaded normally once unlinked because the unload routine cannot be found. The current implementation does not support unloading at all; the driver must be removed via system reboot or manual memory cleanup.

## IOCTL Interface Design

The driver exposes two IOCTLs for usermode communication:

**IOCTL_MM_SET_TARGET_PID** sets the process whitelist. It takes a ULONG ProcessId as input. The driver validates that the whitelist has not already been set, then stores the ProcessId. This IOCTL can only be called once.

**IOCTL_MM_INJECT_DLL** performs the actual injection. It takes an INJECT_DLL_REQUEST structure containing:

- ProcessId: The target process (must match whitelist)
- DllPath: Full path to the DLL file (WCHAR array, MAX_DLL_PATH length)
- DllPathLength: Length of the path in bytes

It returns an INJECT_STATUS structure containing:

- Status: NTSTATUS code indicating success or failure
- DllBaseAddress: The base address where the DLL was mapped
- DllSize: The size of the mapped DLL in bytes

The IOCTL handler performs comprehensive validation:

1. Verify input buffer size is correct
2. Verify ProcessId matches whitelist
3. Verify DllPathLength is within bounds
4. Verify DllPath is null-terminated
5. Open the DLL file and validate it exists
6. Read the DLL file into kernel memory
7. Parse the PE headers
8. Allocate memory in target process
9. Map sections
10. Process relocations
11. Resolve imports (minimal)
12. Call DllMain
13. Return status and mapping information

Any failure at any stage triggers appropriate cleanup: freeing allocated memory, closing file handles, and returning a descriptive error code.

## Error Handling and Cleanup Philosophy

Kernel-mode code must be obsessively careful about error handling. A single unchecked error can crash the entire system. ManualMapDrv follows a strict cleanup philosophy:

1. **Validate all inputs before any state mutation**. Check buffer sizes, verify pointers, validate ranges before touching anything.
2. **Use goto for cleanup**. While goto is generally discouraged in C++, it is the correct pattern for kernel cleanup. Each error path jumps to a common cleanup label that frees resources in reverse order of acquisition.
3. **Initialize all pointers to NULL**. This allows cleanup code to safely call ExFreePool and ZwClose on NULL pointers without checking.
4. **Track resource ownership explicitly**. If a function allocates memory, it must either free it or clearly document that ownership is transferred.
5. **Never leave partially-initialized state**. If a function fails halfway through, it must clean up everything it touched before returning.

An example of this pattern in the injection routine:

\`\`\`c
PVOID dll_buffer = NULL;
HANDLE file_handle = NULL;
PVOID allocated_base = NULL;

dll_buffer = ExAllocatePoolWithTag(...);
if (!dll_buffer) {
    status = STATUS_INSUFFICIENT_RESOURCES;
    goto cleanup;
}

file_handle = ZwOpenFile(...);
if (!NT_SUCCESS(status)) {
    goto cleanup;
}

// ... more operations ...

cleanup:
    if (dll_buffer) ExFreePoolWithTag(dll_buffer, ...);
    if (file_handle) ZwClose(file_handle);
    if (allocated_base) ZwFreeVirtualMemory(...);
    return status;
\`\`\`

This pattern ensures that no resource leaks occur regardless of which error path is taken.

## Testing and Validation

Testing kernel-mode code is challenging because bugs cause immediate BSODs. ManualMapDrv was tested in a virtual machine with kernel debugging enabled.

The testing progression was:

1. **Unit testing individual components**: PE parsing with known good and known bad DLLs, relocation processing with manually crafted relocations, import resolution with kernel modules only.
2. **Integration testing with simple DLLs**: Injecting DLLs that do nothing but log to DebugView, verifying DllMain is called correctly.
3. **Integration testing with complex DLLs**: Injecting the actual CS2 cheat DLL, verifying pattern scanning and function resolution.
4. **Error case testing**: Attempting to inject non-existent files, invalid PEs, protected processes, etc., verifying proper error handling.

The CS2 cheat DLL test was particularly revealing. The DLL successfully loaded and initialized, with pattern scanning finding 38 out of 39 required functions (97% success rate). The one failure (C_CSWeaponBase::UpdateSkin) was due to an outdated pattern in the DLL itself, not a driver issue. This demonstrated that the core manual mapping functionality works correctly.

DebugView (Sysinternals) was used extensively for logging. The driver uses DbgPrintEx with a custom tag "[ManualMapDrv]" for filtering. In release builds, all debug prints are compiled out to reduce detection surface.

## Implementation Status and Limitations

ManualMapDrv is a work-in-progress. The core manual mapping pipeline works, but several features remain incomplete or simplified:

**Full user-mode import resolution** is not implemented. The driver resolves kernel-mode imports using MmGetSystemRoutineAddress but does not attempt to resolve user-mode imports. The target DLL must handle its own imports via delay loading or manual resolution. This is the most significant limitation.

**True user-mode thread execution** for DllMain is not implemented. DllMain is called from a kernel thread that attaches to the target process, but this is not equivalent to a genuine user-mode thread. Some DLLs may have assumptions about thread context that this violates.

**Section-specific memory protections** are not implemented. All sections are mapped with PAGE_EXECUTE_READWRITE. A proper implementation would parse section Characteristics and apply appropriate protections (PAGE_EXECUTE_READ for code, PAGE_READONLY for read-only data, etc.).

**DLL path passing to ManualMapParam_t** is incomplete. The structure has a DllPath field, but the current implementation does not reliably populate it. The DLL receives a placeholder path instead of the actual path.

**Delay-loaded import support** is not implemented. The driver does not parse the delay load import directory. DLLs using delay loading must handle this themselves.

**DLL unloading** is not implemented. There is no IOCTL to unmap a manually mapped DLL. Once injected, the DLL remains until process termination.

**Multiple DLL injection** is not supported. The driver can only inject one DLL at a time. Injecting a second DLL would require reinitializing the driver or extending the IOCTL interface.

## Lessons Learned

Building ManualMapDrv provided several important lessons about kernel-mode programming and Windows internals:

**The Windows loader does more than you think**. Parsing PE files and mapping sections is straightforward. But handling relocations, resolving imports with dependency ordering, managing TLS callbacks, processing exception directories, and handling all the edge cases of the PE format is incredibly complex. The loader is a sophisticated piece of engineering that we take for granted.

**Kernel-mode constraints are fundamental**. You cannot simply "call GetProcAddress from kernel mode." The separation between kernel and usermode is not just a security boundary; it's an architectural boundary with real technical constraints. Working around these constraints requires significant complexity.

**Stealth is a spectrum, not a binary**. Driver unlinking hides from enumeration tools, but the driver's presence can still be detected through other means (timing analysis, memory scanning, behavior analysis). Similarly, manual mapping avoids LoadLibrary detection, but the mapped DLL still leaves traces (memory patterns, API calls, behavior). Complete stealth requires addressing detection vectors at multiple layers.

**Error handling discipline is non-negotiable**. In usermode, a crash terminates the process. In kernel mode, a crash BSODs the system. This raises the stakes for error handling dramatically. Every allocation must be checked, every pointer validated, every error path cleaned up properly.

**Architecture cannot be retrofitted**. The decision to use kernel-mode mapping with minimal import resolution had to be made early. If we had started with a usermode stub approach, switching to kernel-mode would require a complete rewrite. Similarly, if we had built without security features like whitelisting, adding them later would be difficult.

## Future Directions

The next phase of ManualMapDrv development would focus on the incomplete features:

**Full user-mode import resolution** would require either implementing export table parsing for system DLLs or injecting a usermode stub to perform resolution. The stub approach is likely more practical: inject a small shellcode that calls LoadLibrary/GetProcAddress, then have it resolve the imports and patch the IAT.

**True user-mode thread execution** would use NtCreateThreadEx to create a thread in the target process that calls DllMain. This requires creating a usermode stub function in the target process's memory, which adds complexity but provides better compatibility.

**Section-specific memory protections** would parse the section Characteristics field and apply appropriate protections using ZwProtectVirtualMemory. This is relatively straightforward to implement and would reduce the detection surface.

**DLL unloading** would require implementing the inverse of the mapping process: calling DllMain with DLL_PROCESS_DETACH, freeing allocated memory, and cleaning up any resources. This is complex because the DLL may have created threads, allocated memory, or registered callbacks that need cleanup.

**Process auto-detection** would allow the driver to find CS2 by name instead of requiring manual ProcessId specification. This would involve enumerating processes using ZwQuerySystemInformation and matching the image name.

## Conclusion

ManualMapDrv demonstrates that manual PE mapping from kernel mode is feasible but complex. The core functionality—parsing PE files, allocating memory, mapping sections, processing relocations, and calling DllMain—works correctly and has been validated with real-world testing against CS2.

However, the implementation reveals fundamental architectural limitations. Kernel-mode import resolution is inherently difficult, and the current workaround (requiring the DLL to handle its own imports) is a significant constraint. The thread context issue for DllMain execution remains unresolved. Several features that would be present in a production-grade manual mapper are incomplete.

The project serves as both a practical injection tool and a learning resource. It provides a working kernel-mode manual mapper that can be used for stealth injection, but more importantly, it illuminates the complexity of the Windows loader and the challenges of replicating its functionality from kernel mode.

The experience highlights that manual mapping is not a magic bullet for stealth. It avoids certain detection vectors (LoadLibrary calls, LDR enumeration) but introduces others (memory patterns, behavior analysis). Effective stealth requires a layered approach addressing detection at multiple levels, not just bypassing one loader API.`},{id:`byovd-scanner`,title:`BYOVD Scanner: Driver Vulnerability Detection`,subtitle:`Static analysis for identifying drivers vulnerable to BYOVD attacks, IOC generation, and signature-based detection.`,date:`2024`,categories:[`tools`,`security`,`closed`],tags:[`security`,`python`,`binary-analysis`,`vulnerability-scanning`],readTime:`14 min`,featured:!1,content:`## The BYOVD Problem

"Bring Your Own Vulnerable Driver" attacks exploit signed drivers with security flaws to gain kernel execution. The attack vector is elegant in its simplicity: attackers don't need to write their own kernel exploit. Instead, they find a legitimately signed driver from a trusted vendor that happens to have a vulnerability, load it using legitimate driver loading mechanisms, and exploit the vulnerability to gain arbitrary kernel code execution.

The detection problem is fundamentally asymmetric. Attackers need to find just one vulnerable driver. Defenders need to identify and block all vulnerable drivers while preserving legitimate hardware functionality. This is made more difficult by:

- **Trusted signatures**: Vulnerable drivers are signed by reputable vendors (MSI, Dell, ASUS, etc.) that anti-cheat and EDR systems whitelist by default
- **Legitimate use cases**: These drivers ship with legitimate hardware (RGB controllers, fan controllers, overclocking utilities) and breaking them breaks user hardware
- **Continuous discovery**: New vulnerable drivers are discovered regularly, and old drivers remain in driver stores indefinitely
- **Whitelisting inertia**: Once a driver is whitelisted, removing it causes support tickets and user complaints

BYOVD Scanner was built to address this by providing comprehensive static analysis of drivers to identify potential vulnerabilities before they can be exploited. The scanner operates offline on driver files, generating IOCs (Indicators of Compromise) that can be integrated into SIEM systems, EDR policies, or manual review workflows.

## Architectural Premise: Static vs Runtime Analysis

The central architectural decision in BYOVD Scanner is the emphasis on static analysis over runtime analysis. This choice has profound implications for scalability, accuracy, and deployment.

**Static analysis** examines the driver file on disk without loading it. It parses the PE format, extracts imports, exports, and code patterns, and applies heuristic rules to identify potential vulnerabilities. The advantage is that it can scan thousands of drivers in minutes without risking system stability. The disadvantage is that it produces false positives—code patterns that look dangerous but are benign in context.

**Runtime analysis** would involve loading the driver in a sandbox or on a test system, monitoring its behavior, and identifying actual vulnerability exploitation. This would be more accurate but impractical at scale: loading arbitrary kernel drivers is dangerous, requires significant infrastructure, and cannot be automated safely.

BYOVD Scanner chooses static analysis with a conservative confidence model. Rather than claiming definitive vulnerability detection, it provides a risk score and confidence level. High-risk drivers are flagged for manual review. Known vulnerable drivers (from loldrivers.io) are marked with "CONFIRMED" confidence. Everything else falls somewhere in between.

This approach acknowledges the fundamental limitation of static analysis: you cannot prove a driver is vulnerable without actually exploiting it. But you can identify drivers that are worth investigating, and that is sufficient for most defensive workflows.

## The IOC Database: Crowd-Sourced Vulnerability Intelligence

The scanner integrates with loldrivers.io, a community-maintained database of known vulnerable drivers. This integration provides ground truth for vulnerability detection: if a driver's SHA256 matches a known vulnerable sample, it is immediately flagged as "CONFIRMED" with the specific CVE and vulnerability description.

The IOC database is cached locally in \`byovd_ioc_cache.json\` with a 24-hour freshness window. On first run (or when the cache expires), the scanner fetches the latest database from loldrivers.io API. This provides several benefits:

- **Freshness**: New vulnerabilities are incorporated within 24 hours
- **Offline capability**: The cache allows scanning without internet access after the initial fetch
- **Performance**: Hash lookups are O(1) against a local dictionary, not API calls
- **Auditability**: The cache file itself is a JSON document that can be version-controlled and reviewed

The cache structure maps SHA256 hashes to vulnerability descriptions:

\`\`\`
{
  "01aa278b07b58dc46c84bd0b1b5c8e9ee4e62ea0bf7a695862444af32e87f1fd": 
    "RTCore64.sys - MSI Afterburner (CVE-2019-16098)",
  "0296e2ce999e67c76352613a718e11516fe1b0efc3ffdb8918fc999dd76a73a5":
    "DBUtil_2_3.sys - Dell (CVE-2021-21551)"
}
\`\`\`

The scanner falls back to a minimal hardcoded IOC database if both the API fetch and local cache fail. This ensures basic functionality even in air-gapped environments, though with significantly reduced coverage.

## PE Parsing: The Foundation of Static Analysis

All static analysis begins with correct PE parsing. The scanner uses the \`pefile\` library to parse the PE format, extracting headers, sections, data directories, and import/export tables. The parser is intentionally strict: if any signature is invalid or any offset is out of bounds, the driver is marked as INVALID and skipped.

This conservative approach prevents crashes from malformed PE files, which is important for batch scanning. A single malformed file should not abort the entire scan.

The parser extracts:
- **DOS Header**: Validates MZ signature and extracts e_lfanew offset
- **NT Headers**: Extracts ImageBase, SizeOfImage, EntryPoint, and data directory array
- **Section Headers**: Iterates through sections, extracting VirtualAddress, SizeOfRawData, PointerToRawData, and Characteristics
- **Data Directories**: Locates import, export, and relocation directory offsets and sizes

The scanner also verifies that the file is actually a kernel driver by checking the Subsystem field (IMAGE_SUBSYSTEM_NATIVE). User-mode DLLs are skipped because they are not relevant to BYOVD attacks.

## Import Analysis: Identifying Dangerous Primitives

The core of the scanner's vulnerability detection is import analysis. Kernel drivers that import dangerous functions from ntoskrnl.exe are potential BYOVD candidates. The scanner maintains a comprehensive dictionary of risky imports, categorized by the primitive they provide:

**Physical memory mapping primitives**: MmMapIoSpace, MmMapIoSpaceEx, MmGetPhysicalAddress, HalTranslateBusAddress. These functions allow mapping physical memory into kernel virtual address space, which can be abused to read/write arbitrary physical memory (including the kernel itself).

**Locked/MDL page mapping primitives**: MmMapLockedPages, MmMapLockedPagesSpecifyCache, IoAllocateMdl. These functions map MDL-locked pages, which can expose arbitrary physical memory if the MDL is constructed maliciously.

**Cross-process memory primitives**: MmCopyVirtualMemory, MmCopyMemory, ZwMapViewOfSection. These allow reading/writing another process's memory without the usual handle restrictions.

**Process/thread primitives**: ZwOpenProcess, PsLookupProcessByProcessId, ZwAllocateVirtualMemory, ZwWriteVirtualMemory, ZwCreateThreadEx. These allow process manipulation and code injection from kernel mode.

**Kernel code execution primitives**: ExAllocatePool, ExAllocatePoolWithTag, ExAllocatePool2. These allocate kernel pool memory, which can be used to stage shellcode.

**Driver manipulation primitives**: ZwLoadDriver, ZwUnloadDriver, MmGetSystemRoutineAddress. These allow loading/unloading drivers and resolving kernel function addresses dynamically.

**Port/hardware I/O primitives**: WRITE_PORT_UCHAR, READ_PORT_UCHAR, HalGetBusDataByOffset. These allow direct hardware I/O, which can be abused to bypass security checks.

The scanner distinguishes between normal imports and delay-load imports. Delay-load imports are loaded lazily at runtime, which can be an evasion technique—malicious drivers might delay-load dangerous imports to avoid static detection.

For each risky import found, the scanner records the function name and a human-readable description of why it's dangerous. This context is crucial for manual review: knowing that a driver imports MmMapIoSpace is useful; knowing that MmMapIoSpace "maps physical memory into kernel VA — direct hardware/memory access" is actionable.

## Export Analysis: Exposed Attack Surfaces

Some drivers export functions that directly expose dangerous primitives to any caller. These are particularly dangerous because they don't require IOCTL handling or parameter validation—an attacker can call the exported function directly via GetProcAddress.

The scanner maintains a dictionary of suspicious exports: MapPhysicalMemory, ReadPhysicalMemory, WritePhysicalMemory, GetKernelBase, ReadMsr, WriteMsr, ReadCr0, WriteCr0, AllocateNonPagedMemory, etc. These are functions that no legitimate driver should export, as they provide raw kernel primitives to usermode.

Finding a suspicious export is a strong indicator of BYOVD potential. The scanner flags these with HIGH confidence because the intent is clear: the driver author explicitly chose to expose these primitives.

## IOCTL Surface Analysis: The Communication Channel

IOCTL (Input/Output Control) is the primary communication mechanism between usermode and kernel drivers. A driver creates a device object, registers a dispatch table, and handles IOCTL requests. If the IOCTL handler does not validate parameters properly, an attacker can send malicious IOCTLs to trigger vulnerability exploitation.

The scanner's IOCTL surface analysis attempts to estimate the size and security of a driver's IOCTL interface without actually executing code. It uses two complementary approaches:

**Import-based inference**: The scanner checks if the driver imports IOCTL-related functions: IoCreateDevice, IoCreateDeviceSecure, IoCreateSymbolicLink, IoDeleteDevice, IoDeleteSymbolicLink, IoCompleteRequest. Presence of these imports suggests the driver has an IOCTL interface.

- IoCreateDevice vs IoCreateDeviceSecure: The latter takes a security descriptor (SDDL string) that defines who can access the device. Using IoCreateDevice (the insecure version) means any process can open a handle to the device.
- IoCreateSymbolicLink: Creates a symbolic link (e.g., \\\\.\\MyDevice) that makes the device accessible from usermode via CreateFile. This is the primary BYOVD attack surface.
- IoCompleteRequest: Indicates the driver handles IRPs (I/O Request Packets), which is required for IOCTL processing.

**Heuristic IOCTL code extraction**: The scanner scans the binary for DWORD values that match the IOCTL code structure. Windows IOCTL codes follow the CTL_CODE macro layout:
- Bits 31-16: DeviceType (0x0001-0xFFFF, with 0x8000 being custom devices)
- Bits 15-14: Access (0=any, 1=read, 2=write, 3=read+write)
- Bits 13-2: Function (0x000-0xFFF, with 0x800+ being vendor-defined)
- Bits 1-0: Method (0=buffered, 1=in_direct, 2=out_direct, 3=neither)

The scanner looks for DWORDs where DeviceType is in the custom range (0x8000-0xFFFF) and Function is vendor-defined (>= 0x800). This heuristic produces false positives but provides an estimate of IOCTL surface size. A driver with 50 potential IOCTL codes has a larger attack surface than a driver with 2.

The IOCTL surface analysis produces an IoctlSurfaceInfo structure with:
- has_device_creation: Whether the driver creates a device object
- uses_secure_creation: Whether it uses IoCreateDeviceSecure (the secure variant)
- has_symbolic_link: Whether it creates a symbolic link (usermode-accessible)
- has_irp_completion: Whether it handles IRPs
- dispatch_import_count: How many IOCTL-related imports are present
- estimated_ioctl_codes: List of potential IOCTL codes found in the binary
- notes: Analyst notes explaining the security implications

## Section Entropy Analysis: Detecting Packing and Obfuscation

Packed or obfuscated drivers have higher entropy (randomness) in their sections because the code is compressed or encrypted. High entropy is suspicious because legitimate drivers typically have lower entropy (real code has patterns). The scanner calculates Shannon entropy for each section and flags sections with entropy > 7.0, or executable sections with entropy > 6.5.

Shannon entropy measures the unpredictability of data. For a byte sequence, entropy ranges from 0 (all bytes are the same) to 8 (perfectly random). Compressed data typically has entropy around 7.5-8.0. Normal code has entropy around 6.0-7.0.

The scanner flags high entropy as suspicious because:
- Packed drivers may hide malicious code that static analysis cannot see
- Obfuscation is an evasion technique used by malware authors
- Legitimate hardware drivers rarely need packing (they're not trying to hide anything)

However, entropy analysis has false positives. Some legitimate drivers use compression for size reduction, and some optimization techniques increase entropy. The scanner treats entropy as a signal, not definitive evidence.

## Signature Verification: Trust Anchors

The scanner verifies the digital signature of each driver using PowerShell's Get-AuthenticodeSignature cmdlet. Signature status is a critical factor in risk scoring because signed drivers are more likely to be whitelisted by security products.

The signature status is categorized as:
- **Microsoft Signed**: Signed by Microsoft Corporation. These are trusted and receive a -20 risk penalty.
- **Third-Party Signed**: Signed by a non-Microsoft vendor. These receive a +15 risk penalty because third-party signing is easier to obtain.
- **Unsigned**: No digital signature. These receive a +40 risk penalty because unsigned drivers are more suspicious.
- **Invalid**: Signature is present but invalid (hash mismatch, expired certificate, etc.). These receive a +50 risk penalty.
- **Unknown**: Signature verification failed (PowerShell not available, file corrupted, etc.). These receive a +20 risk penalty as a conservative default.

The scanner also maintains a whitelist of known safe Microsoft drivers: ntoskrnl.exe, hal.dll, disk.sys, ntfs.sys, etc. These are skipped entirely because they are core Windows components and cannot be BYOVD vectors.

## Risk Scoring: The Confidence Model

The scanner assigns each driver a risk score from 0-100 and a confidence level (MINIMAL, LOW, MEDIUM, HIGH, CONFIRMED). The scoring model is intentionally conservative: it prefers false negatives over false positives. Flagging a safe driver as vulnerable causes unnecessary work. Missing a vulnerable driver is unfortunate but acceptable given the limitations of static analysis.

The risk score is calculated as:

\`\`\`
base_score = 0

# Known vulnerability (highest weight)
if is_known_vuln:
    base_score += 50

# Risky imports (weighted by danger tier)
for each risky_import:
    if import in HIGH_VALUE_PRIMITIVES:
        base_score += 8
    elif import in MEDIUM_VALUE_PRIMITIVES:
        base_score += 4
    else:
        base_score += 2

# Suspicious exports (high weight because intent is clear)
for each suspicious_export:
    base_score += 10

# IOCTL surface penalty (amplifies when dangerous imports present)
base_score += ioctl_surface.risk_penalty()

# Signature penalty
base_score += signature.risk_penalty()

# Entropy penalty
for each suspicious_entropy_section:
    base_score += 3

# Cap at 100
risk_score = min(base_score, 100)
\`\`\`

The confidence level is determined by combining dangerous primitives with accessible attack surfaces:

- **CONFIRMED**: Driver matches known vulnerable IOC database entry
- **HIGH**: Has high-value primitives (MmMapIoSpace, MmCopyMemory, etc.) AND accessible attack surface (symbolic link or world-accessible device)
- **MEDIUM**: Has high-value primitives but no accessible attack surface, OR has medium-value primitives with accessible attack surface
- **LOW**: Has some risky imports but no high-value primitives
- **MINIMAL**: No risky imports, no suspicious exports, no IOCTL surface

The critical insight is that confidence requires BOTH capability (what the driver can do) AND accessibility (how an attacker reaches it). A driver with MmMapIoSpace but no IOCTL interface is not directly exploitable. A driver with a wide IOCTL surface but only benign imports is not directly exploitable. The combination is what matters.

## Runtime Analysis: Windows-Only Live Inspection

On Windows, the scanner can perform runtime analysis to cross-reference static findings with actual loaded drivers. This uses EnumDeviceDrivers from psapi.dll to enumerate all loaded kernel modules, then checks if any match the drivers being scanned.

Runtime analysis provides:
- **is_loaded**: Whether the driver is currently loaded in the kernel
- **base_address**: The load address of the driver
- **device_objects**: List of device objects created by the driver
- **has_world_accessible_device**: Whether any device object has permissive ACLs (Everyone or Authenticated Users)

The runtime analysis is particularly useful for identifying drivers that are both statically suspicious AND currently active. A vulnerable driver that is not loaded cannot be exploited immediately. A vulnerable driver that is loaded with a world-accessible device object is an active threat.

The runtime analysis has limitations:
- It only works on Windows (requires psapi and WMI)
- It requires administrator privileges
- It cannot inspect drivers that load after the scan
- Device object ACL inspection is heuristic and may miss complex permission structures

## Output Formats: Technical and Machine-Readable

The scanner generates two output formats to serve different use cases:

**JSON output (output.json)**: Machine-readable format for automation and SIEM integration. Each driver report includes:
- Driver metadata (name, path, SHA256, signature status)
- Risk assessment (score, level, BYOVD candidate flag, confidence)
- Static analysis results (risky imports, suspicious exports, IOCTL surface, entropy)
- Runtime analysis results (if available)
- Known vulnerability information (if matched against IOC database)

The JSON structure is normalized and typed, making it suitable for:
- EDR policy generation (block drivers with risk_score > 50)
- SIEM alerting (correlate driver loads with risk scores)
- Automated triage (sort by risk_score for manual review)

**Technical report (output_tech.txt)**: Human-readable format for security analysts. The report includes:
- Per-driver vulnerability analysis with context
- Specific indicators detected (which imports, which exports, which IOCTL patterns)
- Confidence scores with reasoning (why this driver is flagged)
- Remediations or mitigations (block the driver, update to patched version, etc.)

The technical report is designed for manual review. It explains the "why" behind each flag, providing the context needed to make informed decisions about whether to block a driver.

## Integration with kdmapper and Offensive Tools

The scanner has offensive applications as well. Security researchers and red teams use kdmapper to load vulnerable drivers for testing. The scanner helps identify suitable target drivers:

1. Scan the driver store for potential targets
2. Review the output for exploitable vulnerabilities
3. Verify the driver is signed (required for kdmapper)
4. Verify the driver is likely whitelisted (Microsoft or major vendor signature)
5. Use the driver with kdmapper for driver loading and exploitation

The scanner's IOCTL surface analysis is particularly useful here: identifying drivers with symbolic links and wide IOCTL surfaces helps find drivers that are easily reachable from usermode. The import analysis identifies which primitives the driver exposes once loaded.

This offensive use case is intentional. Understanding BYOVD from both sides—defensive and offensive—is necessary for comprehensive security. The scanner is a dual-use tool.

## Implementation Status and Limitations

The scanner is complete and functional for its intended purpose. It successfully scans driver directories, performs static analysis, generates IOCs, and produces actionable reports. However, there are inherent limitations to static analysis that should be acknowledged:

**False positives**: The scanner flags code patterns, not actual vulnerabilities. A driver that imports MmMapIoSpace might use it legitimately for hardware memory mapping. The confidence model mitigates this by requiring multiple signals before flagging as HIGH confidence, but manual review is still necessary.

**False negatives**: Sophisticated vulnerabilities may not leave obvious import patterns. A driver might implement arbitrary memory read/write through a combination of benign-looking imports. A driver might resolve imports dynamically at runtime to avoid static detection. The scanner cannot catch these cases.

**IOC database dependence**: The CONFIDENCE level depends entirely on the loldrivers.io database. If a vulnerable driver is not in the database, the scanner cannot flag it as CONFIRMED, even if it has obvious vulnerabilities. This is why the heuristic analysis exists—to catch unknown vulnerabilities.

**Windows-only runtime analysis**: The runtime analysis only works on Windows. Linux and macOS systems cannot benefit from the loaded driver enumeration, though the static analysis works cross-platform.

**No dynamic analysis**: The scanner does not load drivers in a sandbox or test behavior. It cannot identify vulnerabilities that only manifest at runtime, such as race conditions or use-after-free bugs.

**No exploit generation**: The scanner identifies potential vulnerabilities but does not generate exploit code. It is a defensive tool, not an offensive framework.

## Lessons Learned

Building this scanner revealed several insights about BYOVD detection:

**Static analysis is necessary but not sufficient**: You cannot scan thousands of drivers with dynamic analysis—too slow, too dangerous, too expensive. Static analysis provides the first line of defense, filtering drivers down to a manageable set for manual review. The false positive rate is acceptable if the review process is efficient.

**Confidence models matter more than binary classification**: Labeling a driver as "vulnerable" or "not vulnerable" is misleading. A spectrum of confidence with clear reasoning is more useful for decision-making. Analysts need to know WHY a driver is flagged, not just THAT it is flagged.

**IOC databases are force multipliers**: The loldrivers.io integration transforms the scanner from a heuristic tool to a threat intelligence platform. Known vulnerable drivers are instantly identified without complex analysis. The cache design ensures this works offline and at scale.

**The attacker's advantage is persistence**: Attackers only need one vulnerable driver. Defenders need to identify all of them, keep the IOC database updated, and block them without breaking legitimate hardware. This asymmetry means perfect defense is impossible. The goal is risk reduction, not elimination.

**BYOVD is a symptom, not the disease**: The root cause is vendors shipping drivers with insufficient security review. The scanner treats the symptom (identifying vulnerable drivers), but the long-term fix is improving driver development practices.

## Future Directions

Potential improvements to the scanner include:

**YARA rule integration**: Add YARA pattern matching for known vulnerable code patterns, not just imports. This would catch vulnerabilities that don't involve dangerous imports.

**Control flow graph analysis**: Build CFGs for IOCTL handlers to identify missing parameter validation, buffer overflows, and other code-level vulnerabilities. This requires disassembly and is significantly more complex.

**Machine learning model**: Train a classifier on known vulnerable vs safe drivers to identify subtle patterns that heuristic rules miss. This would require a large labeled dataset and careful validation to avoid bias.

**Sandbox integration**: Load suspicious drivers in a kernel sandbox to observe actual behavior and confirm vulnerabilities. This is high-risk and high-effort but would provide definitive results.

**Vendor collaboration**: Work with driver vendors to fix identified vulnerabilities before they are exploited. The scanner could generate vulnerability reports with proof-of-concept code for responsible disclosure.

**API integration**: Provide a REST API for on-demand scanning of individual drivers submitted by users. This would make the scanner accessible to organizations without deploying the full tool.

## Conclusion

BYOVD Scanner is a practical tool for identifying drivers vulnerable to BYOVD attacks through static analysis. It combines IOC database matching, heuristic import/export analysis, IOCTL surface estimation, and entropy analysis to generate actionable intelligence for security teams.

The scanner acknowledges the limitations of static analysis and provides a confidence model that reflects uncertainty. It is not a vulnerability scanner in the traditional sense—it does not prove vulnerabilities exist. It is a prioritization tool that identifies drivers worth investigating.

For blue teams, the scanner provides visibility into the driver ecosystem and helps identify high-risk drivers before they are exploited. For red teams, the scanner helps identify exploitable drivers for testing. For driver developers, the scanner provides feedback on which imports and exports are suspicious, encouraging more secure design.

The BYOVD problem will persist as long as vendors ship vulnerable drivers. The scanner reduces risk by making it easier to identify and block these drivers, but it does not solve the underlying problem. Long-term security requires improving driver development practices, not just detecting bad drivers after they ship.`},{id:`monitor-def-not-mal`,title:`Monitor-Def-Not-Mal: An APT Simulation Framework`,subtitle:`A modular client-server framework implementing covert C2 channels, evasion techniques, and persistence mechanisms for authorized security research and EDR testing.`,date:`2024`,categories:[`tools`,`security`,`closed`],tags:[`security`,`python`,`apt`,`red-team`,`c2`,`evasion`],readTime:`15 min`,featured:!1,content:`## Architecture

The framework implements a client-server model where the server acts as the simulated target and the client provides administrative control. This separation allows the server to run autonomously on target systems while operators interact through the client interface.

Server modules are organized by function: \`api_routes.py\` exposes Flask REST endpoints, \`monitoring.py\` handles system data collection, \`advanced_c2.py\` implements multi-channel command and control, \`anti_debug.py\` and \`anti_vm.py\` provide analysis evasion, \`evasion.py\` handles string obfuscation and control flow flattening, \`persistence_manager.py\` manages installation mechanisms, \`surveillance_suite.py\` captures audio/video, and \`encryption.py\` provides AES-256 payload encryption.

The client side consists of \`gui.py\` (Tkinter interface), \`api_client.py\` (REST wrapper), \`server_tab.py\` (per-server management), and \`callback_listener.py\` (reverse connection handler). Communication occurs over REST API for explicit commands and reverse TCP connections for callback-based operation.

## Multi-Channel Command & Control

The framework implements three covert communication channels commonly used by APTs:

**DNS Tunneling** encodes data in subdomain queries and retrieves commands via TXT record responses. The DNS channel operates through the system's default resolver, making it difficult to detect at the network layer since DNS traffic is ubiquitous.

**ICMP Covert Channels** embed commands in ICMP echo request payloads. By using the data field of ping packets, the framework can transmit small commands that blend into normal network diagnostic traffic.

**Dead Drops** use public services like Pastebin or GitHub Gists for configuration distribution and command retrieval. This asymmetric communication pattern—where the target polls a public endpoint rather than maintaining a persistent connection—reduces the attack surface and makes detection harder.

These channels are not mutually exclusive. The framework can fail over between them, and operators can configure which channels are active based on the target environment.

## Evasion Techniques

The evasion module implements techniques that malware uses to avoid analysis:

**Debugger Detection** checks for the presence of debuggers using Win32 APIs (\`IsDebuggerPresent\`, \`CheckRemoteDebuggerPresent\`) and timing-based detection. By measuring execution time of known instructions and comparing against expected baselines, the framework can detect when a debugger is single-stepping through code.

**VM Detection** uses hardware fingerprinting to identify virtualized environments. Techniques include checking CPUID return values, inspecting MAC address prefixes for known virtualization vendors, and detecting hypervisor-specific registry keys and processes.

**String Obfuscation** uses XOR encryption with runtime decryption. Strings are stored encrypted in the binary and decrypted only when needed, preventing static analysis from extracting meaningful strings from the compiled executable.

**Process Injection** implements DLL injection via \`CreateRemoteThread\` and process hollowing. These techniques allow the framework to execute code in the context of legitimate processes, bypassing application-level controls.

## Persistence Mechanisms

The persistence manager implements multiple techniques for surviving system reboots:

**Registry Run Keys** add entries to \`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\` and \`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\`. These are the most basic persistence mechanisms but are also the most easily detected.

**Windows Services** create a system service using \`OpenSCManager\`, \`CreateService\`, and \`StartService\`. Services run with system privileges and start automatically on boot, making them more persistent than registry keys.

**WMI Event Subscriptions** use Windows Management Instrumentation to trigger execution on specific events like user login or system startup. WMI-based persistence is harder to detect because it lives outside the normal startup locations.

**Scheduled Tasks** create tasks via the Task Scheduler API with triggers like "At logon" or "At startup." Tasks can be configured to run with specific user contexts and with various privilege levels.

The framework can use multiple persistence mechanisms simultaneously for redundancy, and operators can configure which mechanisms are deployed based on the target environment.

## Build System

The framework uses Nuitka to compile Python to native C code, producing standalone executables. Nuitka translates Python bytecode to C, compiles it with a C compiler, and links it against the Python runtime statically.

This approach provides several advantages:

**No Python Runtime Dependency**—the executable contains everything needed to run, eliminating the need to install Python on target systems.

**Single-File Distribution**—Nuitka can bundle all dependencies into a single executable, simplifying deployment.

**Performance**—compiled code executes faster than interpreted Python, which matters for time-sensitive operations like anti-debug timing checks.

**Console Control**—builds can be configured with or without a console window, allowing the framework to run silently in the background.

The build process is automated via \`build.bat\`, which handles Nuitka invocation, dependency bundling, and code signing.

## Security Controls

The framework includes several controls to limit misuse:

**API Key Authentication**—all REST endpoints require a valid API key in the \`X-API-Key\` header. Keys are configurable and rotate on a schedule defined by the operator.

**Data Retention Policies**—collected data (keystrokes, screenshots, audio) is automatically deleted after a configurable retention period. This prevents indefinite data accumulation.

**Local Network Operation**—by default, the server binds to localhost and the client connects to local addresses only. Remote operation requires explicit configuration and is discouraged.

**Educational Checks**—the framework includes checks that log when it detects analysis environments, but these do not block execution. This allows researchers to study the detection mechanisms without being locked out of the tool.

These controls are designed to make the framework suitable for authorized use while acknowledging that determined actors can bypass them. The framework is not a security product; it is a research tool.

## Technical Implementation Details

The REST API in \`api_routes.py\` exposes endpoints for monitoring data retrieval, command execution, and configuration updates. All responses are JSON-formatted. Endpoints include \`/api/status\` (server health), \`/api/monitoring\` (system data), \`/api/execute\` (command execution), and \`/api/config\` (configuration management).

The monitoring module in \`monitoring.py\` collects system information using WMI queries, registry reads, and direct API calls. Data collected includes running processes, network connections, installed software, and system configuration. This data is cached and updated on a configurable interval.

The encryption module uses AES-256 in CBC mode with PKCS7 padding. Keys are derived from a configurable passphrase using PBKDF2 with 100,000 iterations. Encrypted payloads include the C2 configuration, persistence settings, and any exfiltrated data.

The surveillance suite captures audio using the PyAudio library and video using the mss (Multiple Screen Shots) library. Captures are compressed before transmission to reduce bandwidth usage. Audio is encoded as MP3, video as JPEG frames at a configurable frame rate.

## Applications

The framework serves several use cases in authorized security contexts:

**Security Research**—understanding how APTs implement covert channels, evasion techniques, and persistence mechanisms. By implementing these techniques, researchers can develop better detection signatures and defensive controls.

**Red Team Operations**—simulating adversary behavior during authorized penetration tests. The framework provides realistic C2 infrastructure without the operational overhead of maintaining custom malware.

**EDR Testing**—evaluating endpoint detection and response systems by deploying the framework in a test environment and analyzing which techniques are detected and which evade detection.

**Incident Response Training**—providing a realistic adversary simulation for training IR teams. Trainees can detect, contain, and remediate the framework's persistence mechanisms and C2 channels in a controlled environment.

The framework is explicitly designed for educational and authorized testing purposes. Unauthorized deployment is illegal and unethical.`}];function t(t){return e.find(e=>e.id===t)}function n(n,r=3){let i=t(n);if(!i)return[];let a=new Set(i.tags||[]),o=new Set(i.categories||(i.category?[i.category]:[]));return e.filter(e=>e.id!==n).map(e=>{let t=e.tags||[],n=e.categories||(e.category?[e.category]:[]),r=0;for(let e of t)a.has(e)&&r++;let i=0;for(let e of n)o.has(e)&&i++;return{w:e,score:r*3+i}}).filter(({score:e})=>e>0).sort((e,t)=>t.score-e.score).slice(0,r).map(({w:e})=>e)}var r=[{id:`all`,label:`all`},{id:`systems`,label:`systems`},{id:`tools`,label:`tools`},{id:`reverse-engineering`,label:`reverse engineering`},{id:`security`,label:`security`},{id:`fullstack`,label:`full stack`},{id:`data`,label:`data`},{id:`closed`,label:`closed source`}];export{e as i,t as n,r,n as t};