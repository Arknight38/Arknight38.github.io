import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Spectra from "../spectra/Spectra.jsx";
import Huffman from "../huffman/Huffman.jsx";
import NeuralLab from "../neural/NeuralLab.jsx";
import Kepler from "../kepler/Kepler.jsx";
import Silicon from "../silicon/Silicon.jsx";
import Resonance from "../resonance/Resonance.jsx";
import Mnemosyne from "../mnemosyne/Mnemosyne.jsx";
import LabNotesPage from "./LabNotesPage.jsx";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
for (const [id, Component] of [
  ["spectra", Spectra],
  ["huffman", Huffman],
  ["neural", NeuralLab],
  ["kepler", Kepler],
  ["silicon", Silicon],
  ["resonance", Resonance],
  ["mnemosyne", Mnemosyne],
]) {
  test(`${id} separates the tool and writeup with working navigation`, () => {
    const view = render(
      <MemoryRouter initialEntries={[`/lab/${id}`]}>
        <Routes>
          <Route path={`/lab/${id}`} element={<Component />} />
          <Route path="/lab/:lab/writeup" element={<LabNotesPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      view.container.querySelector(".lab-writeup"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Experiment", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("link", { name: "Writeup", exact: true }));
    expect(
      screen.getByRole("link", { name: "Writeup", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    expect(view.container.querySelector("canvas")).toBeNull();
    expect(view.container.querySelector(`#${id}-experiment`)).toBeNull();
    const article = view.container.querySelector(`#${id}-writeup`);
    expect(article).toBeInTheDocument();
    expect(article.querySelector("h1")).toBeInTheDocument();
    const sections = article.querySelectorAll(".lab-writeup-section");
    expect(sections.length).toBeGreaterThanOrEqual(5);
    expect(article.querySelectorAll("nav ol a")).toHaveLength(sections.length);
    for (const link of article.querySelectorAll('a[href^="#"]'))
      expect(
        view.container.querySelector(link.getAttribute("href")),
      ).toBeInTheDocument();
    expect(
      article.querySelectorAll("pre code.hljs").length,
    ).toBeGreaterThanOrEqual(2);
    expect(article.textContent).not.toMatch(
      /your C\+\+|your implementation|your code/i,
    );
    fireEvent.click(
      screen.getByRole("link", { name: "Open experiment ↗", exact: true }),
    );
    expect(
      view.container.querySelector(`#${id}-experiment`),
    ).toBeInTheDocument();
    expect(view.container.querySelector(".lab-writeup")).toBeNull();
  });
}
test("an unknown lab writeup has a useful recovery link", () => {
  render(
    <MemoryRouter initialEntries={["/lab/missing/writeup"]}>
      <Routes>
        <Route path="/lab/:lab/writeup" element={<LabNotesPage />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Writeup not found." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Explore the lab" })).toHaveAttribute(
    "href",
    "/lab",
  );
});
