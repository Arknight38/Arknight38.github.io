export const atlus = {
  id: "atlus",
  title: "Atlus: A Native Binary-Analysis Workbench",
  subtitle:
    "A C++ and Qt workbench connecting byte inspection, disassembly, comparison, and decompilation.",
  date: "2024-2026",
  categories: [
    "tools",
    "reverse-engineering",
    "security",
    "systems-programming",
  ],
  tags: ["c++", "qt6", "zydis", "revng", "pe", "binary-analysis"],
  readTime: "6 min",
  featured: true,
  content: `## Overview

Atlus is a native binary-analysis application built with C++17 and Qt6. It brings together a hex view, disassembly, functions, sections, imports, cross-references, graph views, and pseudocode so that inspecting a file does not become a sequence of disconnected tools.

The core combines a PE parser with Zydis disassembly. Decompilation goes through rev.ng, which is a separate and more expensive stage. The interface is therefore doing more than presenting a list of instructions: it has to coordinate analysis work, preserve navigation context, and keep the window responsive while a binary is being processed.

## A responsive interface around expensive analysis

Opening a file loads its bytes, parses the executable, and analyzes executable sections. The Qt interface dispatches that work through \`QtConcurrent::run\` and receives the result through a future watcher. Once it is ready, the GUI updates its models and panels.

The useful distinction is between producing analysis data and displaying it. Qt models give the views a structured source of rows and fields, while the background task avoids tying file analysis to the GUI's event loop. That organization also makes it possible to add analysis views without putting their work directly inside paint or input callbacks.

The file is currently read into a vector in memory. That makes byte access straightforward throughout the application, although a mapped or windowed representation would become attractive for very large inputs.

## From bytes to useful comparisons

The comparison core starts with a concrete question: which bytes changed? The serial byte-diff path compares the common portion of two files:

\`\`\`cpp
const size_t common = std::min(old_file.size(), new_file.size());
for (size_t i = 0; i < common; ++i) {
    if (old_file[i] != new_file[i])
        diffs.push_back({i, old_file[i], new_file[i]});
}
\`\`\`

Each result preserves the offset and both values. A later grouping step combines adjacent offsets into chunks, which is a much more useful unit for navigation than thousands of isolated byte changes. A changed instruction or data field often spans several bytes; grouping preserves that locality.

This is an intentionally low-level comparison. It does not establish that two functions behave differently, and the shown loop does not account for an added or removed tail. Those are useful distinctions for the next layer of the tool: byte differences are evidence to inspect, rather than a substitute for instruction-aware comparison.

## Decompilation as a separate service

The rev.ng integration has its own worker, progress reporting, and cached output. It remembers which binary is loaded and recreates the backend when that input changes. Platform-specific launch paths handle native execution or a bridge through WSL or Docker.

That boundary is valuable because disassembly and decompilation have different costs and failure modes. Opening the hex view should not require waiting for pseudocode. Likewise, a decompiler failure should be something the interface can report while the rest of the inspection tools remain useful.

Function discovery currently includes instruction analysis and prologue heuristics. That provides entry points for exploration, but it cannot promise complete recovery of optimized code. Presenting those results as analysis candidates leaves room for the user to inspect the underlying instructions.

## Navigation is part of the analysis

The panels are most useful as different views of the same file. A section gives a region context; the hex view exposes its bytes; disassembly gives those bytes an instruction interpretation; cross-references provide another direction to follow. Function and graph views offer larger units for reasoning about control flow.

That combination changes the role of the interface. It is not simply a report with several tabs: it is a place to move between representations while retaining a location. Consistent address handling is therefore as important as adding another analysis algorithm. A file offset and a virtual address can both be valid numbers while referring to different things.

Qt's model/view approach gives the application a way to keep structured data separate from its presentation. Settings persistence also preserves interface preferences between runs. These are modest features individually, but they reduce the repeated setup that otherwise gets in the way of investigation.

## Different comparisons answer different questions

Atlus includes byte, section, and function-oriented comparison code. A section-level view can quickly identify which broad parts changed, while contiguous byte chunks provide precise locations to inspect. A function-level view should eventually explain changes in terms of instructions or structure.

Those levels should not be confused. Equal instruction counts do not establish equal instructions, and a matching name does not establish equivalent behavior. The current function comparison is still limited, and instruction-level diffing is unfinished. A useful next implementation could align instruction sequences and retain links back to the changed bytes, so the high-level explanation remains inspectable.

This also suggests a good interface design: begin with a compact summary of changed sections and functions, then let the reader drill down into paired instructions and exact byte ranges. The existing workbench provides several of the views that such a workflow would need.

## Turning isolated byte changes into ranges

The diff core preserves the old and new byte at each changed offset. \`make_chunks\` then merges neighboring differences into ranges. This excerpt shows the contiguity decision:

\`\`\`cpp
if (diffs[i].offset == diffs[i-1].offset + 1) {
    current.old_bytes.push_back(diffs[i].old_byte);
    current.new_bytes.push_back(diffs[i].new_byte);
} else {
    chunks.push_back(std::move(current));
    current = {};
    current.offset = diffs[i].offset;
    current.old_bytes.push_back(diffs[i].old_byte);
    current.new_bytes.push_back(diffs[i].new_byte);
}
\`\`\`

This retains both sides of a changed region instead of only a count. A three-byte change becomes one navigable unit; a gap starts another. The representation can support paired hex views while keeping exact offsets available. The common-length byte comparison still needs separate handling for appended and removed tails.

## Matching sections by name

The section comparison builds a name-to-section map for the new file, then visits old sections. A missing name becomes a removed section; a matched section is unchanged or modified according to its data; entries left in the map become additions. Modified sections receive their own byte differences.

This supplies two useful scales of output: a broad inventory of changed sections and precise ranges inside them. Function comparison is another, less complete layer; matching names or addresses is not proof of equivalent behavior. The Qt comparison menu remains unfinished, so these algorithms describe implemented core functionality rather than a completed graphical comparison workflow.

## Background analysis and optional cross-references

Opening a file dispatches an \`AnalysisResult\` task through \`QtConcurrent::run\`. The task owns the loaded binary, PE interpretation, and discovered functions, then publishes its result through a future watcher. Executable sections are selected for analysis, and cross-reference construction is conditional on the selected options.

This is the implemented boundary between processing and presentation: Qt views receive structured results after the work completes. Decompilation has a separate worker and backend context, so opening byte-oriented views does not require pseudocode generation first.

## Concepts explored

PE parsing, instruction interpretation, range grouping, name-based section matching, and Qt model/view presentation are the main technical threads. They provide different levels of explanation while retaining the underlying bytes for inspection.

## Things to do next

I would focus the next iteration on comparison quality: represent appended and removed bytes, compare instruction sequences, and connect changed regions back to functions and cross-references. That would turn a raw difference into a navigable explanation of a new build.
`,
};
