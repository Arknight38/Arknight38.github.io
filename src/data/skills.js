export const skills = {
  languages: [
    { name: 'Rust', level: 'expert', color: 'rose' },
    { name: 'C++', level: 'expert', color: 'lavender' },
    { name: 'C', level: 'advanced', color: 'lavender' },
    { name: 'Python', level: 'advanced', color: 'rose' },
    { name: 'TypeScript', level: 'advanced', color: 'rose' },
    { name: 'x86 ASM', level: 'intermediate', color: 'sage' },
  ],
  systems: [
    { name: 'Kernel Drivers', level: 'expert', color: 'lavender' },
    { name: 'Hypervisors', level: 'expert', color: 'lavender' },
    { name: 'Memory Mgmt', level: 'expert', color: 'lavender' },
    { name: 'IPC', level: 'advanced', color: 'lavender' },
    { name: 'Reverse Eng', level: 'advanced', color: 'lavender' },
  ],
  backend: [
    { name: 'Axum / Tokio', level: 'expert', color: 'sage' },
    { name: 'PostgreSQL', level: 'advanced', color: 'sage' },
    { name: 'WebSockets', level: 'advanced', color: 'sage' },
    { name: 'Docker', level: 'intermediate', color: 'sage' },
    { name: 'AWS S3 / R2', level: 'intermediate', color: 'sage' },
  ],
  tools: [
    { name: 'Git / GitHub', level: 'expert', color: 'neutral' },
    { name: 'Zydis', level: 'advanced', color: 'neutral' },
    { name: 'LIEF', level: 'advanced', color: 'neutral' },
    { name: 'Snowflake', level: 'intermediate', color: 'neutral' },
    { name: 'egui', level: 'intermediate', color: 'neutral' },
  ],
};

export const skillCategories = [
  { id: 'languages', title: 'Languages' },
  { id: 'systems', title: 'Systems & Low-Level' },
  { id: 'backend', title: 'Backend & Infra' },
  { id: 'tools', title: 'Tools' },
];
