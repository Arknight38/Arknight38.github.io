export const arkdrv = {
  id: "ark-drv",
  title: "Ark-Drv: Designing a Native Request Interface",
  subtitle:
    "A Windows systems project exploring bounded batches, completion reporting, and interface contracts.",
  date: "2025-2026",
  categories: [
    "tools",
    "reverse-engineering",
    "security",
    "kernel-development",
  ],
  tags: ["kernel", "c", "windows", "ipc", "abi"],
  readTime: "4 min",
  featured: true,
  content: `## Overview

Ark-Drv is an experimental Windows driver project with a user/kernel request interface. The interesting engineering is the protocol itself: both sides have to agree on structure layout, lengths, output ownership, and how much of a result is valid.

This article focuses on those interface and buffer-management decisions. They are the portions that generalize to native systems programming beyond this particular project.

## A request is more than a structure definition

The interface uses buffered requests and shared declarations describing operations and payloads. A successful dispatch needs to report the actual amount of output written, rather than assuming that the requested capacity equals valid data.

Matching declarations on both sides is essential. Duplicated definitions are easy to let drift, so a common header or generated schema would make compatibility easier to maintain. Fixed-width fields and explicit layout checks would turn assumptions into build-time constraints.

## Checking a batch one entry at a time

The batch path limits the number of entries and checks that each output region fits. This excerpt shows a widened end-offset calculation:

\`\`\`c
UINT64 endOffset64 = entry->OutputOffset + (UINT64)entry->Size;
if (entry->OutputOffset > MAXULONG ||
    entry->OutputOffset >= outputBufferSize ||
    entry->Size > outputBufferSize ||
    endOffset64 > outputBufferSize) {
    continue;
}
\`\`\`

Calculating in a wider type helps prevent a wrapped sum from making an invalid range appear small. Checking the start, size, and end separately makes the intended bound visible.

Batching can reduce request overhead, but it also makes partial success a first-class concern. If one entry fails, the caller needs to distinguish that failure from a legitimate zero-valued result. Per-entry status would express that more clearly than an overall result alone.

## Input length, capacity, and completed output

A buffered request has an input length and an available output capacity. Those quantities can differ even when the operating system supplies one system buffer. A request header fitting into that buffer does not establish that a response of another size fits too.

The dispatch path checks lengths and initializes the reported output count to zero. Completion needs to describe bytes actually produced, rather than the capacity reserved by the caller. That makes a short result meaningful and avoids treating unused space as valid data.

The source sets a maximum transfer size of 16 MiB. This is a configured bound, not a benchmark. Batches need additional reasoning because metadata, entry count, and aggregate output consume resources differently. A small batch can still request a large result, so validation must cover both the collection and its entries.

## Partial results need explicit outcomes

Each batch entry describes an output offset and size. The range check makes it possible to reject an invalid destination independently, but skipping an entry leaves a question for the consumer: which parts of the response contain valid data?

Zero-filled space cannot answer that question because zero can be legitimate output. Per-entry status and an actual byte count would preserve useful partial results while explaining failures. An overall successful dispatch should not silently imply that every entry completed.

The client decoder needs its own checks against the returned length. An impossible entry count, truncated metadata, or a range extending beyond the reported result should be rejected even if the producer normally generates valid responses. Producer and consumer validation protect different assumptions.

The high-level client wrapper is another useful feature boundary. It translates application calls into shared request records, keeping the rest of the interface from depending directly on every dispatch detail. Compatibility checks belong at that translation point as well as in the driver.

## Dispatch completion reports an actual byte count

The dispatch path starts with no valid output and completes using the amount its handler produced. These separate excerpts show that contract:

\`\`\`c
Irp->IoStatus.Information = 0;
\`\`\`

\`\`\`c
Irp->IoStatus.Information = written;
\`\`\`

The caller's output capacity and the completed length have different meanings. Initializing the count before dispatch prevents a failed branch from accidentally inheriting a result size. Reporting \`written\` allows the receiving wrapper to interpret only the produced portion. This is a concrete protocol behavior alongside the batch range checks, not merely an intention to validate buffers.

## One wrapper around the native interface

The C++ client layer translates higher-level calls into shared request structures. Shared declarations include batch entries with an output offset and size, while dispatch applies a 16 MiB transfer limit. The wrapper concentrates operation identifiers and response decoding instead of exposing those details throughout the application.

The source currently has duplicated shared declarations, so one generated or common definition remains useful next work. The existing division still makes the implemented layers clear: application call, serialized request, dispatch validation, and completed response length.

## Concepts explored

The technically substantial pieces are binary structure compatibility, widened range arithmetic, bounded batch processing, and explicit completion lengths. These determine how a native client distinguishes reserved buffer space from valid returned data.

## Things to do next

I would focus on a versioned request contract, per-entry outcomes, and tests for boundary sizes and malformed batches. A small user-mode harness could exercise validation and result decoding with deterministic inputs.
`,
};
