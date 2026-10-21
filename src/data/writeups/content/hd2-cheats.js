// Project article grounded in the current HD2 C++ source checkout.
export const hd2Cheats = {
  id: "hd2-cheats",
  title: "HD2: Bypass Executable and Internal DLL",
  subtitle:
    "A native C++ project combining process coordination, masked image scanning, reversible patch records, and modular DLL features.",
  date: "2024",
  categories: ["systems", "reverse-engineering", "security", "closed"],
  tags: [
    "cpp",
    "windows",
    "dll",
    "pattern-scanning",
    "reverse-engineering",
    "resource-lifetime",
  ],
  readTime: "7 min",
  featured: false,
  content: `## Overview

HD2 is a Windows C++20 project built around two native components: an anticheat-bypass executable and an internal DLL. The executable handles the external preparation and DLL-selection side; the DLL contains pattern discovery, feature dispatch, reversible patch records, and runtime state. Both have separate x64 Visual Studio projects.

The technical focus is the machinery underneath those components: locating code in a changing executable image, representing modifications as owned records, organizing feature-specific implementations, and handling configuration and artifact identity. The former Rust overlay is deprecated and no longer represents the project.

The DLL source describes a reconstruction informed by Ghidra analysis, and individual feature files retain source attributions. The implementation includes working infrastructure alongside incomplete feature branches, so the distinction between a registered feature and an implemented one matters throughout the project.

## Bypass executable: a separate native coordinator

The bypass executable owns the external process-management and preparation logic. Its source separates console output, process/module discovery, configuration, artifact downloads, patch handling, and DLL loading into individual modules. The executable's responsibility is distinct from the internal feature engine: startup work belongs outside the DLL's repeated runtime loop.

Process discovery returns structured module information containing a base pointer, image size, and path. That gives the surrounding code an explicit image identity and extent instead of treating an arbitrary address as sufficient context. Filesystem helpers also resolve the project directory relative to the installation, with a fallback location.

The bypass and loading paths report outcomes independently. The executable can perform its preparation role without loading a DLL, and DLL discovery or download failure has its own status. This is the useful architectural distinction: preparing a session and initializing the internal component are separate operations with separate results.

## DLL discovery and artifact verification

The executable searches for matching local DLL files, excludes directories, normalizes names for matching, and sorts the resulting paths. A separate download module provides a fallback when local artifacts are absent and downloads are enabled.

The configuration layer implements optional SHA-256 verification through Windows CNG. It streams the selected file through a 64 KiB buffer, finishes the digest, and formats the 32-byte result as hexadecimal. The configured digest is normalized before comparison.

The verification helper rejects a file when its digest cannot be calculated:

\`\`\`cpp
std::string actual = ComputeFileSha256(path);
if (actual.empty()) {
    std::wprintf(L"[!] Could not compute DLL hash.\\n");
    return false;
}
\`\`\`

This distinguishes failure to calculate a digest from a successful calculation. A separate comparison rejects a mismatch. Verification is optional in the current configuration; it establishes agreement with an expected digest when configured, rather than authenticating a publisher by itself.

## A render-free internal DLL

The DLL entry path separates runtime work from rendering. Its initialization path locates the target module, creates the patch manager, and publishes status. The repeated loop reads requested feature states, compares them with active records, and forwards numeric values to the manager.

The DLL also reports confirmed activity from the manager's actual state. That feedback is a supporting interface contract, rather than the project's central feature. The substantive work is inside the scanner, feature builders, and patch manager.

Some interface remnants still exist in this checkout, including shared-state headers and an external interface directory in the executable project. They do not make the deprecated Rust overlay the current subject. Likewise, the README's older graphics-hook description is not an accurate description of the render-free DLL entry path now present.

## Pattern scanner: explicit bytes and wildcards

The scanner represents each pattern element as either a concrete byte or an absent value:

\`\`\`cpp
using Pattern = std::vector<std::optional<uint8_t>>;
\`\`\`

This preserves a useful distinction: a literal zero is data, while an absent value accepts any byte. Parsing and matching remain separate operations, allowing a textual pattern to become a reusable representation before the image is searched.

The matching loop tests only concrete elements:

\`\`\`cpp
if (pattern[j].has_value() && chunk[i + j] != pattern[j].value())
{
    match = false;
    break;
}
\`\`\`

Although comments describe Boyer–Moore–Horspool, the current implementation checks candidate positions with a nested masked comparison. There is no bad-character skip table in this path. Its technical value is the explicit wildcard representation and bounded image traversal; the implementation should be described as it exists.

## Chunked scanning across read boundaries

The scanner uses a 256 KiB read window and extends each read by enough bytes to cover a pattern crossing the boundary. The size calculations are:

\`\`\`cpp
size_t readSize  = (std::min)(kChunk, m_size - offset);
size_t totalRead = (std::min)(readSize + patLen - 1, m_size - offset);
\`\`\`

The overlap is pattern-dependent rather than an arbitrary extra page. Advancing by the primary read size allows a candidate beginning near one window's end to include bytes from the next region. Both sizes are capped by the remaining image extent.

Internal and external read modes feed this same matcher. External reads require the reported byte count to equal the requested length; a failed read skips that window. The common matching representation therefore remains independent of how the bytes were acquired.

## Patch manager: original data belongs to the record

The manager groups modifications by feature key. Each applied record retains its location, original bytes, and replacement bytes:

\`\`\`cpp
struct AppliedPatch
{
    uintptr_t            addr     = 0;
    std::vector<uint8_t> original;
    std::vector<uint8_t> patched;
};
\`\`\`

Preserving original data makes restoration part of the representation. A feature can own multiple records, while the manager tracks activation by key and provides enable, disable, toggle, and disable-all operations. Numeric feature values live in a separate map instead of being conflated with active patch membership.

Cleanup takes a snapshot of active keys before reverting them, then releases tracked allocations. Copying the keys avoids iterating a container while the revert path changes it. This is a concrete ownership mechanism around runtime modification, rather than a claim that every multi-record operation is already transactional.

## Feature modules and implementation coverage

The dispatcher routes feature keys to seven domain modules. These keep domain-specific work separate from shared scanning and record management:

| Module | Technical responsibility in the source |
| --- | --- |
| Combat | Resource, health, weapon-behavior, and equipment-related handlers. |
| Movement | Locomotion and movement-state handlers, with several unfinished branches. |
| Mission | Timer and map-related handlers. |
| Stratagems | Ability availability and related state handlers. |
| Farming | Resource collection and reward-related handlers. |
| Unlocks | Equipment and progression-related handlers. |
| Gamemode | A registered module whose current builder returns failure. |

The shared builder interface returns a collection of patch records. Simple cases use a common specification helper; more involved cases build their own records. That division reduces repeated bookkeeping while allowing different feature implementations beneath one manager.

Coverage is uneven. A name appearing in the dispatcher does not establish that its builder succeeds, and the source contains explicit TODO branches. The portfolio can explain the modular implementation without presenting the entire feature inventory as complete or verified against a current game build.

## INI parsing and default migration

The DLL includes an INI manager with sections, string values, typed getters, and default-file creation. It trims whitespace, skips comment lines, parses section headers, and splits assignments at the first equals sign.

A second pass through the default configuration backfills missing keys while preserving existing values:

\`\`\`cpp
if (!defSec->keys.count(key))
{
    defSec->keys[key] = val;
    changed = true;
}
\`\`\`

This is a small configuration migration mechanism: a new default can appear without replacing a previously saved preference. Numeric getters return a fallback on conversion failure. The parser is implemented, but the settings-load call in the current DLL startup is commented out, so automatic loading should not be described as active integration.

## Concepts explored

The project connects executable-image interpretation, masked byte matching, chunk-boundary handling, reversible state records, native process coordination, and artifact hashing. Reconstruction from decompiled material also requires separating historical descriptions from the implementation now in the tree. Those concrete mechanisms are the strongest technical story of the bypass executable and DLL.

## Things to do next

The next useful work is fixture-based testing of pattern parsing and boundary matches, verification of multi-record rollback behavior, and an explicit implemented-versus-placeholder feature inventory. Configuration integration and orderly worker shutdown also remain unfinished. These would make the current native components easier to validate without rebuilding the deprecated interface.
`,
};
