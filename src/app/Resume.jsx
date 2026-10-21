import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const skills = [
  [
    "Languages",
    "C++, Rust, C, Python, TypeScript, JavaScript, Java, x86/x64 assembly",
  ],
  [
    "Systems",
    "Windows kernel development, VMX / EPT, memory management, IPC, PE mapping, operating system internals",
  ],
  [
    "Backend & infrastructure",
    "Axum, Tokio, PostgreSQL, WebSockets, SQLx, Docker, AWS S3, Cloudflare R2",
  ],
  [
    "Tools",
    "Git, Linux, Windows, Visual Studio, Snowflake, Zydis, LIEF, Winsock2",
  ],
];
const projects = [
  [
    "atlus",
    "Atlus",
    "C++ / binary analysis",
    "A native binary-analysis workbench exploring disassembly, decompilation, and comparison of Windows executables.",
  ],
  [
    "wdfilterdrv",
    "WdFilterDrv",
    "C / C++ / Windows",
    "Kernel-mode development with shared-memory IPC, PE mapping, and two-machine WinDbg debugging.",
  ],
  [
    "arkvisor",
    "ArkVisor",
    "C++ / assembly · unfinished",
    "An exploration of Intel VT-x, VM entry and exit handling, EPT memory virtualization, and hypercall dispatch.",
  ],
  [
    "gif-engine",
    "Gif-Engine",
    "Rust / Windows",
    "Process-isolated desktop animation with per-pixel transparency, an egui interface, and persistent settings.",
  ],
  [
    "server-shenanigans",
    "ServerShenanigans",
    "C++ / networking",
    "A custom file-transfer protocol with resumable transfers, zlib compression, and SHA-256 integrity checks.",
  ],
];
function ResumeSection({ number, title, children, id }) {
  return (
    <section className="resume-section" id={id}>
      <div className="resume-section-label">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
export default function Resume() {
  return (
    <article className="resume-page">
      <header className="resume-header">
        <div className="eyebrow">BACKGROUND / EXPERIENCE / SELECTED WORK</div>
        <h1>
          Résumé<span aria-hidden="true">—</span>
        </h1>
        <p className="resume-name">Saku Grossarth</p>
        <p className="resume-intro">
          High school student pursuing electrical and computer engineering, with
          plans to study digital signal processing. My project experience
          includes systems programming, native tools, and networked
          applications.
        </p>
        <div className="resume-public-links">
          <a href="https://github.com/Arknight38">
            GitHub <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="https://www.linkedin.com/in/saku-grossarth-9040083aa">
            LinkedIn <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <Link to="/work">
            Project archive <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <ResumeSection number="01" title="Experience" id="experience">
        <div className="resume-entry">
          <div className="resume-entry-heading">
            <h3>Data Analyst Intern</h3>
            <span>Summer–Winter 2025</span>
          </div>
          <p className="resume-organization">
            Restaurant365 · Research & development
          </p>
          <ul>
            <li>
              Wrote SQL queries in Snowflake to support analytics and internal
              decision-making.
            </li>
            <li>
              Presented query results and data-validation work directly to the
              Head of R&D.
            </li>
          </ul>
        </div>
        <div className="resume-entry">
          <div className="resume-entry-heading">
            <h3>Open-source contributor</h3>
            <a href="https://github.com/wplacer/wplacer">
              wplacer <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <ul>
            <li>
              Contributed features, bug fixes, and performance improvements
              across core JavaScript components.
            </li>
            <li>
              Helped triage issues, review pull requests, and guide new
              contributors through the codebase.
            </li>
          </ul>
        </div>
      </ResumeSection>
      <ResumeSection number="02" title="Technical skills" id="skills">
        <dl className="resume-skills">
          {skills.map(([title, description]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </ResumeSection>
      <ResumeSection number="03" title="Selected projects" id="projects">
        <div className="resume-projects">
          {projects.map(([id, title, tech, description]) => (
            <div className="resume-project" key={id}>
              <div className="resume-entry-heading">
                <h3>
                  <Link to={`/writeups/${id}`}>
                    {title} <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </h3>
              </div>
              <span className="resume-project-tech">{tech}</span>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </ResumeSection>
      <ResumeSection number="04" title="Education" id="education">
        <div className="resume-entry">
          <div className="resume-entry-heading">
            <h3>Pine Creek High School</h3>
            <span>Expected graduation · May 2027</span>
          </div>
          <p className="resume-organization">Colorado Springs, Colorado</p>
          <p>
            AP coursework includes computer science, psychology, and human
            geography.
          </p>
        </div>
      </ResumeSection>
      <ResumeSection number="05" title="Recognition" id="recognition">
        <ul className="resume-recognition">
          <li>FBLA National Competitor — Coding & Programming</li>
          <li>First place — FBLA district and state competitions</li>
          <li>CyberPatriot competitor</li>
          <li>Python Professional Certification</li>
          <li>Java Professional Certification</li>
          <li>CS50 graduate</li>
          <li>National Technical Honor Society</li>
        </ul>
      </ResumeSection>
      <div className="resume-end">
        <Link to="/work">
          Explore the work behind the résumé{" "}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
