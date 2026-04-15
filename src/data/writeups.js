export const writeups = [
  {
    id: 'flux-messaging',
    title: 'Flux: High-Performance Messaging Platform',
    subtitle: 'A modern real-time messaging platform combining a Rust-powered backend with a React frontend.',
    date: '2024',
    category: 'systems',
    tags: ['rust', 'react', 'websockets', 'postgresql'],
    readTime: '12 min',
    featured: true,
    content: `## Architecture Overview

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

Flux is a closed-source project with core messaging features complete. Planned additions include voice channels, message search, and a plugin system for custom functionality.`
  },
  {
    id: 'arkvisor',
    title: 'ArkVisor: Building a Hypervisor from Scratch',
    subtitle: 'Implementing hardware virtualization with Intel VT-x to understand how hypervisors work at the lowest level.',
    date: '2024',
    category: 'systems',
    tags: ['hypervisor', 'vmx', 'c++', 'kernel'],
    readTime: '15 min',
    featured: true,
    content: `## Overview

ArkVisor is a Type-2 hypervisor built from scratch to understand how hardware virtualization actually works. It implements Intel VT-x (Virtualization Technology) extensions to run guest operating systems with near-native performance.

## What is a Hypervisor?

A hypervisor (or Virtual Machine Monitor) is software that creates and runs virtual machines. Type-1 hypervisors run directly on hardware; Type-2 hypervisors like ArkVisor run on top of a host OS.

## Intel VT-x Architecture

### VMX Operation

VT-x introduces two new operation modes:

- **VMX Root Operation**: Where the hypervisor runs
- **VMX Non-Root Operation**: Where guest code runs

Transitions between these modes are called VM entries (into guest) and VM exits (back to hypervisor).

### Key Components

**VMCS (Virtual Machine Control Structure)**
A memory region that controls VM behavior. It contains:
- Guest state (registers, CR3, etc.)
- Host state (saved on VM exit)
- Control fields (determine which operations cause VM exits)

**VM Entry**: Hypervisor launches guest by executing VMLAUNCH/VMRESUME
**VM Exit**: Guest triggers exit, control returns to hypervisor

## Implementation Details

### Memory Virtualization with EPT

Extended Page Tables provide hardware-assisted memory virtualization:

\`\`\`
Guest Virtual Address → Guest Physical Address → Host Physical Address
                    (Guest page tables)      (EPT page tables)
\`\`\`

This two-level translation allows the guest OS to manage its own page tables while the hypervisor maintains control over actual physical memory.

### VM Exit Handling

The hypervisor must handle various exit reasons:

- **CPUID**: Intercept to return virtualized processor info
- **IN/OUT**: Virtualize device I/O
- **RDMSR/WRMSR**: Model-specific register access
- **EPT Violations**: Handle memory access violations
- **HLT/SHUTDOWN**: Guest idle or crashed

### Hypercall Interface

Guest-to-hypervisor communication via special instructions:

\`\`\`c
// Guest calls hypervisor
__asm {
    mov rax, HYPERCALL_ID
    vmcall          // Causes VM exit with specific reason
}
\`\`\`

## Anti-Detection Techniques

Modern hypervisors face detection by sophisticated software. ArkVisor implements:

### Timing Attack Prevention

- TSC (Time Stamp Counter) offsetting
- RDTSC exiting control
- Virtualized timing sources

### CPUID Spoofing

Return modified CPUID results to hide hypervisor presence:

\`\`\`c
case CPUID_HYPERVISOR_PRESENT:
    // Clear hypervisor present bit
    ctx->rax &= ~(1 << 31);
    break;
\`\`\`

### MSR Filtering

Intercept MSR reads that reveal hypervisor presence (like IA32_HYPERVISOR_CALLBACK_ADDR).

## Challenges Faced

### Nested Page Tables

Debugging EPT violations required custom logging and careful page table construction. One bit error in the EPT entry caused complete guest crashes.

### State Management

Saving and restoring x87 FPU and XMM state correctly across VM exits was complex. Missing the XSAVE path caused floating-point corruption in guests.

### APIC Virtualization

Interrupt handling requires careful APIC (Advanced Programmable Interrupt Controller) state management. The hypervisor must virtualize interrupt delivery while allowing performance-critical operations.

## Current Status

ArkVisor successfully launches a Windows guest and handles basic I/O. Working on:

- APIC virtualization for multi-core support
- Device emulation (disk, network)
- Snapshot/checkpoint functionality

## What I Learned

Building a hypervisor revealed how much complexity modern processors hide. The interplay between paging, segmentation, and virtualization creates edge cases that took weeks to debug. Understanding VT-x has been invaluable for reverse engineering and security research.`
  },
  {
    id: 'atlus',
    title: 'Atlus: Native Binary Diff Workbench',
    subtitle: 'A fast, native binary diff and reverse engineering workbench for Windows PE files.',
    date: '2024',
    category: 'tools',
    tags: ['reverse-engineering', 'pe', 'c++', 'dear-imgui'],
    readTime: '10 min',
    featured: true,
    content: `## Overview

Atlus is a native Windows application for binary diffing and reverse engineering analysis. Built for speed and precision, it compares PE (Portable Executable) files at multiple abstraction levels and generates actionable signatures for security research.

## Architecture

### Multi-Layer Design

Atlus uses a four-layer architecture:

\`\`\`
┌─────────────────────────────┐
│  GUI Layer (Dear ImGui)     │
│  - Dockable panels          │
│  - Interactive visualizations│
├─────────────────────────────┤
│  Analysis Engine (atlus_core)│
│  - Diff algorithms          │
│  - Pattern matching         │
├─────────────────────────────┤
│  PE Parser (LIEF)           │
│  - Section analysis         │
│  - Import/Export tables     │
├─────────────────────────────┤
│  Disassembler (Zydis)       │
│  - x86/x64 decoding         │
│  - Control flow analysis    │
└─────────────────────────────┘
\`\`\`

### Four-Level Diff Engine

**Level 1: Byte Diff**
Raw byte-by-byte comparison. Fast but noisy — useful for detecting exact matches and small changes.

**Level 2: Section Diff**
Compare PE sections (text, data, rsrc, etc.). Identifies which code/data regions changed.

**Level 3: Function Diff**
Align functions between binaries and compare instruction sequences. Handles reordering and inlining.

**Level 4: AOB Signature Generation**
Generate Array-of-Bytes signatures that match the changed code even across versions.

## Key Features

### Interactive Disassembly

- Zydis-powered x86/x64 disassembly
- Control flow graph visualization
- Cross-references (xref) tracking
- Function boundary detection

### Decompiler Integration

Ghidra decompiler bridge for C pseudocode:

- Automatic function decompilation
- Type inference and variable naming
- Side-by-side source/asm view

### Pattern Scanning

Multiple signature formats supported:

- **IDA-style**: \`48 89 5C 24 ? 48 89 74 24 ? 57 48 83 EC ?\`
- **Cheat Engine**: \`48 89 5C 24 ?? 48 89 74 24 ?? 57\`
- **Raw bytes**: Exact byte sequences

### Batch Processing

Process multiple file pairs with automated reporting:

\`\`\`
Atlus.exe --batch config.json --out report.html
\`\`\`

## Use Cases

### Game Security Research

- Compare game builds to identify anti-cheat changes
- Generate signatures for bypass development
- Analyze packed/protected binaries

### Malware Analysis

- Track malware evolution across samples
- Identify code reuse between families
- Extract C2 configuration structures

### Software Patching

- Verify patch correctness
- Assess security update coverage
- Generate test cases for changes

## Performance

Atlus is optimized for speed:

- **100MB+ binaries**: Diff in < 2 seconds
- **Parallel processing**: Multi-threaded analysis
- **Memory efficient**: Streaming parser for large files
- **Lazy loading**: Load sections on demand

## Technical Highlights

### LIEF Integration

The LIEF library provides robust PE parsing:

\`\`\`cpp
auto binary = LIEF::PE::Parser::parse("game.exe");
for (const auto& section : binary->sections()) {
    if (section.name() == ".text") {
        analyzeCodeSection(section);
    }
}
\`\`\`

### Zydis Disassembly

Fast, accurate instruction decoding:

\`\`\`cpp
ZydisDecodedInstruction instruction;
ZydisDecoderDecodeBuffer(&decoder, data, size, &instruction);
// Access instruction details: opcode, operands, etc.
\`\`\`

### Dear ImGui Docking

Professional UI with dockable panels:

- Split views for before/after comparison
- Tabbed interface for multiple files
- Customizable layout persistence

## What I Learned

Building Atlus taught me about:
- PE file format intricacies
- Instruction encoding edge cases
- GUI design for technical tools
- Performance optimization in C++
- Integration of multiple specialized libraries

The project reinforced that good reverse engineering tools require both deep technical knowledge and attention to user experience.`
  },
  {
    id: 'wdfilterdrv',
    title: 'WdFilterDrv: Kernel-Mode Driver Development',
    subtitle: 'Building a Windows kernel-mode driver to understand OS internals at the lowest level.',
    date: '2024',
    category: 'systems',
    tags: ['kernel', 'driver', 'c++', 'windows'],
    readTime: '14 min',
    featured: true,
    content: `## Overview

WdFilterDrv is a Windows kernel-mode driver built to understand how the operating system works at the lowest level. It implements shared memory communication across the kernel/user boundary, manual module mapping, and process-level memory operations.

## Why Kernel Development?

Kernel-mode code runs with the highest privileges (Ring 0), allowing:

- Direct hardware access
- Memory management control
- Process/ thread manipulation
- System-wide hooking

This power comes with responsibility — bugs here crash the entire system.

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

Kernel development is challenging but deeply rewarding for understanding how operating systems truly work.`
  },
  // Additional writeups with shorter content
  {
    id: 'cs2-extern',
    title: 'CS2 External: Kernel Memory Operations',
    subtitle: 'External process tool with custom kernel-mode driver and rendering library.',
    date: '2024',
    category: 'systems',
    tags: ['kernel', 'rendering', 'c++', 'rust'],
    readTime: '11 min',
    featured: false,
    content: `## Overview

An external process tool for Counter-Strike 2 featuring a custom kernel-mode driver for memory operations and a from-scratch rendering library.

## Key Components

### Kernel Driver
- Shared memory IPC for kernel/user communication
- Process memory read/write operations
- Manual PE mapper for module loading

### zdraw (Custom Renderer)
Built from scratch with:
- FreeType for font rendering
- BVH spatial system for entity processing
- DirectX 11 integration

### User Interface
- Dear ImGui docking interface
- Real-time overlay rendering
- Configurable hotkey system

## Technical Details

### Memory Layout
\`\`\`
User Mode Process          Kernel Driver              Target Process
    |                             |                           |
    |-- IOCTL/Shared Mem ------->|-- Read/Write Memory ----->|
    |                             |                           |
    |<-- Data -------------------|<-- Results ---------------|
\`\`\`

### Rendering Pipeline
1. Hook Present() or ResizeBuffers()
2. Create render target view
3. Initialize ImGui context
4. Render overlay each frame
5. Cleanup on detach

## What I Learned

- Kernel driver architecture and debugging
- DirectX graphics programming
- Memory layout in modern games
- Anti-cheat detection vectors
- Process synchronization techniques`
  },
  {
    id: 'gif-engine',
    title: 'Gif-Engine: Desktop Animation Manager',
    subtitle: 'Process-isolated GIF rendering with per-pixel transparency on Windows.',
    date: '2024',
    category: 'tools',
    tags: ['rust', 'windows', 'gui', 'multimedia'],
    readTime: '8 min',
    featured: false,
    content: `## Overview

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
- System tray implementation`
  },
  {
    id: 'fbla-spotlocal',
    title: 'SpotLocal: FBLA Coding Competition Project',
    subtitle: 'Offline-first web application for local business discovery.',
    date: '2025',
    category: 'fullstack',
    tags: ['react', 'pwa', 'accessibility', 'fbla'],
    readTime: '9 min',
    featured: false,
    content: `## Overview

Built for FBLA Coding & Programming 2025-26 competition. An offline-first web application for local business discovery with zero-cost infrastructure.

## Features

### Offline-First Architecture
- Service Worker for caching
- LocalStorage for user data
- No backend required

### Interactive Maps
- Leaflet.js integration
- Custom markers for businesses
- Location-based search

### Smart Assistant
- Voice command support
- Natural language search
- Accessibility-first design

### Search
- Fuzzy matching with Levenshtein distance
- Category filtering
- Rating-based sorting

## Technical Stack

- React 18 with functional components
- Tailwind CSS for styling
- Leaflet for maps
- Web Speech API for voice
- Workbox for PWA features

## Competition Results

- 1st Place: District
- 1st Place: State
- Qualified for Nationals

## What I Learned

- PWA development patterns
- Accessibility standards (WCAG)
- Voice interface design
- Client-side search algorithms
- Competition preparation strategies`
  },
  {
    id: 'snowflake-analytics',
    title: 'Yelp Analytics: Snowflake Data Warehouse',
    subtitle: 'Cloud data pipeline analyzing restaurant reviews.',
    date: '2025',
    category: 'data',
    tags: ['snowflake', 'sql', 'python', 'analytics'],
    readTime: '7 min',
    featured: false,
    content: `## Overview

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
- Production data analysis`
  },
  {
    id: 'rune-editor',
    title: 'Rune Editor: Memory Manipulation Tool',
    subtitle: 'Process memory editor with React frontend and C++ backend.',
    date: '2024',
    category: 'tools',
    tags: ['memory', 'react', 'cpp', 'reverse-engineering'],
    readTime: '6 min',
    featured: false,
    content: `## Overview

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
- Process debugging techniques`
  },
  {
    id: 'hd2-cheats',
    title: 'Helldivers 2: Game Modification Framework',
    subtitle: 'DLL injection, DirectX overlay, and anti-cheat bypass techniques.',
    date: '2024',
    category: 'systems',
    tags: ['dll-injection', 'directx', 'rust', 'cpp'],
    readTime: '13 min',
    featured: false,
    content: `## Overview

Game modification framework for Helldivers 2 featuring DLL injection, DirectX overlay rendering, and anti-cheat bypass techniques.

## Components

### DLL Injector
- Manual mapping for stealth
- Thread hijacking technique
- Cleanup and error handling

### Injected DLL
- DirectX 12 hooking
- ImGui overlay rendering
- Feature implementation

### Lua Bypass
- Script-based bypass techniques
- Signature scanning automation
- Configuration system

## Technical Details

### DirectX Hook
\`\`\`cpp
// Hook Present or ResizeBuffers
void** vtable = *(void***)swapChain;
present_orig = (Present_t)vtable[8];
vtable[8] = &Present_Hook;
\`\`\`

### Pattern Scanning
\`\`\`rust
fn find_pattern(module: &str, pattern: &str) -> Option<usize> {
    let bytes = parse_pattern(pattern);
    let (start, size) = get_module_range(module)?;
    
    for i in 0..size - bytes.len() {
        if compare_bytes(start + i, &bytes) {
            return Some(start + i);
        }
    }
    None
}
\`\`\`

## What I Learned

- DLL injection techniques
- DirectX 12 internals
- Anti-cheat detection methods
- Rust/CPP interop
- Lua scripting integration`
  },
];

// Helper function to get writeup by ID
export function getWriteupById(id) {
  return writeups.find(w => w.id === id);
}

// Helper function to get related writeups
export function getRelatedWriteups(currentId, limit = 3) {
  const current = getWriteupById(currentId);
  if (!current) return [];

  return writeups
    .filter(w => w.id !== currentId && w.tags.some(tag => current.tags.includes(tag)))
    .slice(0, limit);
}

// Export categories for filtering
export const writeupCategories = [
  { id: 'all', label: 'all' },
  { id: 'systems', label: 'systems' },
  { id: 'tools', label: 'tools' },
  { id: 'fullstack', label: 'full stack' },
  { id: 'data', label: 'data' },
];
