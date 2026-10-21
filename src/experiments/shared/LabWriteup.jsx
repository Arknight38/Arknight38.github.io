import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import ArticleMarkdown from "../../app/ArticleMarkdown.jsx";
import "../../app/writeup-layout.css";
import "./lab-writeup.css";

function LabWriteup({ id, title, summary, content }) {
  const sections = useMemo(
    () =>
      content
        .split(/^## /m)
        .filter((s) => s.trim())
        .map((section) => {
          const end = section.indexOf("\n"),
            title = section.slice(0, end).trim();
          return {
            title,
            body: section.slice(end + 1).trim(),
            id: `${id}-notes-${title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}`,
          };
        }),
    [content, id],
  );
  const minutes = Math.ceil(content.trim().split(/\s+/).length / 220);
  return (
    <article
      className="lab-writeup"
      id={`${id}-writeup`}
      tabIndex={-1}
      aria-labelledby={`${id}-writeup-title`}
    >
      <header className="lab-writeup-heading">
        <div>
          <div className="eyebrow">
            THE EXPERIMENT, EXPLAINED / {minutes} MIN READ
          </div>
          <h1 id={`${id}-writeup-title`}>{title}</h1>
          <p>{summary}</p>
        </div>
        <Link to={`/lab/${id}`} className="lab-return">
          Open experiment ↗
        </Link>
      </header>
      <div className="lab-writeup-layout">
        <div className="lab-writeup-sections">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              tabIndex={-1}
              className="lab-writeup-section"
            >
              <h2>{section.title}</h2>
              <div className="markdown writeup-prose">
                <ArticleMarkdown>{section.body}</ArticleMarkdown>
              </div>
            </section>
          ))}
        </div>
        <aside className="lab-writeup-rail">
          <nav aria-label={`${title} sections`}>
            <span className="eyebrow">IN THIS WRITEUP</span>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
            <Link className="lab-return" to={`/lab/${id}`}>
              Try it in the experiment ↗
            </Link>
          </nav>
        </aside>
      </div>
    </article>
  );
}

export default memo(LabWriteup);
