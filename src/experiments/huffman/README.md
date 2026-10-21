# Code Loom / Huffman compression

Browser implementation of the vector-based Huffman compressor from the original C++ implementation (`Huffman/main.cpp` and `shared/comp_helper.cpp`).

## Behavior

- `/lab/huffman` is lazy-loaded from the Lab index.
- Text is encoded as UTF-8 bytes; arbitrary files are supported up to 512 KiB.
- The code loom shows the actual active forest after each merge. Playback, single steps, and a scrubber reconstruct the tree. Selecting leaves or byte cards traces the matching binary path and highlights the bitstream.
- Symbol cards include relative frequency bars. The bitstream previews the first 48 input bytes; exports always use all input bytes.
- Payload bits, byte-padded payload, archive metadata, complete archive size, average code length, and Shannon entropy are measured separately. Complete archives may be larger than their input.
- `.ark` files can be compressed, imported, decoded, and downloaded locally. No files are transmitted to a server.

## ARK1 compatibility

Fields follow the original little-endian C++ layout:

1. `ARK1` magic (4 bytes).
2. Symbol count (uint16).
3. UTF-8 filename length (uint16), then filename bytes.
4. Ascending byte-frequency entries: symbol byte + uint64 frequency.
5. Meaningful payload bit count (uint64).
6. Most-significant-bit-first payload with zero padding in the final byte.

Equal weights preserve vector insertion order, including newly appended parents. The browser archive for `BANANA_BANDANA` was compared byte-for-byte with an archive emitted by the actual original C++ functions. The original C++ decoder also successfully recovered a browser-generated archive. A golden fixture retains that check in `codec.test.js`.

The browser decoder additionally supports empty files and single-symbol files. The original single-symbol encoding has an empty bit code; the browser reconstructs it from its stored frequency, fixing the original decoder's missing output for that case. Empty/single-symbol archives should therefore be decoded in the browser rather than with the unchanged legacy decoder.

Inputs are capped before allocation and tree construction. Archive validation checks field bounds, duplicate symbols, decoded-size limits, expected bit count, exact payload length, trailing padding, complete traversal, and reconstructed frequencies. Imported filenames have path components removed before download.

## Validation

Run `npx vitest run src/experiments/huffman src/experiments/spectra/dsp/dsp.test.js src/app/App.test.jsx src/data/writeups/index.test.js`.

Coverage includes native-format parity, ties, prefix-free codes, entropy bounds, forest invariants, malformed archives, Unicode and binary round trips, empty/single-symbol inputs, limits, local file input, decoding controls, text editing, and leaf tracing. Browser checks cover merge stepping, mouse and keyboard leaf selection, and layouts at 320, 390, 768, 1440, and 2560px. Large trees and bitstreams intentionally scroll inside their own panels; the page has no horizontal overflow at those widths.

All visitor-facing copy describes the project itself rather than addressing the portfolio's creator.
