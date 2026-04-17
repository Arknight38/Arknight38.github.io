export const hd2Cheats = {
  id: 'hd2-cheats',
  title: 'Helldivers 2: Game Modification Framework',
  subtitle: 'DLL injection, DirectX overlay, GameGuard bypass, and reverse-engineered game modification system.',
  date: '2024',
  categories: ['systems', 'reverse-engineering', 'security', 'closed'],
  tags: ['dll-injection', 'directx', 'rust', 'cpp', 'anti-cheat-bypass'],
  readTime: '20 min',
  featured: false,
  content: `## Overview

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
- **Cross-language integration**: C++ system code, Lua scripting, Python parsing, JavaScript configuration`
};