export const runeEditor = {
  id: "rune-editor",
  title: "Rune Editor: A Web Interface for a Native Tool",
  subtitle:
    "A React desktop interface connected to a C++ service through a small, explicit API.",
  date: "2024",
  categories: ["tools", "reverse-engineering", "closed"],
  tags: [
    "cpp",
    "react",
    "typescript",
    "webview2",
    "desktop",
    "state-management",
  ],
  readTime: "4 min",
  featured: false,
  content: `## Overview

Rune Editor combines a React and TypeScript interface with a C++ service, displayed in a WebView2 desktop window. It is a single-player game editing tool, but the broader engineering problem is familiar: a web interface needs to control a native capability without becoming tightly coupled to its implementation.

The frontend talks to a loopback HTTP API. The native side owns the session and the operations; the interface owns input, status, and feedback. That separation makes the boundary visible enough to inspect, test, and eventually replace with a mock service.

## Making errors part of the interface contract

The frontend centralizes requests in a typed API helper. A short excerpt shows how server errors become useful messages:

\`\`\`typescript
if (!res.ok) {
  const body = await res.json().catch(() => ({}))
  throw new Error(body?.error ?? \`HTTP \${res.status}\`)
}
return res.json() as Promise<T>
\`\`\`

A failed request carries the backend's explanation when available and falls back to an HTTP status otherwise. Components can then handle one error path rather than duplicating response parsing.

The TypeScript return type helps callers use the result, but it does not validate JSON at runtime. A schema check would strengthen this boundary if the API evolves independently of the interface.

## Validating at both ends

Numeric input is cleaned, checked for valid digits, and constrained to a supported range before submission. The C++ endpoint independently validates the value and range.

That duplication is intentional in responsibility: frontend validation makes editing pleasant, while backend validation protects the operation itself. A disabled button cannot be the service's only defense against invalid input.

The native routes also coordinate access to session state with a mutex. That keeps session changes and operations from treating the same state as independently owned.

## Keeping the view synchronized

The interface refreshes the value on a timer and has a separate heartbeat for session status. When the value is locked, the frontend periodically reapplies the chosen value. Logs are bounded so an ordinary editing session does not keep growing the visible history indefinitely.

This makes polling a real part of the application's behavior rather than a cosmetic refresh. A slow request can overlap the next timer tick, and a response from an old session can arrive after a new session begins. A request generation or session identifier would let the interface discard stale results deliberately.

The lock behavior also depends on the frontend remaining active. Moving any stronger persistence guarantee into the service would require an explicit lifecycle and stop condition.

## Desktop packaging preserves a web boundary

WebView2 provides the desktop window, but the interface still communicates through HTTP. That allows the frontend to be developed against a mock service and lets errors be inspected as ordinary responses.

The same convenience means loopback access should have a deliberate origin policy. A service listening locally is still an API, and the packaged interface should be distinguishable from unrelated pages. Tightening that contract is a natural extension of the project's existing separation between interface and native ownership.

## Bounded numeric adjustment

The main editor hook handles manual input, quick presets, and incremental adjustments. The adjustment path clamps a requested change to the same supported range as manual input:

\`\`\`typescript
const next = Math.max(RUNE_MIN, Math.min(RUNE_MAX, current + delta * step))
\`\`\`

The range is zero through 999,999,999. Clamping lets an increment at the upper limit remain valid rather than creating an out-of-range request. Manual entry has its own digit and range feedback, while the C++ endpoint independently validates the submitted value. These paths share a domain constraint while serving different interface interactions.

## A typed API vocabulary

The frontend centralizes status, process listing, attach/detach, value operations, and logs in one API object. Its status response distinguishes an attached flag from optional session details:

\`\`\`typescript
export interface StatusResponse {
  attached: boolean
  pid?: number
  module_base?: string
  process_name?: string
}
\`\`\`

This lets disconnected responses omit details that do not exist. Components use the same request helper and error path instead of duplicating fetch handling. The TypeScript declarations guide callers; they are not runtime JSON validation.

## Separate refresh and heartbeat timers

The editor uses a 500 ms value-refresh interval and a 2 s session heartbeat. The faster loop updates the displayed value and implements the selected repeated-application mode. The slower loop observes whether the native session is still available.

Those are implemented behaviors with different purposes: the value display can change more frequently than session discovery. The repeated-application setting is owned by the frontend, so it is not a durable backend lock. The hook also maintains a rolling history of 200 log entries using an append after \`prev.slice(-199)\`, keeping feedback bounded during a long session.

## Concepts explored

The implemented boundary combines typed HTTP calls, native session ownership, numeric constraints, and timer-driven interface updates. The project makes those interactions visible in a small desktop tool rather than hiding them behind one component.

## Things to do next

I would start with a mock API and deterministic session scenarios: disconnect during a request, reconnect, invalid input, and a slow status response. A single polling loop that waits for completion before scheduling again would make overlap easier to control.
`,
};
