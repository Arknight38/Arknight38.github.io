# Portfolio Roadmap

## Phase 1: Foundation & Setup

1. **Scaffold the React app**
   - Use Vite + React. Run `npm create vite@latest portfolio -- --template react` for fast builds and easy config, which matters for GitHub Pages deployment.

2. **Configure GitHub Pages deployment**
   - Install gh-pages. Set base in vite.config.js to your repo name (e.g. /username.github.io or /portfolio). Add deploy scripts to package.json. Do this early before you have a lot of code.

3. **Initialize Git repository**
   - Set up .gitignore for Node.js projects (node_modules, dist, .env files). Make your first commit with the scaffolded project.

4. **Set up ESLint + Prettier**
   - Configure ESLint with React and hooks plugins. Add Prettier for consistent formatting. Set up pre-commit hooks with husky and lint-staged.

5. **Install core dependencies**
   - react-router-dom, framer-motion, lucide-react, clsx, tailwind-merge. These form the backbone of routing, animations, and styling utilities.

6. **Configure Tailwind CSS**
   - Install and set up Tailwind with custom color palette matching your design system. Configure the content path in tailwind.config.js.

7. **Set up folder structure**
   - Organize src into components/, pages/, hooks/, utils/, styles/, assets/, data/, and contexts/ directories for maintainability.

8. **Configure path aliases**
   - Set up Vite resolve aliases (@components, @hooks, @utils, @assets) to avoid relative path hell during imports.

9. **Set up environment variables**
   - Create .env.example file. Configure Vite's env prefix. Document all required env vars in README.

10. **Install testing dependencies**
    - Add Vitest, React Testing Library, and JSDOM. Create basic test setup file and a sample component test.

---

## Phase 2: Core Architecture

11. **Set up React Router**
    - Install react-router-dom. Use HashRouter instead of BrowserRouter — GitHub Pages doesn't support server-side routing, so hash-based routing is required for direct links to work.

12. **Port your global styles**
    - Move style.css into the project. Convert your CSS variables to a :root block in a global.css. Keep the Lora/Epilogue/DM Mono font imports.

13. **Create ThemeContext**
    - Set up light/dark theme via a ThemeContext and store preference in localStorage. Add system preference detection and theme toggle component.

14. **Build useMediaQuery hook**
    - Create a custom hook for responsive design that listens to media query changes. Essential for mobile-first components.

15. **Build useLocalStorage hook**
    - Abstract localStorage operations with JSON serialization and error handling for theme, filters, and other persistent UI state.

16. **Build useScrollLock hook**
    - Prevent body scroll when modals or mobile menus are open. Handle iOS Safari's scroll behavior quirks.

17. **Create ErrorBoundary**
    - Implement an error boundary component to gracefully handle runtime errors without crashing the entire app.

18. **Set up loading states**
    - Create skeleton components and loading spinners for async data fetching. Match the skeleton to your layout to prevent layout shift.

---

## Phase 3: Shared Components

19. **Build Navbar component**
    - Port scroll behavior, active link detection from main.js. Add mobile hamburger menu with slide-in animation.

20. **Build Footer component**
    - Include social links, copyright, and a back-to-top button. Keep it minimal and consistent across pages.

21. **Build CursorDot component**
    - Port cursor logic from main.js into useEffect hooks. Add hover state detection and smooth trailing animation.

22. **Build Button component**
    - Create a reusable button with variants (primary, secondary, ghost, icon), sizes, and loading state. Use forwardRef for flexibility.

23. **Build Card component**
    - Generic card component with hover effects, shadows, and consistent padding. Used for projects, experience items, and writeups.

24. **Build Tag/Badge component**
    - Small colored labels for technologies, categories, and statuses. Include color variants matching your design system.

25. **Build Modal/Dialog component**
    - Accessible modal with focus trapping, escape key handling, and backdrop click-to-close. Use for writeup previews or image lightboxes.

26. **Build Accordion component**
    - Expandable sections for FAQs or detailed experience descriptions. Animate height changes smoothly.

27. **Build Tooltip component**
    - Position-aware tooltips using floating-ui. Show hints for navigation items and icon buttons.

28. **Build ScrollProgress component**
    - Thin progress bar at top of viewport showing scroll progress. Especially useful for writeup pages.

29. **Build Image component with lazy loading**
    - Wrap native img with intersection observer for lazy loading. Add blur-up placeholder effect.

30. **Build IconButton component**
    - Circular buttons for social links and actions. Include hover scale and ripple effects.

---

## Phase 4: Page Components

31. **Build Home page**
    - Hero section with name, tagline, and CTA. Quick stats or highlights. Recent projects preview.

32. **Build Projects page**
    - Grid layout with filter by category/technology. Search functionality. Sort by date or name.

33. **Build ProjectCard component**
    - Thumbnail, title, description, tech stack tags, and links. Hover reveals additional actions.

34. **Build ProjectDetail page**
    - Full project writeup with image gallery, tech stack breakdown, challenges faced, and lessons learned.

35. **Build Experience page**
    - Timeline or list view of work history. Include company, role, dates, and key achievements.

36. **Build ExperienceCard component**
    - Consistent formatting for each role with expandable details for responsibilities and accomplishments.

37. **Build Writeups index page**
    - List all 16 writeups with excerpts, categories, and reading time. Include search and filter.

38. **Build WriteupDetail page**
    - Full markdown rendering with syntax highlighting. Table of contents sidebar. Next/previous navigation.

39. **Build WriteupCard component**
    - Preview card with title, date, category, and excerpt. Click through to full writeup.

40. **Build Contact page**
    - Contact form with validation. Social links. Email copy-to-clipboard functionality.

41. **Build ContactForm component**
    - Fields for name, email, subject, message. Client-side validation with error messages.

42. **Build About page**
    - Bio, skills visualization (skill bars or tag cloud), education, certifications.

43. **Build SkillBadge component**
    - Visual representation of proficiency level for each skill.

44. **Build 404 page**
    - Custom not-found page with navigation back home and maybe a fun animation or illustration.

45. **Build ComingSoon page**
    - Placeholder for pages under construction. Include email signup for notifications if relevant.

---

## Phase 5: Animation & Polish

46. **Port the scroll reveal logic**
    - Convert the IntersectionObserver from main.js into a custom hook useReveal.js. Apply it to any element that needs the fade-in animation.

47. **Add page transitions**
    - Use framer-motion with AnimatePresence wrapping your routes. Slide or fade between pages. Keep transitions under 300ms.

48. **Implement stagger animations**
    - Cards and list items should animate in with staggered delays for a polished, orchestrated feel.

49. **Add hover micro-interactions**
    - Subtle scale, shadow, and color transitions on interactive elements. Use transform over position for performance.

50. **Create parallax effects**
    - Gentle parallax on hero images and background elements. Don't overdo it—subtlety is key.

51. **Implement scroll-linked animations**
    - Progress bars, color changes, or element reveals tied to scroll position using useScroll from framer-motion.

52. **Add skeleton loading states**
    - Replace spinner loaders with content-matching skeletons to reduce perceived wait time.

53. **Implement reduced motion support**
    - Respect prefers-reduced-motion by disabling or simplifying animations for accessibility.

54. **Add keyboard navigation**
    - Ensure all interactive elements are keyboard accessible. Visible focus indicators matching your theme.

55. **Create text scramble effect**
    - Matrix/Arknights-inspired text reveal on headings or navigation. Optional but adds character.

---

## Phase 6: Data & Content

56. **Create projects data file**
    - Structure all project data in a projects.js array. Include title, description, tech stack, links, images, and category.

57. **Create experience data file**
    - Structure work history in experience.js with company, role, dates, description, and achievements array.

58. **Create writeups data file**
    - Store all 16 writeups as structured data in writeups.js. Include slug, title, date, category, tags, and content.

59. **Create skills data file**
    - Centralize skills list with categories, proficiency levels, and icons. Easy to update as you learn.

60. **Build content utility functions**
    - Helper functions to filter, sort, and search through your data arrays.

61. **Add reading time calculation**
    - Utility to estimate reading time based on word count. Display on writeup cards and detail pages.

62. **Generate slugs from titles**
    - Utility function to create URL-friendly slugs from writeup and project titles.

63. **Create markdown renderer**
    - Set up react-markdown with remark-gfm for tables and syntax highlighting via prism-react-renderer.

64. **Add image optimization workflow**
    - Script or GitHub Action to optimize and resize images before deployment. WebP conversion with fallbacks.

65. **Implement related content suggestions**
    - Show related writeups at the bottom of each writeup based on shared tags or categories.

---

## Phase 7: Performance

66. **Implement code splitting**
    - Use React.lazy() and Suspense to split routes into separate chunks. Faster initial load.

67. **Optimize font loading**
    - Use font-display: swap. Preload critical fonts. Consider subsetting to reduce file size.

68. **Add service worker for caching**
    - Use Vite PWA plugin or manual Workbox setup. Cache static assets and writeup content.

69. **Optimize images**
    - Convert to WebP/AVIF. Use responsive images with srcset. Lazy load below-the-fold images.

70. **Implement virtual scrolling for lists**
    - If writeup list grows large, use react-window or similar for smooth scrolling performance.

71. **Audit bundle size**
    - Run npm run build and analyze with rollup-plugin-visualizer. Remove unused dependencies.

72. **Optimize framer-motion imports**
    - Import specific features rather than entire package. Tree-shaking helps but explicit imports are safer.

73. **Add preconnect hints**
    - Add <link rel="preconnect"> for external domains (fonts, analytics) to reduce connection overhead.

74. **Implement prefetching**
    - Prefetch route chunks on hover or when idle for instant navigation.

75. **Optimize CSS**
    - Purge unused Tailwind classes in production. Minimize custom CSS to critical above-fold styles.

---

## Phase 8: SEO & Meta

76. **Add react-helmet-async**
    - Dynamic title and meta tags for each page. Essential for SEO and social sharing.

77. **Create SEO component**
    - Reusable component for title, description, og:image, twitter:card, canonical URL, and structured data.

78. **Generate sitemap.xml**
    - Script to generate sitemap including all pages and writeups. Submit to Google Search Console.

79. **Add robots.txt**
    - Allow all important pages, disallow admin or draft pages if they exist.

80. **Implement Open Graph images**
    - Design and generate OG images for homepage, projects, and writeups. 1200x630 dimensions.

81. **Add structured data (JSON-LD)**
    - Schema.org Person markup for personal info. Article markup for writeups.

82. **Create favicon set**
    - Generate favicon.ico, apple-touch-icon, and manifest.json for PWA support. Multiple sizes and formats.

83. **Add Twitter Cards meta**
    - summary_large_image cards for writeups when shared on Twitter/X.

84. **Implement canonical URLs**
    - Prevent duplicate content issues with proper canonical links on every page.

85. **Add RSS feed generation**
    - Generate feed.xml for writeups. Helps with syndication and discoverability.

---

## Phase 9: Testing & QA

86. **Write unit tests for hooks**
    - Test useLocalStorage, useMediaQuery, useReveal with React Testing Library and mock implementations.

87. **Write component tests**
    - Test Button, Card, Navbar, Footer for rendering and interaction. Mock router context.

88. **Write page integration tests**
    - Test full page rendering with mocked data. Verify routing between pages works correctly.

89. **Add E2E tests with Playwright**
    - Test critical user flows: navigation, theme toggle, mobile menu, contact form submission.

90. **Test accessibility with axe**
    - Run automated a11y tests. Fix any color contrast, heading order, or focus management issues.

91. **Cross-browser testing**
    - Test on Chrome, Firefox, Safari, Edge. Verify smooth scrolling and animation behavior.

92. **Mobile responsiveness testing**
    - Test on various viewport sizes. Verify touch targets are large enough (44x44px minimum).

93. **Performance testing**
    - Run Lighthouse audits. Aim for 90+ on Performance, Accessibility, Best Practices, SEO.

94. **Test deployment preview**
    - Deploy to a test branch or staging environment before main deployment.

95. **Validate HTML**
    - Use W3C validator on built HTML. Fix any structural or semantic issues.

---

## Phase 10: Deployment & DevOps

96. **Set up GitHub Actions**
    - Workflow to run tests, linting, and type checking on every push and PR.

97. **Configure automated deployment**
    - GitHub Action to deploy to gh-pages on push to main branch. Include proper git config.

98. **Add branch protection rules**
    - Require PR reviews and passing CI before merging to main. Prevent direct pushes.

99. **Set up Dependabot**
    - Automated dependency updates. Review and merge security patches quickly.

100. **Configure caching in CI**
     - Cache node_modules and build cache between runs for faster CI times.

101. **Add build status badge**
     - Display CI status and deployment status in README.md.

102. **Deploy and test manually**
     - Run npm run deploy. Check every route works via the hash URLs. Test dark mode, cursor, scroll reveal, and mobile layout.

103. **Verify CV PDF link**
     - Put the PDF in /public so Vite copies it to the build output. Test download works correctly.

104. **Test form submissions**
     - Verify contact form submission handling. Test with Formspree, Netlify Forms, or custom backend.

105. **Set up the custom domain (optional)**
     - If you want sakugrossarth.dev instead of username.github.io, add a CNAME file to /public, then configure DNS with your registrar. GitHub handles HTTPS automatically.

---

## Phase 11: Analytics & Monitoring

106. **Add Google Analytics or Plausible**
     - Privacy-focused analytics to track page views and user flow. Respect Do Not Track.

107. **Implement error tracking**
     - Sentry integration to catch and report runtime errors in production.

108. **Add Core Web Vitals tracking**
     - Monitor LCP, FID, CLS. Report to analytics or Real User Monitoring service.

109. **Set up uptime monitoring**
     - Pingdom or UptimeRobot to alert if site goes down.

110. **Create privacy policy page**
     - Document what data is collected by analytics and forms. Required for GDPR compliance.

---

## Phase 12: Content & Maintenance

111. **Write welcome blog post**
     - First writeup about the portfolio redesign. Share your process and decisions.

112. **Document component library**
     - Storybook or simple markdown docs for your custom components. Helps future you.

113. **Write README.md**
     - Comprehensive documentation on setup, development, deployment, and project structure.

114. **Create CONTRIBUTING.md**
     - If open source, guidelines for others to contribute issues or PRs.

115. **Add CHANGELOG.md**
     - Track version history and notable changes. Follow semantic versioning.

116. **Style guide documentation**
     - Document colors, typography, spacing, and component usage patterns.

117. **Plan content calendar**
     - Schedule regular writeups (weekly/bi-weekly) to keep portfolio active.

118. **Create project case study template**
     - Standard format for documenting future projects consistently.

119. **Set up newsletter (optional)**
     - Email signup for new writeup notifications. Use Buttondown or ConvertKit.

120. **Schedule regular dependency updates**
     - Monthly review and update of npm packages. Security patches as needed.

---

## Bonus Ideas

121. **Dark mode toggle animation** — Sun/moon icon morphing with rotation
122. **Command palette** — Cmd+K to search and navigate to any page or writeup
123. **Reading progress bar** — Visual indicator on writeup detail pages
124. **Bookmark/favorite writeups** — LocalStorage-based reading list
125. **Share buttons** — Copy link, share to Twitter, LinkedIn for each writeup
126. **Estimated read time** — Display minutes to read on cards and detail
127. **Tags cloud visualization** — Interactive tag browsing with size by frequency
128. **Guestbook/Guest comments** — Simple comment system or guestbook page
129. **Now page** — What you're currently working on, reading, listening to
130. **Uses page** — Hardware and software setup, tools, and workflow
131. **Bookshelf page** — Books you've read with ratings and notes
132. **Projects by year** — Archive view grouping projects by completion year
133. **Speaking/Talks page** — If you do presentations or talks
134. **Resume PDF generator** — Generate PDF from structured data on demand
135. **API endpoint for projects** — JSON API to consume your own data elsewhere

---

## Style Goals

- **Marathon UI**: Generous whitespace, clean typography, restrained color
- **Arknights UX**: Sharp asymmetric layouts, subtle scan-line or grid texture accents, deliberate hover states
- **Achievement**: All through CSS — no heavy UI libraries needed

---

## Success Metrics

- [ ] Lighthouse 95+ on all categories
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] All 16 writeups migrated and accessible
- [ ] Mobile navigation smooth and intuitive
- [ ] Dark/light mode seamless switching
- [ ] Zero console errors in production
- [ ] All links functional including external PDF