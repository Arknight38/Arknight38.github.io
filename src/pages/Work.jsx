import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { useUIState } from '@contexts/UIStateContext';
import { writeups, writeupCategories, skills, skillCategories } from '@data';
import { SEO } from '@components/SEO';
import { ArrowUpRight, FileText, Github, Layers, Star, Cpu, Terminal, Database, Wrench, ChevronRight } from 'lucide-react';

// Work Page - /work route
// CENTER: featured project (FOCAL) or skills focal
// Surrounding: grid of smaller project cards or skills panels
// No scrolling
// Clicking project → opens overlay using backgroundLocation pattern

const categoryIcons = {
  languages: Terminal,
  systems: Cpu,
  backend: Database,
  tools: Wrench,
};

export function Work() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // WORK';
  }, []);

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('languages');
  const [view, setView] = useState('projects'); // 'projects' or 'skills'
  const navigate = useNavigate();

  const filteredWriteups = useMemo(() => {
    if (activeFilter === 'all') return writeups;
    return writeups.filter((w) => w.categories?.includes(activeFilter));
  }, [activeFilter]);

  const featuredWriteup = useMemo(() => {
    return filteredWriteups.find(w => w.featured) || filteredWriteups[0];
  }, [filteredWriteups]);

  const otherWriteups = useMemo(() => {
    return filteredWriteups.filter(w => w.id !== featuredWriteup?.id);
  }, [filteredWriteups, featuredWriteup]);

  const activeSkills = useMemo(() => {
    return skills[activeCategory] || [];
  }, [activeCategory]);

  const activeCategoryData = useMemo(() => {
    return skillCategories.find(c => c.id === activeCategory);
  }, [activeCategory]);

  const allSkills = useMemo(() => Object.values(skills).flat(), []);

  const topEvidencedSkills = useMemo(() => {
    return [...allSkills]
      .sort((a, b) => (b.evidence?.length || 0) - (a.evidence?.length || 0))
      .slice(0, 6);
  }, [allSkills]);

  const handleWriteupClick = useCallback((writeup) => {
    navigate(`/writeups/${writeup.id}`);
  }, [navigate]);

  return (
    <>
      <SEO title="Work" description="Project archive — systems, tools, and full-stack builds" pathname="/work" />
      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === 'projects' ? 'active' : ''}`}
          onClick={() => setView('projects')}
        >
          <Layers size={16} />
          <span>PROJECTS</span>
        </button>
        <button
          className={`toggle-btn ${view === 'skills' ? 'active' : ''}`}
          onClick={() => setView('skills')}
        >
          <Cpu size={16} />
          <span>SKILLS</span>
        </button>
      </div>
      {view === 'projects' ? (
        <ThreeZoneLayout
          left={
            <FilterPanel
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          }
          center={
            <FeaturedWriteup
              writeup={featuredWriteup}
              onClick={() => handleWriteupClick(featuredWriteup)}
            />
          }
          right={
            <WriteupGrid
              writeups={otherWriteups}
              onWriteupClick={handleWriteupClick}
            />
          }
        />
      ) : (
        <ThreeZoneLayout
          left={
            <SkillsCategorySelector
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          }
          center={
            <SkillsFocal
              category={activeCategoryData}
              skills={activeSkills}
            />
          }
          right={
            <SkillsOverview topSkills={topEvidencedSkills} />
          }
        />
      )}
    </>
  );
}

// LEFT ZONE - Filter Panel
const FilterPanel = memo(function FilterPanel({ activeFilter, onFilterChange }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Layers size={14} />
          <span className="panel-label">ARCHIVE FILTERS</span>
        </div>
        <div className="filter-list">
          {writeupCategories.map((filter) => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => onFilterChange(filter.id)}
            >
              <span className="filter-indicator" />
              <span className="filter-label">{filter.label.toUpperCase()}</span>
            </button>
          ))}
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
            <span className="stat-value">
              {writeups.filter(w => w.featured).length}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-name">CLOSED</span>
            <span className="stat-value">
              {writeups.filter(w => w.categories?.includes('closed')).length}
            </span>
          </div>
        </div>
      </ZoneCard>
    </div>
  );
});

// CENTER ZONE - Featured Writeup (FOCAL)
const FeaturedWriteup = memo(function FeaturedWriteup({ writeup, onClick }) {
  if (!writeup) return null;

  return (
    <ZoneCard
      variant="focal"
      className="featured-project"
      interactive
      onClick={onClick}
    >
      <div className="featured-badge">
        <Star size={12} />
        <span>FEATURED PROJECT</span>
      </div>

      <div className="featured-header">
        <span className="featured-id">WRT-{writeup.id.toUpperCase()}</span>
        <h2 className="featured-name">{writeup.title}</h2>
      </div>

      <p className="featured-desc">{writeup.subtitle}</p>

      <div className="featured-chips">
        {writeup.tags?.slice(0, 4).map((tag) => (
          <span key={tag} className="featured-chip">
            {tag.toUpperCase()}
          </span>
        ))}
        {writeup.tags?.length > 4 && (
          <span className="featured-chip more">
            +{writeup.tags.length - 4}
          </span>
        )}
      </div>

      <div className="featured-action">
        <FileText size={14} />
        <span>READ WRITEUP</span>
      </div>
    </ZoneCard>
  );
});

// RIGHT ZONE - Writeup Grid
const WriteupGrid = memo(function WriteupGrid({ writeups, onWriteupClick }) {
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
            <ZoneCard
              variant="mid"
              interactive
              onClick={() => onWriteupClick(writeup)}
              className="project-grid-item"
            >
              <div className="grid-item-header">
                <span className="grid-item-id">{writeup.id.toUpperCase()}</span>
                {writeup.featured && (
                  <Star size={10} className="grid-item-star" />
                )}
              </div>
              <h4 className="grid-item-name">{writeup.title}</h4>
              <div className="grid-item-meta">
                <span>{writeup.date}</span>
                <span>·</span>
                <span>{writeup.readTime}</span>
              </div>
            </ZoneCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

// SKILLS COMPONENTS

// LEFT ZONE - Skills Category Selector
const SkillsCategorySelector = memo(function SkillsCategorySelector({ activeCategory, onCategoryChange }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <Cpu size={14} />
          <span className="panel-label">SYSTEM MODULES</span>
        </div>
        <div className="category-list">
          {skillCategories.map((category) => {
            const Icon = categoryIcons[category.id];
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                className={`category-btn ${isActive ? 'active' : ''}`}
                onClick={() => onCategoryChange(category.id)}
              >
                <div className="category-indicator">
                  {isActive && <motion.div layoutId="category-glow" className="category-glow" />}
                </div>
                <Icon size={16} className="category-icon" />
                <span className="category-name">{category.title.toUpperCase()}</span>
                <ChevronRight size={14} className="category-arrow" />
              </button>
            );
          })}
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="system-status">
          <div className="status-header">
            <span className="status-dot online" />
            <span className="status-label">SYSTEM ONLINE</span>
          </div>
          <div className="status-metrics">
            <div className="metric">
              <span className="metric-value">EVIDENCE</span>
              <span className="metric-label">NO ARBITRARY RATINGS</span>
            </div>
            <div className="metric">
              <span className="metric-value">LIVE LINKS</span>
              <span className="metric-label">PROJECTS + WRITEUPS</span>
            </div>
          </div>
        </div>
      </ZoneCard>
    </div>
  );
});

// CENTER ZONE - Skills Focal
const SkillsFocal = memo(function SkillsFocal({ category, skills }) {
  const Icon = categoryIcons[category?.id] || Terminal;

  return (
    <ZoneCard variant="focal" className="skills-focal">
      <div className="focal-header">
        <div className="focal-icon">
          <Icon size={32} />
        </div>
        <div className="focal-title">
          <span className="focal-category">MODULE</span>
          <h2 className="focal-name">{category?.title.toUpperCase()}</h2>
        </div>
      </div>

      <div className="focal-divider" />

      <div className="skills-list-evidence">
        {skills.map((skill) => (
          <div key={skill.id || skill.name} className="skill-evidence-item">
            <div className="skill-evidence-header">
              <span className="skill-name">{skill.name}</span>
              <span className={`skill-status ${skill.status || 'active'}`}>{(skill.status || 'active').toUpperCase()}</span>
            </div>
            <div className="skill-contexts">
              {(skill.contexts || []).map((context) => (
                <span key={context} className="skill-context-chip">{context}</span>
              ))}
            </div>
            <div className="skill-evidence-links">
              {(skill.evidence || []).map((item) => (
                <a
                  key={`${skill.name}-${item.type}-${item.id}`}
                  href={item.type === 'writeup' ? `/writeups/${item.id}` : '/work'}
                  className="skill-evidence-link"
                >
                  {item.type === 'writeup' ? 'WR' : 'PRJ'} · {item.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ZoneCard>
  );
});

// RIGHT ZONE - Skills Overview
const SkillsOverview = memo(function SkillsOverview({ topSkills }) {
  return (
    <div className="zone-content">
      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">MOST EVIDENCED</span>
        </div>
        <div className="top-skills-list-evidence">
          {topSkills.map((skill) => (
            <div key={skill.id || skill.name} className="top-evidence-row">
              <span className="top-evidence-name">{skill.name}</span>
              <span className="top-evidence-count">{skill.evidence?.length || 0} links</span>
            </div>
          ))}
        </div>
      </ZoneCard>

      <ZoneCard variant="mid">
        <div className="panel-header">
          <span className="panel-label">EVIDENCE TYPES</span>
        </div>
        <div className="evidence-legend">
          <span className="legend-chip">WR · Writeup proof</span>
          <span className="legend-chip">PRJ · Project context</span>
          <span className="legend-chip">Contexts describe usage domain</span>
        </div>
      </ZoneCard>

      <ZoneCard variant="background">
        <div className="spec-sheet">
          <h4 className="spec-title">APPROACH</h4>
          <p className="spec-text">
            Evidence-driven capability matrix: no arbitrary proficiency scores.
            Every skill is tied to concrete work.
          </p>
        </div>
      </ZoneCard>
    </div>
  );
});
