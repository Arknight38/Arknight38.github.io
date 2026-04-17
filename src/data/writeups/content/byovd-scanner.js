export const byovdScanner = {
  id: 'byovd-scanner',
  title: 'BYOVD Scanner: Driver Vulnerability Detection',
  subtitle: 'Static analysis for identifying drivers vulnerable to BYOVD attacks, IOC generation, and signature-based detection.',
  date: '2024',
  categories: ['tools', 'security', 'closed'],
  tags: ['security', 'python', 'binary-analysis', 'vulnerability-scanning'],
  readTime: '14 min',
  featured: false,
  content: `## The BYOVD Problem

"Bring Your Own Vulnerable Driver" attacks exploit signed drivers with security flaws to gain kernel execution. The attack vector is elegant in its simplicity: attackers don't need to write their own kernel exploit. Instead, they find a legitimately signed driver from a trusted vendor that happens to have a vulnerability, load it using legitimate driver loading mechanisms, and exploit the vulnerability to gain arbitrary kernel code execution.

The detection problem is fundamentally asymmetric. Attackers need to find just one vulnerable driver. Defenders need to identify and block all vulnerable drivers while preserving legitimate hardware functionality. This is made more difficult by:

- **Trusted signatures**: Vulnerable drivers are signed by reputable vendors (MSI, Dell, ASUS, etc.) that anti-cheat and EDR systems whitelist by default
- **Legitimate use cases**: These drivers ship with legitimate hardware (RGB controllers, fan controllers, overclocking utilities) and breaking them breaks user hardware
- **Continuous discovery**: New vulnerable drivers are discovered regularly, and old drivers remain in driver stores indefinitely
- **Whitelisting inertia**: Once a driver is whitelisted, removing it causes support tickets and user complaints

BYOVD Scanner was built to address this by providing comprehensive static analysis of drivers to identify potential vulnerabilities before they can be exploited. The scanner operates offline on driver files, generating IOCs (Indicators of Compromise) that can be integrated into SIEM systems, EDR policies, or manual review workflows.

## Architectural Premise: Static vs Runtime Analysis

The central architectural decision in BYOVD Scanner is the emphasis on static analysis over runtime analysis. This choice has profound implications for scalability, accuracy, and deployment.

**Static analysis** examines the driver file on disk without loading it. It parses the PE format, extracts imports, exports, and code patterns, and applies heuristic rules to identify potential vulnerabilities. The advantage is that it can scan thousands of drivers in minutes without risking system stability. The disadvantage is that it produces false positives—code patterns that look dangerous but are benign in context.

**Runtime analysis** would involve loading the driver in a sandbox or on a test system, monitoring its behavior, and identifying actual vulnerability exploitation. This would be more accurate but impractical at scale: loading arbitrary kernel drivers is dangerous, requires significant infrastructure, and cannot be automated safely.

BYOVD Scanner chooses static analysis with a conservative confidence model. Rather than claiming definitive vulnerability detection, it provides a risk score and confidence level. High-risk drivers are flagged for manual review. Known vulnerable drivers (from loldrivers.io) are marked with "CONFIRMED" confidence. Everything else falls somewhere in between.

This approach acknowledges the fundamental limitation of static analysis: you cannot prove a driver is vulnerable without actually exploiting it. But you can identify drivers that are worth investigating, and that is sufficient for most defensive workflows.

## The IOC Database: Crowd-Sourced Vulnerability Intelligence

The scanner integrates with loldrivers.io, a community-maintained database of known vulnerable drivers. This integration provides ground truth for vulnerability detection: if a driver's SHA256 matches a known vulnerable sample, it is immediately flagged as "CONFIRMED" with the specific CVE and vulnerability description.

The IOC database is cached locally in \`byovd_ioc_cache.json\` with a 24-hour freshness window. On first run (or when the cache expires), the scanner fetches the latest database from loldrivers.io API. This provides several benefits:

- **Freshness**: New vulnerabilities are incorporated within 24 hours
- **Offline capability**: The cache allows scanning without internet access after the initial fetch
- **Performance**: Hash lookups are O(1) against a local dictionary, not API calls
- **Auditability**: The cache file itself is a JSON document that can be version-controlled and reviewed

The cache structure maps SHA256 hashes to vulnerability descriptions:

\`\`\`
{
  "01aa278b07b58dc46c84bd0b1b5c8e9ee4e62ea0bf7a695862444af32e87f1fd": 
    "RTCore64.sys - MSI Afterburner (CVE-2019-16098)",
  "0296e2ce999e67c76352613a718e11516fe1b0efc3ffdb8918fc999dd76a73a5":
    "DBUtil_2_3.sys - Dell (CVE-2021-21551)"
}
\`\`\`

The scanner falls back to a minimal hardcoded IOC database if both the API fetch and local cache fail. This ensures basic functionality even in air-gapped environments, though with significantly reduced coverage.

## PE Parsing: The Foundation of Static Analysis

All static analysis begins with correct PE parsing. The scanner uses the \`pefile\` library to parse the PE format, extracting headers, sections, data directories, and import/export tables. The parser is intentionally strict: if any signature is invalid or any offset is out of bounds, the driver is marked as INVALID and skipped.

This conservative approach prevents crashes from malformed PE files, which is important for batch scanning. A single malformed file should not abort the entire scan.

The parser extracts:
- **DOS Header**: Validates MZ signature and extracts e_lfanew offset
- **NT Headers**: Extracts ImageBase, SizeOfImage, EntryPoint, and data directory array
- **Section Headers**: Iterates through sections, extracting VirtualAddress, SizeOfRawData, PointerToRawData, and Characteristics
- **Data Directories**: Locates import, export, and relocation directory offsets and sizes

The scanner also verifies that the file is actually a kernel driver by checking the Subsystem field (IMAGE_SUBSYSTEM_NATIVE). User-mode DLLs are skipped because they are not relevant to BYOVD attacks.

## Import Analysis: Identifying Dangerous Primitives

The core of the scanner's vulnerability detection is import analysis. Kernel drivers that import dangerous functions from ntoskrnl.exe are potential BYOVD candidates. The scanner maintains a comprehensive dictionary of risky imports, categorized by the primitive they provide:

**Physical memory mapping primitives**: MmMapIoSpace, MmMapIoSpaceEx, MmGetPhysicalAddress, HalTranslateBusAddress. These functions allow mapping physical memory into kernel virtual address space, which can be abused to read/write arbitrary physical memory (including the kernel itself).

**Locked/MDL page mapping primitives**: MmMapLockedPages, MmMapLockedPagesSpecifyCache, IoAllocateMdl. These functions map MDL-locked pages, which can expose arbitrary physical memory if the MDL is constructed maliciously.

**Cross-process memory primitives**: MmCopyVirtualMemory, MmCopyMemory, ZwMapViewOfSection. These allow reading/writing another process's memory without the usual handle restrictions.

**Process/thread primitives**: ZwOpenProcess, PsLookupProcessByProcessId, ZwAllocateVirtualMemory, ZwWriteVirtualMemory, ZwCreateThreadEx. These allow process manipulation and code injection from kernel mode.

**Kernel code execution primitives**: ExAllocatePool, ExAllocatePoolWithTag, ExAllocatePool2. These allocate kernel pool memory, which can be used to stage shellcode.

**Driver manipulation primitives**: ZwLoadDriver, ZwUnloadDriver, MmGetSystemRoutineAddress. These allow loading/unloading drivers and resolving kernel function addresses dynamically.

**Port/hardware I/O primitives**: WRITE_PORT_UCHAR, READ_PORT_UCHAR, HalGetBusDataByOffset. These allow direct hardware I/O, which can be abused to bypass security checks.

The scanner distinguishes between normal imports and delay-load imports. Delay-load imports are loaded lazily at runtime, which can be an evasion technique—malicious drivers might delay-load dangerous imports to avoid static detection.

For each risky import found, the scanner records the function name and a human-readable description of why it's dangerous. This context is crucial for manual review: knowing that a driver imports MmMapIoSpace is useful; knowing that MmMapIoSpace "maps physical memory into kernel VA — direct hardware/memory access" is actionable.

## Export Analysis: Exposed Attack Surfaces

Some drivers export functions that directly expose dangerous primitives to any caller. These are particularly dangerous because they don't require IOCTL handling or parameter validation—an attacker can call the exported function directly via GetProcAddress.

The scanner maintains a dictionary of suspicious exports: MapPhysicalMemory, ReadPhysicalMemory, WritePhysicalMemory, GetKernelBase, ReadMsr, WriteMsr, ReadCr0, WriteCr0, AllocateNonPagedMemory, etc. These are functions that no legitimate driver should export, as they provide raw kernel primitives to usermode.

Finding a suspicious export is a strong indicator of BYOVD potential. The scanner flags these with HIGH confidence because the intent is clear: the driver author explicitly chose to expose these primitives.

## IOCTL Surface Analysis: The Communication Channel

IOCTL (Input/Output Control) is the primary communication mechanism between usermode and kernel drivers. A driver creates a device object, registers a dispatch table, and handles IOCTL requests. If the IOCTL handler does not validate parameters properly, an attacker can send malicious IOCTLs to trigger vulnerability exploitation.

The scanner's IOCTL surface analysis attempts to estimate the size and security of a driver's IOCTL interface without actually executing code. It uses two complementary approaches:

**Import-based inference**: The scanner checks if the driver imports IOCTL-related functions: IoCreateDevice, IoCreateDeviceSecure, IoCreateSymbolicLink, IoDeleteDevice, IoDeleteSymbolicLink, IoCompleteRequest. Presence of these imports suggests the driver has an IOCTL interface.

- IoCreateDevice vs IoCreateDeviceSecure: The latter takes a security descriptor (SDDL string) that defines who can access the device. Using IoCreateDevice (the insecure version) means any process can open a handle to the device.
- IoCreateSymbolicLink: Creates a symbolic link (e.g., \\\\.\\MyDevice) that makes the device accessible from usermode via CreateFile. This is the primary BYOVD attack surface.
- IoCompleteRequest: Indicates the driver handles IRPs (I/O Request Packets), which is required for IOCTL processing.

**Heuristic IOCTL code extraction**: The scanner scans the binary for DWORD values that match the IOCTL code structure. Windows IOCTL codes follow the CTL_CODE macro layout:
- Bits 31-16: DeviceType (0x0001-0xFFFF, with 0x8000 being custom devices)
- Bits 15-14: Access (0=any, 1=read, 2=write, 3=read+write)
- Bits 13-2: Function (0x000-0xFFF, with 0x800+ being vendor-defined)
- Bits 1-0: Method (0=buffered, 1=in_direct, 2=out_direct, 3=neither)

The scanner looks for DWORDs where DeviceType is in the custom range (0x8000-0xFFFF) and Function is vendor-defined (>= 0x800). This heuristic produces false positives but provides an estimate of IOCTL surface size. A driver with 50 potential IOCTL codes has a larger attack surface than a driver with 2.

The IOCTL surface analysis produces an IoctlSurfaceInfo structure with:
- has_device_creation: Whether the driver creates a device object
- uses_secure_creation: Whether it uses IoCreateDeviceSecure (the secure variant)
- has_symbolic_link: Whether it creates a symbolic link (usermode-accessible)
- has_irp_completion: Whether it handles IRPs
- dispatch_import_count: How many IOCTL-related imports are present
- estimated_ioctl_codes: List of potential IOCTL codes found in the binary
- notes: Analyst notes explaining the security implications

## Section Entropy Analysis: Detecting Packing and Obfuscation

Packed or obfuscated drivers have higher entropy (randomness) in their sections because the code is compressed or encrypted. High entropy is suspicious because legitimate drivers typically have lower entropy (real code has patterns). The scanner calculates Shannon entropy for each section and flags sections with entropy > 7.0, or executable sections with entropy > 6.5.

Shannon entropy measures the unpredictability of data. For a byte sequence, entropy ranges from 0 (all bytes are the same) to 8 (perfectly random). Compressed data typically has entropy around 7.5-8.0. Normal code has entropy around 6.0-7.0.

The scanner flags high entropy as suspicious because:
- Packed drivers may hide malicious code that static analysis cannot see
- Obfuscation is an evasion technique used by malware authors
- Legitimate hardware drivers rarely need packing (they're not trying to hide anything)

However, entropy analysis has false positives. Some legitimate drivers use compression for size reduction, and some optimization techniques increase entropy. The scanner treats entropy as a signal, not definitive evidence.

## Signature Verification: Trust Anchors

The scanner verifies the digital signature of each driver using PowerShell's Get-AuthenticodeSignature cmdlet. Signature status is a critical factor in risk scoring because signed drivers are more likely to be whitelisted by security products.

The signature status is categorized as:
- **Microsoft Signed**: Signed by Microsoft Corporation. These are trusted and receive a -20 risk penalty.
- **Third-Party Signed**: Signed by a non-Microsoft vendor. These receive a +15 risk penalty because third-party signing is easier to obtain.
- **Unsigned**: No digital signature. These receive a +40 risk penalty because unsigned drivers are more suspicious.
- **Invalid**: Signature is present but invalid (hash mismatch, expired certificate, etc.). These receive a +50 risk penalty.
- **Unknown**: Signature verification failed (PowerShell not available, file corrupted, etc.). These receive a +20 risk penalty as a conservative default.

The scanner also maintains a whitelist of known safe Microsoft drivers: ntoskrnl.exe, hal.dll, disk.sys, ntfs.sys, etc. These are skipped entirely because they are core Windows components and cannot be BYOVD vectors.

## Risk Scoring: The Confidence Model

The scanner assigns each driver a risk score from 0-100 and a confidence level (MINIMAL, LOW, MEDIUM, HIGH, CONFIRMED). The scoring model is intentionally conservative: it prefers false negatives over false positives. Flagging a safe driver as vulnerable causes unnecessary work. Missing a vulnerable driver is unfortunate but acceptable given the limitations of static analysis.

The risk score is calculated as:

\`\`\`
base_score = 0

# Known vulnerability (highest weight)
if is_known_vuln:
    base_score += 50

# Risky imports (weighted by danger tier)
for each risky_import:
    if import in HIGH_VALUE_PRIMITIVES:
        base_score += 8
    elif import in MEDIUM_VALUE_PRIMITIVES:
        base_score += 4
    else:
        base_score += 2

# Suspicious exports (high weight because intent is clear)
for each suspicious_export:
    base_score += 10

# IOCTL surface penalty (amplifies when dangerous imports present)
base_score += ioctl_surface.risk_penalty()

# Signature penalty
base_score += signature.risk_penalty()

# Entropy penalty
for each suspicious_entropy_section:
    base_score += 3

# Cap at 100
risk_score = min(base_score, 100)
\`\`\`

The confidence level is determined by combining dangerous primitives with accessible attack surfaces:

- **CONFIRMED**: Driver matches known vulnerable IOC database entry
- **HIGH**: Has high-value primitives (MmMapIoSpace, MmCopyMemory, etc.) AND accessible attack surface (symbolic link or world-accessible device)
- **MEDIUM**: Has high-value primitives but no accessible attack surface, OR has medium-value primitives with accessible attack surface
- **LOW**: Has some risky imports but no high-value primitives
- **MINIMAL**: No risky imports, no suspicious exports, no IOCTL surface

The critical insight is that confidence requires BOTH capability (what the driver can do) AND accessibility (how an attacker reaches it). A driver with MmMapIoSpace but no IOCTL interface is not directly exploitable. A driver with a wide IOCTL surface but only benign imports is not directly exploitable. The combination is what matters.

## Runtime Analysis: Windows-Only Live Inspection

On Windows, the scanner can perform runtime analysis to cross-reference static findings with actual loaded drivers. This uses EnumDeviceDrivers from psapi.dll to enumerate all loaded kernel modules, then checks if any match the drivers being scanned.

Runtime analysis provides:
- **is_loaded**: Whether the driver is currently loaded in the kernel
- **base_address**: The load address of the driver
- **device_objects**: List of device objects created by the driver
- **has_world_accessible_device**: Whether any device object has permissive ACLs (Everyone or Authenticated Users)

The runtime analysis is particularly useful for identifying drivers that are both statically suspicious AND currently active. A vulnerable driver that is not loaded cannot be exploited immediately. A vulnerable driver that is loaded with a world-accessible device object is an active threat.

The runtime analysis has limitations:
- It only works on Windows (requires psapi and WMI)
- It requires administrator privileges
- It cannot inspect drivers that load after the scan
- Device object ACL inspection is heuristic and may miss complex permission structures

## Output Formats: Technical and Machine-Readable

The scanner generates two output formats to serve different use cases:

**JSON output (output.json)**: Machine-readable format for automation and SIEM integration. Each driver report includes:
- Driver metadata (name, path, SHA256, signature status)
- Risk assessment (score, level, BYOVD candidate flag, confidence)
- Static analysis results (risky imports, suspicious exports, IOCTL surface, entropy)
- Runtime analysis results (if available)
- Known vulnerability information (if matched against IOC database)

The JSON structure is normalized and typed, making it suitable for:
- EDR policy generation (block drivers with risk_score > 50)
- SIEM alerting (correlate driver loads with risk scores)
- Automated triage (sort by risk_score for manual review)

**Technical report (output_tech.txt)**: Human-readable format for security analysts. The report includes:
- Per-driver vulnerability analysis with context
- Specific indicators detected (which imports, which exports, which IOCTL patterns)
- Confidence scores with reasoning (why this driver is flagged)
- Remediations or mitigations (block the driver, update to patched version, etc.)

The technical report is designed for manual review. It explains the "why" behind each flag, providing the context needed to make informed decisions about whether to block a driver.

## Integration with kdmapper and Offensive Tools

The scanner has offensive applications as well. Security researchers and red teams use kdmapper to load vulnerable drivers for testing. The scanner helps identify suitable target drivers:

1. Scan the driver store for potential targets
2. Review the output for exploitable vulnerabilities
3. Verify the driver is signed (required for kdmapper)
4. Verify the driver is likely whitelisted (Microsoft or major vendor signature)
5. Use the driver with kdmapper for driver loading and exploitation

The scanner's IOCTL surface analysis is particularly useful here: identifying drivers with symbolic links and wide IOCTL surfaces helps find drivers that are easily reachable from usermode. The import analysis identifies which primitives the driver exposes once loaded.

This offensive use case is intentional. Understanding BYOVD from both sides—defensive and offensive—is necessary for comprehensive security. The scanner is a dual-use tool.

## Implementation Status and Limitations

The scanner is complete and functional for its intended purpose. It successfully scans driver directories, performs static analysis, generates IOCs, and produces actionable reports. However, there are inherent limitations to static analysis that should be acknowledged:

**False positives**: The scanner flags code patterns, not actual vulnerabilities. A driver that imports MmMapIoSpace might use it legitimately for hardware memory mapping. The confidence model mitigates this by requiring multiple signals before flagging as HIGH confidence, but manual review is still necessary.

**False negatives**: Sophisticated vulnerabilities may not leave obvious import patterns. A driver might implement arbitrary memory read/write through a combination of benign-looking imports. A driver might resolve imports dynamically at runtime to avoid static detection. The scanner cannot catch these cases.

**IOC database dependence**: The CONFIDENCE level depends entirely on the loldrivers.io database. If a vulnerable driver is not in the database, the scanner cannot flag it as CONFIRMED, even if it has obvious vulnerabilities. This is why the heuristic analysis exists—to catch unknown vulnerabilities.

**Windows-only runtime analysis**: The runtime analysis only works on Windows. Linux and macOS systems cannot benefit from the loaded driver enumeration, though the static analysis works cross-platform.

**No dynamic analysis**: The scanner does not load drivers in a sandbox or test behavior. It cannot identify vulnerabilities that only manifest at runtime, such as race conditions or use-after-free bugs.

**No exploit generation**: The scanner identifies potential vulnerabilities but does not generate exploit code. It is a defensive tool, not an offensive framework.

## Lessons Learned

Building this scanner revealed several insights about BYOVD detection:

**Static analysis is necessary but not sufficient**: You cannot scan thousands of drivers with dynamic analysis—too slow, too dangerous, too expensive. Static analysis provides the first line of defense, filtering drivers down to a manageable set for manual review. The false positive rate is acceptable if the review process is efficient.

**Confidence models matter more than binary classification**: Labeling a driver as "vulnerable" or "not vulnerable" is misleading. A spectrum of confidence with clear reasoning is more useful for decision-making. Analysts need to know WHY a driver is flagged, not just THAT it is flagged.

**IOC databases are force multipliers**: The loldrivers.io integration transforms the scanner from a heuristic tool to a threat intelligence platform. Known vulnerable drivers are instantly identified without complex analysis. The cache design ensures this works offline and at scale.

**The attacker's advantage is persistence**: Attackers only need one vulnerable driver. Defenders need to identify all of them, keep the IOC database updated, and block them without breaking legitimate hardware. This asymmetry means perfect defense is impossible. The goal is risk reduction, not elimination.

**BYOVD is a symptom, not the disease**: The root cause is vendors shipping drivers with insufficient security review. The scanner treats the symptom (identifying vulnerable drivers), but the long-term fix is improving driver development practices.

## Future Directions

Potential improvements to the scanner include:

**YARA rule integration**: Add YARA pattern matching for known vulnerable code patterns, not just imports. This would catch vulnerabilities that don't involve dangerous imports.

**Control flow graph analysis**: Build CFGs for IOCTL handlers to identify missing parameter validation, buffer overflows, and other code-level vulnerabilities. This requires disassembly and is significantly more complex.

**Machine learning model**: Train a classifier on known vulnerable vs safe drivers to identify subtle patterns that heuristic rules miss. This would require a large labeled dataset and careful validation to avoid bias.

**Sandbox integration**: Load suspicious drivers in a kernel sandbox to observe actual behavior and confirm vulnerabilities. This is high-risk and high-effort but would provide definitive results.

**Vendor collaboration**: Work with driver vendors to fix identified vulnerabilities before they are exploited. The scanner could generate vulnerability reports with proof-of-concept code for responsible disclosure.

**API integration**: Provide a REST API for on-demand scanning of individual drivers submitted by users. This would make the scanner accessible to organizations without deploying the full tool.

## Conclusion

BYOVD Scanner is a practical tool for identifying drivers vulnerable to BYOVD attacks through static analysis. It combines IOC database matching, heuristic import/export analysis, IOCTL surface estimation, and entropy analysis to generate actionable intelligence for security teams.

The scanner acknowledges the limitations of static analysis and provides a confidence model that reflects uncertainty. It is not a vulnerability scanner in the traditional sense—it does not prove vulnerabilities exist. It is a prioritization tool that identifies drivers worth investigating.

For blue teams, the scanner provides visibility into the driver ecosystem and helps identify high-risk drivers before they are exploited. For red teams, the scanner helps identify exploitable drivers for testing. For driver developers, the scanner provides feedback on which imports and exports are suspicious, encouraging more secure design.

The BYOVD problem will persist as long as vendors ship vulnerable drivers. The scanner reduces risk by making it easier to identify and block these drivers, but it does not solve the underlying problem. Long-term security requires improving driver development practices, not just detecting bad drivers after they ship.`
};
