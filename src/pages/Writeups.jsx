import { useState, useEffect, useMemo, memo } from 'react';
import { Search, Clock, ArrowRight, FileText, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { writeups, writeupCategories as categories } from '@data/writeups';
import { SEO } from '@components/SEO';

export function Writeups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // WRITEUPS';
  }, []);

  const filteredWriteups = useMemo(() => {
    return writeups.filter((w) => {
      const writeupCategories = w.categories || [w.category];
      const matchesCategory = activeCategory === 'all' || writeupCategories.includes(activeCategory);
      const excerptText = w.excerpt || w.subtitle || '';
      const matchesSearch =
        searchQuery === '' ||
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        excerptText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredWriteup = filteredWriteups.find((w) => w.featured);
  const regularWriteups = filteredWriteups.filter((w) => !w.featured);

  return (
    <>
      <SEO title="Writeups" description="Technical deep dives and writeups" pathname="/writeups" />
      <ThreeZoneLayout
        left={
          <CategoryPanel
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        }
        center={
          <FeaturedWriteup writeup={featuredWriteup} />
        }
        right={
          <WriteupArchive writeups={regularWriteups} />
        }
      />
    </>
  );
}

// LEFT ZONE - Category Filter & Search
const CategoryPanel = memo(function CategoryPanel({ activeCategory, onCategoryChange, searchQuery, onSearchChange }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Tag size={14} />
          <span className="panel-label">CATEGORIES</span>
        </div>
        <div className="filter-list">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              <div className="filter-indicator" />
              <span className="filter-name">{cat.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <Search size={14} />
          <span className="panel-label">SEARCH</span>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Filter entries..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="archive-stats">
          <div className="stat-row">
            <span className="stat-name">TOTAL</span>
            <span className="stat-value">{writeups.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-name">FEATURED</span>
            <span className="stat-value">{writeups.filter(w => w.featured).length}</span>
          </div>
        </div>
      </ZoneCard>
    </div>
  );
});

// CENTER ZONE - Featured Writeup
const FeaturedWriteup = memo(function FeaturedWriteup({ writeup }) {
  if (!writeup) return null;

  return (
    <ZoneCard variant="focal" className="featured-project">
      <div className="featured-badge">
        <FileText size={12} />
        <span>FEATURED WRITEUP</span>
      </div>

      <div className="featured-header">
        <span className="featured-id">WRT-{writeup.id.toUpperCase()}</span>
        <h2 className="featured-name">{writeup.title}</h2>
      </div>

      <p className="featured-desc">{writeup.subtitle || writeup.excerpt}</p>

      <div className="featured-chips">
        {writeup.tags?.slice(0, 4).map((tag) => (
          <span key={tag} className="featured-chip">
            {tag.toUpperCase()}
          </span>
        ))}
      </div>

      <Link to={`/writeups/${writeup.id}`} className="featured-action no-underline">
        <FileText size={14} />
        <span>READ WRITEUP</span>
      </Link>
    </ZoneCard>
  );
});

// RIGHT ZONE - Writeup Archive
const WriteupArchive = memo(function WriteupArchive({ writeups }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid" className="project-grid-header">
        <span className="panel-label">ARCHIVE ENTRIES</span>
        <span className="grid-count">{writeups.length}</span>
      </ZoneCard>

      <div className="project-grid">
        {writeups.map((writeup, index) => (
          <motion.div
            key={writeup.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            <Link to={`/writeups/${writeup.id}`} className="no-underline">
              <ZoneCard variant="mid" interactive className="project-grid-item">
                <div className="grid-item-header">
                  <span className="grid-item-id">{writeup.id.toUpperCase()}</span>
                  {writeup.featured && <FileText size={10} className="grid-item-star" />}
                </div>
                <h4 className="grid-item-name">{writeup.title}</h4>
                <div className="grid-item-meta">
                  <span>{writeup.date}</span>
                  <span>·</span>
                  <span>{writeup.readTime}</span>
                </div>
              </ZoneCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
