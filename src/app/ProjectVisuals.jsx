import { SpectraEngine, PRESETS } from "../experiments/spectra/dsp/engine.js";
import { buildModel } from "../experiments/huffman/codec.js";
import "./project-visuals.css";

// Capture the real notch preset after settling; no decorative oscillator or RAF.
const engine = new SpectraEngine(PRESETS.notch.settings);
engine.advance(1);
function waveform(samples) {
  return Array.from(
    samples.slice(0, 128),
    (sample, i) =>
      `${i ? "L" : "M"}${(24 + (i / 127) * 752).toFixed(2)},${(172 - sample * 115).toFixed(2)}`,
  ).join(" ");
}
const inputPath = waveform(engine.input);
const outputPath = waveform(engine.output);

export function SpectraStudy() {
  return (
    <div
      className="waveform-study"
      role="img"
      aria-label="Actual SPECTRA capture: a dual-tone 32 and 96 Hz signal, overlaid with the output of a filter that rejects 96 Hz."
    >
      <div className="project-art-heading">
        <span>SPECTRA / FILTER IN ACTION</span>
        <span>01</span>
      </div>
      <div className="waveform-legend">
        <span className="waveform-input">Input · 32 + 96 Hz</span>
        <span className="waveform-output">Output · 96 Hz notch</span>
      </div>
      <svg viewBox="0 0 800 344" aria-hidden="true">
        <g stroke="var(--line)" strokeWidth="1" opacity=".6">
          {[24, 212, 400, 588, 776].map((x) => (
            <line x1={x} y1="26" x2={x} y2="318" key={x} />
          ))}
          {[57, 114, 172, 230, 287].map((y) => (
            <line x1="24" y1={y} x2="776" y2={y} key={y} />
          ))}
        </g>
        <path
          d={inputPath}
          fill="none"
          stroke="var(--tone-80b9ee, #80b9ee)"
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity=".75"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={outputPath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="waveform-time">
        <span>0 ms</span>
        <span>124 ms</span>
      </div>
      <div className="project-art-caption">
        <span>A complex signal. A cleaner sine.</span>
        <span>ACTUAL DSP CAPTURE</span>
      </div>
    </div>
  );
}
function BinaryColumn({ revised = false }) {
  return (
    <div className="binary-column">
      <h3>{revised ? "BINARY B" : "BINARY A"}</h3>
      <div className="instruction">
        <code className="instruction-bytes">8B 41 10</code>
        <code>mov eax, [rcx+0x10]</code>
      </div>
      <div
        className={
          revised
            ? "instruction instruction-after"
            : "instruction instruction-before"
        }
      >
        <code className="instruction-bytes">
          83 F8 <mark>{revised ? "02" : "01"}</mark>
        </code>
        <code>
          cmp eax, <mark>{revised ? "0x02" : "0x01"}</mark>
        </code>
      </div>
      <div className="instruction">
        <code className="instruction-bytes">75 04</code>
        <code>jne …</code>
      </div>
    </div>
  );
}
export function BinaryStudy() {
  return (
    <div
      className="binary-comparison"
      role="img"
      aria-label="Illustrative Atlus binary comparison. The byte 01 changes to 02, changing a comparison instruction from cmp eax, 0x01 to cmp eax, 0x02. This is an illustration, not a product screenshot."
    >
      <div className="project-art-heading">
        <span>ATLUS / BINARY DIFF</span>
        <span>02</span>
      </div>
      <div className="binary-columns">
        <BinaryColumn />
        <BinaryColumn revised />
      </div>
      <div className="project-art-caption">
        <span>One byte. A different condition.</span>
        <span>ILLUSTRATIVE DIFF</span>
      </div>
    </div>
  );
}

// The artwork uses the same deterministic tree and codes as the live compressor.
const huffmanText = "ABRACADABRA";
const huffmanModel = buildModel(new TextEncoder().encode(huffmanText));
const huffmanPositions = new Map();
let huffmanLeaf = 0;
function positionHuffmanNode(id, depth = 0) {
  const node = huffmanModel.nodes[id];
  const y = 46 + depth * 102;
  const x =
    node.left < 0
      ? 64 + huffmanLeaf++ * 116
      : (positionHuffmanNode(node.left, depth + 1) +
          positionHuffmanNode(node.right, depth + 1)) /
        2;
  huffmanPositions.set(id, { x, y });
  return x;
}
positionHuffmanNode(huffmanModel.root);
const huffmanSymbols = [...huffmanModel.codes.entries()].sort(
  (a, b) =>
    huffmanModel.frequencies[b[0]] - huffmanModel.frequencies[a[0]] ||
    a[0] - b[0],
);
export function HuffmanStudy() {
  return (
    <div
      className="huffman-study"
      role="img"
      aria-label="Actual Huffman tree for ABRACADABRA. A appears five times and receives code 0; B and R receive three-bit codes, as do C and D. Eleven input bytes produce 23 payload bits, excluding archive metadata."
    >
      <div className="project-art-heading">
        <span>CODE LOOM / FROM FREQUENCY TO FORM</span>
        <span>03</span>
      </div>
      <div className="huffman-study-layout">
        <div className="huffman-tree-art">
          <div className="huffman-art-source">
            <span>INPUT / 11 BYTES</span>
            <strong>{huffmanText}</strong>
          </div>
          <svg viewBox="0 0 600 402" aria-hidden="true">
            <defs>
              <pattern
                id="huffman-study-grid"
                width="29"
                height="29"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 29 0 L 0 0 0 29"
                  fill="none"
                  stroke="#444052"
                  strokeWidth=".6"
                />
              </pattern>
            </defs>
            <rect
              width="600"
              height="402"
              fill="url(#huffman-study-grid)"
              opacity=".45"
            />
            {huffmanModel.nodes
              .filter((n) => n.left >= 0)
              .flatMap((node) =>
                [node.left, node.right].map((child, bit) => {
                  const from = huffmanPositions.get(node.id),
                    to = huffmanPositions.get(child),
                    active = huffmanModel.nodes[child].symbol === 65;
                  return (
                    <g key={`${node.id}-${child}`}>
                      <path
                        d={`M${from.x},${from.y + 20} C${from.x},${from.y + 65} ${to.x},${to.y - 60} ${to.x},${to.y - 24}`}
                        fill="none"
                        stroke={active ? "#f3a388" : "#b6a5db"}
                        strokeWidth={active ? 3 : 1.7}
                      />
                      <text
                        x={(from.x + to.x) / 2 + (bit ? 12 : -12)}
                        y={(from.y + to.y) / 2 + 8}
                        fill={active ? "#f3a388" : "#c4b6e0"}
                        textAnchor="middle"
                        fontSize="26"
                        fontFamily="monospace"
                      >
                        {bit}
                      </text>
                    </g>
                  );
                }),
              )}
            {huffmanModel.nodes.map((node) => {
              const { x, y } = huffmanPositions.get(node.id),
                leaf = node.left < 0,
                active = node.symbol === 65;
              return (
                <g key={node.id}>
                  {leaf ? (
                    <>
                      <rect
                        x={x - 29}
                        y={y - 27}
                        width="58"
                        height="58"
                        rx="2"
                        fill={active ? "#f3a388" : "#292535"}
                        stroke={active ? "#f3a388" : "#a393c0"}
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y={y + 13}
                        textAnchor="middle"
                        fill={active ? "#211b20" : "#ede5fa"}
                        fontSize="38"
                        fontFamily="monospace"
                      >
                        {String.fromCharCode(node.symbol)}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r="24"
                        fill="#211f2a"
                        stroke="#b6a5db"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y={y + 9}
                        textAnchor="middle"
                        fill="#e4d9f4"
                        fontSize="26"
                        fontFamily="monospace"
                      >
                        {node.weight}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="huffman-code-art">
          <div className="huffman-code-art-heading">
            <span>BYTE / COUNT</span>
            <span>CODE</span>
          </div>
          {huffmanSymbols.map(([byte, code]) => (
            <div
              className={
                byte === 65 ? "huffman-art-code is-common" : "huffman-art-code"
              }
              key={byte}
            >
              <span>
                <strong>{String.fromCharCode(byte)}</strong>
                <span>{huffmanModel.frequencies[byte]}×</span>
              </span>
              <code>{code}</code>
              <i
                style={{
                  width: `${(huffmanModel.frequencies[byte] / 5) * 100}%`,
                }}
                aria-hidden="true"
              />
            </div>
          ))}
          <div className="huffman-art-payload">
            <span>PACKED PAYLOAD / {huffmanModel.bitLength} BITS</span>
            <code>
              {[...huffmanText]
                .map((c) => huffmanModel.codes.get(c.charCodeAt(0)))
                .join("")}
            </code>
            <p>Frequent bytes take the shortest path.</p>
          </div>
        </div>
      </div>
      <div className="project-art-caption">
        <span>One tree. Every bit accounted for.</span>
        <span>PAYLOAD ONLY</span>
      </div>
    </div>
  );
}
