export const arkmt = {
  id: "ark-mt",
  title: "ark-mt: Building Responsive Analysis Tools",
  subtitle:
    "A native C++ research workbench with dedicated tools for structures, pointer graphs, classes, cross-references, and camera mathematics.",
  date: "2026-2027",
  categories: [
    "tools",
    "reverse-engineering",
    "security",
    "systems-programming",
  ],
  tags: ["cpp", "windows", "concurrency", "binary-analysis", "tooling"],
  readTime: "9 min",
  featured: true,
  content: `## Overview

ark-mt is a C++17 toolkit for investigating Windows programs, combining focused command-line utilities with a native Dear ImGui workbench. It covers binary inspection, pointer relationships, class metadata, string references, camera mathematics, and process structure. The interesting part is the range of representations: the same underlying bytes can become a hex view, a graph of pointers, a candidate transformation matrix, or a structured JSON report.

The research-tool build defines twelve utilities. The GUI embeds tool functions directly, using Win32 and DirectX 11 rather than launching a console process for every operation. A shared support library supplies common process utilities. The repository also contains experimental driver and image-loading components; the analysis tools below are the main focus of this writeup.

## Dumper: identifying an executable image

The tool named \`dumper\` establishes basic image information before deeper analysis. Its standalone implementation finds the main image base, checks the DOS magic, and reads the PE signature. The GUI implementation additionally reports machine type, section count, and image size.

This is an image-identification tool rather than a complete executable reconstruction pipeline. Its output supplies context for the other utilities: whether the selected source resembles a PE image and which base address subsequent relative locations refer to.

The separate PE parser extracts PE32/PE32+ metadata and section records. Each record retains both raw-file and virtual-image coordinates. That matters when comparing a saved file with an image-oriented view: identical numeric offsets do not necessarily identify identical bytes.

## Scanner: a precise byte window

The standalone \`scanner\` presents a byte range relative to the main image base. It validates the PE signature, computes the requested location from the base plus a relative offset, and formats the result in sixteen-byte rows.

Its scope is deliberately concrete: a byte-window and read-path diagnostic, not a finished iterative value-search engine. That distinction makes the tool useful as a baseline. Before interpreting a region as a structure or matrix, the raw bytes can be inspected independently of a higher-level heuristic.

A neighboring saved-input scanner adds pattern matching to dump analysis. It looks in a valid \`.text\` section first and falls back to the full file. Pattern definitions are loaded from JSON, with per-definition errors and compiled defaults if no usable definitions load. That separates the matching engine from the signatures it consumes.

## Inspector: several interpretations of one buffer

\`inspector\` combines a conventional hex/ASCII display with typed interpretations and printable-string candidates. At eight-byte offsets, its typed view reads the same bytes as a pointer-sized integer, a float, a double, and signed integers. These are alternative interpretations rather than recovered field types.

Printable runs of at least four characters become string candidates; an optional output path saves the inspected buffer as raw bytes. This makes the tool useful for comparing a suspected layout with its actual storage instead of committing immediately to one guessed structure.

The ASCII column renders printable bytes directly and substitutes a dot for other values:

\`\`\`cpp
uint8_t c = data[offset + i];
std::wcout << (c >= 0x20 && c < 0x7F
    ? static_cast<wchar_t>(c) : L'.');
\`\`\`

Nonprintable bytes remain visible as placeholders, preserving alignment between the byte and text columns. The result is a compact visual check for mixed binary and textual fields.

## Pointer scanner: reverse indexing and graph traversal

\`pointer_scanner\` turns observed pointer values into a reverse index. Instead of repeatedly searching the entire input for every level, it records which locations contain each candidate value. The central container and insertion are:

\`\`\`cpp
std::unordered_map<uint64_t, std::vector<uint64_t>> reverseMap;
// Inside the aligned-value scan:
reverseMap[val].push_back(addr + i);
\`\`\`

The index answers “which locations refer to this value?” A breadth-first traversal starts at the selected target and follows incoming references, retaining a visited set and stopping at the configured depth. Results record a base location, depth, and an offset sequence, then are sorted with shallower paths first and exported to JSON.

The technically interesting choice is the graph representation. Index construction and path exploration are separate stages, allowing repeated relationships to be looked up instead of rescanned. The current exported offset semantics remain experimental; these paths should be treated as discovery results rather than a guarantee of stable navigation across sessions.

## Entity finder: recognizing repeated structures

\`entity_finder\` uses two passes to produce candidates. The first detects consecutive aligned pointer-like values. Its run state survives adjacent chunks, so a candidate array is not automatically split at an I/O boundary. Unreadable input ends the current run, and a minimum run length filters short coincidences.

The second pass examines sixteen-float windows for transform-like data. It checks plausible position components and nondegenerate scale-related values, retaining an address and candidate position. The windows overlap between chunks so a complete matrix can be considered across a boundary.

Both passes write structured results: \`pointer_arrays\` records locations and counts, while \`transform_matrices\` records candidate positions. The tool narrows a large search space using structural regularities; it does not identify semantic entity types merely because a sequence passes those tests.

## Class finder: vtable and RTTI candidates

\`class_finder\` looks for two different traces of C++ structure. One pass examines pointer-sized entries and tests whether a candidate table and its first function entry resemble locations within the module. Another searches for RTTI-like records and attempts to recover a type-descriptor name.

The RTTI path looks for a signature, plausible metadata fields, and a name beginning with a familiar decorated-name prefix. Output keeps vtable candidates and RTTI observations in separate JSON collections. That preserves the distinction between a pointer relationship and a recovered name.

This is heuristic discovery rather than complete class reconstruction. Its useful output is a set of locations and names to inspect with the structure viewer. The implemented combination demonstrates how ABI metadata can provide context that a plain hex search cannot.

## XRef finder: connecting strings to code

\`xref_finder\` first finds occurrences of a supplied string, preserving nearby context. It then searches for a limited set of instruction encodings that can refer to each occurrence, including selected relative-address forms and a 32-bit immediate form.

The result has two layers: where the text exists and where a recognized instruction appears to reference it. This gives a reader a path from a human-readable clue toward the surrounding code. It is a focused byte-pattern recognizer, not a complete disassembler, so the output is a set of reference candidates.

String scanning overlaps chunks by the search-string length; code scanning also retains a boundary overlap. Those choices address a practical implementation detail: an occurrence should not disappear solely because its bytes straddle two reads. The JSON writer escapes context text and labels recognized reference kinds for later inspection.

## Camera finder: testing geometric structure

\`camera_finder\` examines floating-point windows for view matrices, projection matrices, and possible field-of-view values. A view candidate must have finite, bounded entries and basis-vector lengths close to one.

The camera finder tests the lengths of the three candidate basis vectors:

\`\`\`cpp
float rightLen = std::sqrt(m[0]*m[0] + m[1]*m[1] + m[2]*m[2]);
float upLen = std::sqrt(m[4]*m[4] + m[5]*m[5] + m[6]*m[6]);
float fwdLen = std::sqrt(m[8]*m[8] + m[9]*m[9] + m[10]*m[10]);

return rightLen > 0.9f && rightLen < 1.1f &&
       upLen > 0.9f && upLen < 1.1f &&
       fwdLen > 0.9f && fwdLen < 1.1f;
\`\`\`

That test recognizes approximately unit-length basis vectors; it does not establish mutual orthogonality. Projection candidates use expected near-zero entries and a plausible ratio between two diagonal terms. FOV candidates are checked against a configurable degree range, including conversion from radians.

The outputs remain separate—view, projection, and FOV candidates—because each test uses different evidence. This is a direct application of linear algebra and numeric representation to binary analysis.

## SigMaker: representing variable bytes explicitly

\`sigmaker\` converts hexadecimal input into a byte signature. Its optional displacement mode replaces a particular four-byte slot with wildcard markers. That is a fixed-layout convenience, not an instruction decoder that discovers every displacement automatically.

The core pattern parser represents wildcard bytes independently from literal byte values:

\`\`\`cpp
if (token == "?" || token == "??") {
  out.bytes.push_back(PatternByte{std::nullopt});
} else {
  out.bytes.push_back(PatternByte{ParseHexByte(token)});
}
\`\`\`

Using an optional value preserves the distinction between a literal zero byte and “accept any byte.” The parser also rejects invalid hexadecimal tokens and empty patterns. SigMaker handles preparation; the parser and matcher handle interpretation. These are separate, reusable parts of the signature workflow.

## MemMap: interpreting virtual regions

\`memmap\` exports regions with their base, size, protection, and type. Its implementations support a region-query backend and a \`VirtualQueryEx\` fallback. The fallback distinguishes committed, reserved, and free regions, as well as image, mapped, and private storage.

This turns an address space into a structured overview rather than a flat expanse of bytes. A location can be understood in terms of its containing region, allocation state, and storage type before another tool inspects its contents.

The fallback advances by the reported region size, not by a fixed page increment. That follows the API's segmentation and avoids querying every address in a large homogeneous region. A zero-size guard prevents the traversal from failing to advance.

## Thread inspector: process execution inventory

The standalone \`thread_inspector\` uses a Toolhelp thread snapshot and filters entries by owner process. It prints thread ID, base priority, flags, and owning PID. The relevant filter is small and direct:

\`\`\`cpp
if (te.th32OwnerProcessID == pid) {
    // Print this process's thread record.
}
\`\`\`

Unlike the matrix and class tools, this is enumeration rather than heuristic discovery. It provides a concrete execution inventory to accompany the toolkit's memory-oriented views.

## One native workbench for the tool collection

The GUI gives each tool a retained input state and dispatches long-running jobs to worker threads. Tool functions return text into a shared output system. Results are split into lines, grouped by tool, and presented in separate tabs with selection, copying, and status colors.

The implementation bounds each tool's displayed history:

\`\`\`cpp
lines.push_back(ol);
if (lines.size() > 4096) lines.pop_front();
\`\`\`

Rendering uses \`ImGuiListClipper\`, so the interface visits the visible portion of a long output list rather than drawing every retained line. The rolling deque and clipped rendering address storage and drawing costs separately. This is a concrete interface implementation around the analysis tools, not simply a launcher with buttons.

The build also includes driver lifecycle utilities and a manual-mapping component. Their role is separate from the analytical passes above; the portfolio's focus here is the implemented inspection, candidate discovery, and result presentation.

## Concepts explored

The tools connect several technical ideas: reverse indexes and graph search in the pointer scanner, numeric heuristics in the camera finder, executable metadata in the dumper and parser, and byte/text representations in the inspector. The common workbench turns these otherwise separate experiments into one investigative workflow.

An important distinction runs through their outputs. Enumeration reports observed records; parsing interprets a defined format; heuristic discovery proposes candidates. Keeping those labels accurate makes the results easier to combine without overstating what any individual tool has established.

## Things to do next

The most useful next additions are known-input fixtures for each analysis pass and a shared result model connecting candidates directly to the inspector. Pointer-path encoding needs verification, camera tests need reference matrices, and RTTI matching needs samples with known class layouts. Cooperative job cancellation would complete the workbench lifecycle. These are targeted extensions of implemented tools rather than a replacement for explaining what already exists.
`,
};
