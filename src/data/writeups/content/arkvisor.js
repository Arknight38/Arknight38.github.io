export const arkvisor = {
  id: "arkvisor",
  title: "ArkVisor: Exploring Hardware Virtualization",
  subtitle:
    "An experimental C and assembly project exploring processor-local state and virtualization lifecycle.",
  date: "2024",
  categories: ["systems", "closed", "security"],
  tags: ["hypervisor", "vmx", "c", "assembly", "resource-lifetime"],
  readTime: "4 min",
  featured: true,
  content: `## Overview

ArkVisor is an experimental Intel VT-x hypervisor written in C and assembly. It explores processor-local virtualization state, extended page tables, VM exits, and the lifecycle of resources that cannot be treated like ordinary application objects.

This is an unfinished systems project. Its value is in the hardware-facing engineering it exposes: setup must be correct for each processor, assembly and C must agree about state, and partial initialization needs a safe way back out.

## State belongs to a processor

Virtualization brings together control structures, memory mappings, and execution state. ArkVisor organizes that work around per-CPU state rather than assuming one global instance represents the machine.

The assembly boundary is particularly important. Register preservation and the transition into a C dispatcher form a contract between two languages and the processor. A mistake there can undermine otherwise reasonable high-level code, which makes small, inspectable interfaces more useful than clever abstractions.

## Making failures observable

The project includes a safety-monitor structure that records runtime observations:

\`\`\`c
typedef struct _SAFETY_MONITOR {
    ULONG64 VmExitCount;
    ULONG64 LastCheckTime;
    ULONG64 StartTime;
    BOOLEAN EmergencyMode;
    ULONG ConsecutiveErrors;
} SAFETY_MONITOR;
\`\`\`

Exit counts and timing provide a way to identify unusually frequent transitions or repeated failures. The separation between total activity, the last check, and consecutive errors supports more than a single success flag.

These counters are diagnostics, not proof that recovery is safe. Their useful role is to make behavior visible enough to investigate and to support explicit decisions about stopping an experiment.

## Translation is a relationship between address spaces

Virtualization introduces another translation layer alongside the operating system's own paging. Guest virtual addresses, guest-physical addresses, and host-physical addresses describe different locations in different coordinate systems. A simple experiment can map some ranges identically without making those concepts interchangeable.

ArkVisor's extended page-table support has limited coverage. The useful contract is therefore a supported range and configuration, not an assumption that every plausible machine address is represented. A capability summary could expose that boundary before initialization starts and reject configurations outside it.

The tables also have an active lifetime. Returning from initialization does not end their use: processors can continue depending on them throughout the session. Cleanup must establish that no processor still uses a structure before releasing it. This connects translation correctness directly to resource ownership.

## Assembly and C share a state contract

The VM-exit entry code and C dispatcher must agree on register preservation, stack assumptions, and the representation of saved state. A correctly declared C structure is only part of that agreement. The calling convention and the transition back to execution matter as well.

A small documented boundary makes this inspectable. Layout assertions where possible, a single state representation, and a clear owner for each transition would reduce assumptions scattered across the implementation. These are ways to strengthen the existing experimental path without implying that every exit reason is fully supported.

The per-processor structures make this responsibility concrete: an initialization marker belongs to an individual processor, while shared translation resources belong to the wider session. Keeping those scopes distinct is necessary when one processor fails after another has already started.

## Measuring VM-exit activity

The monitoring implementation uses the performance counter to relate observed exit counts to elapsed time. Its rate calculation is:

\`\`\`c
elapsedMs = ((currentTime - g_SafetyMonitor.LastCheckTime) * 1000) / perfFreq;
\`\`\`

After the interval checks and count update, it derives a rate:

\`\`\`c
exitsPerSecond = (g_SafetyMonitor.VmExitCount * 1000) / elapsedMs;
\`\`\`

This gives the experiment a time-based observation rather than just a lifetime event total. The monitor also records consecutive errors and an emergency-mode flag. The implemented feature is instrumentation around a hardware-facing execution path; counters alone do not demonstrate safe recovery.

## Processor-local allocation records

The per-processor record retains control-region pointers, physical addresses, saved guest state, and separate initialized/enabled flags. These fields let initialization and stop paths refer to the processor's own resources rather than assume one global instance describes every CPU.

The implementation declares a fixed maximum of 64 processor records. That is a source-level capacity, not a claim of verified support for every 64-processor configuration. Shared EPT state and processor-local control state have different scopes, which is the central ownership distinction visible in this implementation.

## Concepts explored

Processor-local control records, assembly/C state transfer, nested address translation, and interval-based instrumentation are the implemented technical themes. The project remains an experimental hypervisor with limited mapping coverage and unfinished aggregate failure handling.

## Things to do next

The next milestone would be an initialization state machine with per-processor outcomes and a verified reverse-order cleanup path. Structured logs could show which stage each processor reached, while parser and bookkeeping tests could exercise the portions that do not require entering virtualization.
`,
};
