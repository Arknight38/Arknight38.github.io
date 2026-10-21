import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ArticleMarkdown from "./ArticleMarkdown.jsx";
import { getRelatedWriteups } from "../data/writeups/index.js";
import "./writeup-layout.css";

export default function WriteupBody({ writeup }) {
  const contentRef = useRef(null);
  const [sections, setSections] = useState([]);
  const related = getRelatedWriteups(writeup.id, 3);

  useEffect(() => {
    const seen = new Map();
    const entries = [...contentRef.current.querySelectorAll("h2")].map(
      (heading) => {
        const title = heading.textContent.trim();
        const base =
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "section";
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        const id = `article-${base}${count > 1 ? `-${count}` : ""}`;
        heading.id = id;
        heading.tabIndex = -1;
        return { title, id };
      },
    );
    setSections(entries);
  }, [writeup.id, writeup.content]);

  return (
    <>
      <div className="writeup-body-layout">
        <div ref={contentRef} className="prose markdown writeup-prose">
          <ArticleMarkdown>{writeup.content}</ArticleMarkdown>
        </div>
        <aside className="writeup-rail">
          <div className="writeup-rail-inner">
            <span className="writeup-rail-label">READING NOTES</span>
            {sections.length > 0 && (
              <nav aria-label="On this page">
                <h2>In this writeup</h2>
                <ol>
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`}>{section.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="writeup-topics">
              <h2>Filed under</h2>
              <div>
                {writeup.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <Link className="writeup-index-link" to="/work">
              Explore the archive <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="writeup-related" aria-label="Related writeups">
          <div className="writeup-related-label">
            CONTINUE EXPLORING <span aria-hidden="true">↗</span>
          </div>
          <div className="writeup-related-grid">
            {related.map((item) => (
              <Link key={item.id} to={`/writeups/${item.id}`}>
                <span>{item.categories?.[0] || item.category}</span>
                <h2>{item.title}</h2>
                <p>{item.subtitle}</p>
                <span className="writeup-related-action">
                  Read writeup <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
