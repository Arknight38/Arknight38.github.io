import { useEffect } from 'react';
import { Cpu, BookOpenText, Headphones, Star, NotebookText, User } from 'lucide-react';
import { SEO } from '@components/SEO';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { LastFMTrack } from '@components/shared/LastFMTrack';
import { DiscordStatus } from '@components/shared/DiscordStatus';

const BOOKS = [
  { title: 'Clean Architecture', note: 'Great boundaries and system shape.', rating: '4.5/5' },
  { title: 'Designing Data-Intensive Applications', note: 'Strong mental model for backend systems.', rating: '5/5' },
  { title: 'Pragmatic Programmer', note: 'Solid habits and practical engineering advice.', rating: '4/5' },
];

export function Now() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // NOW';
  }, []);

  return (
    <>
      <SEO title="Now" description="What I am currently working on, reading, and listening to." pathname="/now" />
      <ThreeZoneLayout left={<NowWork />} center={<NowFocus />} right={<NowMedia />} />
    </>
  );
}

function NowWork() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Cpu size={14} />
          <span className="panel-label">CURRENT WORK</span>
        </div>
        <ul className="mini-list">
          <li>Refining UI system and reusable components</li>
          <li>Expanding writeups with cleaner metadata</li>
          <li>Iterating on faster content loading paths</li>
        </ul>
      </ZoneCard>
    </div>
  );
}

function NowFocus() {
  return (
    <ZoneCard variant="focal" className="status-focal">
      <h1 className="status-focal-title">NOW</h1>
      <p className="status-focal-text">
        Building this portfolio into a polished, game-inspired system with better discoverability and stronger
        project storytelling.
      </p>
    </ZoneCard>
  );
}

function NowMedia() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <BookOpenText size={14} />
          <span className="panel-label">READING</span>
        </div>
        <ul className="mini-list">
          <li>Windows internals topics</li>
          <li>Systems architecture notes</li>
        </ul>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <NotebookText size={14} />
          <span className="panel-label">BOOKSHELF</span>
        </div>
        <div className="book-list">
          {BOOKS.map((book) => (
            <div key={book.title} className="book-item">
              <div className="book-title-row">
                <span className="book-title">{book.title}</span>
                <span className="book-rating">
                  <Star size={12} />
                  {book.rating}
                </span>
              </div>
              <p className="book-note">{book.note}</p>
            </div>
          ))}
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Headphones size={14} />
          <span className="panel-label">LISTENING</span>
        </div>
        <LastFMTrack />
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <User size={14} />
          <span className="panel-label">DISCORD</span>
        </div>
        <DiscordStatus />
      </ZoneCard>
    </div>
  );
}
