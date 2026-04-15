import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@contexts/ThemeContext';
import { Navbar, Footer, CursorDot } from '@components/layout';
import ErrorBoundary from '@components/ErrorBoundary';
import { Home, Projects, Experience, Writeups, WriteupDetail, Contact, NotFound } from '@pages';

// Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <CursorDot />
      <Navbar />

      <main className="flex-1">
        <PageTransition>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/writeups" element={<Writeups />} />
            <Route path="/writeups/:slug" element={<WriteupDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
