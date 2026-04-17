import { projects } from './projects.js';

// Track page load time for uptime command
const pageLoadTime = Date.now();
let commandHistory = [];

export const terminalCommands = {
  help: {
    desc: 'Show available commands',
    exec: () => `AVAILABLE COMMANDS:
  help       - Show this message
  email      - Copy email to clipboard
  github     - Open GitHub profile
  linkedin   - Open LinkedIn profile
  cv         - Download resume
  whoami     - About Saku
  ls         - List contact methods
  date       - Current date/time
  neofetch   - System info
  matrix     - Enter the matrix
  clear      - Clear terminal

SYSTEM / LORE:
  uptime     - Time since page loaded
  ping       - Fake latency readout
  uname      - Short system info
  ps         - Fake process list
  top        - Process list with CPU/mem
  ifconfig   - Fake network output

PROJECTS / WORK:
  projects   - List actual projects
  cat        - View README.md
  git log    - Fake commit history
  man saku   - Manual page bio

UTILITY:
  echo       - Echo text
  history    - Command history
  man        - Manual for commands
  alias      - List aliases`
  },
  email: {
    desc: 'Copy email to clipboard',
    exec: (copyToClipboard) => {
      copyToClipboard('sakugrossarth@gmail.com', 'email');
      return 'EMAIL COPIED TO CLIPBOARD: sakugrossarth@gmail.com';
    }
  },
  github: {
    desc: 'Open GitHub profile',
    exec: () => {
      window.open('https://github.com/Arknight38', '_blank');
      return 'OPENING GITHUB...';
    }
  },
  linkedin: {
    desc: 'Open LinkedIn profile',
    exec: () => {
      window.open('https://linkedin.com/in/saku-grossarth-9040083aa', '_blank');
      return 'OPENING LINKEDIN...';
    }
  },
  cv: {
    desc: 'Download resume',
    exec: () => {
      window.open('/Saku_Grossarth_CV.pdf', '_blank');
      return 'OPENING RESUME...';
    }
  },
  whoami: {
    desc: 'About Saku',
    exec: () => `SAKU@PORTFOLIO
---------------
NAME: Saku Grossarth
ROLE: Low-level Systems & Security Researcher
FOCUS: Kernel development, reverse engineering, vuln research
LOCATION: Colorado Springs, CO
STATUS: ● Open to opportunities`
  },
  ls: {
    desc: 'List contact methods',
    exec: () => `CONTACT/
├── email    → sakugrossarth@gmail.com
├── github   → @Arknight38
├── linkedin → Saku Grossarth
└── cv       → Saku_Grossarth_CV.pdf`
  },
  date: {
    desc: 'Current date/time',
    exec: () => new Date().toString().toUpperCase()
  },
  neofetch: {
    desc: 'System info',
    exec: () => `    ___       ___       ___       ___
   /\\__\\     /\\  \\     /\\__\\     /\\  \\
  /:/  /    /::\\  \\   /:/  /    /::\\  \\
 /:/__/    /:/\\:\\__\\ /:/__/    /:/\\:\\__\\
 \\:\\  \\    /:/ /:/  /|:|  |__ /:/ /:/  /
  \\:\\  \\  /:/_/:/  / |:| /\\  /:/_/:/  /
   \\:\\__\\ \\:\\/:/  /  |:|/__/ \\:\\/:/  /
    \\/__/  \\::/  /   |:|\\_|/   \\::/  /
           /:/  /    |:| \\|/   /:/  /
          /:/  /      \\|/|/    /:/  /
          \\/__/        /__/     \\/__/

SAKU@PORTFOLIO
----------------
OS: Portfolio OS 1.0
HOST: Arknight38.github.io
KERNEL: low-level-security
SHELL: contact-terminal
LANGS: C, C++, Rust, Python
FOCUS: Systems, Security, RE`
  },
  matrix: {
    desc: 'Enter the matrix',
    exec: () => {
      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      let rain = '';
      for (let i = 0; i < 12; i++) {
        let line = '';
        for (let j = 0; j < 40; j++) {
          line += chars[Math.floor(Math.random() * chars.length)];
        }
        rain += line + '\n';
      }
      return {
        content: rain + '\nWAKE UP, NEO...',
        animated: true,
        chars: chars,
        lines: 12,
        cols: 40
      };
    }
  },
  clear: {
    desc: 'Clear terminal',
    exec: (setHistory) => {
      setHistory([]);
      return null;
    }
  },
  secret: {
    desc: 'Hidden',
    exec: () => `ACCESS GRANTED: RESTRICTED SECTOR

[REDACTED] Intel discovered via unconventional analysis.

"Understanding a system requires observing it from angles
not documented in the specification."

Trace origin: Reverse engineering discipline
Competency: Systems-level debugging
Status: Operational`
  },

  // SYSTEM / LORE COMMANDS
  uptime: {
    desc: 'Time since page loaded',
    exec: () => {
      const elapsed = Date.now() - pageLoadTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `UPTIME: ${minutes}m ${remainingSeconds}s`;
    }
  },
  ping: {
    desc: 'Fake latency readout',
    exec: () => {
      const latency = Math.floor(Math.random() * 20) + 2;
      return `PINGING sakugrossarth.dev...\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=${latency}ms`;
    }
  },
  uname: {
    desc: 'Short system info',
    exec: () => `PortfolioOS 1.0 x86_64 GNU/Linux`
  },
  ps: {
    desc: 'Fake process list',
    exec: () => `  PID TTY          TIME CMD
    1 pts/0    00:00:42 kernel-driver-research
    2 pts/0    00:01:15 vuln-scanner
    3 pts/0    00:00:08 coffee-daemon
    4 pts/0    00:00:23 reverse-engineering
    5 pts/0    00:00:31 rust-compiler`
  },
  top: {
    desc: 'Process list with CPU/mem',
    exec: () => `top - 12:34:56 up 1 day,  2 users,  load average: 0.42, 0.31, 0.28
Tasks:   5 total,   2 running,   3 sleeping,   0 stopped,   0 zombie
%Cpu(s): 12.3 us,  5.2 sy,  0.0 ni, 80.5 id,  2.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem:   16384.0 total,   8192.0 free,   4096.0 used,   4096.0 buff/cache

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 saku      20   0   12345   2048    512 R  15.2   0.1   0:42.31 kernel-driver-research
    2 saku      20   0   23456   4096   1024 S   8.5   0.2   1:15.42 vuln-scanner
    3 saku      20   0    3456    512    256 S   2.1   0.0   0:08.15 coffee-daemon
    4 saku      20   0   45678   8192   2048 R  12.3   0.4   0:23.67 reverse-engineering
    5 saku      20   0   56789   6144   1536 S  18.7   0.3   0:31.89 rust-compiler`
  },
  ifconfig: {
    desc: 'Fake network output',
    exec: () => `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.38  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)
        RX packets 12345  bytes 1234567 (1.2 MiB)
        TX packets 67890  bytes 9876543 (9.4 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 42  bytes 2048 (2.0 KiB)
        TX packets 42  bytes 2048 (2.0 KiB)

GITHUB_LINK: 192.168.1.100
LINKEDIN_LINK: 192.168.1.101`
  },

  // PROJECTS / WORK COMMANDS
  projects: {
    desc: 'List actual projects',
    exec: () => {
      return projects.map(p => 
        `● ${p.name}
  ${p.description.substring(0, 80)}...`
      ).join('\n\n');
    }
  },
  cat: {
    desc: 'View README.md',
    exec: () => `# Saku Grossarth

Low-level systems & security researcher focused on kernel development,
reverse engineering, and vulnerability research.

## Focus Areas
- Kernel-mode driver development
- Binary analysis and reverse engineering
- Hypervisor research (VT-x/VMX)
- Security tooling and exploit development

## Tech Stack
- C, C++, Rust, Python
- Windows internals, Linux kernel
- Ghidra, IDA Pro, WinDbg

## Contact
- GitHub: @Arknight38
- Email: sakugrossarth@gmail.com

---
"Understanding a system requires observing it from angles
not documented in the specification."`
  },
  'git log': {
    desc: 'Fake commit history',
    exec: () => `commit a1b2c3d4e5f67890 (HEAD -> main)
Author: Saku <sakugrossarth@gmail.com>
Date:   ${new Date().toDateString()}

    feat: added hypervisor stealth module

commit b2c3d4e5f67890a1
Author: Saku <sakugrossarth@gmail.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    fix: stopped being bad at Rust

commit c3d4e5f67890a1b2
Author: Saku <sakugrossarth@gmail.com>
Date:   ${new Date(Date.now() - 172800000).toDateString()}

    refactor: rewrote memory scanner in C++

commit d4e5f67890a1b2c3
Author: Saku <sakugrossarth@gmail.com>
Date:   ${new Date(Date.now() - 259200000).toDateString()}

    docs: added kernel debugging guide

commit e5f67890a1b2c3d4
Author: Saku <sakugrossarth@gmail.com>
Date:   ${new Date(Date.now() - 345600000).toDateString()}

    feat: implemented EPT memory virtualization`
  },
  'man saku': {
    desc: 'Manual page bio',
    exec: () => `SAKU(1)                     User Commands                    SAKU(1)

NAME
     saku - Low-level Systems & Security Researcher

SYNOPSIS
     saku [--kernel] [--reverse-engineering] [--vuln-research]

DESCRIPTION
     Saku Grossarth is a systems and security researcher focused on
     kernel development, reverse engineering, and vulnerability research.

OPTIONS
     --kernel
              Focus on kernel-mode driver development and hypervisor research

     --reverse-engineering
              Binary analysis using Ghidra, IDA Pro, and custom tools

     --vuln-research
              Security research and exploit development

EXAMPLES
     saku --kernel --hypervisor
              Build and test hypervisor with VMX/EPT support

     saku --reverse-engineering target.exe
              Analyze binary and generate AOB signatures

SEE ALSO
     whoami(1), neofetch(1), projects(1)

AUTHOR
     Saku Grossarth <sakugrossarth@gmail.com>

PORTFOLIO OS                          April 2026                       SAKU(1)`
  },

  // EASTER EGGS
  sudo: {
    desc: 'Try to get root',
    exec: () => `Nice try. You don't have root here.`
  },
  'rm -rf /': {
    desc: 'Try to delete everything',
    exec: () => `⚠️  WARNING: DELETING ROOT FILESYSTEM...
rm: cannot remove '/': Device or resource busy
rm: it's probably for the best
rm: just kidding. nice try though.`
  },
  hack: {
    desc: 'Fake intrusion attempt',
    exec: () => {
      const sequence = [
        'INITIATING INTRUSION SEQUENCE...',
        'BYPASSING FIREWALL...',
        'DECRYPTING PASSWORDS...',
        'ACCESSING MAINFRAME...',
        'UPLOADING PAYLOAD...',
        '████████████████████ 100%',
        'ACCESS DENIED: you\'re not that guy'
      ];
      return sequence.join('\n');
    }
  },
  vim: {
    desc: 'Enter vim (good luck)',
    exec: () => `entering vim... good luck getting out...
[after 5 minutes of trying]
hint: try :q`
  },
  coffee: {
    desc: 'ASCII art coffee',
    exec: () => `    (
    )\\
  .--' '--.
 /          \\
|            |
 \\,        ,/
  '--------,'
BREWING... DONE.
PRODUCTIVITY +12%`
  },
  fortune: {
    desc: 'Random hacker quote',
    exec: () => {
      const fortunes = [
        '"Talk is cheap. Show me the code." - Linus Torvalds',
        '"First, solve the problem. Then, write the code." - John Johnson',
        '"The best error message is the one that never shows up." - Thomas Fuchs',
        '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler',
        '"Debugging is twice as hard as writing the code in the first place." - Brian Kernighan',
        '"There are only two kinds of languages: the ones people complain about and the ones nobody uses." - Bjarne Stroustrup',
        '"If you think your users are idiots, only idiots will use your software." - Linus Torvalds',
        '"The computer was born to solve problems that did not exist before." - Bill Gates',
        '"Most software today is very much like an Egyptian pyramid with millions of bricks piled on top of each other, with no structural integrity." - Alan Kay',
        '"There is no such thing as a secure system." - Bruce Schneier'
      ];
      return fortunes[Math.floor(Math.random() * fortunes.length)];
    }
  },

  // UTILITY COMMANDS
  echo: {
    desc: 'Echo text',
    exec: (_, args) => args.join(' ') || ''
  },
  history: {
    desc: 'Command history',
    exec: () => {
      if (commandHistory.length === 0) {
        return 'No commands in history.';
      }
      return commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n');
    }
  },
  man: {
    desc: 'Manual for commands',
    exec: (_, args) => {
      const command = args[0];
      if (!command) {
        return 'What manual page do you want?';
      }
      if (command === 'saku') {
        return terminalCommands['man saku'].exec();
      }
      const cmd = terminalCommands[command];
      if (cmd) {
        return `${command}(1)                    User Commands                   ${command.toUpperCase()}(1)

NAME
     ${command} - ${cmd.desc}

DESCRIPTION
     ${cmd.desc}

SEE ALSO
     help(1)`;
      }
      return `No manual entry for ${command}`;
    }
  },
  alias: {
    desc: 'List aliases',
    exec: () => `alias hack='read docs carefully'
alias rm='rm -i'
alias sudo='please'
alias coffee='brew --productivity-boost'
alias vim='nano --easier-mode'
alias git='git --force'`
  }
};

// Helper to track command history
export const addToHistory = (command) => {
  commandHistory.push(command);
  if (commandHistory.length > 50) {
    commandHistory.shift();
  }
};
