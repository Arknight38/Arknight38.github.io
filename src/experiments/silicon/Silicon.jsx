import { useState } from "react";
import Workspace from "../shared/Workspace.jsx";
import useLabClock from "../shared/useLabClock.js";
import { CPU, assemble, PROGRAMS, ISA, hex } from "./engine.js";
import "./silicon.css";
const TABS = [
  ["display", "Computer", "Pixels from instructions"],
  ["program", "Program", "Assembly and bytecode"],
  ["cpu", "Execution", "Datapath and ALU"],
  ["memory", "Memory", "All 256 bytes"],
];
const PHASES = ["Fetch", "Decode", "Execute", "Writeback"];
function Datapath({ cpu }) {
  const blocks = [
    [20, 20, "PC", `0x${hex(cpu.pc)}`],
    [220, 20, "MEMORY", "256 bytes"],
    [420, 20, "IR", cpu.ir ? cpu.ir.map(hex).join(" ") : "—"],
    [20, 150, "REGISTERS", Array.from(cpu.regs).map(hex).join(" ")],
    [220, 150, "ALU", (cpu.pending?.alu || cpu.lastALU)?.name || "—"],
    [420, 150, "FLAGS", `Z ${+cpu.flags.z} / C ${+cpu.flags.c}`],
  ];
  const active = [
    [0, 1, 2],
    [2, 3],
    [3, 4],
    [0, 1, 3, 5],
  ][cpu.phase];
  return (
    <svg
      viewBox="0 0 610 260"
      role="img"
      aria-label={`Datapath after ${cpu.cycles} microsteps; next stage ${PHASES[cpu.phase]}`}
      className="silicon-datapath"
    >
      <g stroke="#52684a" fill="none">
        <path d="M180 60H220M380 60H420M500 100V130H100V150M180 190H220M380 190H420" />
      </g>
      {blocks.map(([x, y, name, value], i) => (
        <g key={name}>
          <rect
            x={x}
            y={y}
            width="160"
            height="85"
            fill={active.includes(i) ? "#29391d" : "#19221b"}
            stroke={active.includes(i) ? "#d7ff3f" : "#4a594a"}
          />
          <text x={x + 12} y={y + 26} fill="#b8c8b1" fontSize="13">
            {name}
          </text>
          <text
            x={x + 12}
            y={y + 58}
            fill="#edf2e5"
            fontSize="15"
            fontFamily="monospace"
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}
export default function Silicon() {
  const [source, setSource] = useState(PROGRAMS.weave.source),
    [program, setProgram] = useState(() => assemble(PROGRAMS.weave.source)),
    [cpu, setCPU] = useState(
      () => new CPU(assemble(PROGRAMS.weave.source).memory),
    ),
    [view, setView] = useState("display"),
    [running, setRunning] = useState(true),
    [, revision] = useState(0),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [speed, setSpeed] = useState(480),
    [cycleSpeed, setCycleSpeed] = useState(12),
    [demo, setDemo] = useState("weave"),
    [painting, setPainting] = useState(false),
    [ink, setInk] = useState(90),
    [breakpoint, setBreakpoint] = useState(""),
    [address, setAddress] = useState(192),
    [byte, setByte] = useState(1);
  const refresh = () => revision((n) => n + 1);
  const load = (text = source) => {
    setRunning(false);
    setPainting(false);
    try {
      const p = assemble(text);
      setProgram(p);
      setCPU(new CPU(p.memory));
      setSource(text);
      setDirty(false);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  const cycle = () => {
    setRunning(false);
    cpu.step();
    refresh();
  };
  const runBatch = () => {
    for (
      let i = 0;
      i < (view === "display" ? Math.max(4, Math.round(speed / 30) * 4) : 1);
      i++
    ) {
      if (
        cpu.phase === 0 &&
        breakpoint !== "" &&
        cpu.pc === Number(breakpoint)
      ) {
        setRunning(false);
        break;
      }
      cpu.step();
      if (cpu.halted || cpu.fault) {
        setRunning(false);
        break;
      }
    }
    refresh();
  };
  useLabClock(running, runBatch, view === "display" ? 30 : cycleSpeed);
  const alu = cpu.pending?.alu || cpu.lastALU;
  const controls = (
    <div className="lab-toolbar">
      <button
        className="lab-primary"
        disabled={cpu.halted || !!cpu.fault || dirty}
        onClick={() => setRunning((v) => !v)}
      >
        {running ? "Pause" : "Run"}
      </button>
      <button disabled={cpu.halted || !!cpu.fault || dirty} onClick={cycle}>
        Next cycle
      </button>
      <button
        disabled={cpu.halted || !!cpu.fault || dirty}
        onClick={() => {
          setRunning(false);
          cpu.instruction();
          refresh();
        }}
      >
        Step instruction
      </button>
      <button
        disabled={!cpu.history.length}
        onClick={() => {
          setRunning(false);
          cpu.previous();
          refresh();
        }}
      >
        Previous cycle
      </button>
      <button
        onClick={() => {
          setRunning(false);
          cpu.reset();
          refresh();
        }}
      >
        Reset CPU
      </button>
    </div>
  );
  return (
    <Workspace
      id="silicon"
      name="SILICON"
      number="005 / COMPUTER ARCHITECTURE"
      description="An original 8-bit instruction set with visible execution and memory-mapped pixels."
      tabs={TABS}
      view={view}
      onView={(v) => {
        setRunning(false);
        setView(v);
      }}
      summary={
        <>
          <span>
            PC <b>0x{hex(cpu.pc)}</b>
          </span>
          <span>
            Instructions <b>{cpu.instructions}</b>
          </span>
          <span>
            Microsteps <b>{cpu.cycles}</b>
          </span>
          <span>
            {cpu.fault
              ? "Fault"
              : cpu.halted
                ? "Halted"
                : running
                  ? "Running"
                  : "Paused"}
          </span>
          <span>
            Next <b>{PHASES[cpu.phase]}</b>
          </span>
        </>
      }
    >
      {(error || cpu.fault) && (
        <p className="lab-error" role="alert">
          {error || cpu.fault}
        </p>
      )}
      {view === "program" && (
        <>
          <h2>Assembly and its encoded bytes</h2>
          <div className="lab-toolbar">
            <label>
              Example program
              <select
                value=""
                onChange={(e) => {
                  load(PROGRAMS[e.target.value].source);
                  setDemo(e.target.value);
                }}
              >
                <option value="" disabled>
                  Load an example
                </option>
                {Object.entries(PROGRAMS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="lab-primary"
              onClick={() => {
                load();
                setDemo("");
              }}
            >
              Assemble & load
            </button>
            <button onClick={() => setView("cpu")}>Open execution</button>
            {dirty && <span className="lab-hint">Unassembled edits</span>}
          </div>
          <div className="lab-grid">
            <div>
              <label>
                Assembly source
                <textarea
                  className="silicon-source"
                  spellCheck="false"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setDirty(true);
                    setRunning(false);
                  }}
                />
              </label>
              <p className="lab-hint">
                Four registers (R0–R3), 256 bytes, three bytes per instruction.
                Labels resolve to byte addresses. Semicolon comments are
                supported.
              </p>
            </div>
            <div className="lab-card lab-table-scroll">
              <table>
                <caption>Loaded program</caption>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Bytes</th>
                    <th>Instruction</th>
                  </tr>
                </thead>
                <tbody>
                  {program.listing.map((row) => (
                    <tr key={row.address}>
                      <td>{hex(row.address)}</td>
                      <td>
                        <code>{row.bytes.map(hex).join(" ")}</code>
                      </td>
                      <td>
                        <code>{row.code}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <details>
            <summary>Instruction set</summary>
            <div className="lab-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Mnemonic</th>
                    <th>Opcode</th>
                    <th>Operands / effect</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ISA).map(([name, opcode]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{hex(opcode)}</td>
                      <td>
                        {name === "LDI"
                          ? "Rd, byte · load immediate"
                          : name === "LD" || name === "ST"
                            ? "R, address · direct load/store"
                            : name === "LDX" || name === "STX"
                              ? "Rdata, Raddress · indirect load/store"
                              : name === "JMP" ||
                                  name === "JZ" ||
                                  name === "JNZ"
                                ? "address or label · branch"
                                : name === "SHL" || name === "SHR"
                                  ? "R · shift one bit"
                                  : name === "HLT"
                                    ? "Stop at writeback"
                                    : name === "NOP"
                                      ? "No operation"
                                      : "Rd, Rs · result in Rd (CMP changes flags only)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      {view === "cpu" && (
        <>
          <h2>Instruction execution</h2>
          {controls}
          <div className="lab-grid">
            <div className="lab-card">
              <ol className="silicon-phases">
                {PHASES.map((phase, i) => (
                  <li
                    key={phase}
                    aria-current={i === cpu.phase ? "step" : undefined}
                  >
                    {phase}
                  </li>
                ))}
              </ol>
              <Datapath cpu={cpu} />
              <p className="lab-hint" role="status">
                {cpu.active}
              </p>
              <p className="lab-hint">
                The highlighted stage is next. Execute computes a pending
                result; writeback commits it. This is a four-stage teaching
                machine, not a cycle-accurate model of a commercial processor.
              </p>
            </div>
            <div className="lab-stack">
              <div className="lab-card">
                <h3>Registers and flags</h3>
                <dl className="lab-readouts">
                  {Array.from(cpu.regs).map((v, i) => (
                    <div key={i}>
                      <dt>R{i}</dt>
                      <dd>
                        0x{hex(v)} · {v}
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt>Zero</dt>
                    <dd>{+cpu.flags.z}</dd>
                  </div>
                  <div>
                    <dt>Carry / no borrow</dt>
                    <dd>{+cpu.flags.c}</dd>
                  </div>
                </dl>
              </div>
              <div className="lab-card lab-controls">
                <label>
                  Cycles/s target
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={cycleSpeed}
                    onChange={(e) => setCycleSpeed(Number(e.target.value))}
                  />
                  <output>{cycleSpeed}</output>
                </label>
                <label>
                  Breakpoint address
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={breakpoint}
                    onChange={(e) =>
                      setBreakpoint(
                        e.target.value === ""
                          ? ""
                          : String(
                              Math.max(
                                0,
                                Math.min(
                                  255,
                                  Math.floor(Number(e.target.value)),
                                ),
                              ),
                            ),
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </div>
          {alu && (
            <div className="lab-card" style={{ marginTop: 24 }}>
              <h3>
                ALU · {alu.name}: {alu.a}{" "}
                {alu.name === "ADD"
                  ? "+"
                  : alu.name === "SUB" || alu.name === "CMP"
                    ? "−"
                    : alu.name}{" "}
                {alu.b ?? ""} → {alu.result}
              </h3>
              {alu.bits && (
                <div className="lab-table-scroll">
                  <table>
                    <caption>
                      Actual ripple-carry addition · least significant bit first
                    </caption>
                    <thead>
                      <tr>
                        {["Bit", "A", "B", "Carry in", "Sum", "Carry out"].map(
                          (v) => (
                            <th key={v}>{v}</th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {alu.bits.map((bit) => (
                        <tr key={bit.bit}>
                          {Object.values(bit).map((v, i) => (
                            <td key={i}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {view === "memory" && (
        <>
          <h2>Byte-addressed memory</h2>
          {controls}
          <div className="lab-toolbar">
            <label>
              Address (decimal)
              <input
                type="number"
                min="0"
                max="255"
                value={address}
                onChange={(e) => setAddress(Number(e.target.value))}
              />
            </label>
            <label>
              Value (decimal)
              <input
                type="number"
                min="0"
                max="255"
                value={byte}
                onChange={(e) => setByte(Number(e.target.value))}
              />
            </label>
            <button
              onClick={() => {
                setRunning(false);
                try {
                  cpu.write(address, byte);
                  setError("");
                  refresh();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Write byte
            </button>
          </div>
          <div className="lab-table-scroll">
            <table className="silicon-memory">
              <caption>
                0x00–0xBF program/data · 0xC0–0xFF framebuffer · selected PC
                highlighted
              </caption>
              <thead>
                <tr>
                  <th>Offset</th>
                  {Array.from({ length: 16 }, (_, i) => (
                    <th key={i}>{i.toString(16).toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }, (_, row) => (
                  <tr key={row}>
                    <th>{hex(row * 16)}</th>
                    {Array.from({ length: 16 }, (_, col) => {
                      const at = row * 16 + col;
                      return (
                        <td key={col}>
                          <button
                            className={
                              at === cpu.pc
                                ? "silicon-pc"
                                : at >= 192
                                  ? "silicon-pixel-byte"
                                  : ""
                            }
                            aria-label={`Address 0x${hex(at)}: ${cpu.memory[at]}`}
                            onClick={() => {
                              setAddress(at);
                              setByte(cpu.memory[at]);
                            }}
                          >
                            {hex(cpu.memory[at])}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lab-hint">
            Writing memory pauses the CPU, restarts fetch at the current PC, and
            clears undo history. Self-modifying code is possible. Instruction
            bytes and data share memory.
          </p>
        </>
      )}
      {view === "display" && (
        <>
          <div className="lab-toolbar silicon-demo-picker">
            {["weave", "scan", "spectrum"].map((key) => (
              <button
                key={key}
                aria-pressed={demo === key && !dirty}
                onClick={() => {
                  load(PROGRAMS[key].source);
                  setDemo(key);
                  setRunning(true);
                }}
              >
                {PROGRAMS[key].name}
              </button>
            ))}
            <label>
              Instructions per second
              <input
                type="range"
                min="30"
                max="1200"
                step="30"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <output>{speed}</output>
            </label>
          </div>
          {controls}
          <div className="lab-grid">
            <div
              className="silicon-framebuffer"
              role="group"
              aria-label="8 by 8 framebuffer mapped from addresses 0xC0 through 0xFF"
            >
              {Array.from(cpu.memory.slice(192)).map((v, i) => (
                <button
                  disabled={!painting}
                  aria-label={`Pixel column ${(i % 8) + 1}, row ${Math.floor(i / 8) + 1}: byte ${v}`}
                  onClick={() => {
                    setRunning(false);
                    cpu.write(i + 192, ink);
                    setAddress(i + 192);
                    setByte(ink);
                    refresh();
                  }}
                  key={i}
                  title={`0x${hex(i + 192)}: ${v}`}
                  className={
                    cpu.lastWrite?.address === i + 192 ? "silicon-written" : ""
                  }
                  style={{
                    background: v
                      ? `hsl(${(v * 29) % 360} 65% ${35 + (v % 4) * 12}%)`
                      : "#111710",
                  }}
                />
              ))}
            </div>
            <div className="lab-stack">
              <div className="lab-card">
                <h2>{PROGRAMS[demo]?.name || "Pixel display"}</h2>
                <p>{PROGRAMS[demo]?.description}</p>
                <div
                  className="silicon-store-flow"
                  aria-label="Last committed pixel write"
                >
                  <span>
                    CPU <b>{cpu.decoded?.text || "Ready"}</b>
                  </span>
                  <span aria-hidden="true">↓</span>
                  <span>
                    RAM{" "}
                    <b>
                      {cpu.lastWrite
                        ? `0x${hex(cpu.lastWrite.address)} ← ${cpu.lastWrite.value}`
                        : "Awaiting a store"}
                    </b>
                  </span>
                  <span aria-hidden="true">↓</span>
                  <span>
                    PIXEL{" "}
                    <b>
                      {cpu.lastWrite?.address >= 192
                        ? `column ${((cpu.lastWrite.address - 192) % 8) + 1}, row ${Math.floor((cpu.lastWrite.address - 192) / 8) + 1}`
                        : "8 × 8 display"}
                    </b>
                  </span>
                </div>
                <p className="lab-hint">
                  The image is produced by the running CPU. Each of the 64
                  pixels reads one byte from addresses 0xC0–0xFF.
                </p>
              </div>
              <div className="lab-card">
                <h3>Draw directly into memory</h3>
                <p className="lab-hint">
                  Pause the program and paint pixels. Each click writes a byte
                  to RAM; running the program again lets its instructions
                  repaint the display.
                </p>
                <div className="lab-toolbar" style={{ marginTop: 16 }}>
                  <button
                    aria-pressed={painting}
                    onClick={() => {
                      setRunning(false);
                      setPainting((v) => !v);
                    }}
                  >
                    {painting ? "Finish drawing" : "Draw pixels"}
                  </button>
                  <label>
                    Color byte
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={ink}
                      onChange={(e) => setInk(Number(e.target.value))}
                    />
                    <output>{ink === 0 ? "0 · black" : ink}</output>
                  </label>
                </div>
                <h3>Working registers</h3>
                <div className="silicon-register-bits">
                  {Array.from(cpu.regs).map((value, index) => (
                    <div key={index}>
                      <span>
                        R{index} <b>{value}</b>
                      </span>
                      <div
                        aria-label={`Register ${index}: ${value.toString(2).padStart(8, "0")}`}
                      >
                        {Array.from({ length: 8 }, (_, bit) => (
                          <i
                            key={bit}
                            className={value & (1 << (7 - bit)) ? "on" : ""}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setRunning(false);
                    setView("program");
                  }}
                >
                  Inspect this program
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </Workspace>
  );
}
