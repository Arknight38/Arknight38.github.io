# Saku Grossarth — Portfolio

A modern, fast, and accessible portfolio website built with React, Vite, and Tailwind CSS.

**Live Site**: [https://arknight38.github.io/Arknight38.github.io](https://arknight38.github.io/Arknight38.github.io)

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router (HashRouter for GitHub Pages)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Content**: React Markdown + Remark GFM
- **SEO**: React Helmet Async
- **Deployment**: GitHub Pages

## Features

- ⚡ **Fast**: Vite-powered development and optimized production builds
- 🎨 **Beautiful**: Custom design with dark/light theme support
- ♿ **Accessible**: Reduced motion support, keyboard navigation, semantic HTML
- 📱 **Responsive**: Mobile-first design with smooth animations
- 🔍 **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, JSON-LD structured data
- 📝 **Content**: Full markdown support for writeups with syntax highlighting
- 🚀 **CI/CD**: Automated GitHub Actions workflows

## Development

```bash
# Clone the repository
git clone https://github.com/Arknight38/Arknight38.github.io.git
cd Arknight38.github.io

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
src/
├── components/       # React components
│   ├── layout/      # Navbar, Footer, CursorDot
│   ├── ui/          # Button, Card, Tag, etc.
│   ├── SEO.jsx      # SEO component
│   └── ErrorBoundary.jsx
├── contexts/        # React contexts (Theme)
├── data/            # Data files (projects, experience, skills, writeups)
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── styles/          # Global styles
└── utils/           # Utility functions
```

## Roadmap

This project follows a comprehensive roadmap covering:

1. **Phase 1**: Foundation & Setup ✅
2. **Phase 2**: Core Architecture ✅
3. **Phase 3**: Shared Components ✅
4. **Phase 4**: Page Components ✅
5. **Phase 5**: Animation & Polish ✅
6. **Phase 6**: Data & Content ✅
7. **Phase 7**: Performance (in progress)
8. **Phase 8**: SEO & Meta ✅
9. **Phase 9**: Testing & QA
10. **Phase 10**: Deployment & DevOps ✅

## License

MIT License - feel free to use this as a template for your own portfolio.
