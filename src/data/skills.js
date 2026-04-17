export const skills = {
  languages: [
    {
      id: 'rust',
      name: 'Rust',
      status: 'core',
      contexts: ['systems', 'backend', 'performance'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
        { type: 'writeup', id: 'gif-engine', label: 'Gif-Engine' },
      ],
    },
    {
      id: 'cpp',
      name: 'C++',
      status: 'core',
      contexts: ['kernel', 'reverse', 'native tooling'],
      evidence: [
        { type: 'writeup', id: 'atlus', label: 'Atlus' },
        { type: 'writeup', id: 'arkvisor', label: 'ArkVisor' },
        { type: 'writeup', id: 'wdfilterdrv', label: 'WdFilterDrv' },
      ],
    },
    {
      id: 'c',
      name: 'C',
      status: 'foundational',
      contexts: ['systems fundamentals', 'memory layout'],
      evidence: [
        { type: 'writeup', id: 'manualmapdrv', label: 'ManualMapDrv' },
      ],
    },
    {
      id: 'python',
      name: 'Python',
      status: 'active',
      contexts: ['automation', 'data', 'security tooling'],
      evidence: [
        { type: 'writeup', id: 'snowflake-analytics', label: 'Snowflake Analytics' },
        { type: 'writeup', id: 'monitor-def-not-mal', label: 'Cybersecurity Framework' },
      ],
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      status: 'active',
      contexts: ['frontend', 'tooling', 'web ui'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux Frontend' },
        { type: 'writeup', id: 'fbla-spotlocal', label: 'SpotLocal' },
      ],
    },
  ],
  systems: [
    {
      id: 'kernel-drivers',
      name: 'Kernel Drivers',
      status: 'core',
      contexts: ['windows internals', 'ioctl design'],
      evidence: [
        { type: 'writeup', id: 'wdfilterdrv', label: 'WdFilterDrv' },
        { type: 'writeup', id: 'manualmapdrv', label: 'ManualMapDrv' },
      ],
    },
    {
      id: 'hypervisors',
      name: 'Hypervisors',
      status: 'core',
      contexts: ['vmx', 'ept', 'research'],
      evidence: [
        { type: 'writeup', id: 'arkvisor', label: 'ArkVisor' },
      ],
    },
    {
      id: 'memory-management',
      name: 'Memory Management',
      status: 'core',
      contexts: ['process memory', 'manual mapping'],
      evidence: [
        { type: 'writeup', id: 'cs2-extern', label: 'CS2 Extern' },
        { type: 'writeup', id: 'rune-editor', label: 'Rune Editor' },
      ],
    },
    {
      id: 'ipc',
      name: 'IPC',
      status: 'active',
      contexts: ['shared memory', 'message routing'],
      evidence: [
        { type: 'writeup', id: 'wdfilterdrv', label: 'WdFilterDrv' },
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
    {
      id: 'reverse-engineering',
      name: 'Reverse Engineering',
      status: 'core',
      contexts: ['binary diffing', 'analysis workflow'],
      evidence: [
        { type: 'writeup', id: 'atlus', label: 'Atlus' },
        { type: 'writeup', id: 'byovd-scanner', label: 'BYOVD Scanner' },
      ],
    },
  ],
  backend: [
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      status: 'active',
      contexts: ['schema design', 'query optimization'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
    {
      id: 'websockets',
      name: 'WebSockets',
      status: 'core',
      contexts: ['real-time messaging', 'presence'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
    {
      id: 'docker',
      name: 'Docker',
      status: 'active',
      contexts: ['deployment', 'environment parity'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
    {
      id: 'r2-s3',
      name: 'Cloudflare R2 / S3',
      status: 'active',
      contexts: ['object storage', 'asset pipelines'],
      evidence: [
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
  ],
  tools: [
    {
      id: 'git-github',
      name: 'Git / GitHub',
      status: 'core',
      contexts: ['collaboration', 'version control'],
      evidence: [
        { type: 'writeup', id: 'server-shenanigans', label: 'ServerShenanigans' },
        { type: 'writeup', id: 'flux-messaging', label: 'Flux' },
      ],
    },
    {
      id: 'zydis',
      name: 'Zydis',
      status: 'active',
      contexts: ['disassembly', 'x86/x64 analysis'],
      evidence: [
        { type: 'writeup', id: 'atlus', label: 'Atlus' },
      ],
    },
    {
      id: 'lief',
      name: 'LIEF',
      status: 'active',
      contexts: ['pe parsing', 'binary tooling'],
      evidence: [
        { type: 'writeup', id: 'atlus', label: 'Atlus' },
      ],
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      status: 'active',
      contexts: ['warehouse analytics', 'sql pipelines'],
      evidence: [
        { type: 'writeup', id: 'snowflake-analytics', label: 'Snowflake Analytics' },
      ],
    },
    {
      id: 'imgui',
      name: 'Dear ImGui',
      status: 'active',
      contexts: ['native ui', 'tool interfaces'],
      evidence: [
        { type: 'writeup', id: 'atlus', label: 'Atlus' },
        { type: 'writeup', id: 'cs2-extern', label: 'CS2 Extern' },
      ],
    },
  ],
};

export const skillCategories = [
  { id: 'languages', title: 'Languages' },
  { id: 'systems', title: 'Systems & Low-Level' },
  { id: 'backend', title: 'Backend & Infra' },
  { id: 'tools', title: 'Tools' },
];
