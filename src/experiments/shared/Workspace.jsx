import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Maximize, Minimize, ArrowLeft } from "lucide-react";
import LabNavigation from "./LabNavigation.jsx";
import "./workspace.css";

export default function Workspace({
  id,
  name,
  number,
  description,
  tabs,
  view,
  onView,
  summary,
  children,
}) {
  const [focused, setFocused] = useState(false);
  const root = useRef(null),
    toggle = useRef(null),
    buttons = useRef({});
  const select = (key) => {
    onView(key);
    buttons.current[key]?.focus();
  };
  useEffect(() => {
    if (!focused) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event) => {
      if (event.key === "Escape") {
        setFocused(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        const items = [
          ...root.current.querySelectorAll(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length);
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handle);
    };
  }, [focused]);
  const keydown = (event, index) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      select(tabs[next][0]);
    }
  };
  return (
    <article
      ref={root}
      id={`${id}-experiment`}
      className={`lab-workspace${focused ? " lab-workspace-focused" : ""}`}
      role={focused ? "dialog" : undefined}
      aria-modal={focused ? true : undefined}
      aria-label={focused ? `${name} workspace` : undefined}
    >
      <header className="lab-workspace-heading">
        <div>
          <Link className="lab-workspace-back" to="/lab">
            <ArrowLeft size={15} /> Lab notebook
          </Link>
          <span className="eyebrow">EXPERIMENT {number}</span>
          <h1>{name}</h1>
          <p>{description}</p>
        </div>
        <button
          ref={toggle}
          onClick={() => setFocused((v) => !v)}
          aria-pressed={focused}
        >
          {focused ? <Minimize size={16} /> : <Maximize size={16} />}{" "}
          {focused ? "Exit focus" : "Focus workspace"}
        </button>
      </header>
      <LabNavigation lab={id} />
      <div
        className="lab-workspace-summary"
        role="region"
        aria-label={`${name} summary`}
      >
        {summary}
      </div>
      <div
        className="lab-workspace-tabs"
        role="tablist"
        aria-label={`${name} views`}
      >
        {tabs.map(([key, label, hint], index) => (
          <button
            key={key}
            ref={(el) => {
              buttons.current[key] = el;
            }}
            id={`${id}-tab-${key}`}
            role="tab"
            aria-selected={view === key}
            aria-controls={`${id}-panel-${key}`}
            tabIndex={view === key ? 0 : -1}
            onClick={() => select(key)}
            onKeyDown={(event) => keydown(event, index)}
          >
            <span>0{index + 1}</span>
            <div>
              {label}
              <small>{hint}</small>
            </div>
          </button>
        ))}
      </div>
      <section
        className="lab-workspace-view"
        role="tabpanel"
        id={`${id}-panel-${view}`}
        aria-labelledby={`${id}-tab-${view}`}
        tabIndex={0}
      >
        {children}
      </section>
    </article>
  );
}
