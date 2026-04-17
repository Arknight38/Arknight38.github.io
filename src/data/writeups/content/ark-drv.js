export const arkdrv = {
  id: 'ark-drv',
  title: 'Ark-Drv: A Custom Kernel Driver for Game Memory Access',
  subtitle: 'Lessons from building a stealthy Windows kernel driver that replaces CORMEM with process memory allocation, VAD walking, and BattlEye evasion.',
  date: '2024-2026',
  categories: ['tools', 'reverse-engineering', 'security', 'kernel-development'],
  tags: ['windows-driver', 'kernel', 'wkd', 'battleye-evasion', 'physical-memory', 'vad-walking', 'manual-mapping'],
  readTime: '14 min',
  featured: true,
  content: `## The Problem with CORMEM

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

The core insight remains: operate within the bounds of legitimate kernel behavior. Use documented APIs, avoid hooks, choose innocuous names, and design for the specific anti-cheat's scanning patterns. The rest follows.`
};
