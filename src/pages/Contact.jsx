import { useEffect, useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { SEO } from '@components/SEO';
import { Mail, Github, FileText, Globe, Radio, Terminal, Zap, Lock } from 'lucide-react';

// Contact Page - /contact route
// CENTER: terminal-style panel (FOCAL)
// Minimal supporting elements
// Strong CTA ("GO ONLINE")

const contactLinks = [
  {
    id: 'email',
    label: 'EMAIL',
    value: 'sakugrossarth@gmail.com',
    href: 'mailto:sakugrossarth@gmail.com',
    icon: Mail,
    description: 'Direct communication channel',
    color: 'rose',
  },
  {
    id: 'github',
    label: 'GITHUB',
    value: 'Arknight38',
    href: 'https://github.com/Arknight38',
    icon: Github,
    description: 'Source code repository',
    color: 'lavender',
  },
  {
    id: 'linkedin',
    label: 'LINKEDIN',
    value: 'Saku Grossarth',
    href: 'https://www.linkedin.com/in/saku-grossarth-9040083aa/',
    icon: Globe,
    description: 'Professional network',
    color: 'sage',
  },
  {
    id: 'cv',
    label: 'RESUME',
    value: 'Saku_Grossarth_CV.pdf',
    href: '/Saku_Grossarth_CV.pdf',
    icon: FileText,
    description: 'Complete capability dossier',
    color: 'text2',
  },
];

export function Contact() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // CONTACT';
  }, []);

  return (
    <>
      <SEO title="Contact" description="Establish connection — available for systems engineering opportunities" pathname="/contact" />
      <ThreeZoneLayout
        left={<ContactInfo />}
        center={<TerminalFocal />}
        right={<QuickConnect />}
      />
    </>
  );
}

// LEFT ZONE - Contact Info
const ContactInfo = memo(function ContactInfo() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Radio size={14} />
          <span className="panel-label">COMMS STATUS</span>
        </div>
        <div className="comms-status">
          <div className="status-row">
            <span className="status-indicator online" />
            <span className="status-text">ONLINE</span>
          </div>
          <div className="status-detail">
            <span>COLORADO SPRINGS, CO</span>
            <span>UTC-07:00</span>
          </div>
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Zap size={14} />
          <span className="panel-label">AVAILABILITY</span>
        </div>
        <div className="availability-info">
          <p className="availability-primary">
            OPEN TO OPPORTUNITIES
          </p>
          <p className="availability-secondary">
            Systems programming, security research, low-level development
          </p>
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="response-time">
          <span className="response-label">TYPICAL RESPONSE</span>
          <span className="response-value">&lt; 24 HOURS</span>
        </div>
      </ZoneCard>
    </div>
  );
});

// CENTER ZONE - Interactive Terminal
const TerminalFocal = memo(function TerminalFocal() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const inputRef = useRef(null);
  const historyEndRef = useRef(null);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const commands = {
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
  clear      - Clear terminal`
    },
    email: {
      desc: 'Copy email to clipboard',
      exec: () => {
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
 \\:\  \\    /:/ /:/  /|:|  |__ /:/ /:/  /
  \\:\  \\  /:/_/:/  / |:| /\\  /:/_/:/  / 
   \\:\__\\ \\:\/:/  /  |:|/__/ \\:\/:/  /  
    \\/__/  \\::/  /   |:|\\_\\\\   \\::/  /   
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
        for (let i = 0; i < 8; i++) {
          let line = '';
          for (let j = 0; j < 30; j++) {
            line += chars[Math.floor(Math.random() * chars.length)];
          }
          rain += line + '\n';
        }
        return rain + '\nWAKE UP, NEO...';
      }
    },
    clear: {
      desc: 'Clear terminal',
      exec: () => {
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
    }
  };

  const executeCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    const newEntry = { type: 'input', content: cmd };
    let outputEntry = null;

    if (commands[trimmed]) {
      const result = commands[trimmed].exec();
      if (result) outputEntry = { type: 'output', content: result };
    } else {
      outputEntry = { type: 'error', content: `COMMAND NOT FOUND: ${trimmed}\nTYPE 'help' FOR AVAILABLE COMMANDS` };
    }

    setHistory(prev => [...prev, newEntry, ...(outputEntry ? [outputEntry] : [])]);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    }
  };

  useEffect(() => {
    // Auto-focus on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when history changes
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <ZoneCard variant="focal" className="terminal-focal">
      <div className="terminal-header">
        <Terminal size={18} />
        <span className="terminal-title">CONNECTION_TERMINAL</span>
        <div className="terminal-status-strip" aria-hidden="true">
          <span>SECURE</span>
          <strong>OK</strong>
        </div>
        <div className="terminal-controls">
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-dot" />
        </div>
      </div>

      <div className="terminal-interactive-screen">
        {/* Boot lines */}
        <div className="terminal-line">
          <span className="terminal-prefix">&gt;</span>
          <span className="terminal-text">INITIATING_CONTACT_PROTOCOL...</span>
        </div>
        <div className="terminal-line">
          <span className="terminal-prefix">&gt;</span>
          <span className="terminal-text">ESTABLISHING_SECURE_CHANNEL...</span>
        </div>
        <div className="terminal-line">
          <span className="terminal-prefix ready">$</span>
          <span className="terminal-text">CONNECTION_READY</span>
        </div>
        <div className="terminal-line welcome-line">
          <span className="terminal-prefix">$</span>
          <span className="terminal-text terminal-dim">TYPE 'help' FOR AVAILABLE COMMANDS</span>
        </div>

        {/* Command history */}
        {history.map((entry, index) => (
          <div key={index} className="terminal-line">
            {entry.type === 'input' ? (
              <>
                <span className="terminal-prefix ready">$</span>
                <span className="terminal-text">{entry.content}</span>
              </>
            ) : entry.type === 'error' ? (
              <span className="terminal-output terminal-error">{entry.content}</span>
            ) : (
              <span className="terminal-output">{entry.content}</span>
            )}
          </div>
        ))}

        {/* Input line */}
        <div className="terminal-input-wrapper">
          <span className="terminal-prefix ready">$</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-command-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER_COMMAND..."
            spellCheck={false}
            autoComplete="off"
          />
          <span className="terminal-cursor">_</span>
        </div>

        <div ref={historyEndRef} />
      </div>

      <div className="terminal-divider" />

      <div className="terminal-quick-links">
        <span className="quick-links-label">QUICK LINKS:</span>
        <div className="terminal-contact-grid compact">
          {contactLinks.map((link) => {
            const Icon = link.icon;
            const isEmail = link.id === 'email';

            return (
              <a
                key={link.id}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener' : undefined}
                className="terminal-contact-item compact"
                onClick={isEmail ? (e) => {
                  e.preventDefault();
                  copyToClipboard(link.value, link.id);
                } : undefined}
              >
                <div className="contact-item-header">
                  <Icon size={12} className={`contact-icon ${link.color}`} />
                  <span className="contact-label">{link.label}</span>
                </div>
                <span className="contact-value">{copiedId === link.id ? 'COPIED!' : link.value}</span>
              </a>
            );
          })}
        </div>
      </div>
    </ZoneCard>
  );
});

// RIGHT ZONE - Quick Connect
const QuickConnect = memo(function QuickConnect() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">PRIORITY CHANNELS</span>
        </div>
        <div className="priority-list">
          <div className="priority-item">
            <span className="priority-rank">01</span>
            <span className="priority-name">EMAIL</span>
            <span className="priority-desc">Direct</span>
          </div>
          <div className="priority-item">
            <span className="priority-rank">02</span>
            <span className="priority-name">GITHUB</span>
            <span className="priority-desc">Code</span>
          </div>
          <div className="priority-item">
            <span className="priority-rank">03</span>
            <span className="priority-name">LINKEDIN</span>
            <span className="priority-desc">Professional</span>
          </div>
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="encrypted-notice">
          <Lock size={14} className="notice-icon" />
          <span className="notice-text">
            All communications are treated confidentially
          </span>
        </div>
      </ZoneCard>
    </div>
  );
});
