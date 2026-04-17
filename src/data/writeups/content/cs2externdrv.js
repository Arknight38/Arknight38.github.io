export const cs2externdrv = {
  id: 'cs2externdrv',
  title: 'CS2ExternDrv: Minimal R/W Driver',
  subtitle: 'A minimal kernel driver for CS2-Extern using shared memory only (no IOCTL), designed for kdmapper loading with process whitelisting.',
  date: '2024',
  categories: ['systems', 'closed', 'security'],
  tags: ['kernel', 'driver', 'shared-memory', 'c'],
  readTime: '12 min',
  featured: false,
  content: `## The Problem with Traditional IOCTL Drivers

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

The core architecture — shared memory only, no device object, polling thread — will remain. The minimal surface area design is fundamental to the project's goals.`
};
