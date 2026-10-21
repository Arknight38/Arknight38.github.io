import { useState } from "react";
import {
  Download,
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import Loom from "./Loom.jsx";
import { symbolLabel } from "./codec.js";
const size = (n) => `${n.toLocaleString()} B`;
export function InputPanel({
  text,
  file,
  example,
  examples,
  onExample,
  onText,
  onUpload,
  onReturn,
  onNext,
  bytes,
  model,
}) {
  return (
    <>
      <div className="huff-panel-heading">
        <div>
          <span className="eyebrow">01 / SOURCE</span>
          <h2>Choose something to compress.</h2>
        </div>
        <p>Text becomes UTF-8 bytes. Binary files keep their original bytes.</p>
      </div>
      <div className="huff-source-grid">
        <div className="huff-editor">
          <label className="huff-label">
            Load an example
            <select value={example} onChange={(e) => onExample(e.target.value)}>
              {example === "custom" && (
                <option value="custom">Custom input</option>
              )}
              {Object.entries(examples).map(([key, e]) => (
                <option key={key} value={key}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          {file ? (
            <div
              className="huff-file-card"
              role="group"
              aria-label="Binary input"
            >
              <Upload size={26} />
              <strong>{file.name}</strong>
              <span>{size(file.bytes.length)} · binary input</span>
              <button onClick={onReturn}>Return to text</button>
            </div>
          ) : (
            <label className="huff-label">
              Input text
              <textarea
                spellCheck="false"
                value={text}
                onChange={(e) => onText(e.target.value)}
              />
            </label>
          )}
          <div className="huff-source-actions">
            <button onClick={onUpload}>
              <Upload size={16} /> Open a file
            </button>
            <span>Local processing · up to 512 KiB</span>
          </div>
        </div>
        <aside className="huff-source-note">
          <span className="huff-note-mark" aria-hidden="true">
            01 → 10
          </span>
          <h3>Start with repetition.</h3>
          <p>
            The repeating signal has enough redundancy to cover the archive
            header. BANANA makes a smaller tree that is easier to step through.
          </p>
          <dl>
            <div>
              <dt>Input</dt>
              <dd>{size(bytes.length)}</dd>
            </div>
            <div>
              <dt>Unique byte values</dt>
              <dd>{model.leafCount} / 256</dd>
            </div>
            <div>
              <dt>Tree construction</dt>
              <dd>{model.merges.length} merges</dd>
            </div>
          </dl>
          <p>
            Changing the source resets the tree steps and selected byte.
            Switching views preserves them.
          </p>
        </aside>
      </div>
      <footer className="huff-panel-footer">
        <span>
          {bytes.length
            ? "The tree and archive update as the source changes."
            : "An empty input still has a valid archive header."}
        </span>
        <button className="huff-primary" onClick={onNext}>
          Build the tree <ArrowRight size={16} />
        </button>
      </footer>
    </>
  );
}
export function TreePanel({
  model,
  step,
  selected,
  onSelect,
  playing,
  onPlay,
  onStep,
  onNext,
}) {
  const merge = step ? model.merges[step - 1] : null;
  return (
    <>
      <div className="huff-panel-heading">
        <div>
          <span className="eyebrow">02 / CONSTRUCTION</span>
          <h2>Join the two lightest roots.</h2>
        </div>
        <p>
          {step} of {model.merges.length} merges ·{" "}
          {Math.max(0, model.leafCount - step)} active roots
        </p>
      </div>
      <div className="huff-tree-controls">
        <button
          onClick={() => onStep(0)}
          aria-label="Return to initial forest"
          disabled={!model.merges.length}
        >
          <SkipBack size={16} /> Start
        </button>
        <button onClick={onPlay} disabled={!model.merges.length}>
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Animate merges"}
        </button>
        <button onClick={() => onStep(step - 1)} disabled={step === 0}>
          <ChevronLeft size={16} /> Previous merge
        </button>
        <button
          onClick={() => onStep(step + 1)}
          disabled={step === model.merges.length}
        >
          Next merge <ArrowRight size={16} />
        </button>
        <button
          onClick={() => onStep(model.merges.length)}
          aria-label="Show completed tree"
          disabled={!model.merges.length}
        >
          <SkipForward size={16} /> Complete
        </button>
      </div>
      <label className="huff-step-slider">
        Merge step
        <input
          type="range"
          min="0"
          max={model.merges.length || 1}
          value={step}
          disabled={!model.merges.length}
          onChange={(e) => onStep(Number(e.target.value))}
        />
        <output>
          {step} / {model.merges.length}
        </output>
      </label>
      <p className="huff-merge-description" aria-live="polite">
        {!model.leafCount
          ? "No bytes to combine."
          : model.leafCount === 1
            ? "One leaf needs no merges. Its frequency is enough to reconstruct the input."
            : merge
              ? `Merge ${step}: combine weights ${model.nodes[merge.left].weight} + ${model.nodes[merge.right].weight} → ${merge.weight}.`
              : "The initial forest: one weighted leaf for every unique byte."}
      </p>
      <Loom model={model} step={step} selected={selected} onSelect={onSelect} />
      <footer className="huff-panel-footer">
        <span>
          Edges read left → right. The newest merge is orange. Select a leaf to
          highlight its path.
        </span>
        <button className="huff-primary" onClick={onNext}>
          Trace codes <ArrowRight size={16} />
        </button>
      </footer>
    </>
  );
}
export function TracePanel({
  model,
  bytes,
  symbols,
  selected,
  onSelect,
  query,
  onQuery,
  mode,
  onMode,
  onNext,
}) {
  const code = selected == null ? null : model.codes.get(selected),
    q = query.trim().toLowerCase();
  const filtered = symbols.filter(
    (s) =>
      !q ||
      symbolLabel(s.byte).toLowerCase().includes(q) ||
      `0x${s.byte.toString(16).padStart(2, "0")}` === q,
  );
  const path = [];
  let cursor = model.root;
  if (cursor >= 0 && code != null) {
    path.push({ id: cursor, bit: null });
    for (const bit of code) {
      cursor =
        bit === "0" ? model.nodes[cursor].left : model.nodes[cursor].right;
      path.push({ id: cursor, bit });
    }
  }
  const preview = Array.from(bytes.slice(0, 48));
  return (
    <>
      <div className="huff-panel-heading">
        <div>
          <span className="eyebrow">03 / PREFIX-FREE CODES</span>
          <h2>Follow one byte.</h2>
        </div>
        <p>
          Codes always use the completed tree, independently of the construction
          view.
        </p>
      </div>
      {!symbols.length ? (
        <div className="huff-empty">
          Add some input to inspect its codebook.
        </div>
      ) : (
        <div className="huff-trace-grid">
          <aside className="huff-codebook">
            <label className="huff-label">
              Find a byte
              <input
                type="search"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Character, SPACE, LF, or 0xFF"
              />
            </label>
            <div className="huff-codebook-heading">
              <span>Byte</span>
              <span>Count</span>
              <span>Code</span>
            </div>
            <div
              className="huff-codebook-scroll"
              role="group"
              aria-label="Select a byte to trace"
            >
              {filtered.map((s) => (
                <button
                  key={s.byte}
                  aria-label={`Trace byte ${symbolLabel(s.byte)}`}
                  aria-pressed={selected === s.byte}
                  onClick={() => onSelect(s.byte)}
                >
                  <strong>{symbolLabel(s.byte)}</strong>
                  <span>{s.count}×</span>
                  <code>{s.code || "∅"}</code>
                </button>
              ))}
              {!filtered.length && (
                <p className="huff-empty">
                  No matching bytes.{" "}
                  <button onClick={() => onQuery("")}>Clear search</button>
                </p>
              )}
            </div>
          </aside>
          <section
            className="huff-trace-detail"
            aria-label="Selected byte details"
          >
            <div className="huff-byte-heading">
              <strong>{symbolLabel(selected)}</strong>
              <div>
                <span>{model.frequencies[selected]} occurrences</span>
                <code>{code || "∅"}</code>
                <span>{code.length} bits per occurrence</span>
              </div>
            </div>
            <p className="huff-selected-path" aria-live="polite">
              {code === ""
                ? "Only one symbol: frequency alone reconstructs it; no payload bits are needed."
                : `${symbolLabel(selected)} → ${code} · ${code.length} bits per occurrence`}
            </p>
            <div
              className="huff-detail-switch"
              role="group"
              aria-label="Trace display"
            >
              <button
                aria-pressed={mode === "path"}
                onClick={() => onMode("path")}
              >
                Code path
              </button>
              <button
                aria-pressed={mode === "bits"}
                onClick={() => onMode("bits")}
              >
                Bitstream preview
              </button>
            </div>
            {mode === "path" ? (
              <>
                <ol
                  className="huff-code-path"
                  aria-label="Root-to-leaf code path"
                >
                  {path.map((item, i) => (
                    <li key={item.id}>
                      <span>{item.bit ?? "ROOT"}</span>
                      <div>
                        <strong>
                          {i === path.length - 1
                            ? symbolLabel(selected)
                            : "Branch"}
                        </strong>
                        <small>Weight {model.nodes[item.id].weight}</small>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="huff-hint">
                  Each edge adds one bit. A leaf ends the code, so no byte’s
                  code is the prefix of another.
                </p>
              </>
            ) : (
              <>
                <div
                  className="huff-bit-grid"
                  aria-label="Encoded input preview"
                >
                  {preview.map((byte, i) => (
                    <button
                      key={i}
                      aria-pressed={selected === byte}
                      onClick={() => onSelect(byte)}
                      aria-label={`Byte ${i + 1}: ${symbolLabel(byte)}, code ${model.codes.get(byte) || "empty"}`}
                    >
                      <span>
                        {i + 1} / {symbolLabel(byte)}
                      </span>
                      <code>{model.codes.get(byte) || "∅"}</code>
                    </button>
                  ))}
                </div>
                <p className="huff-hint">
                  First {preview.length} input bytes. Groups are separated here
                  for reading; archive bits concatenate without gaps.{" "}
                  {bytes.length > 48
                    ? "The archive includes the full input."
                    : ""}
                </p>
              </>
            )}
          </section>
        </div>
      )}
      <footer className="huff-panel-footer">
        <span>{symbols.length} unique bytes · ordered by frequency</span>
        <button className="huff-primary" onClick={onNext}>
          Inspect archive <ArrowRight size={16} />
        </button>
      </footer>
    </>
  );
}
export function ArchivePanel({
  model,
  bytes,
  packed,
  roundTrip,
  busy,
  onDownload,
  onDecode,
  decoded,
  onSaveDecoded,
  mode,
  onMode,
}) {
  const saving = bytes.length
      ? 100 * (1 - packed.bytes.length / bytes.length)
      : 0,
    max = Math.max(bytes.length, packed.bytes.length, 1);
  return (
    <>
      <div className="huff-panel-heading">
        <div>
          <span className="eyebrow">04 / FILE FORMAT</span>
          <h2>From codes to a real file.</h2>
        </div>
        <p>
          Payload savings and complete-archive savings are different
          measurements.
        </p>
      </div>
      <div
        className="huff-detail-switch"
        role="group"
        aria-label="Archive operation"
      >
        <button
          aria-pressed={mode === "encode"}
          onClick={() => onMode("encode")}
        >
          Encoded archive
        </button>
        <button
          aria-pressed={mode === "decode"}
          onClick={() => onMode("decode")}
        >
          Decode an archive
        </button>
      </div>
      {mode === "encode" ? (
        <div className="huff-archive-grid">
          <section
            className="huff-size-comparison"
            aria-label="Archive size breakdown"
          >
            <div className="huff-total">
              <span>Complete ARK1 archive</span>
              <strong>{size(packed.bytes.length)}</strong>
              <p>
                {bytes.length
                  ? `${Math.abs(saving).toFixed(1)}% ${saving >= 0 ? "smaller" : "larger"} than the ${size(bytes.length)} input`
                  : "Empty input; header only."}
              </p>
            </div>
            <div className="huff-size-row">
              <span>
                Original <b>{size(bytes.length)}</b>
              </span>
              <div className="huff-size-track">
                <i
                  className="original"
                  style={{ width: `${(bytes.length / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="huff-size-row">
              <span>
                Archive <b>{size(packed.bytes.length)}</b>
              </span>
              <div className="huff-size-track">
                <i
                  className="metadata"
                  style={{ width: `${(packed.headerBytes / max) * 100}%` }}
                />
                <i
                  className="payload"
                  style={{ width: `${(packed.payloadBytes / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="huff-bar-legend">
              <span>■ Metadata {size(packed.headerBytes)}</span>
              <span>■ Payload {size(packed.payloadBytes)}</span>
            </div>
            <p className="huff-hint">
              The header stores the filename, byte frequencies, and bit count.
              Small inputs can grow even when their payload shrinks.
            </p>
            <button
              className="huff-primary huff-download"
              disabled={!roundTrip || busy}
              onClick={onDownload}
            >
              <Download size={17} /> Download .ark archive
            </button>
          </section>
          <aside className="huff-format-details">
            <h3>What is stored?</h3>
            <dl>
              <div>
                <dt>Encoded payload</dt>
                <dd>{model.bitLength.toLocaleString()} bits</dd>
              </div>
              <div>
                <dt>After byte padding</dt>
                <dd>{size(packed.payloadBytes)}</dd>
              </div>
              <div>
                <dt>Metadata</dt>
                <dd>{size(packed.headerBytes)}</dd>
              </div>
              <div>
                <dt>Unique bytes</dt>
                <dd>{model.leafCount}</dd>
              </div>
            </dl>
            <details>
              <summary>Coding and format details</summary>
              <dl>
                <div>
                  <dt>Average code length</dt>
                  <dd>
                    {bytes.length
                      ? (model.bitLength / bytes.length).toFixed(3)
                      : "0.000"}{" "}
                    bits / byte
                  </dd>
                </div>
                <div>
                  <dt>Byte entropy</dt>
                  <dd>{model.entropy.toFixed(3)} bits / byte</dd>
                </div>
              </dl>
              <p>
                Header integers: little-endian. Payload bits: most-significant
                first. The bit count excludes final-byte padding.
              </p>
              <p>
                A one-symbol input has zero payload bits and reconstructs from
                its stored frequency.
              </p>
            </details>
          </aside>
        </div>
      ) : (
        <section className="huff-decode">
          <Upload size={28} />
          <h3>Open an ARK1 archive.</h3>
          <p>
            Decode a file from this experiment or the original C++ compressor.
            The decoded result stays here while exploring the other views.
          </p>
          <button className="huff-primary" disabled={busy} onClick={onDecode}>
            <Upload size={16} /> Open .ark file
          </button>
          {decoded && (
            <div className="huff-decoded" role="status">
              <strong>Archive decoded</strong>
              <p>
                {decoded.filename} · {size(decoded.bytes.length)}
              </p>
              <button onClick={onSaveDecoded}>
                <Download size={16} /> Save decoded file
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}

const hex = (value, width = 2) =>
  value.toString(16).toUpperCase().padStart(width, "0");
export function OutputBytesPanel({ packed, page, onPage }) {
  const data = packed.bytes;
  const [selectedOffset, setSelectedOffset] = useState(0);
  const selected = Math.min(selectedOffset, data.length - 1);
  const nameLength = new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  ).getUint16(6, true);
  const field = (offset) => {
    if (offset < 4) return "Magic / ARK1";
    if (offset < 6) return "Unique-byte count / uint16 little-endian";
    if (offset < 8) return "Filename length / uint16 little-endian";
    if (offset < 8 + nameLength) return "UTF-8 filename";
    if (offset < packed.headerBytes - 8)
      return (offset - 8 - nameLength) % 9 === 0
        ? "Frequency entry / byte value"
        : "Frequency entry / uint64 little-endian count";
    if (offset < packed.headerBytes)
      return "Payload bit count / uint64 little-endian";
    return "Encoded payload / most-significant bit first";
  };
  const pages = Math.ceil(data.length / 256);
  const current = Math.min(page, pages - 1);
  const start = current * 256;
  const end = Math.min(start + 256, data.length);
  const rows = Array.from(
    { length: Math.ceil((end - start) / 16) },
    (_, row) => start + row * 16,
  );
  return (
    <>
      <div className="huff-panel-heading">
        <div>
          <span className="eyebrow">05 / BINARY OUTPUT</span>
          <h2>The file, byte for byte.</h2>
        </div>
        <p>
          The exact bytes saved by Download .ark archive. Hexadecimal on the
          left; printable ASCII on the right.
        </p>
      </div>
      <div className="huff-byte-legend">
        <span>■ Header · {size(packed.headerBytes)}</span>
        <span>■ Payload · {size(packed.payloadBytes)}</span>
      </div>
      <p className="huff-hint">
        Offsets are hexadecimal. Select or focus a byte for its field, decimal
        value, and bits. A dot marks a byte outside printable ASCII; the file
        still contains its original value.
      </p>
      <p className="huff-byte-inspector" role="status">
        0x{hex(selected, 8)} · {field(selected)} · {data[selected]} decimal ·{" "}
        {data[selected].toString(2).padStart(8, "0")} binary
      </p>
      <div
        className="huff-hex-scroll"
        role="region"
        aria-label="ARK1 output bytes"
        tabIndex={0}
      >
        <table className="huff-hex-table">
          <caption>
            Bytes {start.toLocaleString()}–{(end - 1).toLocaleString()} of{" "}
            {data.length.toLocaleString()} · 16 bytes per row
          </caption>
          <thead>
            <tr>
              <th scope="col">Offset</th>
              {Array.from({ length: 16 }, (_, i) => (
                <th scope="col" key={i}>
                  {hex(i)}
                </th>
              ))}
              <th scope="col">ASCII</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((offset) => (
              <tr key={offset}>
                <th scope="row">{hex(offset, 8)}</th>
                {Array.from({ length: 16 }, (_, column) => {
                  const at = offset + column;
                  if (at >= end) return <td key={column} />;
                  const value = data[at];
                  const description = `Offset 0x${hex(at, 8)} · ${field(at)} · hex ${hex(value)} · decimal ${value} · binary ${value.toString(2).padStart(8, "0")}`;
                  return (
                    <td
                      key={column}
                      className={
                        at < packed.headerBytes
                          ? "huff-hex-header"
                          : "huff-hex-payload"
                      }
                    >
                      <button
                        onFocus={() => setSelectedOffset(at)}
                        onClick={() => setSelectedOffset(at)}
                        title={description}
                        aria-label={description}
                      >
                        {hex(value)}
                      </button>
                    </td>
                  );
                })}
                <td className="huff-hex-ascii">
                  {Array.from(
                    data.slice(offset, Math.min(offset + 16, end)),
                    (value) =>
                      value >= 32 && value <= 126
                        ? String.fromCharCode(value)
                        : ".",
                  ).join("")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="huff-panel-footer">
        <span>
          Page {current + 1} of {pages} · the entire archive is available across
          pages.
        </span>
        <div className="huff-byte-pages">
          <button disabled={current === 0} onClick={() => onPage(current - 1)}>
            Previous bytes
          </button>
          <button
            disabled={current === pages - 1}
            onClick={() => onPage(current + 1)}
          >
            Next bytes
          </button>
        </div>
      </footer>
    </>
  );
}
