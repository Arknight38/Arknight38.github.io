import LabNavigation from "../shared/LabNavigation.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";
import { archive, buildModel, decodeArchive, MAX_BYTES } from "./codec.js";
import {
  InputPanel,
  TreePanel,
  TracePanel,
  ArchivePanel,
  OutputBytesPanel,
} from "./WorkspacePanels.jsx";
import "./huffman.css";
const EXAMPLES = {
  signal: {
    label: "A repeating signal",
    text: "signal signal signal signal signal signal signal signal\nnoise noise noise\nsignal signal signal signal\n".repeat(
      8,
    ),
  },
  banana: { label: "The classic: BANANA", text: "BANANA_BANDANA" },
  equal: { label: "Equal frequencies", text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  single: { label: "One unique symbol", text: "A".repeat(64) },
};
const VIEWS = [
  ["input", "Input", "Text or file"],
  ["tree", "Build tree", "Step through merges"],
  ["codes", "Trace codes", "Inspect one byte"],
  ["archive", "Archive", "Download or decode"],
  ["bytes", "Output bytes", "Inspect the ARK1 file"],
];
function save(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes])),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Huffman() {
  const [text, setText] = useState(EXAMPLES.signal.text),
    [file, setFile] = useState(null),
    [example, setExample] = useState("signal");
  const [view, setView] = useState("input"),
    [step, setStep] = useState(0),
    [selected, setSelected] = useState(null),
    [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState(""),
    [traceMode, setTraceMode] = useState("path"),
    [archiveMode, setArchiveMode] = useState("encode"),
    [bytePage, setBytePage] = useState(0);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [decoded, setDecoded] = useState(null),
    [focused, setFocused] = useState(false);
  const uploadRef = useRef(null),
    decodeRef = useRef(null),
    job = useRef(0),
    tabs = useRef({}),
    root = useRef(null),
    focusToggle = useRef(null);
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const bytes = useMemo(
    () => file?.bytes || new TextEncoder().encode(text),
    [file, text],
  );
  const model = useMemo(() => buildModel(bytes), [bytes]);
  const packed = useMemo(
    () => archive(model, file?.name || "message.txt"),
    [model, file],
  );
  const symbols = useMemo(
    () =>
      [...model.codes]
        .map(([byte, code]) => ({ byte, code, count: model.frequencies[byte] }))
        .sort((a, b) => b.count - a.count || a.byte - b.byte),
    [model],
  );
  const tracedByte =
    selected !== null && model.codes.has(selected)
      ? selected
      : (symbols[0]?.byte ?? null);
  const currentStep = Math.min(step, model.merges.length);
  const saving = bytes.length
    ? 100 * (1 - packed.bytes.length / bytes.length)
    : null;
  const roundTrip = useMemo(() => {
    const result = decodeArchive(packed.bytes).bytes;
    return (
      result.length === bytes.length && result.every((b, i) => b === bytes[i])
    );
  }, [packed, bytes]);
  useEffect(
    () => () => {
      job.current++;
    },
    [],
  );
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(
      () => {
        const next = Math.min(currentStep + 1, model.merges.length);
        setStep(next);
        if (next === model.merges.length) setPlaying(false);
      },
      reduced.current ? 1000 : 550,
    );
    return () => clearTimeout(timer);
  }, [playing, currentStep, model.merges.length]);
  useEffect(() => {
    if (!focused) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e) => {
      if (e.key === "Escape") {
        setFocused(false);
        focusToggle.current?.focus();
      }
      if (e.key === "Tab") {
        const items = [
          ...root.current.querySelectorAll(
            'a[href],button:not([disabled]),input:not([disabled]):not([hidden]),textarea,select,[tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
    };
  }, [focused]);
  const go = (next) => {
    setPlaying(false);
    setView(next);
    tabs.current[next]?.focus();
  };
  const resetModelView = () => {
    setBytePage(0);
    setStep(0);
    setSelected(null);
    setPlaying(false);
    setQuery("");
    setError("");
  };
  const loadExample = (key) => {
    if (!EXAMPLES[key]) return;
    job.current++;
    setBusy(false);
    setFile(null);
    setText(EXAMPLES[key].text);
    setExample(key);
    resetModelView();
  };
  const updateText = (value) => {
    if (new TextEncoder().encode(value).length > MAX_BYTES) {
      setError("Keep the input below 512 KiB.");
      return;
    }
    job.current++;
    setBusy(false);
    setFile(null);
    setText(value);
    setExample("custom");
    resetModelView();
  };
  const returnText = () => {
    job.current++;
    setBusy(false);
    setFile(null);
    setExample("custom");
    resetModelView();
  };
  const upload = async (event, decode = false) => {
    const input = event.target,
      source = input.files?.[0];
    input.value = "";
    if (!source) return;
    const token = ++job.current;
    setError("");
    setBusy(true);
    if (decode) {
      setDecoded(null);
      setView("archive");
      setArchiveMode("decode");
    }
    try {
      if (source.size > (decode ? MAX_BYTES + 68000 : MAX_BYTES))
        throw new Error("Choose a file of 512 KiB or less before compression.");
      const data = new Uint8Array(await source.arrayBuffer());
      if (token !== job.current) return;
      if (decode) setDecoded(decodeArchive(data));
      else {
        setFile({ name: source.name, bytes: data });
        setExample("custom");
        resetModelView();
      }
    } catch (err) {
      if (token === job.current) setError(err.message);
    } finally {
      if (token === job.current) setBusy(false);
    }
  };
  const onStep = (next) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(next, model.merges.length)));
  };
  const play = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (currentStep >= model.merges.length) setStep(0);
    setPlaying(true);
  };
  const tabKey = (event, key) => {
    const at = VIEWS.findIndex((v) => v[0] === key);
    let next;
    if (event.key === "ArrowRight") next = (at + 1) % VIEWS.length;
    if (event.key === "ArrowLeft")
      next = (at + VIEWS.length - 1) % VIEWS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = VIEWS.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      go(VIEWS[next][0]);
    }
  };
  return (
    <article
      className={`huffman-page${focused ? " huff-focused" : ""}`}
      id="huffman-experiment"
      ref={root}
      role={focused ? "dialog" : undefined}
      aria-modal={focused ? true : undefined}
      aria-label={focused ? "Code Loom workspace" : undefined}
    >
      <header className="huff-heading">
        <div>
          <Link to="/lab" className="huff-back">
            <ArrowLeft size={15} /> Lab notebook
          </Link>
          <div className="eyebrow">EXPERIMENT 002 / LOSSLESS COMPRESSION</div>
          <h1>
            Code <span>loom.</span>
            <i aria-hidden="true">⌘</i>
          </h1>
          <p>From repeating characters to simple bytes.</p>
        </div>
        <button
          ref={focusToggle}
          onClick={() => setFocused((v) => !v)}
          aria-pressed={focused}
        >
          {focused ? <Minimize size={16} /> : <Maximize size={16} />}{" "}
          {focused ? "Exit focus" : "Focus workspace"}
        </button>
      </header>
      <LabNavigation lab="huffman" />
      <div className="huff-session" aria-label="Current compression summary">
        <span title={file?.name || "UTF-8 text"}>
          {file?.name || "Text / UTF-8"}
        </span>
        <span>
          <b>{bytes.length.toLocaleString()} B</b> input
        </span>
        <span>
          <b>{packed.bytes.length.toLocaleString()} B</b> archive
        </span>
        <span
          className={
            saving != null && saving < 0 ? "huff-growth" : "huff-saving"
          }
        >
          {saving == null
            ? "Header only"
            : `${Math.abs(saving).toFixed(1)}% ${saving >= 0 ? "smaller" : "larger"}`}
        </span>
        <span className="huff-verified">
          {roundTrip
            ? "✓ Byte-for-byte round trip verified"
            : "Round trip failed"}
        </span>
      </div>
      <div
        className="huff-tabs"
        role="tablist"
        aria-label="Compression workspace"
      >
        {VIEWS.map(([key, label, hint], i) => (
          <button
            key={key}
            ref={(el) => {
              tabs.current[key] = el;
            }}
            id={`huff-tab-${key}`}
            role="tab"
            aria-selected={view === key}
            aria-controls={`huff-panel-${key}`}
            tabIndex={view === key ? 0 : -1}
            onClick={() => go(key)}
            onKeyDown={(e) => tabKey(e, key)}
          >
            <span>0{i + 1}</span>
            <div>
              {label}
              <small>{hint}</small>
            </div>
          </button>
        ))}
      </div>
      <input
        hidden
        ref={uploadRef}
        aria-label="Input file"
        type="file"
        onChange={(e) => upload(e)}
      />
      <input
        hidden
        ref={decodeRef}
        aria-label="ARK1 archive"
        type="file"
        accept=".ark"
        onChange={(e) => upload(e, true)}
      />
      {busy && (
        <p className="huff-feedback" role="status">
          Reading file…
        </p>
      )}
      {error && (
        <p className="huff-error" role="alert">
          {error}
        </p>
      )}
      <section
        id={`huff-panel-${view}`}
        role="tabpanel"
        aria-labelledby={`huff-tab-${view}`}
        tabIndex={0}
        className="huff-panel"
      >
        {view === "input" && (
          <InputPanel
            text={text}
            file={file}
            example={example}
            examples={EXAMPLES}
            onExample={loadExample}
            onText={updateText}
            onUpload={() => uploadRef.current.click()}
            onReturn={returnText}
            onNext={() => go("tree")}
            bytes={bytes}
            model={model}
          />
        )}
        {view === "tree" && (
          <TreePanel
            model={model}
            step={currentStep}
            selected={selected}
            onSelect={setSelected}
            playing={playing}
            onPlay={play}
            onStep={onStep}
            onNext={() => go("codes")}
          />
        )}
        {view === "codes" && (
          <TracePanel
            model={model}
            bytes={bytes}
            symbols={symbols}
            selected={tracedByte}
            onSelect={setSelected}
            query={query}
            onQuery={setQuery}
            mode={traceMode}
            onMode={setTraceMode}
            onNext={() => go("archive")}
          />
        )}
        {view === "archive" && (
          <ArchivePanel
            model={model}
            bytes={bytes}
            packed={packed}
            roundTrip={roundTrip}
            busy={busy}
            onDownload={() =>
              save(packed.bytes, `${file?.name || "message.txt"}.ark`)
            }
            onDecode={() => decodeRef.current.click()}
            decoded={decoded}
            onSaveDecoded={() => save(decoded.bytes, decoded.filename)}
            mode={archiveMode}
            onMode={setArchiveMode}
          />
        )}
        {view === "bytes" && (
          <OutputBytesPanel
            packed={packed}
            page={bytePage}
            onPage={setBytePage}
          />
        )}
      </section>
    </article>
  );
}
