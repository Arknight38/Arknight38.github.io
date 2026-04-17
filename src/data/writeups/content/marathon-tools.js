export const arkmt = {
  id: 'ark-mt',
  title: 'ark-mt: A Game Analysis Toolkit for Marathon',
  subtitle: 'Lessons from building a kernel-assisted reverse engineering workbench for the Marathon game with layered memory access, pattern-driven discovery, and architectural separation between stealth and analysis.',
  date: '2024-2026',
  categories: ['tools', 'reverse-engineering', 'security', 'systems-programming'],
  tags: ['reverse-engineering', 'memory-analysis', 'c++', 'kernel-driver', 'pattern-scanning', 'game-research', 'dear-imgui'],
  readTime: '15 min',
  featured: true,
  content: `## The Problem with Traditional Game Analysis Tools

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

The core insight remains: separate privilege from analysis, separate discovery from action, and separate transport from interpretation. The rest follows.`
};
