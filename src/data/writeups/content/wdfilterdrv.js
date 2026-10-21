export const wdfilterdrv = {
  id: "wdfilterdrv",
  title: "WdFilterDrv: Building a Worker-Based Driver",
  subtitle:
    "Shared requests, background work, and resource ownership in an experimental Windows driver.",
  date: "2024",
  categories: ["systems", "closed", "security"],
  tags: ["kernel", "driver", "c", "windows", "concurrency"],
  readTime: "4 min",
  featured: true,
  content: `## Overview

WdFilterDrv is an experimental Windows kernel project with a shared-memory request interface and a background worker. The central engineering question is how requests, worker state, and shutdown fit together when the worker borrows resources owned by the device.

The implementation uses a device extension to hold that state, synchronization around command handling, and an event-driven stop path. It is a useful setting for studying ownership because cleanup is part of correctness, not simply housekeeping at the end.

## Waiting without a busy loop

The worker waits on a stop event with a timeout, checks initialization state, and examines the command state under a mutex. A timed wait gives shutdown a direct signal while allowing periodic request checks.

That approach trades polling latency against idle wakeups. It does not automatically outperform an I/O-request interface; the useful design question is whether its latency and resource cost fit the intended workload.

A second boundary is publication. A kernel mutex coordinates code that takes that mutex, but a user-mode writer does not automatically participate. Shared request state needs an explicit rule for when a command is complete and safe to consume.

## Shutdown reveals the ownership model

The unload path contains this sequence:

\`\`\`c
deviceExtension->IsInitialized = FALSE;
StopSharedMemoryWorker(deviceExtension);
CleanupMouseDevice(deviceExtension);
DestroySharedMemory(deviceExtension);
\`\`\`

The worker stops before the shared memory it uses is destroyed. That ordering expresses the dependency directly: borrowed resources must outlive their borrower.

The stop helper signals the event and waits for the referenced worker thread. Holding a thread-object reference, rather than treating a closed handle as a durable identity, gives the wait a meaningful lifetime. The remaining challenge is making sure no worker operation can prevent shutdown from completing indefinitely.

## Device state records ownership

The device extension groups shared-memory references, initialization state, synchronization, and the worker's identity. That makes a dependency visible: the worker borrows resources owned by the device, so unloading must account for the borrower before releasing those resources.

Startup passes through several milestones. Allocating shared state, creating a worker, and becoming ready to accept commands are different events. A future lifecycle model could represent allocated, ready, stopping, and stopped explicitly, rather than expecting several independent booleans to express every partial state.

Failure during startup should release only acquisitions that succeeded. A single cleanup path is useful when its helpers deliberately tolerate missing resources; otherwise the initialization stage needs to determine which release operations are valid. This is part of the architecture rather than an exceptional afterthought.

## A handle is not the same as an object reference

The startup path creates a system thread, obtains a reference to its thread object, and closes the original handle. The retained reference supports the later wait in the stop helper. Closing the handle and releasing the object reference are separate obligations.

That distinction gives shutdown a durable object to wait on. The reference must remain owned until the worker completes, and only then can the device release it and destroy dependent state. Treating a transient identifier as an indefinitely valid object would lose that guarantee.

## Interruptible timed waiting

The worker uses an event wait with a timeout instead of a continuously spinning command loop. Its stop decision follows the wait result directly:

\`\`\`c
NTSTATUS waitStatus = KeWaitForSingleObject(
    &deviceExtension->WorkerThreadStopEvent,
    Executive,
    KernelMode,
    FALSE,
    &pollInterval
);
\`\`\`

A timeout lets the worker inspect shared command state; a signaled stop event takes it out of the loop. It also exits when the device is no longer initialized. These paths give unload a direct connection to the worker's control flow.

## Referenced thread ownership

Startup creates a system thread and obtains a thread-object reference before closing the temporary handle. Stop signals the event, waits using that retained reference, and releases it after completion. The object reference is what keeps the later wait meaningful after the original handle is closed.

Together with the unload ordering, this is an implemented resource-lifetime mechanism: shared memory remains present until the worker using it has stopped. It is the key reason the cleanup excerpt belongs in the article. A kernel-side command mutex is also present, while cross-context request publication still needs a separately documented protocol.

## Concepts explored

Timed waits, event signaling, retained object references, and reverse-order release form the core implementation. They show how background execution is made dependent on an owning device lifetime.

## Things to do next

Request handling is often the visible feature of a driver, but teardown tests whether its architecture is coherent. Can initialization fail halfway through?
`,
};
