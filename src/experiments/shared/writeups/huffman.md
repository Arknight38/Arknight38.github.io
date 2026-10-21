## Overview

Code Loom turns Huffman compression into a sequence that can be inspected: count bytes, merge the lightest trees, assign prefix-free codes, and pack those codes into a downloadable archive. The visualization and encoder share one model, so selecting a byte traces the code actually used in the file.

The browser port follows the original C++ compressor's vector-based merge order and ARK1 format. It accepts UTF-8 text or binary files up to 512 KiB and can decode an ARK1 archive locally. The aim is to show both the elegance of the coding algorithm and the less glamorous details required to store its result correctly.

## Try three very different inputs

Begin with **A repeating signal**, which contains enough repetition for the complete archive to be smaller than the input. Compare its encoded payload with its total archive size, then follow one common byte through the tree.

Next load **Equal frequencies**. With no dominant symbol, there is less opportunity to assign disproportionately short codes. Finally try **One unique symbol**: the archive can reconstruct the data from its frequency without storing a payload bit for every repeated byte.

**Input**, **Build tree**, **Trace codes**, and **Archive** organize the main compression workflow. **Output bytes** adds a paginated hex and ASCII view of the exact downloadable archive, with header and payload coloring. Selecting a byte shows its field, decimal value, and bits. Switching views preserves the source, construction step, and selected byte. Focus workspace expands the experiment; Escape returns to the page. Archive contains the complete size breakdown, download, and a separate decode operation.

In Build tree, use the zoom controls to fit the forest or inspect it at a readable scale. Use the merge controls to return to the initial forest and advance one merge at a time. The newest merge is highlighted. The codebook and bitstream always refer to the completed tree, even while the visualization is showing an earlier construction step. This keeps the archive representation stable while the building process is explored.

## Counting bytes instead of characters

Text first passes through `TextEncoder`, producing UTF-8 bytes. The histogram has 256 possible entries, independent of the language of the text. A multibyte character can therefore contribute to several byte frequencies; a byte code is not necessarily a character code.

The histogram construction in `huffman/codec.js` is deliberately small:

```javascript
const frequencies = new Uint32Array(256);
for (const byte of bytes) frequencies[byte]++;
```

Only nonzero frequencies become leaves. Each leaf carries its byte value, weight, and stable node ID. Binary input uses the same path without text decoding, so zero bytes and values above 127 are ordinary symbols rather than special cases.

This representation also limits the tree to at most 256 leaves. The input can contain hundreds of thousands of bytes without requiring one tree node per occurrence; occurrences affect weights and the later payload, not the alphabet's maximum size.

## Building the tree with deterministic merges

Each iteration finds the two active roots with the smallest weights and joins them beneath a new parent. The parent's weight is their sum; the children become inactive roots but remain in the node array for traversal and visualization.

The model retains every merge as a record with its child IDs and parent ID. Stepping backward and forward changes which construction stage is displayed rather than rerunning a different algorithm. The entire forest and completed code tree can therefore be derived from the same retained history.

Equal frequencies matter for compatibility. The selection loop uses strict less-than comparisons, leaving earlier vector entries ahead when weights tie. Leaves begin in byte order, and parents are appended. A decoder rebuilding from frequencies must reproduce that order or it can assign different bit patterns to the same bytes.

A priority queue could change construction cost, but replacing this vector search would also need to preserve tie behavior. With at most 256 symbols, matching the native format and making each merge visible are the more important properties of this port.

## Prefix-free codes and traced paths

Walking left appends zero; walking right appends one. Reaching a leaf records that path as its code. The implementation is:

```javascript
if (node.left < 0) {
  codes.set(node.symbol, code);
  return;
}
walk(node.left, code + "0");
walk(node.right, code + "1");
```

Source: `huffman/codec.js`, excerpt from the tree walk.

No leaf's path can be the prefix of another leaf's path, because a leaf has no children. That is what allows the decoder to consume concatenated bits without inserting a separator after each symbol. Reaching a leaf emits a byte and returns traversal to the root.

Selecting a codebook entry highlights its actual path. The searchable codebook opens a root-to-leaf path with each edge bit and node weight. The Bitstream preview shows the first 48 input bytes as individual code groups for readability, while the downloadable archive concatenates the full input's codes without those visual gaps.

## Packing bits into bytes

The payload buffer is allocated using the ceiling of the total bit count divided by eight. Bits are written most-significant first:

```javascript
if (bit === "1") payload[cursor >> 3] |= 1 << (7 - (cursor & 7));
cursor++;
```

Source: `huffman/codec.js`, inside `packPayload`.

The right shift chooses the destination byte, while the low three cursor bits choose a position inside that byte. The final partially used byte is zero-padded. Its padding is storage alignment, not additional encoded symbols; the archive's bit count tells decoding exactly where the payload ends.

This is where a string of zeroes and ones becomes an actual compressed representation. Saving the textual characters `0` and `1` would consume one byte per displayed bit and would not realize the bit-level savings shown by the algorithm.

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

The header-size calculation is `16 + filenameBytes + 9 × uniqueBytes`. Rebuilding from stored frequencies keeps the archive compatible with the original merge rule instead of introducing a separately serialized tree format.

## Payload savings versus complete-file savings

The interface separates original bytes, encoded payload bits, padded payload bytes, and the complete ARK1 archive. These answer different questions. A shorter code stream does not guarantee a smaller stored file because decoding metadata has a cost.

For the default repeating sample with the default `message.txt` filename, 816 input bytes become a 321-byte padded payload plus 117 bytes of metadata: a 438-byte archive, about 46.3% smaller overall. A shorter sample using the same alphabet can have similar coding efficiency yet grow after paying that header cost.

The entropy figure describes the observed byte-frequency distribution. Average code length describes this tree's payload cost per input byte. They can be close without including filename storage, the frequency table, or padding. Reading those values alongside total size avoids presenting an algorithmic ratio as a complete-file result.

## Edge cases and verification

An empty alphabet has no tree. A singleton alphabet has one leaf and a zero-length code; its stored frequency is sufficient to reproduce the repeated byte. Handling that case explicitly avoids traversing nonexistent child branches and fixes a native decoder edge case.

The decoder checks the magic, available lengths, symbol count, repeated entries, frequencies, and declared bit count before accepting an archive. A malformed input receives an error rather than being treated as an ordinary empty result. The browser's size limit applies to reconstructed output as well as input selection.

Tests cover binary and text round trips, deterministic merges, empty and singleton inputs, and malformed archives. Compatibility was also checked against the original C++ encoding path. The visible round-trip check compares decoded bytes with original bytes, preserving binary content rather than relying on a text rendering.

## Things to do next

A useful comparison would place this frequency-table format beside a canonical Huffman header and show how metadata changes the break-even point. Larger-file streaming and a different tree-construction data structure are separate extensions. Any format change should be versioned: an improved representation is not automatically compatible with an existing decoder merely because it still uses Huffman codes.
