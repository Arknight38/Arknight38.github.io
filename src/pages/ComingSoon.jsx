import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ZoneCard } from '@components/gameui';
import { SEO } from '@components/SEO';

export function ComingSoon() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // CONSTRUCTING';
  }, []);

  return (
    <div className="zone-layout-shell">
      <SEO title="Coming Soon" description="This section is still under construction." pathname="/coming-soon" />
      <div className="zone-main-content !grid-cols-1">
        <ZoneCard variant="focal" className="max-w-[720px] mx-auto my-10">
          <div className="panel-header mb-3">
            <span className="panel-label">UNDER CONSTRUCTION</span>
          </div>
          <h1 className="text-3xl text-[var(--text)] mb-3" style={{ fontFamily: 'var(--serif)' }}>
            Coming soon
          </h1>
          <p className="text-[var(--text2)] mb-6">
            This section is planned in the roadmap and will be available in an upcoming update.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text2)] hover:border-[var(--rose)] hover:text-[var(--rose)]"
          >
            Back to profile
          </Link>
        </ZoneCard>
      </div>
    </div>
  );
}
