import { useEffect } from 'react';
import { BookOpen, Star, NotebookText } from 'lucide-react';
import { SEO } from '@components/SEO';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';

const BOOKS = [
  { title: 'Clean Architecture', note: 'Great boundaries and system shape.', rating: '4.5/5' },
  { title: 'Designing Data-Intensive Applications', note: 'Strong mental model for backend systems.', rating: '5/5' },
  { title: 'Pragmatic Programmer', note: 'Solid habits and practical engineering advice.', rating: '4/5' },
];

export function Bookshelf() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // BOOKSHELF';
  }, []);

  return (
    <>
      <SEO title="Bookshelf" description="Books read with ratings and notes." pathname="/bookshelf" />
      <ThreeZoneLayout left={<ShelfInfo />} center={<ShelfFocus />} right={<ShelfList />} />
    </>
  );
}

function ShelfInfo() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <BookOpen size={14} />
          <span className="panel-label">SHELF STATUS</span>
        </div>
        <ul className="mini-list">
          <li>{BOOKS.length} highlighted reads</li>
          <li>Focus: systems and engineering craft</li>
          <li>Notes captured for future projects</li>
        </ul>
      </ZoneCard>
    </div>
  );
}

function ShelfFocus() {
  return (
    <ZoneCard variant="focal" className="status-focal">
      <h1 className="status-focal-title">BOOKSHELF</h1>
      <p className="status-focal-text">
        A running list of books that directly shaped how I design systems, structure code, and think about trade-offs.
      </p>
    </ZoneCard>
  );
}

function ShelfList() {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <NotebookText size={14} />
          <span className="panel-label">READS + NOTES</span>
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
    </div>
  );
}
