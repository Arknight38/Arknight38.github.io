import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App.jsx";
import { writeups } from "../data/writeups/index.js";

afterEach(cleanup);
function visit(path) {
  window.history.replaceState({}, "", path);
  window.scrollTo = vi.fn();
  return render(<App />);
}
test("every preserved writeup opens at its original URL and renders its content", () => {
  for (const writeup of writeups) {
    const view = visit(`/writeups/${writeup.id}`);
    expect(
      screen.getByRole("heading", { level: 1, name: writeup.title }),
    ).toBeInTheDocument();
    expect(
      view.container.querySelector(".markdown").textContent.length,
    ).toBeGreaterThan(100);
    const sectionLinks = view.container.querySelectorAll(
      'nav[aria-label="On this page"] a',
    );
    expect(sectionLinks.length).toBeGreaterThanOrEqual(5);
    for (const link of sectionLinks) {
      const heading = view.container.querySelector(link.getAttribute("href"));
      expect(heading?.tagName).toBe("H2");
      expect(heading?.textContent).toBe(link.textContent);
    }
    view.unmount();
  }
});
test("archive searches existing technologies and handles no results", () => {
  visit("/work");
  const search = screen.getByRole("searchbox");
  fireEvent.change(search, { target: { value: "postgresql" } });
  expect(
    screen.getByRole("heading", {
      name: writeups.find((writeup) => writeup.id === "flux-messaging").title,
    }),
  ).toBeInTheDocument();
  fireEvent.change(search, {
    target: { value: "a-topic-that-does-not-exist" },
  });
  expect(screen.getByText(/No writeups match/)).toBeInTheDocument();
});
test("unknown article shows a recoverable 404", () => {
  visit("/writeups/nonexistent");
  expect(
    screen.getByRole("heading", { name: "A path less traveled." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Explore work/ })).toHaveAttribute(
    "href",
    "/work",
  );
});
test("mobile menu exposes and closes navigation after choosing a destination", () => {
  visit("/");
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  expect(
    screen.getByRole("button", { name: "Close navigation" }),
  ).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("link", { name: "Lab", exact: true }));
  expect(
    screen.getByRole("heading", { name: "Ideas, made tangible." }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("Escape dismisses navigation and restores focus to its toggle", () => {
  visit("/");
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  fireEvent.keyDown(document, { key: "Escape" });
  const toggle = screen.getByRole("button", { name: "Open navigation" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
});

test("dedicated résumé includes experience without email, phone, or PDF download", () => {
  const view = visit("/resume");
  expect(
    screen.getByRole("heading", { level: 1, name: "Résumé" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Data Analyst Intern" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Education" }),
  ).toBeInTheDocument();
  expect(view.container.textContent).not.toMatch(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  expect(view.container.textContent).not.toMatch(
    /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/,
  );
  expect(
    view.container.querySelector(
      'a[href^="mailto:"],a[href^="tel:"],a[href$=".pdf"]',
    ),
  ).toBeNull();
});

test("shared geometric logo removes serial numbers and archive metadata reflects closed status", () => {
  const home = visit("/");
  expect(home.container.querySelectorAll(".ark-ribbon")).toHaveLength(2);
  expect(home.container.querySelector(".brand-tile").textContent).not.toContain(
    "038",
  );
  expect(
    home.container.querySelector(".curiosity-stamp").textContent,
  ).not.toContain("038");
  home.unmount();
  const work = visit("/work");
  expect(
    screen.getByRole("searchbox").closest(".hud-search-frame"),
  ).toBeInTheDocument();
  const closed = writeups.find((w) => w.categories?.includes("closed"));
  const row = screen
    .getByRole("heading", { name: closed.title })
    .closest(".archive-row");
  expect(row.querySelector(".project-status")).toHaveClass("is-archived");
  expect(
    work.container.querySelectorAll(".project-status.is-current").length,
  ).toBeGreaterThan(0);
});
