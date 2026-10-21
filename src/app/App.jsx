import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import WriteupBody from "./WriteupBody.jsx";
import { ArrowUpRight, ArrowRight, ArrowLeft, Menu, X } from "lucide-react";
import ArkMark from "./ArkMark.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Resume from "./Resume.jsx";
import { SpectraStudy, BinaryStudy, HuffmanStudy } from "./ProjectVisuals.jsx";
import { writeups, getWriteupById } from "../data/writeups/index.js";

const LabNotesPage = lazy(
  () => import("../experiments/shared/LabNotesPage.jsx"),
);

const NeuralLab = lazy(() => import("../experiments/neural/NeuralLab.jsx"));

const Spectra = lazy(() => import("../experiments/spectra/Spectra.jsx"));

const Huffman = lazy(() => import("../experiments/huffman/Huffman.jsx"));

function Arrow({ diagonal = false }) {
  return diagonal ? (
    <ArrowUpRight size={18} aria-hidden="true" />
  ) : (
    <ArrowRight size={18} aria-hidden="true" />
  );
}
function SectionLabel({ number, children }) {
  return (
    <div className="section-label">
      <span>
        {number} / {children}
      </span>
      <span aria-hidden="true">↓</span>
    </div>
  );
}
function Home() {
  return (
    <div className="editorial-home">
      <section className="editorial-hero">
        <div className="edition-line">
          <span>ELECTRICAL & COMPUTER ENGINEERING / DSP</span>
          <span>INDEX — 001</span>
        </div>
        <div className="headline-composition">
          <h1>
            Built out
            <br />
            <span className="headline-indent">of curiosity.</span>
          </h1>
          <div className="curiosity-stamp" aria-hidden="true">
            <ArkMark />
          </div>
        </div>
        <div className="editorial-intro">
          <span className="intro-index">[ ↓ SCROLL TO EXPLORE ]</span>
          <p>
            High school student pursuing electrical and computer engineering,
            with an interest in digital signal processing.
          </p>
          <Link to="/work" className="text-link">
            View the work index <Arrow diagonal />
          </Link>
        </div>
      </section>
      <section className="work-publication" aria-label="Selected projects">
        <div className="publication-heading">
          <span>SELECTED WORK / {new Date().getFullYear()}</span>
          <span>01—03</span>
          <Link to="/work">VIEW INDEX ↗</Link>
        </div>
        <div className="publication-grid">
          <article className="publication-project project-flux">
            <Link
              to="/lab/spectra"
              className="project-visual-link"
              aria-label="Open SPECTRA signal-processing workstation"
            >
              <SpectraStudy />
              <span className="visual-corner" aria-hidden="true">
                ↗
              </span>
            </Link>
            <div className="publication-meta">
              <span>001 / SIGNAL PROCESSING</span>
              <span>FFT · IIR · POLES & ZEROS</span>
            </div>
            <Link to="/lab/spectra" className="publication-title">
              <h2>SPECTRA</h2>
              <Arrow diagonal />
            </Link>
            <p>
              An interactive DSP workstation with a radix-2 FFT and a pole/zero
              biquad. Change a signal or filter and compare the waveform,
              spectrum, and response.
            </p>
          </article>
          <article className="publication-project project-atlus">
            <Link
              to="/writeups/atlus"
              className="project-visual-link"
              aria-label="Read Atlus case study"
            >
              <BinaryStudy />
              <span className="visual-corner" aria-hidden="true">
                ↗
              </span>
            </Link>
            <div className="publication-meta">
              <span>002 / NATIVE TOOLS</span>
              <span>C++ · BINARY ANALYSIS</span>
            </div>
            <Link to="/writeups/atlus" className="publication-title">
              <h2>Atlus</h2>
              <Arrow diagonal />
            </Link>
            <p>
              A C++ and Qt6 workbench for inspecting Windows executables, with
              hex views, disassembly, cross-referencing, and a separate
              decompiler integration.
            </p>
          </article>
          <article className="publication-project project-huffman">
            <Link
              to="/lab/huffman"
              className="project-visual-link"
              aria-label="Open Code Loom Huffman compressor"
            >
              <HuffmanStudy />
              <span className="visual-corner" aria-hidden="true">
                ↗
              </span>
            </Link>
            <div className="publication-meta">
              <span>003 / ALGORITHMS</span>
              <span>HUFFMAN · PREFIX CODES · ARK1</span>
            </div>
            <Link to="/lab/huffman" className="publication-title">
              <h2>Huffman Compression</h2>
              <Arrow diagonal />
            </Link>
            <p>
              Build the tree, trace byte codes, and pack or unpack an ARK1
              archive. A browser port of my C++ compressor, with complete-file
              size accounting.
            </p>
          </article>
        </div>
      </section>
      <section className="editorial-interlude">
        <div className="interlude-intro">
          <span className="eyebrow">
            ↳ INTERACTIVE EXPERIMENTS / OPEN QUESTIONS
          </span>
          <h2>
            What happens
            <br />
            if you build it?
          </h2>
          <p>
            Three working experiments. Change an input, and inspect the results.
          </p>
          <Link to="/lab" className="text-link">
            Open the labs page <Arrow diagonal />
          </Link>
        </div>
        <div className="interlude-experiments">
          <Link to="/lab/spectra" className="interlude-experiment">
            <span className="experiment-index">01 / SIGNALS</span>
            <strong>
              SPECTRA <Arrow diagonal />
            </strong>
            <span>Shape and filter signals in real time.</span>
          </Link>
          <Link to="/lab/huffman" className="interlude-experiment">
            <span className="experiment-index">02 / COMPRESSION</span>
            <strong>
              Code Loom <Arrow diagonal />
            </strong>
            <span>
              Follow characters through compression and tree building.
            </span>
          </Link>
          <Link to="/lab/neural" className="interlude-experiment">
            <span className="experiment-index">03 / LEARNING</span>
            <strong>
              Neural Lab <Arrow diagonal />
            </strong>
            <span>
              Train a neural network and understand the decisions it makes.
            </span>
          </Link>
        </div>
      </section>
      <section className="editorial-colophon">
        <span className="eyebrow">A NOTE FROM THE AUTHOR</span>
        <p>
          I’m Saku. My focus is electrical and computer engineering, and I’m
          planning to study digital signal processing. I ask too many questions
          and occasionally remember to go outside.
        </p>
        <Link to="/about" className="text-link">
          More about me <Arrow diagonal />
        </Link>
      </section>
    </div>
  );
}
function Work() {
  const [query, setQuery] = useState("");
  const archive = [...writeups].sort(
    (a, b) =>
      Number(a.id === "flux-messaging") - Number(b.id === "flux-messaging"),
  );
  const visible = archive.filter((w) =>
    `${w.title} ${w.subtitle} ${w.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        label="01 / ENGINEERING & WRITING"
        title="Writeups and work"
        text="Writeups on different projects I've worked on over the years. Features, thoughts, and more."
      />
      <section className="section work-section">
        <label className="search-label" htmlFor="search">
          SEARCH THE ARCHIVE{" "}
          <span>
            {visible.length} / {writeups.length} WRITEUPS
          </span>
        </label>
        <div className="hud-search-frame">
          <input
            id="search"
            type="search"
            placeholder="Search projects, technologies, or topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="archive">
          {visible.map((w) => (
            <Link key={w.id} to={`/writeups/${w.id}`} className="archive-row">
              <div
                className={`eyebrow project-status ${w.categories?.some((c) => ["closed", "legacy", "archived"].includes(c)) ? "is-archived" : "is-current"}`}
              >
                {w.categories?.join(" / ") || w.category} <span>{w.date}</span>
              </div>
              <h2>
                {w.title}
                <Arrow diagonal />
              </h2>
              <p>{w.subtitle}</p>
              <div className="article-meta">
                {w.tags.join(" · ")} <span>{w.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
        {!visible.length && (
          <p className="empty">
            No writeups match “{query}”. Try another topic.
          </p>
        )}
      </section>
    </>
  );
}
function PageHeader({ label, title, text }) {
  return (
    <header className="page-header">
      <div className="eyebrow">{label}</div>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}
function Lab() {
  return (
    <>
      <PageHeader
        label="02 / THE EXPERIMENTAL SIDE"
        title="Ideas, made tangible."
        text="A place for interactive explorations of algorithms, signals, and the systems underneath. This part of the lab is taking shape."
      />
      <section className="section">
        <SectionLabel number="IN PROGRESS">THE LAB NOTEBOOK</SectionLabel>
        {[
          [
            "01",
            "SPECTRA",
            "Signal processing",
            "A real-time DSP workstation: generate signals, drag poles and zeros, and explore the resulting waveform and spectrum.",
          ],
          [
            "02",
            "Huffman Compression",
            "Algorithms & data structures",
            "Open the compressor: build a Huffman tree, trace byte codes, and pack or unpack an ARK1 archive locally in the browser.",
          ],
          [
            "03",
            "Neural Lab",
            "Learning & visualization",
            "Train a small network, inspect its neurons, and follow a real gradient update—from XOR to spirals.",
          ],
        ].map(([n, name, category, text]) => (
          <Link
            className="lab-row"
            key={n}
            to={
              n === "01"
                ? "/lab/spectra"
                : n === "02"
                  ? "/lab/huffman"
                  : "/lab/neural"
            }
          >
            <span className="row-number">{n}</span>
            <div>
              <div className="eyebrow">{category}</div>
              <h2>{name}</h2>
              <p>{text}</p>
            </div>
            <span className="lab-live">
              {n === "01"
                ? "Launch SPECTRA"
                : n === "02"
                  ? "Open Code Loom"
                  : "Open Neural Lab"}{" "}
              <Arrow diagonal />
            </span>
          </Link>
        ))}
        <p className="lab-note">
          Explore SPECTRA and Code Loom, or browse the{" "}
          <Link to="/work">project archive</Link> for implementation notes and
          other work.
        </p>
      </section>
    </>
  );
}
function About() {
  return (
    <>
      <PageHeader
        label="03 / ABOUT"
        title="Hi, I’m Saku."
        text="Focused on electrical and computer engineering in Colorado Springs, with plans to study digital signal processing."
      />
      <section className="section about-grid">
        <h2>
          Learning by
          <br />
          building.
        </h2>
        <div className="prose">
          <p>
            I’m interested in electrical and computer engineering, and I plan to
            study digital signal processing. I want to understand how signals
            and systems behave, and how to build things that work with them.
          </p>
          <p>
            Much of my project work so far is in programming: real-time
            applications, native tools, and low-level systems. This site
            documents that work alongside the signal-processing experiments I
            want to explore next.
          </p>
          <p>
            Away from the keyboard, I ski, play cello, and spend time with games
            and cars. The curiosity tends to follow me around.
          </p>
          <div className="contact-links">
            <Link className="button" to="/resume">
              View résumé <Arrow diagonal />
            </Link>
            <a className="text-link" href="https://github.com/Arknight38">
              GitHub <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
function Article() {
  const { slug } = useParams();
  const w = getWriteupById(slug);
  if (!w) return <NotFound />;
  return (
    <article className="reading">
      <Link className="text-link back" to="/work">
        <ArrowLeft size={16} /> All work & writeups
      </Link>
      <header>
        <div
          className={`eyebrow project-status ${w.categories?.some((c) => ["closed", "legacy", "archived"].includes(c)) ? "is-archived" : "is-current"}`}
        >
          {w.categories?.join(" / ") || w.category} / {w.date} / {w.readTime}
        </div>
        <h1>{w.title}</h1>
        <p className="subtitle">{w.subtitle}</p>
        <div
          className={`tags ${w.categories?.includes("closed") ? "is-archived" : "is-current"}`}
        >
          {w.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </header>
      <WriteupBody writeup={w} />
      <div className="article-end">
        <Link className="text-link" to="/work">
          Back to the archive <Arrow />
        </Link>
      </div>
    </article>
  );
}
function NotFound() {
  return (
    <>
      <PageHeader
        label="404 / NOT FOUND"
        title="A path less traveled."
        text="This page doesn’t exist. There’s plenty to explore back in the archive."
      />
      <Link className="button" to="/work">
        Explore work <Arrow />
      </Link>
    </>
  );
}
function Shell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [open]);
  const chapter =
    location.pathname.startsWith("/writeups") || location.pathname === "/work"
      ? "02 / WORK ARCHIVE"
      : location.pathname.startsWith("/lab")
        ? "03 / EXPERIMENTS"
        : location.pathname === "/about"
          ? "04 / ABOUT"
          : location.pathname === "/resume"
            ? "05 / RÉSUMÉ"
            : "01 / INDEX";
  useEffect(() => {
    window.scrollTo(0, 0);
    const w = location.pathname.startsWith("/writeups/")
      ? getWriteupById(location.pathname.split("/")[2])
      : null;
    document.title = `${w?.title || { "/work": "Work", "/lab": "Lab", "/about": "About", "/resume": "Résumé", "/lab/spectra": "SPECTRA — DSP Workstation", "/lab/huffman": "Code Loom — Huffman Compression", "/lab/neural": "Neural Lab — Inside a Learning Network", "/lab/neural/writeup": "Inside the learning loop", "/lab/spectra/writeup": "Inside SPECTRA", "/lab/huffman/writeup": "From bytes to an archive" }[location.pathname] || "Built out of curiosity."} — Saku Grossarth`;
  }, [location.pathname]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner">
          <Link
            className="masthead-brand"
            to="/"
            onClick={() => setOpen(false)}
            aria-label="Saku Grossarth — Home"
          >
            <span className="brand-tile">
              <ArkMark />
            </span>
            <span className="masthead-name">
              SAKU
              <br />
              GROSSARTH<span>ELECTRICAL & COMPUTER ENGINEERING</span>
            </span>
          </Link>
          <div className="masthead-edition" aria-hidden="true">
            <span>PERSONAL SYSTEMS</span>
            <strong>{chapter}</strong>
            <span className="edition-rule">
              +<i />+
            </span>
          </div>
          <button
            ref={menuRef}
            className="masthead-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="navigation"
            onClick={() => setOpen(!open)}
          >
            <span>{open ? "CLOSE" : "MENU"}</span>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
          <nav
            id="navigation"
            className={open ? "masthead-nav is-open" : "masthead-nav"}
            aria-label="Main navigation"
          >
            {["Work", "Lab", "About"].map((label, i) => (
              <NavLink
                key={label}
                to={`/${label.toLowerCase()}`}
                onClick={() => setOpen(false)}
              >
                <span className="nav-index" aria-hidden="true">
                  0{i + 1}
                </span>
                <span>{label}</span>
                <span className="nav-pointer" aria-hidden="true">
                  ↗
                </span>
              </NavLink>
            ))}
            <a
              className="masthead-source"
              href="https://github.com/Arknight38"
              aria-label="GitHub profile"
            >
              <span className="nav-index" aria-hidden="true">
                SOURCE
              </span>
              <span>GitHub</span>
              <Arrow diagonal />
            </a>
          </nav>
          <ThemeToggle />
        </div>
        <div className="masthead-rail">
          <span>SG—</span>
          <span>SYSTEMS / SIGNALS / EXPERIMENTS</span>
          <span className="rail-bars" aria-hidden="true" />
        </div>
      </header>
      <div className="site-container">
        <main id="main" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/lab" element={<Lab />} />
            <Route
              path="/lab/spectra"
              element={
                <Suspense fallback={<p className="empty">Loading SPECTRA…</p>}>
                  <Spectra />
                </Suspense>
              }
            />
            <Route
              path="/lab/huffman"
              element={
                <Suspense
                  fallback={<p className="empty">Loading Code Loom…</p>}
                >
                  <Huffman />
                </Suspense>
              }
            />
            <Route
              path="/lab/neural"
              element={
                <Suspense
                  fallback={<p className="empty">Loading Neural Lab…</p>}
                >
                  <NeuralLab />
                </Suspense>
              }
            />
            <Route
              path="/lab/:lab/writeup"
              element={
                <Suspense fallback={<p className="empty">Loading writeup…</p>}>
                  <LabNotesPage />
                </Suspense>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/writeups" element={<Navigate to="/work" replace />} />
            <Route path="/writeups/:slug" element={<Article />} />
            {["profile", "contact", "now"].map((p) => (
              <Route
                key={p}
                path={`/${p}`}
                element={
                  <Navigate to={p === "profile" ? "/" : "/about"} replace />
                }
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer>
          <Link className="wordmark" to="/">
            SG.
          </Link>
          <span>Always something left to understand.</span>
          <Link to="/resume">
            Résumé <Arrow diagonal />
          </Link>
          <small>© {new Date().getFullYear()} Saku Grossarth</small>
        </footer>
      </div>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
