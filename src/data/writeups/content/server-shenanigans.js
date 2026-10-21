export const serverShenanigans = {
  id: "server-shenanigans",
  title: "ServerShenanigans: A File-Transfer Protocol in C++",
  subtitle:
    "A C++ file-sharing application exploring streaming transfers, compression, checksums, and resume.",
  date: "2024",
  categories: ["tools", "fullstack"],
  tags: ["cpp", "networking", "zlib", "sha256", "winsock2"],
  readTime: "5 min",
  featured: false,
  content: `## Overview

ServerShenanigans is a Windows C++ file-sharing project built directly on Winsock. It supports listing shared files, downloading them, optional zlib compression, SHA-256 checksums, and a raw-transfer resume path.

Using sockets directly makes the application responsible for details a higher-level HTTP library normally hides: where a header ends, how many bytes belong to a payload, what a partial write means, and how a receiver detects completion. Those protocol decisions are the most interesting part of the project.

## Describing a transfer before sending it

A download begins with a textual response describing the remaining uncompressed size and whether the payload is raw or compressed:

\`\`\`text
OK:<remaining bytes>:RAW
OK:<remaining bytes>:COMPRESSED
\`\`\`

The size gives the receiver a completion target. The mode tells it how to interpret the following bytes. For raw transfers, those bytes are file data. For compressed transfers, each block has a length prefix followed by its compressed contents.

The sender processes 64 KiB chunks rather than loading a whole file. Compression uses zlib's \`compressBound\` to reserve enough output space and \`Z_BEST_SPEED\` to favor throughput over maximum compression. That is a useful tradeoff for an interactive transfer tool: compression only helps if the CPU work costs less than the bytes it saves.

## Why framing matters

TCP provides an ordered stream, not a sequence of application messages. One \`send\` does not imply one matching \`recv\`, and a successful write can still report fewer bytes than requested.

The current implementation has places that assume a header or chunk arrives in one operation. Tightening those paths would be the highest-value protocol improvement: read a header up to its delimiter, retain any already-received payload bytes, and loop until each framed block is fully transferred. The compressed length prefix should also use a defined byte order.

This is where the project moves beyond a basic socket demonstration. The same framing rules need to hold for a tiny file, a slow peer, and a connection interrupted halfway through a block.

## Resume and integrity are related features

The client stores resume metadata containing the file, server, port, and downloaded byte count. A raw download can continue from an offset. Complete-file checksum verification is available, and the server also has a prefix-checksum command.

Those pieces provide a foundation for safer resume, but the current resume path does not verify the existing local prefix against the server before continuing. I would connect those features so that resuming means continuing the same content, rather than simply trusting a byte count. Compressed transfers currently take a separate path without resume.

## Compression changes the unit of progress

In a raw transfer, the number of bytes received closely follows the number of file bytes written. Compression breaks that equivalence. A short wire payload can expand into a much larger output block, so progress and completion need to be defined against the uncompressed file size.

The protocol announces that uncompressed size and frames compressed blocks individually. Independent zlib blocks keep the receiver's working set bounded and avoid requiring the entire file before decompression starts. The receiver must still validate both the advertised compressed length and the actual expanded result before writing it.

The sender reserves space using \`compressBound\`, which accounts for inputs that compress poorly. The receive path needs to honor the same possibility: compressed data is not guaranteed to be smaller than its source. This is a useful reminder that a protocol's limits must be shared by both ends, not inferred from typical files.

## Sharing metadata versus sharing a file

The registry holds names, paths, file sizes, and checksums. That makes a listing inexpensive to serve, but it also creates a distinction between the registered description and the file currently on disk.

If a shared file changes after registration, the stored size or digest may no longer describe the bytes being transferred. A future version should either revalidate when opening a transfer or define a snapshot policy. Otherwise a checksum mismatch can be caused by ordinary file modification as well as a broken connection.

The same concern applies to resume: matching the server address and filename is useful bookkeeping, but verifying content identity is what makes continuing an earlier download meaningful.

## Chunk compression with an explicit output bound

The server compresses each input chunk independently. It allocates using zlib's upper bound rather than assuming compressed data is smaller:

\`\`\`cpp
compressedSize = compressBound(size);
std::vector<char> compressed(compressedSize);

if (compress2((Bytef *)compressed.data(), (uLongf *)&compressedSize,
              (const Bytef *)data, size, Z_BEST_SPEED) != Z_OK) {
    compressedSize = 0;
    return std::vector<char>();
}
compressed.resize(compressedSize);
\`\`\`

The final resize records the actual encoded length. Each compressed block is framed with a length prefix, letting the receiver separate consecutive blocks and decompress incrementally. The 64 KiB input chunk bounds the file-processing working set; it is not a claim that every transfer completes in one socket operation.

## Full-file and prefix hashing

The server's SHA-256 helper streams the file through a fixed-size buffer and accepts an optional maximum byte count. Sharing a file records its complete digest, while the hash command can calculate a prefix digest. These are two uses of one streaming implementation: identifying a whole file and comparing the portion already present locally.

The resume path stores filename, server, port, and downloaded byte count in local metadata. Raw transfers can continue from that offset; compressed transfers do not currently share that resume behavior. Prefix hashing exists as a separate capability and is not yet connected to resume validation. Keeping those facts separate explains both the implemented feature and its next integration point.

## Shared-file inventory and concurrent clients

The server stores path, size, and checksum metadata in a mutex-protected registry. Listings can use this inventory without hashing every file again. A client handler looks up the selected file and starts its transfer, while accepted connections run in separate threads.

The current transfer handler retains the registry lock during sending, which limits independence between clients. Moving the metadata copy outside that long-held lock is a focused next change. The implemented inventory and worker model are useful features, while their current lock scope is a limitation rather than a throughput benchmark.

## Concepts explored

The main technical features are bounded streaming, block compression, binary/text framing, incremental hashing, and persisted resume state. Their interaction is the protocol: wire bytes, expanded file bytes, and verified content are related but distinct quantities.

## Things to do next

I would prioritize complete read/write loops, portable framing, verified resume, and managed worker lifetimes. Integration tests could deliberately split headers and payloads into small writes and interrupt downloads at different offsets.
`,
};
