import { useEffect, memo } from 'react';
import { MapPin, Code2, GraduationCap, Trophy } from 'lucide-react';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { SEO } from '@components/SEO';
import { ScrambleText } from '@components/ui';
import profilePicture from '@assets/sad_mizu.jpg';

// Profile Page - /profile route
// LEFT: identity panel
// CENTER: portrait / main identity card (FOCAL)
// RIGHT: stats / dossier

const INTERESTS = [
  { name: 'skiing', link: null },
  { name: 'volleyball', link: null },
  { name: 'gaming', link: 'https://steamcommunity.com/profiles/76561199251411603/' },
  { name: 'anime', link: 'https://myanimelist.net/profile/Arkknight38' },
  { name: 'manga', link: 'https://mangadex.org/user/2d8f11e8-57c3-421a-ab32-56b6af059c44' },
  { name: 'driving', link: null },
];

export function Profile() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // PROFILE';
  }, []);

  return (
    <>
      <SEO title="Profile" description="System profile — Saku Grossarth, Computer Engineer" pathname="/profile" />
      <ThreeZoneLayout
        left={<IdentityPanel />}
        center={<IdentityFocal />}
        right={<StatsPanel />}
      />
    </>
  );
}

// LEFT ZONE - Identity Panel
const IdentityPanel = memo(function IdentityPanel() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">OPERATIVE</span>
        </div>
        <div className="identity-meta">
          <div className="meta-row">
            <MapPin size={14} />
            <span>COLORADO SPRINGS</span>
          </div>
          <div className="meta-row">
            <Code2 size={14} />
            <span>SYSTEMS ENGINEER</span>
          </div>
          <div className="meta-row">
            <GraduationCap size={14} />
            <span>PINE CREEK HIGH</span>
          </div>
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">INTERESTS</span>
        </div>
        <div className="interests-grid">
          {INTERESTS.map((interest) => (
            interest.link ? (
              <a
                key={interest.name}
                href={interest.link}
                target="_blank"
                rel="noopener noreferrer"
                className="interest-tag linked"
              >
                {interest.name}
              </a>
            ) : (
              <span key={interest.name} className="interest-tag">
                {interest.name}
              </span>
            )
          ))}
        </div>
      </ZoneCard>

      <ZoneCard variant="background" className="current-ops">
        <div className="ops-indicator">
          <div className="ops-pulse" />
          <span className="ops-label">CURRENT OPS</span>
        </div>
        <p className="ops-text">
          Deep dive into anticheat reversing and low-level C++/Rust systems
        </p>
      </ZoneCard>
    </div>
  );
});

// CENTER ZONE - Focal Identity Card
const IdentityFocal = memo(function IdentityFocal() {
  return (
    <ZoneCard variant="focal" className="identity-focal">
      <div className="focal-badge">
        <span className="badge-class">RANK 07</span>
        <span className="badge-status">ACTIVE</span>
      </div>

      <div className="focal-portrait">
        <div className="portrait-frame">
          <img src={profilePicture} alt="Profile" className="portrait-image" />
          <div className="portrait-scanline" />
        </div>
      </div>

      <div className="focal-identity">
        <h1 className="focal-name">
          <ScrambleText as="span" className="name-given" text="SAKU" durationMs={550} />
          <ScrambleText as="span" className="name-family" text="GROSSARTH" durationMs={650} />
        </h1>
        <p className="focal-tagline">
          Building things that are interesting from the ground up
        </p>
      </div>

      <div className="focal-divider" />

      <div className="focal-tagline" style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text2)' }}>
        Low-level systems • Kernel development • Reverse engineering
      </div>
    </ZoneCard>
  );
});

// RIGHT ZONE - Stats / Dossier
const StatsPanel = memo(function StatsPanel() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Trophy size={14} />
          <span className="panel-label">ACHIEVEMENTS</span>
        </div>
        <div className="achievements-list">
          <div className="achievement-item">
            <span className="achievement-name">INTERNSHIP WITH R365</span>
            <span className="achievement-detail">Working under Matt Pobst</span>
          </div>
          <div className="achievement-item">
            <span className="achievement-name">FBLA NATIONALS</span>
            <span className="achievement-detail">Coding & Programming</span>
          </div>
          <div className="achievement-item">
            <span className="achievement-name">DISTRICT 1ST PLACE</span>
            <span className="achievement-detail">Coding & Programming</span>
          </div>
          <div className="achievement-item">
            <span className="achievement-name">STATE 1ST PLACE</span>
            <span className="achievement-detail">Coding & Programming</span>
          </div>
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">PRIMARY SYSTEMS</span>
        </div>
        <div className="systems-list">
          <div className="system-tag kernel">KERNEL DRIVERS</div>
          <div className="system-tag hypervisor">HYPERVISORS</div>
          <div className="system-tag rust">RUST SYSTEMS</div>
          <div className="system-tag reverse">REVERSE ENGINEERING</div>
          <div className="system-tag backend">BACKEND / INFRA</div>
          <div className="system-tag memory">MEMORY MGMT</div>
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="dossier-header">
          <span className="dossier-id">DOSSIER-7842</span>
        </div>
        <p className="dossier-text">
          Junior engineer specializing in low-level systems. 
          Experienced in kernel drivers, hypervisors, and binary analysis.
          Self-taught through developer forums and hands-on projects.
        </p>
      </ZoneCard>
    </div>
  );
});
