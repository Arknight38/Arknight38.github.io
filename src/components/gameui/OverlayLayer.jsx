import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useUIState } from '@contexts/UIStateContext';
import { projects } from '@data';
import { X } from 'lucide-react';

// OverlayLayer - renders overlays on top of previous route
// Uses React Router location.state (backgroundLocation pattern)
// Closing: navigate(-1)
// Overlays must NOT replace base UI - preserve previous screen state

const overlayVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export function OverlayLayer() {
  const { state, actions } = useUIState();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = useCallback(() => {
    actions.closeOverlay();
    navigate(-1);
  }, [navigate, actions]);

  // Check if we have a background location (overlay state from router)
  const backgroundLocation = location.state?.backgroundLocation;
  const isOverlayOpen = state.overlay.isOpen || backgroundLocation;

  // Get overlay content
  const renderOverlayContent = () => {
    if (state.overlay.content) {
      return state.overlay.content;
    }

    // If using backgroundLocation pattern, render project detail
    if (backgroundLocation && location.pathname.startsWith('/work/')) {
      const projectId = location.pathname.split('/').pop();
      return <ProjectDetailOverlay projectId={projectId} />;
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOverlayOpen && (
        <>
          {/* Backdrop - dims background */}
          <Motion.div
            className="overlay-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />

          {/* Overlay content - has its own scroll */}
          <Motion.div
            className="overlay-container"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              className="overlay-close"
              onClick={handleClose}
              aria-label="Close overlay"
            >
              <X size={20} />
            </button>

            {/* Scrollable content area */}
            <div className="overlay-content">
              {renderOverlayContent()}
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Project detail overlay component
function ProjectDetailOverlay({ projectId }) {
  // Find project from imported data
  const project = useMemo(() => projects.find(p => p.id === projectId), [projectId]);

  if (!project) {
    return (
      <div className="overlay-error">
        <h3>PROJECT NOT FOUND</h3>
        <p>ID: {projectId}</p>
      </div>
    );
  }

  return (
    <div className="project-overlay">
      <header className="project-overlay-header">
        <span className="project-overlay-id">PRJ-{project.id.toUpperCase()}</span>
        <h2 className="project-overlay-title">{project.name}</h2>
      </header>

      <div className="project-overlay-meta">
        {project.languages.map((lang) => (
          <span key={lang} className="project-overlay-lang">
            {lang.toUpperCase()}
          </span>
        ))}
      </div>

      <p className="project-overlay-desc">{project.description}</p>

      <div className="project-overlay-chips">
        {project.chips.map((chip) => (
          <span key={chip} className="project-overlay-chip">
            {chip}
          </span>
        ))}
      </div>

      <div className="project-overlay-actions">
        {project.linkType === 'github' ? (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="overlay-btn primary"
          >
            VIEW SOURCE
          </a>
        ) : (
          <a href={project.link} className="overlay-btn primary">
            READ WRITEUP
          </a>
        )}
      </div>
    </div>
  );
}
