export const atlus = {
  id: 'atlus',
  title: 'Atlus: A Unified IR Architecture for Binary Analysis',
  subtitle: 'Lessons from building a deterministically reproducible reverse engineering workbench with explicit invalidation and SQL-like query semantics.',
  date: '2024-2026',
  categories: ['tools', 'reverse-engineering', 'security', 'systems-programming'],
  tags: ['reverse-engineering', 'pe', 'c++', 'ir-design', 'incremental-analysis', 'dear-imgui'],
  readTime: '18 min',
  featured: true,
  content: `## The Problem with Traditional Reverse Engineering Tools

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

The core insight remains: treat binary analysis like compilation. Parse to IR, optimize, cache, invalidate, and present. The rest follows.`
};

