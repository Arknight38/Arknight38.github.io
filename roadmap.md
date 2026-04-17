# Portfolio Roadmap

## Phase 1: Foundation & Setup

- [x] 1. **Scaffold the React app**
   - Use Vite + React. Run `npm create vite@latest portfolio -- --template react` for fast builds and easy config, which matters for GitHub Pages deployment.

- [x] 2. **Configure GitHub Pages deployment**
   - Install gh-pages. Set base in vite.config.js to your repo name (e.g. /username.github.io or /portfolio). Add deploy scripts to package.json. Do this early before you have a lot of code.

- [x] 3. **Initialize Git repository**
   - Set up .gitignore for Node.js projects (node_modules, dist, .env files). Make your first commit with the scaffolded project.

- [x] 4. **Set up ESLint + Prettier**
   - Configure ESLint with React and hooks plugins. Add Prettier for consistent formatting. Set up pre-commit hooks with husky and lint-staged.

- [x] 5. **Install core dependencies**
   - react-router-dom, framer-motion, lucide-react, clsx, tailwind-merge. These form the backbone of routing, animations, and styling utilities.

- [x] 6. **Configure Tailwind CSS**
   - Install and set up Tailwind with custom color palette matching your design system. Configure the content path in tailwind.config.js.

- [x] 7. **Set up folder structure**
   - Organize src into components/, pages/, hooks/, utils/, styles/, assets/, data/, and contexts/ directories for maintainability.

- [x] 8. **Configure path aliases**
   - Set up Vite resolve aliases (@components, @hooks, @utils, @assets) to avoid relative path hell during imports.

- [x] 9. **Set up environment variables**
   - Create .env.example file. Configure Vite's env prefix. Document all required env vars in README.

- [x] 10. **Install testing dependencies**
    - Add Vitest, React Testing Library, and JSDOM. Create basic test setup file and a sample component test.

---

## Phase 2: Core Architecture

- [x] 11. **Set up React Router**
    - Install react-router-dom. Use HashRouter instead of BrowserRouter — GitHub Pages doesn't support server-side routing, so hash-based routing is required for direct links to work.

- [x] 12. **Port your global styles**
    - Move style.css into the project. Convert your CSS variables to a :root block in a global.css. Keep the Lora/Epilogue/DM Mono font imports.

- [x] 13. **Create ThemeContext**
    - Set up light/dark theme via a ThemeContext and store preference in localStorage. Add system preference detection and theme toggle component.

- [x] 14. **Build useMediaQuery hook**
    - Create a custom hook for responsive design that listens to media query changes. Essential for mobile-first components.

- [x] 15. **Build useLocalStorage hook**
    - Abstract localStorage operations with JSON serialization and error handling for theme, filters, and other persistent UI state.

- [x] 16. **Build useScrollLock hook**
    - Prevent body scroll when modals or mobile menus are open. Handle iOS Safari's scroll behavior quirks.

- [x] 17. **Create ErrorBoundary**
    - Implement an error boundary component to gracefully handle runtime errors without crashing the entire app.

- [x] 18. **Set up loading states**
    - Create skeleton components and loading spinners for async data fetching. Match the skeleton to your layout to prevent layout shift.

---

## Phase 3: Shared Components

- [x] 19. **Build Navbar component**
    - Port scroll behavior, active link detection from main.js. Add mobile hamburger menu with slide-in animation.

- [x] 20. **Build Footer component**
    - Include social links, copyright, and a back-to-top button. Keep it minimal and consistent across pages.

- [x] 21. **Build CursorDot component**
    - Port cursor logic from main.js into useEffect hooks. Add hover state detection and smooth trailing animation.

- [x] 22. **Build Button component**
    - Create a reusable button with variants (primary, secondary, ghost, icon), sizes, and loading state. Use forwardRef for flexibility.

- [x] 23. **Build Card component**
    - Generic card component with hover effects, shadows, and consistent padding. Used for projects, experience items, and writeups.

- [x] 24. **Build Tag/Badge component**
    - Small colored labels for technologies, categories, and statuses. Include color variants matching your design system.

- [x] 25. **Build Modal/Dialog component**
    - Accessible modal with focus trapping, escape key handling, and backdrop click-to-close. Use for writeup previews or image lightboxes.

- [x] 26. **Build Accordion component**
    - Expandable sections for FAQs or detailed experience descriptions. Animate height changes smoothly.

- [x] 27. **Build Tooltip component**
    - Position-aware tooltips using floating-ui. Show hints for navigation items and icon buttons.

- [x] 28. **Build ScrollProgress component**
    - Thin progress bar at top of viewport showing scroll progress. Especially useful for writeup pages.

- [x] 29. **Build Image component with lazy loading**
    - Wrap native img with intersection observer for lazy loading. Add blur-up placeholder effect.

- [x] 30. **Build IconButton component**
    - Circular buttons for social links and actions. Include hover scale and ripple effects.

---

## Phase 4: Page Components

- [x] 31. **Build Home page** (replaced by Profile)
    - Hero section with name, tagline, and CTA. Quick stats or highlights. Recent projects preview.

- [x] 32. **Build Projects page** (replaced by Work)
    - Grid layout with filter by category/technology. Search functionality. Sort by date or name.

- [x] 33. **Build ProjectCard component**
    - Thumbnail, title, description, tech stack tags, and links. Hover reveals additional actions.

- [x] 34. **Build ProjectDetail page** (overlay version)
    - Full project writeup with image gallery, tech stack breakdown, challenges faced, and lessons learned.

- [x] 35. **Build Experience page** (integrated into Work/Profile)
    - Timeline or list view of work history. Include company, role, dates, and key achievements.

- [x] 36. **Build ExperienceCard component**
    - Consistent formatting for each role with expandable details for responsibilities and accomplishments.

- [x] 37. **Build Writeups index page**
    - List all 16 writeups with excerpts, categories, and reading time. Include search and filter.

- [x] 38. **Build WriteupDetail page**
    - Full markdown rendering with syntax highlighting. Table of contents sidebar. Next/previous navigation.

- [x] 39. **Build WriteupCard component**
    - Preview card with title, date, category, and excerpt. Click through to full writeup.

- [x] 40. **Build Contact page**
    - Contact form with validation. Social links. Email copy-to-clipboard functionality.

- [x] 41. **Build ContactForm component** (integrated)
    - Fields for name, email, subject, message. Client-side validation with error messages.

- [x] 42. **Build About page** (Profile)
    - Bio, skills visualization (skill bars or tag cloud), education, certifications.

- [x] 43. **Build SkillBadge component**
    - Visual representation of proficiency level for each skill.

- [x] 44. **Build 404 page**
    - Custom not-found page with navigation back home and maybe a fun animation or illustration.

- [x] 45. **Build ComingSoon page**
    - Placeholder for pages under construction. Include email signup for notifications if relevant.

---

## Phase 5: Animation & Polish

- [x] 46. **Port the scroll reveal logic**
    - Convert the IntersectionObserver from main.js into a custom hook useReveal.js. Apply it to any element that needs the fade-in animation.

- [x] 47. **Add page transitions**
    - Use framer-motion with AnimatePresence wrapping your routes. Slide or fade between pages. Keep transitions under 300ms.

- [x] 48. **Implement stagger animations**
    - Cards and list items should animate in with staggered delays for a polished, orchestrated feel.

- [x] 49. **Add hover micro-interactions**
    - Subtle scale, shadow, and color transitions on interactive elements. Use transform over position for performance.

- [x] 50. **Create parallax effects**
    - Gentle parallax on hero images and background elements. Don't overdo it—subtlety is key.

- [x] 51. **Implement scroll-linked animations**
    - Progress bars, color changes, or element reveals tied to scroll position using useScroll from framer-motion.

- [x] 52. **Add skeleton loading states**
    - Replace spinner loaders with content-matching skeletons to reduce perceived wait time.

- [x] 53. **Implement reduced motion support**
    - Respect prefers-reduced-motion by disabling or simplifying animations for accessibility.

- [x] 54. **Add keyboard navigation**
    - Ensure all interactive elements are keyboard accessible. Visible focus indicators matching your theme.

- [x] 55. **Create text scramble effect**
    - Matrix/Arknights-inspired text reveal on headings or navigation.

---

## Phase 6: Data & Content

- [x] 56. **Create projects data file**
    - Structure all project data in a projects.js array. Include title, description, tech stack, links, images, and category.

- [x] 57. **Create experience data file**
    - Structure work history in experience.js with company, role, dates, description, and achievements array.

- [x] 58. **Create writeups data file**
    - Store all 16 writeups as structured data in writeups.js. Include slug, title, date, category, tags, and content.

- [x] 59. **Create skills data file**
    - Centralize skills list with categories, proficiency levels, and icons. Easy to update as you learn.

- [x] 60. **Build content utility functions**
    - Helper functions to filter, sort, and search through your data arrays.

- [x] 61. **Add reading time calculation**
    - Utility to estimate reading time based on word count. Display on writeup cards and detail pages.

- [x] 62. **Generate slugs from titles**
    - Utility function to create URL-friendly slugs from writeup and project titles.

- [x] 65. **Implement related content suggestions**
    - Show related writeups at the bottom of each writeup based on shared tags or categories.

---

## Phase 7: Performance

- [x] 66. **Implement code splitting**
    - Use React.lazy() and Suspense to split routes into separate chunks. Faster initial load.

- [x] 67. **Optimize font loading**
    - Use font-display: swap. Preload critical fonts. Consider subsetting to reduce file size.

68. **Add service worker for caching**
    - Use Vite PWA plugin or manual Workbox setup. Cache static assets and writeup content.

70. **Implement virtual scrolling for lists**
    - If writeup list grows large, use react-window or similar for smooth scrolling performance.

71. **Audit bundle size**
    - Run npm run build and analyze with rollup-plugin-visualizer. Remove unused dependencies.

73. **Add preconnect hints**
    - Add <link rel="preconnect"> for external domains (fonts, analytics) to reduce connection overhead.

74. **Implement prefetching**
    - Prefetch route chunks on hover or when idle for instant navigation.

75. **Optimize CSS**
    - Purge unused Tailwind classes in production. Minimize custom CSS to critical above-fold styles.

---

## Phase 8: SEO & Meta

- [x] 76. **Add react-helmet-async**
    - Dynamic title and meta tags for each page. Essential for SEO and social sharing.

- [x] 77. **Create SEO component**
    - Reusable component for title, description, og:image, twitter:card, canonical URL, and structured data.

- [x] 78. **Generate sitemap.xml**
    - Script to generate sitemap including all pages and writeups. Submit to Google Search Console.

- [x] 79. **Add robots.txt**
    - Allow all important pages, disallow admin or draft pages if they exist.


## Phase 12: Content & Maintenance

111. **Write welcome blog post**
     - First writeup about the portfolio redesign. Share your process and decisions.

112. **Document component library**
     - Storybook or simple markdown docs for your custom components. Helps future you.

113. **Write README.md**
     - Comprehensive documentation on setup, development, deployment, and project structure.

116. **Style guide documentation**
     - Document colors, typography, spacing, and component usage patterns.

117. **Plan content calendar**
     - Schedule regular writeups (weekly/bi-weekly) to keep portfolio active.

118. **Create project case study template**
     - Standard format for documenting future projects consistently.

---

## Bonus Ideas

121. **Dark mode toggle animation** — Sun/moon icon morphing with rotation
122. **Command palette** — Cmd+K to search and navigate to any page or writeup
123. **Reading progress bar** — Visual indicator on writeup detail pages
126. **Estimated read time** — Display minutes to read on cards and detail
127. **Tags cloud visualization** — Interactive tag browsing with size by frequency
128. **Guestbook/Guest comments** — Simple comment system or guestbook page
129. **Now page** — What you're currently working on, reading, listening to
130. **Uses page** — Hardware and software setup, tools, and workflow
131. **Bookshelf page** — Books you've read with ratings and notes
132. **Projects by year** — Archive view grouping projects by completion year
133. **HUD quick links** — Add top-bar shortcuts for Now, Uses, and Bookshelf pages

---

## Style Goals

- **Marathon UI**: Generous whitespace, clean typography, restrained color
- **Arknights UX**: Sharp asymmetric layouts, subtle scan-line or grid texture accents, deliberate hover states
- **Achievement**: All through CSS — no heavy UI libraries needed