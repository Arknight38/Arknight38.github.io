import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Writeups data - extracted from the legacy HTML files
const writeups = [
  {
    id: 'flux-messaging',
    title: 'Flux: A Real-Time Messaging Platform in Rust',
    excerpt: 'Building a high-performance messaging platform from scratch with Rust, Axum, Tokio, and WebSockets. Sub-100ms latency handling thousands of concurrent connections.',
    date: '2024',
    category: 'systems',
    readTime: '12 min',
    featured: true,
  },
  {
    id: 'arkvisor',
    title: 'ArkVisor: Building a Hypervisor from Scratch',
    excerpt: 'Deep dive into hardware virtualization with VT-x/VMX, EPT memory virtualization, and hypercall dispatch. Understanding how hypervisors stay hidden from security software.',
    date: '2024',
    category: 'systems',
    readTime: '15 min',
    featured: true,
  },
  {
    id: 'atlus',
    title: 'Atlus: A Native Binary Diff Workbench',
    excerpt: 'Creating a fast, native PE analysis tool with Dear ImGui. Multi-layer diff engine, Zydis disassembly, and Ghidra decompiler integration.',
    date: '2024',
    category: 'tools',
    readTime: '10 min',
    featured: true,
  },
  {
    id: 'wdfilterdrv',
    title: 'WdFilterDrv: Kernel-Mode Driver Development',
    excerpt: 'Building a Windows kernel-mode driver to understand OS internals. Shared memory IPC, manual PE mapping, and kernel debugging.',
    date: '2024',
    category: 'systems',
    readTime: '14 min',
    featured: false,
  },
  {
    id: 'cs2-extern',
    title: 'CS2 External: Kernel Memory Operations',
    excerpt: 'Building a custom rendering library (zdraw) from scratch with FreeType fonts, BVH spatial system, and kernel-mode driver for memory operations.',
    date: '2024',
    category: 'systems',
    readTime: '11 min',
    featured: false,
  },
  {
    id: 'gif-engine',
    title: 'Gif-Engine: Desktop Animation Manager',
    excerpt: 'Process-isolated GIF rendering with per-pixel transparency using WS_EX_LAYERED windows. Building because existing tools had performance problems.',
    date: '2024',
    category: 'tools',
    readTime: '8 min',
    featured: false,
  },
  {
    id: 'fbla-spotlocal',
    title: 'SpotLocal: FBLA Coding Competition Project',
    excerpt: 'Offline-first local business discovery app with zero-cost infrastructure, full accessibility compliance, and privacy-centric design.',
    date: '2025',
    category: 'fullstack',
    readTime: '9 min',
    featured: false,
  },
  {
    id: 'snowflake-analytics',
    title: 'Yelp Analytics: Snowflake Data Warehouse',
    excerpt: 'Cloud data pipeline analyzing restaurant reviews with Snowflake. SQL architecture, sentiment analysis, and geospatial queries.',
    date: '2025',
    category: 'data',
    readTime: '7 min',
    featured: false,
  },
  {
    id: 'rune-editor',
    title: 'Rune Editor: Memory Manipulation Tool',
    excerpt: 'Process memory editing with React frontend and C++ backend. Win32 API, cpp-httplib, and standalone executable packaging.',
    date: '2024',
    category: 'tools',
    readTime: '6 min',
    featured: false,
  },
  {
    id: 'hd2-cheats',
    title: 'Helldivers 2: Game Modification Framework',
    excerpt: 'DLL injection, DirectX overlay rendering in Rust, and anti-cheat bypass techniques. Lua scripting and pattern scanning.',
    date: '2024',
    category: 'systems',
    readTime: '13 min',
    featured: false,
  },
  {
    id: 'kdmapper',
    title: 'KDMapper: Manual Driver Mapping',
    excerpt: 'Understanding Windows driver mapping techniques and kernel injection methods.',
    date: '2024',
    category: 'systems',
    readTime: '10 min',
    featured: false,
  },
  {
    id: 'cs2externdrv',
    title: 'CS2 External Driver Architecture',
    excerpt: 'Kernel-mode driver architecture for external process memory access and rendering.',
    date: '2024',
    category: 'systems',
    readTime: '12 min',
    featured: false,
  },
  {
    id: 'byovd-scanner',
    title: 'BYOVD: Vulnerable Driver Scanner',
    excerpt: 'Building a scanner to detect bring-your-own-vulnerable-driver techniques.',
    date: '2024',
    category: 'tools',
    readTime: '8 min',
    featured: false,
  },
  {
    id: 'monitor-def-not-mal',
    title: 'Security Research: C2 Framework',
    excerpt: 'Educational APT simulation framework for authorized red team operations and EDR testing.',
    date: '2024',
    category: 'tools',
    readTime: '11 min',
    featured: false,
  },
  {
    id: 'manualmapdrv',
    title: 'Manual Map Driver: PE Loading',
    excerpt: 'Implementing manual PE mapping for kernel-mode drivers. Understanding the Windows loader.',
    date: '2024',
    category: 'systems',
    readTime: '14 min',
    featured: false,
  },
  {
    id: 'rnw-drv',
    title: 'RNW Driver: Network Stack Analysis',
    excerpt: 'Analyzing and working with Windows network driver stacks.',
    date: '2024',
    category: 'systems',
    readTime: '9 min',
    featured: false,
  },
];

const categories = [
  { id: 'all', label: 'all' },
  { id: 'systems', label: 'systems' },
  { id: 'tools', label: 'tools' },
  { id: 'fullstack', label: 'full stack' },
  { id: 'data', label: 'data' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export function Writeups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    document.title = 'Writeups — Saku Grossarth';
  }, []);

  const filteredWriteups = useMemo(() => {
    return writeups.filter((w) => {
      const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredWriteups = writeups.filter((w) => w.featured);
  const regularWriteups = filteredWriteups.filter((w) => !w.featured);

  return (
    <div className="min-h-screen px-6 lg:px-12 pb-16">
      {/* Header */}
      <header className="pt-[18vh] pb-12 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[var(--rose)] mb-6 text-[0.7rem] tracking-[0.14em]"
          style={{ fontFamily: 'var(--mono)' }}
        >
          technical writing
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(2.5rem,6vw,3.5rem)] leading-[1.1] tracking-[-0.02em] text-[var(--text)]"
          style={{ fontFamily: 'var(--serif)', fontWeight: 400 }}
        >
          Deep dives &<br /><em className="not-italic text-[var(--rose)]">writeups</em>
        </motion.h1>
      </header>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-3xl mx-auto mb-8"
      >
        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]"
          />
          <input
            type="text"
            placeholder="Search writeups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:border-[var(--rose)] transition-colors"
            style={{ fontFamily: 'var(--sans)' }}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-[0.68rem] tracking-[0.07em] transition-all duration-300 border ${
                activeCategory === cat.id
                  ? 'border-[var(--rose)] text-[var(--rose)] bg-[var(--rose-dim)]'
                  : 'border-[var(--border)] text-[var(--text3)] hover:border-[var(--rose)] hover:text-[var(--rose)]'
              }`}
              style={{ fontFamily: 'var(--mono)' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Featured Section */}
      {!searchQuery && activeCategory === 'all' && featuredWriteups.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg text-[var(--text)]" style={{ fontFamily: 'var(--serif)' }}>
              Featured
            </h2>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredWriteups.map((writeup, index) => (
              <FeaturedCard key={writeup.id} writeup={writeup} index={index} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Regular Writeups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {regularWriteups.map((writeup, index) => (
          <WriteupCard key={writeup.id} writeup={writeup} index={index} />
        ))}
      </div>

      {/* Empty State */}
      {filteredWriteups.length === 0 && (
        <div className="text-center py-16 max-w-3xl mx-auto">
          <p className="text-[var(--text3)]" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
            No writeups found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ writeup, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <Link
        to={`/writeups/${writeup.id}`}
        className="block h-full p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)] group no-underline"
      >
        <p className="text-[0.62rem] tracking-[0.08em] text-[var(--rose)] mb-3" style={{ fontFamily: 'var(--mono)' }}>
          {writeup.category}
        </p>
        <p
          className="text-[0.9rem] leading-[1.6] text-[var(--text2)] italic mb-4"
          style={{ fontFamily: 'var(--serif)' }}
        >
          "{writeup.excerpt.slice(0, 100)}..."
        </p>
        <div className="mt-auto flex items-center gap-3 text-[0.65rem] text-[var(--text3)]" style={{ fontFamily: 'var(--mono)' }}>
          <span>{writeup.date}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {writeup.readTime}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function WriteupCard({ writeup, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <Link
        to={`/writeups/${writeup.id}`}
        className="block h-full p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-[var(--rose-b)] hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--shadow)] group no-underline"
      >
        <p className="text-[0.62rem] tracking-[0.08em] text-[var(--rose)] mb-3" style={{ fontFamily: 'var(--mono)' }}>
          {writeup.category}
        </p>
        <h3
          className="text-lg font-medium text-[var(--text)] mb-3 group-hover:text-[var(--rose)] transition-colors"
          style={{ fontFamily: 'var(--serif)' }}
        >
          {writeup.title}
        </h3>
        <p className="text-[0.88rem] text-[var(--text2)] leading-[1.6] mb-4">
          {writeup.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-[0.65rem] text-[var(--text3)]" style={{ fontFamily: 'var(--mono)' }}>
            <span>{writeup.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {writeup.readTime}
            </span>
          </div>
          <ArrowRight
            size={14}
            className="text-[var(--text3)] group-hover:text-[var(--rose)] group-hover:translate-x-1 transition-all"
          />
        </div>
      </Link>
    </motion.div>
  );
}
