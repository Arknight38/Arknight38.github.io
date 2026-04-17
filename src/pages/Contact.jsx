import { useEffect, useState, useRef, memo } from 'react';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { SEO } from '@components/SEO';
import { Mail, Github, FileText, Globe, Radio, Terminal, Zap, Lock } from 'lucide-react';
import { terminalCommands, addToHistory } from '@data/terminalCommands';

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
  const cursorRef = useRef(null);
  const animationIntervalRef = useRef(null);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const executeCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to command history
    addToHistory(trimmed);

    const newEntry = { type: 'input', content: cmd };
    let outputEntry = null;

    // Parse command and arguments
    const parts = trimmed.toLowerCase().split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    // Handle multi-word commands
    let commandKey = commandName;
    const fullCommand = parts.join(' ');

    // Check for exact multi-word matches first
    if (terminalCommands[fullCommand]) {
      commandKey = fullCommand;
    } else if (terminalCommands[commandName]) {
      commandKey = commandName;
    }

    if (terminalCommands[commandKey]) {
      const command = terminalCommands[commandKey];
      let result;

      if (commandKey === 'email') {
        result = command.exec(copyToClipboard);
      } else if (commandKey === 'clear') {
        result = command.exec(setHistory);
      } else if (commandKey === 'echo' || commandKey === 'man') {
        result = command.exec(null, args);
      } else if (commandKey === 'cat') {
        // Handle cat README.md specifically
        if (args[0] === 'readme.md' || args[0] === 'readme') {
          result = command.exec();
        } else {
          result = `cat: ${args[0] || ''}: No such file or directory`;
        }
      } else {
        result = command.exec();
      }

      if (result) {
        // Handle animated output (matrix)
        if (result.animated) {
          outputEntry = {
            type: 'output',
            content: result.content,
            animated: true,
            chars: result.chars,
            lines: result.lines,
            cols: result.cols
          };

          // Clear any existing animation
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
          }

          // Start new animation
          animationIntervalRef.current = setInterval(() => {
            setHistory(prev => {
              const newHistory = [...prev];
              const lastEntry = newHistory[newHistory.length - 1];
              if (lastEntry && lastEntry.animated) {
                const currentContent = lastEntry.content.split('\n');
                const matrixLines = currentContent.slice(0, lastEntry.lines);

                // Only shift ~15% of characters for glitch effect
                const shiftProbability = 0.15;

                for (let i = 0; i < matrixLines.length; i++) {
                  let line = matrixLines[i];
                  let newLine = '';
                  for (let j = 0; j < line.length; j++) {
                    if (Math.random() < shiftProbability) {
                      newLine += lastEntry.chars[Math.floor(Math.random() * lastEntry.chars.length)];
                    } else {
                      newLine += line[j];
                    }
                  }
                  matrixLines[i] = newLine;
                }

                newHistory[newHistory.length - 1] = {
                  ...lastEntry,
                  content: matrixLines.join('\n') + '\nWAKE UP, NEO...'
                };
              }
              return newHistory;
            });
          }, 100);

          // Stop animation after 5 seconds
          setTimeout(() => {
            if (animationIntervalRef.current) {
              clearInterval(animationIntervalRef.current);
              animationIntervalRef.current = null;
            }
          }, 5000);
        } else {
          outputEntry = { type: 'output', content: result };
        }
      }
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

      <div className="terminal-interactive-screen" onClick={() => inputRef.current?.focus()}>
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
        </div>

        <div ref={historyEndRef} />
      </div>

      <div className="terminal-divider" />
    </ZoneCard>
  );
});

// RIGHT ZONE - Quick Connect
const QuickConnect = memo(function QuickConnect() {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">PRIORITY CHANNELS</span>
        </div>
        <div className="priority-list">
          {contactLinks.map((link) => {
            const Icon = link.icon;
            const isEmail = link.id === 'email';

            return (
              <a
                key={link.id}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener' : undefined}
                className="priority-link"
                onClick={isEmail ? (e) => {
                  e.preventDefault();
                  copyToClipboard(link.value, link.id);
                } : undefined}
              >
                <div className="priority-item">
                  <span className="priority-rank">{String(contactLinks.indexOf(link) + 1).padStart(2, '0')}</span>
                  <span className="priority-name">{link.label}</span>
                  <Icon size={14} className={`priority-icon ${link.color}`} />
                  <span className="priority-desc">{copiedId === link.id ? 'COPIED!' : link.description}</span>
                </div>
              </a>
            );
          })}
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
