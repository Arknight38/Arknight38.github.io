import { useState, useMemo, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThreeZoneLayout, ZoneCard } from '@components/gameui';
import { skills, skillCategories } from '@data';
import { SEO } from '@components/SEO';
import { Link } from 'react-router-dom';
import { Cpu, Terminal, Database, Wrench, ChevronRight } from 'lucide-react';

// Skills Page - /skills route
// CENTER: active stat category (FOCAL)
// Surrounding: grouped stat panels
// Animated stat bars on entry

const categoryIcons = {
  languages: Terminal,
  systems: Cpu,
  backend: Database,
  tools: Wrench,
};


export function Skills() {
  useEffect(() => {
    document.title = 'SYS.ARKNIGHT // SKILLS';
  }, []);

  const [activeCategory, setActiveCategory] = useState('languages');
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

  return (
    <>
      <SEO title="Skills" description="Capability matrix — languages, systems, backend, tools" pathname="/skills" />
      <ThreeZoneLayout
        left={
          <CategorySelector
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
    </>
  );
}

// LEFT ZONE - Category Selector
const CategorySelector = memo(function CategorySelector({ activeCategory, onCategoryChange }) {
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
                <Link
                  key={`${skill.name}-${item.type}-${item.id}`}
                  to={item.type === 'writeup' ? `/writeups/${item.id}` : '/work'}
                  className="skill-evidence-link"
                >
                  {item.type === 'writeup' ? 'WR' : 'PRJ'} · {item.label}
                </Link>
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

