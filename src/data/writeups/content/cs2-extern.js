export const cs2Extern = {
  id: 'cs2-extern',
  title: 'CS2 External: Kernel Memory Operations',
  subtitle: 'External process tool with custom kernel-mode driver and rendering library.',
  date: '2024',
  categories: ['closed', 'systems', 'reverse-engineering'],
  tags: ['kernel', 'rendering', 'c++', 'rust'],
  readTime: '11 min',
  featured: false,
  content: `## Overview

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
- A named shared section (Global\CS2ExternShared)
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

The most valuable outcome was understanding the complexity of building stealthy software that operates in hostile environments (anti-cheat protected games). The detection vectors are numerous and sophisticated, and true stealth requires deep knowledge of both the target application and the protection systems.`
};
