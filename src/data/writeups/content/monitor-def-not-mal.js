export const monitorDefNotMal = {
  id: 'monitor-def-not-mal',
  title: 'Monitor-Def-Not-Mal: An APT Simulation Framework',
  subtitle: 'A modular client-server framework implementing covert C2 channels, evasion techniques, and persistence mechanisms for authorized security research and EDR testing.',
  date: '2024',
  categories: ['tools', 'security', 'closed'],
  tags: ['security', 'python', 'apt', 'red-team', 'c2', 'evasion'],
  readTime: '15 min',
  featured: false,
  content: `## Architecture

The framework implements a client-server model where the server acts as the simulated target and the client provides administrative control. This separation allows the server to run autonomously on target systems while operators interact through the client interface.

Server modules are organized by function: \`api_routes.py\` exposes Flask REST endpoints, \`monitoring.py\` handles system data collection, \`advanced_c2.py\` implements multi-channel command and control, \`anti_debug.py\` and \`anti_vm.py\` provide analysis evasion, \`evasion.py\` handles string obfuscation and control flow flattening, \`persistence_manager.py\` manages installation mechanisms, \`surveillance_suite.py\` captures audio/video, and \`encryption.py\` provides AES-256 payload encryption.

The client side consists of \`gui.py\` (Tkinter interface), \`api_client.py\` (REST wrapper), \`server_tab.py\` (per-server management), and \`callback_listener.py\` (reverse connection handler). Communication occurs over REST API for explicit commands and reverse TCP connections for callback-based operation.

## Multi-Channel Command & Control

The framework implements three covert communication channels commonly used by APTs:

**DNS Tunneling** encodes data in subdomain queries and retrieves commands via TXT record responses. The DNS channel operates through the system's default resolver, making it difficult to detect at the network layer since DNS traffic is ubiquitous.

**ICMP Covert Channels** embed commands in ICMP echo request payloads. By using the data field of ping packets, the framework can transmit small commands that blend into normal network diagnostic traffic.

**Dead Drops** use public services like Pastebin or GitHub Gists for configuration distribution and command retrieval. This asymmetric communication pattern—where the target polls a public endpoint rather than maintaining a persistent connection—reduces the attack surface and makes detection harder.

These channels are not mutually exclusive. The framework can fail over between them, and operators can configure which channels are active based on the target environment.

## Evasion Techniques

The evasion module implements techniques that malware uses to avoid analysis:

**Debugger Detection** checks for the presence of debuggers using Win32 APIs (\`IsDebuggerPresent\`, \`CheckRemoteDebuggerPresent\`) and timing-based detection. By measuring execution time of known instructions and comparing against expected baselines, the framework can detect when a debugger is single-stepping through code.

**VM Detection** uses hardware fingerprinting to identify virtualized environments. Techniques include checking CPUID return values, inspecting MAC address prefixes for known virtualization vendors, and detecting hypervisor-specific registry keys and processes.

**String Obfuscation** uses XOR encryption with runtime decryption. Strings are stored encrypted in the binary and decrypted only when needed, preventing static analysis from extracting meaningful strings from the compiled executable.

**Process Injection** implements DLL injection via \`CreateRemoteThread\` and process hollowing. These techniques allow the framework to execute code in the context of legitimate processes, bypassing application-level controls.

## Persistence Mechanisms

The persistence manager implements multiple techniques for surviving system reboots:

**Registry Run Keys** add entries to \`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\` and \`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\`. These are the most basic persistence mechanisms but are also the most easily detected.

**Windows Services** create a system service using \`OpenSCManager\`, \`CreateService\`, and \`StartService\`. Services run with system privileges and start automatically on boot, making them more persistent than registry keys.

**WMI Event Subscriptions** use Windows Management Instrumentation to trigger execution on specific events like user login or system startup. WMI-based persistence is harder to detect because it lives outside the normal startup locations.

**Scheduled Tasks** create tasks via the Task Scheduler API with triggers like "At logon" or "At startup." Tasks can be configured to run with specific user contexts and with various privilege levels.

The framework can use multiple persistence mechanisms simultaneously for redundancy, and operators can configure which mechanisms are deployed based on the target environment.

## Build System

The framework uses Nuitka to compile Python to native C code, producing standalone executables. Nuitka translates Python bytecode to C, compiles it with a C compiler, and links it against the Python runtime statically.

This approach provides several advantages:

**No Python Runtime Dependency**—the executable contains everything needed to run, eliminating the need to install Python on target systems.

**Single-File Distribution**—Nuitka can bundle all dependencies into a single executable, simplifying deployment.

**Performance**—compiled code executes faster than interpreted Python, which matters for time-sensitive operations like anti-debug timing checks.

**Console Control**—builds can be configured with or without a console window, allowing the framework to run silently in the background.

The build process is automated via \`build.bat\`, which handles Nuitka invocation, dependency bundling, and code signing.

## Security Controls

The framework includes several controls to limit misuse:

**API Key Authentication**—all REST endpoints require a valid API key in the \`X-API-Key\` header. Keys are configurable and rotate on a schedule defined by the operator.

**Data Retention Policies**—collected data (keystrokes, screenshots, audio) is automatically deleted after a configurable retention period. This prevents indefinite data accumulation.

**Local Network Operation**—by default, the server binds to localhost and the client connects to local addresses only. Remote operation requires explicit configuration and is discouraged.

**Educational Checks**—the framework includes checks that log when it detects analysis environments, but these do not block execution. This allows researchers to study the detection mechanisms without being locked out of the tool.

These controls are designed to make the framework suitable for authorized use while acknowledging that determined actors can bypass them. The framework is not a security product; it is a research tool.

## Technical Implementation Details

The REST API in \`api_routes.py\` exposes endpoints for monitoring data retrieval, command execution, and configuration updates. All responses are JSON-formatted. Endpoints include \`/api/status\` (server health), \`/api/monitoring\` (system data), \`/api/execute\` (command execution), and \`/api/config\` (configuration management).

The monitoring module in \`monitoring.py\` collects system information using WMI queries, registry reads, and direct API calls. Data collected includes running processes, network connections, installed software, and system configuration. This data is cached and updated on a configurable interval.

The encryption module uses AES-256 in CBC mode with PKCS7 padding. Keys are derived from a configurable passphrase using PBKDF2 with 100,000 iterations. Encrypted payloads include the C2 configuration, persistence settings, and any exfiltrated data.

The surveillance suite captures audio using the PyAudio library and video using the mss (Multiple Screen Shots) library. Captures are compressed before transmission to reduce bandwidth usage. Audio is encoded as MP3, video as JPEG frames at a configurable frame rate.

## Applications

The framework serves several use cases in authorized security contexts:

**Security Research**—understanding how APTs implement covert channels, evasion techniques, and persistence mechanisms. By implementing these techniques, researchers can develop better detection signatures and defensive controls.

**Red Team Operations**—simulating adversary behavior during authorized penetration tests. The framework provides realistic C2 infrastructure without the operational overhead of maintaining custom malware.

**EDR Testing**—evaluating endpoint detection and response systems by deploying the framework in a test environment and analyzing which techniques are detected and which evade detection.

**Incident Response Training**—providing a realistic adversary simulation for training IR teams. Trainees can detect, contain, and remediate the framework's persistence mechanisms and C2 channels in a controlled environment.

The framework is explicitly designed for educational and authorized testing purposes. Unauthorized deployment is illegal and unethical.`
};
