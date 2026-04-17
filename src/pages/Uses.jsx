import { useEffect } from 'react';
import { Monitor, Wrench, Workflow } from 'lucide-react';
import { SEO } from '@components/SEO';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';

export function Uses() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // USES';
  }, []);

  return (
    <>
      <SEO title="Uses" description="Hardware, software, and workflow setup." pathname="/uses" />
      <ThreeZoneLayout left={<HardwarePanel />} center={<UsesFocus />} right={<SoftwarePanel />} />
    </>
  );
}

function HardwarePanel() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Monitor size={14} />
          <span className="panel-label">HARDWARE</span>
        </div>
        <ul className="mini-list">
          <li>Main development workstation</li>
          <li>Secondary display for docs/debugging</li>
          <li>Mechanical keyboard + lightweight mouse</li>
        </ul>
      </ZoneCard>
    </div>
  );
}

function UsesFocus() {
  return (
    <ZoneCard variant="focal" className="status-focal">
      <h1 className="status-focal-title">USES</h1>
      <p className="status-focal-text">
        Minimal tooling, predictable workflows, and repeatable project structure focused on fast iteration.
      </p>
    </ZoneCard>
  );
}

function SoftwarePanel() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Wrench size={14} />
          <span className="panel-label">SOFTWARE</span>
        </div>
        <ul className="mini-list">
          <li>Cursor + VS Code ecosystem</li>
          <li>GitHub, npm, and Vite-based workflow</li>
          <li>Figma + Excalidraw for planning</li>
        </ul>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Workflow size={14} />
          <span className="panel-label">WORKFLOW</span>
        </div>
        <ul className="mini-list">
          <li>Spec first, implement second</li>
          <li>Component-driven UI iteration</li>
          <li>Fast validate loop with lint + preview</li>
        </ul>
      </ZoneCard>
    </div>
  );
}
