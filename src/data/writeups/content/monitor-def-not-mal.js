export const monitorDefNotMal = {
  id: "monitor-def-not-mal",
  title: "PC Monitor: A Python Monitoring Prototype",
  subtitle:
    "A Flask service and Tkinter viewer exploring incremental records and background-task ownership.",
  date: "2024",
  categories: ["tools", "systems"],
  tags: ["python", "flask", "tkinter", "threading", "desktop"],
  readTime: "3 min",
  featured: false,
  content: `## Overview

PC Monitor is a Python prototype that separates a monitoring service from a desktop viewer. Flask exposes status and collected records, while a Tkinter client displays activity and screenshots.

The project explores a common application pattern: background work produces data continuously, and a separate interface requests a recent view. Because the records can be sensitive, consent, visibility, and retention are central design requirements for any further development.

## Keeping records easy to inspect

Events are appended as individual JSON records. The persistence pattern is small:

\`\`\`python
with open(log_file, 'a') as f:
    f.write(json.dumps(event) + "\\n")
\`\`\`

One record per line allows incremental writing and inspection without rewriting a growing JSON array. Readers can process the file a line at a time, and an interrupted final record need not prevent examination of earlier lines.

The service also maintains an in-memory event list and stores screenshots separately. The viewer can request recent records, but limiting a response does not limit what remains in memory or on disk. Retention needs its own policy.

## Events and images have different costs

The service writes daily event files and stores screenshot images separately. Metadata can reference an image without embedding all its contents into every event. That keeps the append path smaller and allows the viewer to request image data when needed.

Retention must account for the relationship. An expired image should produce an understandable unavailable-image state, while removing old records should not leave an unlimited collection of orphaned files. A future cleanup task should apply a documented age or capacity policy to both.

Limiting the recent-events response does not limit its backing in-memory list. A bounded deque would address memory; rotation and deletion would address disk. Those policies have different effects and need to be designed independently.

## A shared event envelope

Each recorded event has a timestamp, type, and structured details. The service constructs that representation before adding it to the recent-event list and append-only file:

\`\`\`python
event = {
    "timestamp": datetime.now().isoformat(),
    "type": event_type,
    "details": details
}
\`\`\`

A common envelope lets the viewer distinguish event kinds without inventing a separate transport format for every record. Details remain structured JSON, while the timestamp supports chronological presentation. The on-disk file uses one JSON record per line even though its filename has a \`.json\` extension.

## Image references and viewer transport

Screenshots are stored as PNG files, and event details record the corresponding filename. A latest-image helper reads the current PNG and encodes it as Base64 for a JSON response. The Tkinter viewer can therefore consume text-oriented API responses while creating a local image object for display.

This is a concrete serialization boundary: a binary image becomes an encoded response, then becomes a GUI image. Listing, latest-image retrieval, and filename-based retrieval provide different views of the stored collection. A response limit bounds returned events; it does not by itself bound retained records or images.

## Service routes and desktop presentation

Flask exposes status, start/stop, recent-event, and screenshot routes, with an API-key check before protected requests. Tkinter owns the visible controls and scheduled refreshes. The split allows the viewer to request observations without owning the producers that create them.

The prototype's synchronous requests and incomplete listener shutdown are current limitations. Further development should make collection visibly opt-in, make stop end every producer, and provide simple deletion and retention controls. Those concerns belong with the implemented service/viewer boundary, without expanding collection capabilities.

## Concepts explored

The implementation combines structured event envelopes, line-oriented persistence, binary-to-text image transport, and a separate GUI client. These are the concrete mechanisms behind the prototype’s incremental observation-and-display workflow.

## Things to do next

I would prioritize a visible recording indicator, explicit opt-in, minimal collection, and straightforward deletion before expanding any monitoring features. Bounded buffers and a documented retention window would make data lifetime predictable.
`,
};
