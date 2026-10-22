import { useState } from "react";
import Workspace from "../shared/Workspace.jsx";
import useLabClock from "../shared/useLabClock.js";
import { ProcessRuntime, operationText } from "./engine/ProcessRuntime.js";
import {
  BASE,
  SIZE,
  HEAP_START,
  HEAP_END,
  address,
  hexByte,
} from "./engine/MemorySpace.js";
import { EXAMPLES } from "./examples/index.js";
import {
  allocationAnalysis,
  interpretations,
  snapshotDiff,
} from "./analysis/index.js";
import "./mnemosyne.css";
const TABS = [
  ["memory", "Memory", "Allocations and live bytes"],
  ["trace", "Trace", "Reads, writes, and lifetimes"],
  ["structures", "Structures", "Bytes and pointer evidence"],
  ["analysis", "Analysis", "Snapshots and reachability"],
];
const COLORS = {
  heap: "#d7ff3f",
  stack: "#c3a5e9",
  global: "#91b9dc",
  free: "#253029",
};
function MemoryMap({ memory, selected, highlight, onSelect, scope }) {
  const live = memory.blocks.filter((b) => b.alive);
  const start = scope === "all" ? 0 : Math.floor((selected - BASE) / 128) * 128;
  const columns = scope === "all" ? 32 : 16;
  const count = scope === "all" ? SIZE : 128;
  const cellWidth = 560 / columns;
  const cellHeight = scope === "all" ? 18 : 56;
  const rows = count / columns;
  const drawingHeight = 45 + rows * cellHeight;
  return (
    <figure className="mn-map">
      <figcaption>
        LIVE MEMORY MAP{" "}
        <span>
          1 cell = 1 byte · {count} of {SIZE} bytes
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 640 ${drawingHeight + 50}`}
        role="img"
        aria-label="Process memory map. Select an address using the address control or click a byte."
      >
        {Array.from({ length: rows }, (_, row) => (
          <g key={row}>
            {row % (scope === "all" ? 4 : 1) === 0 && (
              <text
                x="0"
                y={row * cellHeight + 35}
                fill="#a2b4a4"
                fontSize="11"
                fontFamily="monospace"
              >
                {address(BASE + start + row * columns)}
              </text>
            )}
            {Array.from({ length: columns }, (_, col) => {
              const offset = start + row * columns + col,
                at = BASE + offset,
                block = live.find(
                  (b) => at >= b.address && at < b.address + b.size,
                ),
                selectedBlock = live.find(
                  (b) => selected >= b.address && selected < b.address + b.size,
                );
              const active =
                highlight?.address != null &&
                at >= highlight?.address &&
                at < highlight.address + highlight.size;
              return (
                <rect
                  key={col}
                  x={65 + col * cellWidth}
                  y={15 + row * cellHeight}
                  width={cellWidth - 3}
                  height={cellHeight - 3}
                  rx="1"
                  fill={COLORS[block?.kind || "free"]}
                  fillOpacity={
                    block
                      ? at < block.address + block.requested
                        ? 0.82
                        : 0.25
                      : 0.6
                  }
                  stroke={
                    at === selected
                      ? "#fff"
                      : active
                        ? "#fff"
                        : block && block.id === selectedBlock?.id
                          ? COLORS[block.kind]
                          : "none"
                  }
                  strokeWidth={at === selected ? 2.5 : 1}
                  onClick={() => onSelect(at)}
                >
                  <title>
                    {address(at)} · {block?.label || "unallocated"} ·{" "}
                    {hexByte(memory.bytes[offset])}
                  </title>
                </rect>
              );
            })}
          </g>
        ))}
        <text x="65" y={drawingHeight + 5} fill="#a2b4a4" fontSize="12">
          {address(BASE + start)}–{address(BASE + start + count - 1)} ·
          addresses increase downward
        </text>
      </svg>
      <p className="mn-window-range">
        {address(BASE + start)}–{address(BASE + start + count - 1)} ·{" "}
        {scope === "all" ? "Full address space" : "Selected address window"}
      </p>
      <div className="mn-allocation-key">
        {live
          .filter(
            (b) =>
              b.address < BASE + start + count &&
              b.address + b.size > BASE + start,
          )
          .map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.address)}
              style={{ borderLeftColor: COLORS[b.kind] }}
            >
              #{b.id} {b.label}
              <small>
                {address(b.address)} · {b.requested} B
              </small>
            </button>
          ))}
      </div>
      <div className="mn-legend">
        {Object.entries(COLORS).map(([kind, color]) => (
          <span key={kind}>
            <i style={{ background: color }} />
            {kind === "global"
              ? "Globals"
              : kind === "free"
                ? "Unallocated"
                : kind === "heap"
                  ? "Heap"
                  : "Stack"}
          </span>
        ))}
      </div>
      <p className="lab-hint">
        White outlines mark the selected byte or last event. Freed bytes remain
        visible as data until an allocation reuses the range; the color follows
        ownership.
      </p>
    </figure>
  );
}
function ByteTable({ memory, block }) {
  const start = block?.address ?? BASE;
  return (
    <div className="lab-table-scroll">
      <table>
        <caption>
          Raw bytes · {address(start)}
          {block ? `–${address(start + block.requested - 1)}` : ""}
        </caption>
        <thead>
          <tr>
            <th>Address</th>
            <th>Bytes</th>
            <th>ASCII</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(
            { length: Math.ceil((block?.requested || 8) / 8) },
            (_, row) => {
              const offset = start - BASE + row * 8;
              const bytes = [
                ...memory.bytes.slice(
                  offset,
                  Math.min(start - BASE + (block?.requested || 8), offset + 8),
                ),
              ];
              return (
                <tr key={row}>
                  <td>{address(BASE + offset)}</td>
                  <td>
                    <code>{bytes.map(hexByte).join(" ")}</code>
                  </td>
                  <td>
                    {bytes
                      .map((b) =>
                        b >= 32 && b <= 126 ? String.fromCharCode(b) : "·",
                      )
                      .join("")}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}
export default function Mnemosyne() {
  const [runtime] = useState(() => new ProcessRuntime()),
    [, revision] = useState(0),
    [view, setView] = useState("memory"),
    [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(5),
    [scope, setScope] = useState("window"),
    [follow, setFollow] = useState(true),
    [selected, setSelected] = useState(BASE + HEAP_START),
    [pickedEvent, setPickedEvent] = useState(null),
    [filter, setFilter] = useState("all"),
    [allocationFilter, setAllocationFilter] = useState("all"),
    [interpretation, setInterpretation] = useState("integer"),
    [baseline, setBaseline] = useState(0);
  const refresh = () => revision((v) => v + 1);
  const memory = runtime.memory,
    recorder = runtime.recorder,
    events = runtime.events,
    currentEvent = events.at(-1),
    highlight = pickedEvent || currentEvent;
  const live = memory.blocks.filter((b) => b.alive),
    block = live.find(
      (b) => selected >= b.address && selected < b.address + b.size,
    ),
    stats = allocationAnalysis(memory),
    decoded = interpretations(memory, selected);
  const advance = () => {
    setPickedEvent(null);
    runtime.step();
    const event = runtime.events.at(-1);
    if (follow && event?.address != null) setSelected(event.address);
    if (runtime.status === "complete" || runtime.status === "fault")
      setRunning(false);
    refresh();
  };
  useLabClock(running, advance, speed);
  const chooseView = (key) => {
    setRunning(false);
    setView(key);
  };
  const inspectEvent = (event) => {
    setRunning(false);
    runtime.seek(event.index);
    if (event.address !== null) setSelected(event.address);
    setFollow(false);
    setPickedEvent(event);
    refresh();
    setView("memory");
  };
  const seek = (index) => {
    setRunning(false);
    setPickedEvent(null);
    runtime.seek(index);
    refresh();
  };
  const load = (key) => {
    setRunning(false);
    runtime.reset(key);
    setBaseline(0);
    setPickedEvent(null);
    setSelected(BASE + HEAP_START);
    setAllocationFilter("all");
    refresh();
  };
  const visibleEvents = events.filter(
    (e) =>
      (filter === "all" || e.kind === filter) &&
      (allocationFilter === "all" ||
        e.allocationId === Number(allocationFilter)),
  );
  const diff = snapshotDiff(
    recorder.records[Math.min(baseline, recorder.records.length - 1)].state,
    recorder.current.state,
  );
  const hotspots = [...runtime.accesses]
    .map((count, index) => ({ count, address: BASE + index }))
    .filter((r) => r.count)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const timeline = (
    <div className="mn-timeline">
      <label>
        Recorded event
        <input
          type="range"
          min="0"
          max={recorder.records.length - 1}
          value={recorder.cursor}
          onChange={(e) => seek(Number(e.target.value))}
        />
      </label>
      <output>
        {recorder.cursor} / {recorder.records.length - 1}
      </output>
      <span>
        {recorder.cursor === recorder.records.length - 1
          ? "Latest recorded state"
          : "Historical state · Next replays recorded events"}
      </span>
    </div>
  );
  const controls = (
    <>
      <div className="lab-toolbar mn-controls">
        <label>
          Program
          <select
            value={runtime.example}
            onChange={(e) => load(e.target.value)}
          >
            {Object.entries(EXAMPLES).map(([key, example]) => (
              <option key={key} value={key}>
                {example.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="lab-primary"
          disabled={
            (runtime.status === "complete" &&
              recorder.cursor === recorder.records.length - 1) ||
            runtime.status === "fault"
          }
          onClick={() => setRunning((v) => !v)}
        >
          {running ? "Pause" : "Run"}
        </button>
        <button
          onClick={() => seek(recorder.cursor - 1)}
          disabled={recorder.cursor === 0}
        >
          Previous event
        </button>
        <button
          onClick={() => {
            setRunning(false);
            advance();
          }}
          disabled={
            (runtime.status === "complete" &&
              recorder.cursor === recorder.records.length - 1) ||
            runtime.status === "fault"
          }
        >
          Next event
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setPickedEvent(null);
            runtime.finish();
            const event = runtime.events.at(-1);
            if (follow && event?.address != null) setSelected(event.address);
            refresh();
          }}
        >
          Run to end
        </button>
        <button onClick={() => load(runtime.example)}>Reset program</button>
        <label>
          Playback events/s
          <input
            type="range"
            min="1"
            max="12"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <output>{speed}</output>
        </label>
      </div>
      {timeline}
    </>
  );
  return (
    <Workspace
      id="mnemosyne"
      name="MNEMOSYNE"
      number="007 / MEMORY & DYNAMIC ANALYSIS"
      description="Inspect a modeled program through its allocations, stored bytes, and recorded accesses."
      tabs={TABS}
      view={view}
      onView={chooseView}
      summary={
        <>
          <span>
            Event <b>{recorder.cursor}</b>
          </span>
          <span>
            Heap{" "}
            <b>
              {stats.used} / {HEAP_END - HEAP_START} B
            </b>
          </span>
          <span>
            Stack depth <b>{stats.depth}</b>
          </span>
          <span>
            {running
              ? "Running"
              : runtime.status === "complete"
                ? "Program complete"
                : runtime.status === "fault"
                  ? "Fault"
                  : "Paused"}
          </span>
        </>
      }
    >
      {controls}
      {runtime.fault && (
        <p className="lab-error" role="alert">
          {runtime.fault}
        </p>
      )}
      {view === "memory" && (
        <div className="lab-grid">
          <div>
            <div className="lab-toolbar">
              <label>
                Map view
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="window">128-byte address window</option>
                  <option value="all">Entire process · 1 KiB</option>
                </select>
              </label>
              <label className="lab-check">
                <input
                  type="checkbox"
                  checked={follow}
                  onChange={(e) => setFollow(e.target.checked)}
                />
                Follow memory activity
              </label>
            </div>
            <MemoryMap
              scope={scope}
              memory={memory}
              selected={selected}
              highlight={highlight}
              onSelect={(at) => {
                setRunning(false);
                setSelected(at);
                setFollow(false);
              }}
            />
          </div>
          <aside className="lab-stack">
            <div className="lab-card">
              <h2>{block?.label || "Unallocated address"}</h2>
              <div className="lab-controls">
                <label>
                  Inspect address (decimal)
                  <input
                    type="number"
                    min={BASE}
                    max={BASE + SIZE - 1}
                    value={selected}
                    onChange={(e) => {
                      const at = Number(e.target.value);
                      if (
                        Number.isInteger(at) &&
                        at >= BASE &&
                        at < BASE + SIZE
                      ) {
                        setSelected(at);
                        setRunning(false);
                        setFollow(false);
                      }
                    }}
                  />
                </label>
                <label>
                  Live object
                  <select
                    value={block?.id ?? ""}
                    onChange={(e) => {
                      setRunning(false);
                      setFollow(false);
                      setSelected(
                        live.find((b) => b.id === Number(e.target.value))
                          .address,
                      );
                    }}
                  >
                    <option value="" disabled>
                      Select allocation
                    </option>
                    {live.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} {b.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <dl className="lab-readouts mn-details">
                <div>
                  <dt>Selected address</dt>
                  <dd>{address(selected)}</dd>
                </div>
                <div>
                  <dt>Allocation identity</dt>
                  <dd>
                    {block ? `#${block.id} · ${block.kind}` : "No live owner"}
                  </dd>
                </div>
                <div>
                  <dt>Requested / reserved</dt>
                  <dd>
                    {block ? `${block.requested} / ${block.size} B` : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Address range</dt>
                  <dd>
                    {block
                      ? `${address(block.address)}–${address(block.address + block.size - 1)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              {block && <ByteTable memory={memory} block={block} />}
              <div className="lab-toolbar mn-details">
                <button
                  disabled={!block}
                  onClick={() => {
                    setAllocationFilter(String(block.id));
                    chooseView("trace");
                  }}
                >
                  Trace this object
                </button>
                <button onClick={() => chooseView("structures")}>
                  Interpret bytes
                </button>
              </div>
            </div>
            <div className="lab-card">
              <h3>{pickedEvent ? "Selected trace event" : "Latest event"}</h3>
              <p>
                {highlight?.description ||
                  "Ready to allocate the first object."}
              </p>
              {highlight?.address != null && (
                <p className="lab-hint">
                  Event {highlight.index} · {address(highlight.address)} ·{" "}
                  {highlight.size} bytes
                </p>
              )}
              {pickedEvent && (
                <p className="lab-hint">
                  Showing the captured state immediately after this event. Next
                  event replays the recorded future.
                </p>
              )}
              <p className="lab-hint">
                {EXAMPLES[runtime.example].description}
              </p>
              <h3 className="mn-details">Next operation</h3>
              <code className="mn-operation">
                {operationText(runtime.program[runtime.pc])}
              </code>
              <p className="lab-hint">
                These operations run inside a 1 KiB modeled address space. They
                do not inspect other programs or host memory.
              </p>
            </div>
          </aside>
        </div>
      )}
      {view === "trace" && (
        <>
          <h2>Recorded memory activity</h2>
          <div className="lab-toolbar">
            <label>
              Event type
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All events</option>
                {[
                  "allocate",
                  "read",
                  "write",
                  "free",
                  "call",
                  "return",
                  "fault",
                ].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Allocation filter
              <select
                value={allocationFilter}
                onChange={(e) => setAllocationFilter(e.target.value)}
              >
                <option value="all">Every allocation</option>
                {memory.blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} {b.label}
                    {b.alive ? "" : " · released"}
                  </option>
                ))}
              </select>
            </label>
            <span className="lab-hint">
              {visibleEvents.length} events through the current timeline
              position
            </span>
          </div>
          <div className="lab-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Operation</th>
                  <th>Address / owner</th>
                  <th>Bytes before → after</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((e) => (
                  <tr key={e.index}>
                    <td>
                      {e.index} / {e.kind}
                    </td>
                    <td>{e.description}</td>
                    <td>
                      {e.address === null ? "—" : address(e.address)}
                      {e.allocationId !== null ? ` · #${e.allocationId}` : ""}
                    </td>
                    <td>
                      <code>
                        {e.before
                          ? e.before.map(hexByte).join(" ") + " → "
                          : ""}
                        {e.after
                          ? e.after.map(hexByte).join(" ")
                          : `${e.size} bytes`}
                      </code>
                    </td>
                    <td>
                      <button
                        disabled={e.address === null}
                        onClick={() => inspectEvent(e)}
                      >
                        Show bytes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleEvents.length && (
              <p className="lab-hint">
                No matching events at this timeline position. Advance the
                program or change the filters.
              </p>
            )}
          </div>
        </>
      )}
      {view === "structures" && (
        <>
          <h2>Interpretation backed by bytes</h2>
          <div className="lab-grid">
            <div className="lab-stack">
              <div className="lab-card">
                <h3>Declared pointer fields</h3>
                <p className="lab-hint">
                  Edges below decode little-endian 32-bit fields from declared
                  layouts. Numeric resemblance to an address alone does not
                  prove a pointer.
                </p>
                <div className="mn-pointer-list">
                  {stats.edges.map((edge, index) => {
                    const from = memory.blocks.find((b) => b.id === edge.from),
                      target = memory.blocks.find((b) => b.id === edge.to);
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelected(
                            edge.value >= BASE && edge.value < BASE + SIZE
                              ? edge.value
                              : from.address + edge.offset,
                          );
                          chooseView("memory");
                        }}
                      >
                        <span>
                          #{from.id} {from.label}
                          <small>
                            +{edge.offset}:{" "}
                            {Array.from(
                              memory.bytes.slice(
                                from.address + edge.offset - BASE,
                                from.address + edge.offset - BASE + 4,
                              ),
                            )
                              .map(hexByte)
                              .join(" ")}
                          </small>
                        </span>
                        <span aria-hidden="true">→</span>
                        <span>
                          {edge.status === "null"
                            ? "NULL"
                            : target
                              ? `#${target.id} ${target.label}`
                              : edge.status}
                          <small>{address(edge.value)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {block && <ByteTable memory={memory} block={block} />}
            </div>
            <div className="lab-card">
              <h3>Four bytes, several hypotheses</h3>
              <div className="lab-controls">
                <label>
                  Interpret address (decimal)
                  <input
                    type="number"
                    min={BASE}
                    max={BASE + SIZE - 4}
                    value={selected}
                    onChange={(e) => {
                      const at = Number(e.target.value);
                      if (
                        Number.isInteger(at) &&
                        at >= BASE &&
                        at <= BASE + SIZE - 4
                      )
                        setSelected(at);
                    }}
                  />
                </label>
                <label>
                  Interpretation
                  <select
                    value={interpretation}
                    onChange={(e) => setInterpretation(e.target.value)}
                  >
                    <option value="integer">Signed integer · i32</option>
                    <option value="unsigned">Unsigned integer · u32</option>
                    <option value="float">IEEE 754 float · f32</option>
                    <option value="text">ASCII bytes</option>
                    <option value="pointer">Address hypothesis</option>
                  </select>
                </label>
              </div>
              <p className="mn-decoded">
                {decoded
                  ? interpretation === "pointer"
                    ? address(decoded.unsigned)
                    : String(decoded[interpretation])
                  : "Choose four bytes inside the address space"}
              </p>
              <code>{decoded?.bytes.map(hexByte).join(" ")}</code>
              <p className="lab-hint">
                All numeric interpretations use little-endian byte order. Dots
                stand for non-printable ASCII. An address hypothesis is not
                automatically part of the pointer graph. Linked-list nodes
                declare value at +0 and next at +4; the record declares its
                pointer at +12.
              </p>
            </div>
          </div>
        </>
      )}
      {view === "analysis" && (
        <>
          <h2>Allocation and snapshot evidence</h2>
          <div className="lab-grid">
            <div className="lab-stack">
              <div className="lab-card">
                <dl className="lab-readouts">
                  {[
                    ["Reserved heap", `${stats.used} B`],
                    ["Payload bytes", `${stats.requested} B`],
                    ["Free heap", `${stats.free} B`],
                    ["Largest free gap", `${stats.largest} B`],
                    [
                      "External fragmentation",
                      `${(stats.fragmentation * 100).toFixed(1)}%`,
                    ],
                    ["Peak reserved heap", `${runtime.peakHeap} B`],
                    [
                      "Current / peak stack depth",
                      `${stats.depth} / ${runtime.peakDepth}`,
                    ],
                    ["Unreachable live allocations", stats.unreachable.length],
                  ].map(([name, value]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="lab-hint">
                  Fragmentation = 1 − largest free gap / total free heap.
                  Reachability starts from declared global and stack pointer
                  fields; unreachable objects are candidates, not proof of a
                  leak in arbitrary native code.
                </p>
              </div>
              <div className="lab-card">
                <h3>Unreachable allocation candidates</h3>
                {stats.unreachable.length ? (
                  stats.unreachable.map((b) => (
                    <button
                      className="mn-candidate"
                      key={b.id}
                      onClick={() => {
                        setSelected(b.address);
                        chooseView("memory");
                      }}
                    >
                      #{b.id} {b.label} · {address(b.address)} · {b.requested} B
                    </button>
                  ))
                ) : (
                  <p className="lab-hint">
                    No live heap objects are unreachable through the declared
                    roots.
                  </p>
                )}
                <p className="lab-hint">
                  During construction an allocation may be temporarily unlinked.
                  The end-of-program state is a useful checkpoint; absence of a
                  declared pointer can also change this result.
                </p>
              </div>
              <div className="lab-card">
                <h3>Most accessed addresses</h3>
                {hotspots.map((row) => (
                  <button
                    className="mn-hotspot"
                    key={row.address}
                    onClick={() => {
                      setSelected(row.address);
                      chooseView("memory");
                    }}
                  >
                    <span>{address(row.address)}</span>
                    <meter min="0" max={hotspots[0].count} value={row.count} />
                    <span>{row.count}</span>
                  </button>
                ))}
                {!hotspots.length && (
                  <p className="lab-hint">
                    Read or write operations are needed before an access history
                    is available.
                  </p>
                )}
                <p className="lab-hint">
                  Counts include instrumented reads and writes through the
                  selected timeline position, including earlier owners of reused
                  addresses.
                </p>
              </div>
            </div>
            <div className="lab-card">
              <h3>Snapshot comparison</h3>
              <label>
                Baseline event
                <select
                  value={baseline}
                  onChange={(e) => setBaseline(Number(e.target.value))}
                >
                  {recorder.records.map((_, i) => (
                    <option key={i} value={i}>
                      Event {i}
                    </option>
                  ))}
                </select>
              </label>
              <p className="lab-hint">
                A = event {baseline}; B = current event {recorder.cursor}.
                Compared by allocation identity as well as address.
              </p>
              <dl className="lab-readouts mn-details">
                <div>
                  <dt>Changed bytes</dt>
                  <dd>{diff.changes.length}</dd>
                </div>
                <div>
                  <dt>New / released objects</dt>
                  <dd>
                    {diff.created.length} / {diff.released.length}
                  </dd>
                </div>
              </dl>
              <p className="lab-hint">
                New:{" "}
                {diff.created.map((b) => `#${b.id} ${b.label}`).join(", ") ||
                  "none"}
                <br />
                Released:{" "}
                {diff.released.map((b) => `#${b.id} ${b.label}`).join(", ") ||
                  "none"}
              </p>
              <div className="lab-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>A</th>
                      <th>B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.changes.slice(0, 64).map((c) => (
                      <tr key={c.address}>
                        <td>{address(c.address)}</td>
                        <td>{hexByte(c.before)}</td>
                        <td>{hexByte(c.after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {diff.changes.length > 64 && (
                <p className="lab-hint">
                  Showing the first 64 of {diff.changes.length} changed bytes.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </Workspace>
  );
}
