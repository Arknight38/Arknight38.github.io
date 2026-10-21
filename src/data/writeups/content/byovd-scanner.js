export const byovdScanner = {
  id: "byovd-scanner",
  title: "BYOVD Scanner: Making Driver Triage Inspectable",
  subtitle:
    "A defensive Python tool bringing known hashes and static metadata into a reviewable driver report.",
  date: "2024",
  categories: ["tools", "security", "closed"],
  tags: ["security", "python", "pe", "static-analysis", "triage"],
  readTime: "4 min",
  featured: false,
  content: `## Overview

BYOVD Scanner is a defensive Python tool for triaging Windows driver files. It combines known-file hashes, PE imports and exports, and signature observations into a report that helps decide what deserves closer inspection.

The emphasis is on collecting evidence. A suspicious import can be a reason to investigate, while a match against a known driver dataset is a different kind of signal. Keeping those observations visible makes the output more useful than a single unexplained risk number.

## Identifying an exact file

SHA-256 hashing gives the scanner a stable way to compare a local file with known entries. The implementation reads bounded chunks:

\`\`\`python
def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return ""
\`\`\`

The iterator stops at an empty read, and the hash accumulates without retaining the whole file. A digest match identifies the exact bytes; a familiar filename alone cannot offer the same assurance.

The known-driver data path uses a remote dataset, a timed cache, and offline fallbacks. That lets scanning remain useful when a network request fails, while making dataset freshness an important part of interpreting a result.

## Looking beyond known hashes

The scanner parses ordinary imports, delay imports, and exports. These provide clues about capabilities exposed or referenced by a driver, including files that do not match the known-hash set.

Static metadata has limits. An imported function is not proof that a dangerous path is reachable, and a signature observation is not a complete trust decision. The weighted score organizes the evidence; it is a heuristic rather than a calibrated probability of exploitability.

## One model, multiple report formats

A shared report model feeds technical and more accessible output, including JSON. That keeps the underlying observations consistent while allowing different readers to consume them differently. Someone automating a review can retain structured fields; someone investigating one file can read the explanation.

## Keeping evidence categories separate

The report model does not flatten every symbol into one warning list. It retains normal imports, delay-loaded imports, and suspicious exports separately:

\`\`\`python
risky_imports:      list[str] = field(default_factory=list)
delay_load_imports: list[str] = field(default_factory=list)
suspicious_exports: list[str] = field(default_factory=list)
\`\`\`

The PE reader examines both import directories and the export table. The resulting categories let a technical reader distinguish a declared dependency from a delayed dependency or a named exposed function. They remain static observations rather than runtime reachability evidence.

## An inspectable scoring function

Known vulnerable hashes receive the maximum category directly. Other reports accumulate explicit contributions:

\`\`\`python
score += report.signature.risk_penalty()
score += len(report.risky_imports)      * 10
score += len(report.delay_load_imports) * 12
score += len(report.suspicious_exports) * 15
\`\`\`

The function then applies its allowlist adjustment, clamps the score, and assigns a severity band. These weights are inspectable heuristics, not probabilities. Their value is that a reviewer can trace the result back to the observations and challenge an individual contribution.

## Cached and offline reference data

The known-hash path has a 24-hour cache window, remote refresh, an offline option, and fallback data. It normalizes digest strings before lookup and can continue with cached data if refresh fails. Signature collection is platform-aware: the Windows path uses Authenticode observations, while unavailable verification remains an explicit status.

This makes the tool useful in more than one operating environment, while reference freshness and exact signature-status parsing remain important limits. Neither a missing hash match nor a favorable signature is treated here as proof that a file is safe.

## Concepts explored

Streaming hashes establish exact file identity; PE parsing provides capability clues; structured reports preserve provenance categories; and a visible scoring function orders review attention. This is a defensive triage pipeline with inspectable intermediate evidence.

## Things to do next

I would add explicit provenance and dataset timestamps to every result, plus fixture-based tests for malformed PE files and cached-data failures. The scoring model would benefit from evaluation against a labeled collection, with false positives and missed cases recorded rather than hidden behind a threshold.
`,
};
