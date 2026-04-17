export const arkvisor = {
  id: 'arkvisor',
  title: 'ArkVisor: Building a Hypervisor from Scratch',
  subtitle: 'Implementing hardware virtualization with Intel VT-x to understand how hypervisors work at the lowest level.',
  date: '2024',
  categories: ['systems', 'closed', 'security'],
  tags: ['hypervisor', 'vmx', 'c++', 'kernel'],
  readTime: '15 min',
  featured: true,
  content: `## The Problem with Learning Hypervisor Development

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

Understanding VT-x has been invaluable for reverse engineering and security research. Many anti-cheat systems use hypervisor-based techniques, and understanding how they work at the hardware level is essential for analyzing them. ArkVisor provided that foundation, and I hope this writeup helps others on the same journey.`
};
