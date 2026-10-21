import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App.jsx";

beforeEach(() => {
  const values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    clear: vi.fn(() => values.clear()),
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function open() {
  window.history.replaceState({}, "", "/");
  window.scrollTo = vi.fn();
  return render(<App />);
}
test("theme toggle changes the palette, saves the choice and survives route navigation", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("portfolio-theme")).toBe("light");
  fireEvent.click(screen.getByRole("link", { name: "About", exact: true }));
  expect(
    screen.getByRole("button", { name: "Switch to dark mode" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("portfolio-theme")).toBe("dark");
});
test("saved initial palette is reflected in the control", () => {
  document.documentElement.dataset.theme = "light";
  open();
  expect(
    screen.getByRole("button", { name: "Switch to dark mode" }),
  ).toBeInTheDocument();
});
test("blocked browser storage does not prevent switching themes", () => {
  vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  open();
  fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(
    screen.getByRole("button", { name: "Switch to dark mode" }),
  ).toBeInTheDocument();
});
