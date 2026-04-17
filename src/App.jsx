import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@contexts/ThemeContext';
import { UIStateProvider } from '@contexts/UIStateContext';
import { AppShell } from '@components/gameui';
import ErrorBoundary from '@components/ErrorBoundary';
import { PageSkeleton } from '@components/ui';

const Profile = lazy(() => import('@pages/Profile').then((m) => ({ default: m.Profile })));
const Work = lazy(() => import('@pages/Work').then((m) => ({ default: m.Work })));
const Contact = lazy(() => import('@pages/Contact').then((m) => ({ default: m.Contact })));
const Now = lazy(() => import('@pages/Now').then((m) => ({ default: m.Now })));
const ComingSoon = lazy(() => import('@pages/ComingSoon').then((m) => ({ default: m.ComingSoon })));
const Writeups = lazy(() => import('@pages/Writeups').then((m) => ({ default: m.Writeups })));
const WriteupDetail = lazy(() => import('@pages/WriteupDetail').then((m) => ({ default: m.WriteupDetail })));
const NotFound = lazy(() => import('@pages/NotFound').then((m) => ({ default: m.NotFound })));

// Layout component that wraps all routes with AppShell and AnimatedRouteView
function GameLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

// Game-like UI App Structure
// AppShell NEVER unmounts - persistent HUD and Navigation
// Routes render inside AnimatedRouteView with transitions via the layout

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <UIStateProvider>
            <HashRouter>
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route element={<GameLayout />}>
                    <Route path="/" element={<Profile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/work" element={<Work />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/now" element={<Now />} />
                    <Route path="/coming-soon" element={<ComingSoon />} />
                    <Route path="/writeups" element={<Writeups />} />
                    <Route path="/writeups/:slug" element={<WriteupDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </HashRouter>
          </UIStateProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
