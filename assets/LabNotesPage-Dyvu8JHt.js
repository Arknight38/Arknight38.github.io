import{d as e,l as t,m as n,r,t as i}from"./jsx-runtime-BhOe2DHf.js";import{t as a}from"./writeup-layout-BjMXN8Zm.js";import{t as o}from"./LabNavigation-BPg1WiAo.js";var s=n(e(),1),c=i();function l({id:e,title:t,summary:n,content:i}){let o=(0,s.useMemo)(()=>i.split(/^## /m).filter(e=>e.trim()).map(t=>{let n=t.indexOf(`
`),r=t.slice(0,n).trim();return{title:r,body:t.slice(n+1).trim(),id:`${e}-notes-${r.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-|-$/g,``)}`}}),[i,e]),l=Math.ceil(i.trim().split(/\s+/).length/220);return(0,c.jsxs)(`article`,{className:`lab-writeup`,id:`${e}-writeup`,tabIndex:-1,"aria-labelledby":`${e}-writeup-title`,children:[(0,c.jsxs)(`header`,{className:`lab-writeup-heading`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsxs)(`div`,{className:`eyebrow`,children:[`THE EXPERIMENT, EXPLAINED / `,l,` MIN READ`]}),(0,c.jsx)(`h1`,{id:`${e}-writeup-title`,children:t}),(0,c.jsx)(`p`,{children:n})]}),(0,c.jsx)(r,{to:`/lab/${e}`,className:`lab-return`,children:`Open experiment ↗`})]}),(0,c.jsxs)(`div`,{className:`lab-writeup-layout`,children:[(0,c.jsx)(`div`,{className:`lab-writeup-sections`,children:o.map(e=>(0,c.jsxs)(`section`,{id:e.id,tabIndex:-1,className:`lab-writeup-section`,children:[(0,c.jsx)(`h2`,{children:e.title}),(0,c.jsx)(`div`,{className:`markdown writeup-prose`,children:(0,c.jsx)(a,{children:e.body})})]},e.id))}),(0,c.jsx)(`aside`,{className:`lab-writeup-rail`,children:(0,c.jsxs)(`nav`,{"aria-label":`${t} sections`,children:[(0,c.jsx)(`span`,{className:`eyebrow`,children:`IN THIS WRITEUP`}),(0,c.jsx)(`ol`,{children:o.map(e=>(0,c.jsx)(`li`,{children:(0,c.jsx)(`a`,{href:`#${e.id}`,children:e.title})},e.id))}),(0,c.jsx)(r,{className:`lab-return`,to:`/lab/${e}`,children:`Try it in the experiment ↗`})]})})]})]})}var u=(0,s.memo)(l),d={spectra:{title:`Inside SPECTRA`,summary:`From poles and zeros to a measured waveform: the mathematics, implementation, and experiments behind the workstation.`,content:`## Overview

SPECTRA connects three views of one system: a signal changing over time, its frequency content, and the poles and zeros that shape a digital filter. The browser application is a port of an original Khan Academy / ProcessingJS project, with the signal generator, radix-2 FFT, and second-order filter separated from their rendering code.

The plots share actual computed samples. Moving a zero changes the filter coefficients, the filtered waveform, and the measured spectrum; the response curve independently evaluates the same coefficient set. The point of the workstation is making those relationships inspectable rather than presenting an animated waveform with unrelated controls.

## Start with a frequency cancellation

Load **Remove the 96 Hz tone**. The input contains tones at 32 Hz and 96 Hz. The preset places a conjugate zero pair at the angle corresponding to 96 Hz, with radius one, and a pole pair nearby inside the unit circle.

1. Compare the blue input and lime output in the oscilloscope. The output should lose the faster ripple contributed by the second tone.
2. Find the 96 Hz bin in the FFT. Its reduction is the measured consequence of the filter, while the response panel shows the designed notch.
3. Bypass the filter to compare against the original input, then reactivate it.
4. Move the zero angle away from 96 Hz. The tone returns as the cancellation moves elsewhere.

The default scope is phase-stabilized so this change can be studied without the waveform racing sideways. Pause holds the source capture while leaving the filter controls usable. The **Resonance at 128 Hz** preset provides a different experiment: broadband noise excites a narrow band emphasized by poles near the unit circle.

## Turning poles and zeros into a biquad

The z-plane edits conjugate pairs, preserving real coefficients. For a pair at radius r and angle θ, expanding the two factors produces a quadratic with a middle coefficient of −2r cos(θ) and a final coefficient of r².

The unnormalized numerator and denominator construction appears directly in \`spectra/dsp/biquad.js\`:

\`\`\`javascript
let b0 = 1,
  b1 = -2 * zeroR * Math.cos(zeroA),
  b2 = zeroR ** 2;
const a1 = -2 * poleR * Math.cos(poleA),
  a2 = poleR ** 2;
\`\`\`

The transfer function is \`(b0 + b1 z⁻¹ + b2 z⁻²) / (1 + a1 z⁻¹ + a2 z⁻²)\`. The implementation normally rescales the numerator for unit DC gain. When the numerator is effectively zero at DC, it retains the raw numerator instead of dividing by that zero.

Pole radius controls how persistent the recursive response becomes; moving a pole closer to the unit circle sharpens resonance. A zero on the unit circle creates an exact cancellation at its angle. The interface constrains pole radii below one and moves both members of a conjugate pair together.

## Filtering actual samples

The time-domain implementation retains two previous inputs and two previous outputs. Each new sample evaluates the difference equation:

\`\`\`javascript
const raw = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
\`\`\`

Source: \`spectra/dsp/biquad.js\`, excerpt from \`Biquad.sample\`.

Those state variables give the filter memory. The response curve is not used to paint an approximate output: the waveform comes from this recurrence, and its FFT is calculated afterward. This creates two independent ways to investigate the same system—an analytic frequency response and a measured response to generated input.

A numerical guard limits the displayed output to ±20 and reports when that guard activates. Large-gain configurations should therefore be interpreted with that status in mind: a limited waveform no longer represents the unconstrained linear filter. Changing coefficients clears filter state and reprocesses the captured input, giving paused inspection an immediate result.

## FFT bins, windowing, and amplitude

The simulation samples at 1024 Hz and analyzes 256 samples at a time. That gives 4 Hz bin spacing and a Nyquist frequency of 512 Hz. The displayed spectrum contains the nonnegative half of the transform, including DC and Nyquist.

Before the FFT, samples are multiplied by a Hann window. This reduces the discontinuity at the capture boundaries and spreads less energy into distant bins when the capture does not contain an integer number of cycles. It also changes amplitude, so the implementation normalizes by the window sum.

The one-sided amplitude conversion in \`spectra/dsp/fft.js\` is:

\`\`\`javascript
const factor = i === 0 || i === n / 2 ? 1 : 2;
result[i] = toDb((factor * Math.hypot(re[i], im[i])) / windowSum);
\`\`\`

Doubling interior bins accounts for their negative-frequency counterparts; DC and Nyquist remain unpaired. Values are expressed in decibels relative to unit peak amplitude. Bin spacing is a property of this capture size, not a promise that arbitrary neighboring tones can always be distinguished simply because their frequencies differ by 4 Hz.

## A stable scope without slowing the system

The scope keeps a separate 4096-sample display history. Periodic sources select a complete window aligned to a consistent source phase. Dual tones use their common repeat frequency; input and output use the same start time, preserving the filter's relative phase shift.

**Slow drift** gradually moves that display phase by 2% of a common cycle per simulated second. Noise and chirp do not have a fixed repeating phase, so they use real held captures refreshed twice per second. Fractional window starts are interpolated from the recorded samples.

This is a presentation choice. The generator, filter, FFT, and spectrogram continue on their existing sample clock. The stable view does not lower the signal frequencies or replace the output with a synthetic drawing. Immediately after reset, enough history must accumulate to choose a phase-aligned window.

## Reading the spectrogram and source behavior

The spectrogram adds a slice every 128 samples, or 125 ms. Its bounded history holds 80 rows, corresponding to up to ten seconds. Frequency runs horizontally, newer time appears at the bottom, and color represents magnitude from −90 to 0 dB. A fixed tone forms a vertical feature; the chirp moves across frequency as it sweeps.

Source choices expose different aspects of the filter. A sine isolates one frequency, dual tones show selective cancellation, and noise probes a broad range at once. Square and sawtooth generators introduce harmonics and are intentionally unbandlimited, matching the original experiment. Harmonics above Nyquist can alias into the visible band.

The application produces no audio. The sample rate is chosen for this visual experiment, and its frequencies and time axes should be read in that context. Background or offscreen SPECTRA views stop advancing rather than accumulating an invisible backlog.

## Concepts explored and verification

The project joins complex-plane geometry, recursive difference equations, Fourier analysis, window normalization, and sample-time scheduling. These concepts meet at observable checks: a unit-circle zero should suppress its tone, and the transform of an impulse response should agree with the analytic transfer function.

Tests compare the FFT with a direct DFT, recover a known sine amplitude, verify notch rejection, and check that different animation-frame increments produce the same samples. Separate scope tests establish phase stability without modifying FFT data. The distinction between DSP state and display state is part of the implementation, not just its folder structure.

## Things to do next

Useful extensions include selectable capture lengths, explicit trigger controls, and a bandlimited oscillator comparison. Averaging could make noise spectra easier to interpret, while a visible impulse-response view would connect the recurrence to its frequency response more directly. Those additions should retain the same rule: each plot must correspond to a defined computation and a clearly labeled time or frequency scale.
`},huffman:{title:`From bytes to an archive`,summary:`Follow the codebook, bit packing, and file-format decisions that make Code Loom work.`,content:`## Overview

Code Loom turns Huffman compression into a sequence that can be inspected: count bytes, merge the lightest trees, assign prefix-free codes, and pack those codes into a downloadable archive. The visualization and encoder share one model, so selecting a byte traces the code actually used in the file.

The browser port follows the original C++ compressor's vector-based merge order and ARK1 format. It accepts UTF-8 text or binary files up to 512 KiB and can decode an ARK1 archive locally. The aim is to show both the elegance of the coding algorithm and the less glamorous details required to store its result correctly.

## Try three very different inputs

Begin with **A repeating signal**, which contains enough repetition for the complete archive to be smaller than the input. Compare its encoded payload with its total archive size, then follow one common byte through the tree.

Next load **Equal frequencies**. With no dominant symbol, there is less opportunity to assign disproportionately short codes. Finally try **One unique symbol**: the archive can reconstruct the data from its frequency without storing a payload bit for every repeated byte.

**Input**, **Build tree**, **Trace codes**, and **Archive** organize the main compression workflow. **Output bytes** adds a paginated hex and ASCII view of the exact downloadable archive, with header and payload coloring. Selecting a byte shows its field, decimal value, and bits. Switching views preserves the source, construction step, and selected byte. Focus workspace expands the experiment; Escape returns to the page. Archive contains the complete size breakdown, download, and a separate decode operation.

In Build tree, use the zoom controls to fit the forest or inspect it at a readable scale. Use the merge controls to return to the initial forest and advance one merge at a time. The newest merge is highlighted. The codebook and bitstream always refer to the completed tree, even while the visualization is showing an earlier construction step. This keeps the archive representation stable while the building process is explored.

## Counting bytes instead of characters

Text first passes through \`TextEncoder\`, producing UTF-8 bytes. The histogram has 256 possible entries, independent of the language of the text. A multibyte character can therefore contribute to several byte frequencies; a byte code is not necessarily a character code.

The histogram construction in \`huffman/codec.js\` is deliberately small:

\`\`\`javascript
const frequencies = new Uint32Array(256);
for (const byte of bytes) frequencies[byte]++;
\`\`\`

Only nonzero frequencies become leaves. Each leaf carries its byte value, weight, and stable node ID. Binary input uses the same path without text decoding, so zero bytes and values above 127 are ordinary symbols rather than special cases.

This representation also limits the tree to at most 256 leaves. The input can contain hundreds of thousands of bytes without requiring one tree node per occurrence; occurrences affect weights and the later payload, not the alphabet's maximum size.

## Building the tree with deterministic merges

Each iteration finds the two active roots with the smallest weights and joins them beneath a new parent. The parent's weight is their sum; the children become inactive roots but remain in the node array for traversal and visualization.

The model retains every merge as a record with its child IDs and parent ID. Stepping backward and forward changes which construction stage is displayed rather than rerunning a different algorithm. The entire forest and completed code tree can therefore be derived from the same retained history.

Equal frequencies matter for compatibility. The selection loop uses strict less-than comparisons, leaving earlier vector entries ahead when weights tie. Leaves begin in byte order, and parents are appended. A decoder rebuilding from frequencies must reproduce that order or it can assign different bit patterns to the same bytes.

A priority queue could change construction cost, but replacing this vector search would also need to preserve tie behavior. With at most 256 symbols, matching the native format and making each merge visible are the more important properties of this port.

## Prefix-free codes and traced paths

Walking left appends zero; walking right appends one. Reaching a leaf records that path as its code. The implementation is:

\`\`\`javascript
if (node.left < 0) {
  codes.set(node.symbol, code);
  return;
}
walk(node.left, code + "0");
walk(node.right, code + "1");
\`\`\`

Source: \`huffman/codec.js\`, excerpt from the tree walk.

No leaf's path can be the prefix of another leaf's path, because a leaf has no children. That is what allows the decoder to consume concatenated bits without inserting a separator after each symbol. Reaching a leaf emits a byte and returns traversal to the root.

Selecting a codebook entry highlights its actual path. The searchable codebook opens a root-to-leaf path with each edge bit and node weight. The Bitstream preview shows the first 48 input bytes as individual code groups for readability, while the downloadable archive concatenates the full input's codes without those visual gaps.

## Packing bits into bytes

The payload buffer is allocated using the ceiling of the total bit count divided by eight. Bits are written most-significant first:

\`\`\`javascript
if (bit === "1") payload[cursor >> 3] |= 1 << (7 - (cursor & 7));
cursor++;
\`\`\`

Source: \`huffman/codec.js\`, inside \`packPayload\`.

The right shift chooses the destination byte, while the low three cursor bits choose a position inside that byte. The final partially used byte is zero-padded. Its padding is storage alignment, not additional encoded symbols; the archive's bit count tells decoding exactly where the payload ends.

This is where a string of zeroes and ones becomes an actual compressed representation. Saving the textual characters \`0\` and \`1\` would consume one byte per displayed bit and would not realize the bit-level savings shown by the algorithm.

## What ARK1 stores

The archive contains enough metadata to reconstruct the coding tree. Its integers are little-endian, while the bit order within payload bytes is most-significant first. Those are separate conventions.

| Field                 | Storage                                                     |
| --------------------- | ----------------------------------------------------------- |
| Magic                 | Four bytes: ARK1                                            |
| Unique-byte count     | Unsigned 16-bit integer                                     |
| UTF-8 filename length | Unsigned 16-bit integer                                     |
| Filename              | The stated number of bytes                                  |
| Frequency entries     | One byte value plus an unsigned 64-bit frequency per symbol |
| Payload bit count     | Unsigned 64-bit integer                                     |
| Payload               | Packed bits, padded to a whole byte                         |

The header-size calculation is \`16 + filenameBytes + 9 × uniqueBytes\`. Rebuilding from stored frequencies keeps the archive compatible with the original merge rule instead of introducing a separately serialized tree format.

## Payload savings versus complete-file savings

The interface separates original bytes, encoded payload bits, padded payload bytes, and the complete ARK1 archive. These answer different questions. A shorter code stream does not guarantee a smaller stored file because decoding metadata has a cost.

For the default repeating sample with the default \`message.txt\` filename, 816 input bytes become a 321-byte padded payload plus 117 bytes of metadata: a 438-byte archive, about 46.3% smaller overall. A shorter sample using the same alphabet can have similar coding efficiency yet grow after paying that header cost.

The entropy figure describes the observed byte-frequency distribution. Average code length describes this tree's payload cost per input byte. They can be close without including filename storage, the frequency table, or padding. Reading those values alongside total size avoids presenting an algorithmic ratio as a complete-file result.

## Edge cases and verification

An empty alphabet has no tree. A singleton alphabet has one leaf and a zero-length code; its stored frequency is sufficient to reproduce the repeated byte. Handling that case explicitly avoids traversing nonexistent child branches and fixes a native decoder edge case.

The decoder checks the magic, available lengths, symbol count, repeated entries, frequencies, and declared bit count before accepting an archive. A malformed input receives an error rather than being treated as an ordinary empty result. The browser's size limit applies to reconstructed output as well as input selection.

Tests cover binary and text round trips, deterministic merges, empty and singleton inputs, and malformed archives. Compatibility was also checked against the original C++ encoding path. The visible round-trip check compares decoded bytes with original bytes, preserving binary content rather than relying on a text rendering.

## Things to do next

A useful comparison would place this frequency-table format beside a canonical Huffman header and show how metadata changes the break-even point. Larger-file streaming and a different tree-construction data structure are separate extensions. Any format change should be versioned: an improved representation is not automatically compatible with an existing decoder merely because it still uses Huffman codes.
`},neural:{title:`Inside the learning loop`,summary:`Follow the computation behind the boundary: dense layers, gradients, optimizer state, and reproducible experiments.`,content:`## Overview

Neural Lab makes a small classifier's computation visible. Two input coordinates pass through a configurable dense network to produce the probability of class one. The main plot evaluates that network across a plane, neuron tiles expose intermediate responses, and a learning trace opens one labeled sample's update into separate stages.

The implementation uses explicit JavaScript mathematics rather than a hosted model or a machine-learning framework. Forward propagation, analytic gradients, binary cross-entropy, and both optimizers live independently of the React interface. Training changes the weights used by every visualization; the boundary is not a prerecorded demonstration.

The workspace separates **Data & model**, **Training**, **Network**, and **Gradient trace**. Set up samples and architecture in the first view, compare the boundary and loss in Training, and inspect one layer at a time in Network. Gradient trace retains its captured sample and calculation stages while moving between views. Switching views pauses training without resetting weights, optimizer state, or history. Focus workspace expands the interface; Escape returns to the page. The writeup remains separate from the experiment.

## Three experiments and what to look for

**XOR** starts with four corners. Opposite corners share a class, so one straight boundary cannot separate them. Train the default hidden network, then remove its hidden layer and compare the loss. This is a small representation problem: every corner is a training example, so 100% accuracy is not a generalization benchmark.

**Concentric circles** asks for a closed boundary. Inspect how several hidden responses combine into an output that distinguishes an inner ring from an outer ring. Hollow markers are held out from epoch training, making them a separate check on the learned boundary.

**Two spirals** needs a winding separation. Selecting it loads a verified starting point: two hidden layers with eight tanh neurons each, Adam, learning rate 0.01, and seed 42. Open **Training**, press **Train**, and allow roughly 1,000 epochs. The preset reload button restores both the original point cloud and that configuration after experiments with other settings.

Use the canvas tools to add, move, or remove samples. Coordinate sliders and the sample selector provide keyboard alternatives. Edits pause training, retain the current weights, and restart loss history; architecture changes reset the weights. Up to 160 points keep the interactive workload bounded.

## Forward propagation through dense layers

A neuron forms a weighted sum of the preceding layer's activations, adds a bias, and applies an activation function. A hidden layer therefore transforms the representation available to the next layer rather than simply drawing another separator directly on the input.

The inner calculation in \`neural/engine/network.js\` is:

\`\`\`javascript
z[j] = layer.b[j];
for (let k = 0; k < layer.inputs; k++)
  z[j] += layer.w[j * layer.inputs + k] * activations[l][k];
\`\`\`

Weights are stored in flat \`Float64Array\` buffers, with each output neuron's incoming weights occupying one contiguous row. The engine retains preactivations and activations for each layer. The same forward-pass data supports the neuron inspector and the backward calculation.

Hidden layers can use tanh, sigmoid, or ReLU. The output always uses sigmoid, turning its logit into a number between zero and one. With no hidden layer, this is logistic classification with a single affine separator. Hidden nonlinearities let combinations of features form curved boundaries.

## Reading neurons, weights, and the decision field

The main field evaluates a 65 × 65 probability grid. Marching squares interpolates where neighboring samples cross probability 0.5 to draw the white decision contour. A coarse grid is a rendering approximation of the current network, not another model being fitted to it.

Each neuron tile evaluates one activation over the same input domain using a 20 × 20 grid. A first-layer tanh neuron often resembles a soft split of the plane; later neurons combine those responses into more complex regions. Selecting a tile reveals its weights, bias, preactivation z, and activation at the current probe coordinate.

Color scales depend on what is being displayed. Tanh maps −1 through +1 from coral to lime. Sigmoid and output probability use zero through one. ReLU is unbounded, so its tile uses \`a / (1 + a)\` for color while the numeric inspector retains the actual activation. The diagram's edge color represents weight sign, and thickness represents magnitude.

The probe can move independently of the data. Inspecting a location does not add a training example or assign it a label. This makes it possible to investigate a region between samples without changing the problem being learned.

## Binary cross-entropy without unstable logarithms

For a target y and predicted probability p, binary cross-entropy is \`−y log(p) − (1−y) log(1−p)\`. It penalizes confident wrong predictions more strongly than uncertain ones. The displayed loss is averaged over the relevant sample set.

Calculating that expression directly from rounded probabilities can encounter \`log(0)\`. The engine instead uses the output logit:

\`\`\`javascript
Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)));
\`\`\`

Source: \`neural/engine/network.js\`, expression returned by \`binaryLoss\`.

This equivalent form remains finite for extreme logits without replacing the objective with an arbitrary probability clamp. The loss chart uses a logarithmic vertical scale to show improvement across several orders of magnitude. Its plotting range is limited for readability; the numeric loss remains the actual computed value.

## Backpropagation and one visible update

Sigmoid output paired with binary cross-entropy gives a compact output derivative: \`p − y\`. The implementation starts there and propagates error backward through the weighted connections, multiplying by each hidden activation's derivative.

The output error and weight-gradient accumulation are visible in these excerpts:

\`\`\`javascript
let delta = Float64Array.of(pass.probability - point.label);
\`\`\`

\`\`\`javascript
grads[l].w[j * layer.inputs + k] +=
  (delta[j] * pass.activations[l][k]) / points.length;
\`\`\`

Source: \`neural/engine/network.js\`, separate excerpts from \`gradients\`.

Dividing each contribution by the batch size produces the mean gradient. Epoch training uses all training points for one update. The **Follow the gradient** panel deliberately uses one selected training sample: prediction, loss, the inspected neuron's gradient, then a plain gradient-descent update \`w ← w − ηg\`.

The trace snapshots its forward pass, gradient, rate, and old weights before applying the update once. That allows the final stage to show an actual before-and-after weight. It remains a plain gradient-descent example even when epoch training uses Adam; applying it clears Adam's accumulated moments so subsequent training does not reuse stale optimizer state.

## Why Adam helps the spiral

The original XOR starter can remain near a simple separator on the spiral. More epochs alone do not make a small representation become a good winding boundary, and plain gradient descent can progress slowly even with a larger network.

Adam retains a first moment of the gradient and a second moment of its square for each weight and bias. It corrects the initial zero-state bias and scales the update by the square root of the corrected second moment. Neural Lab uses β₁ = 0.9, β₂ = 0.999, and ε = 10⁻⁸.

The moment updates in \`neural/engine/network.js\` are:

\`\`\`javascript
m[i] = 0.9 * m[i] + 0.1 * g;
v[i] = 0.999 * v[i] + 0.001 * g * g;
\`\`\`

Those buffers persist across animation-frame batches. Resetting them every frame would make training depend on how the browser groups work. Switching optimizers clears their memory while retaining weights; resetting the network starts everything fresh.

The following measured results use the original seed-42 spiral: 80 training points and 20 held-out points. They compare complete configurations, not an isolated optimizer benchmark.

| Configuration                                  | Epochs | Training accuracy | Held-out accuracy |
| ---------------------------------------------- | -----: | ----------------: | ----------------: |
| One 4-neuron tanh layer, gradient descent 0.08 | 10,000 |               65% |               60% |
| Two 8-neuron tanh layers, gradient descent 0.5 | 10,000 |              100% |               80% |
| Two 8-neuron tanh layers, Adam 0.01            |  1,000 |              100% |              100% |

The tested Adam preset reaches training loss about 0.00329 and held-out loss about 0.04056 at 1,000 epochs. Edited points and other seeds can behave differently; the numbers establish a reproducible example rather than a universal guarantee.

## Reproducibility, held-out data, and display timing

Seeded initialization makes a reset repeatable. Xavier-style uniform initialization is used for tanh and sigmoid paths, while ReLU hidden layers use a He-style range. Biases start at zero. The supported network has two inputs, up to two hidden layers of eight neurons, and one output.

Circle and spiral generators mark a balanced fifth of their samples as held out. Those points are excluded from epoch gradients and the trace selector. Their loss and accuracy evaluate the same current model without updating it. The split is a fixed illustrative sample, not a broad statistical study.

Training runs in bounded animation-frame batches and publishes visual updates at about 10 Hz. The speed setting is a target number of epochs per second, not a promise of device throughput. Hidden tabs stop accumulating training time. The loss chart retains its latest 400 observations so an extended session does not grow history without limit.

## Concepts explored and verification

The central ideas are representation learning, the chain rule, numerical stability, optimization state, and the difference between fitting examples and evaluating held-out ones. Their implementation is small enough to compare different explanations of the same result: a gradient value, a changing weight, a neuron response, and the final boundary.

Tests compare analytic gradients against central finite differences through two hidden layers for tanh, sigmoid, and ReLU. They also verify XOR versus a linear model, seeded trajectories, extreme logits, single-sample descent, Adam bias correction, and optimizer-state continuity across batch boundaries. A spiral regression uses the same preset exposed in the interface and evaluates training and held-out points separately.

## Things to do next

Useful extensions include batch-size controls, a visual comparison of optimizer updates, and validation across multiple dataset seeds. A signal-classification experiment could connect these representations to DSP—for example, learning from measured spectral features while retaining a separate unseen-signal evaluation. Any new view should expose an actual activation, gradient, or measurement rather than add motion unrelated to the computation.
`}};function f(){let{lab:e}=t(),n=d[e];return n?(0,c.jsxs)(`div`,{className:`lab-notes-page`,children:[(0,c.jsx)(r,{className:`lab-notes-back`,to:`/lab`,children:`← Lab notebook`}),(0,c.jsx)(o,{lab:e}),(0,c.jsx)(u,{id:e,...n})]}):(0,c.jsxs)(`section`,{className:`page-header`,children:[(0,c.jsx)(`h1`,{children:`Writeup not found.`}),(0,c.jsx)(r,{to:`/lab`,children:`Explore the lab`})]})}export{f as default};