import { createElement } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Kepler from "../kepler/Kepler.jsx";
import Silicon from "../silicon/Silicon.jsx";
import Resonance from "../resonance/Resonance.jsx";
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
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
const open = (Component) =>
  render(<MemoryRouter>{createElement(Component)}</MemoryRouter>);
test("Kepler preserves body edits and progress between views and computes a separate comparison", () => {
  open(Kepler);
  fireEvent.click(screen.getByRole("button", { name: "Add body" }));
  expect(
    screen.getByRole("region", { name: "KEPLER summary" }),
  ).toHaveTextContent("3 bodies");
  fireEvent.click(screen.getByRole("button", { name: "Step 4 timesteps" }));
  fireEvent.click(screen.getByRole("tab", { name: /Conservation/ }));
  expect(
    screen.getByRole("region", { name: "KEPLER summary" }),
  ).toHaveTextContent("0.020");
  fireEvent.click(screen.getByRole("tab", { name: /Integrators/ }));
  fireEvent.click(screen.getByRole("button", { name: "Run comparison" }));
  expect(
    screen.getByRole("img", {
      name: "Relative total-energy change over equal simulation time",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "KEPLER summary" }),
  ).toHaveTextContent("0.020");
});
test("Silicon exposes real microsteps and retains its state between memory and execution", () => {
  const view = open(Silicon);
  fireEvent.click(screen.getByRole("tab", { name: /Execution/ }));
  for (let i = 0; i < 3; i++)
    fireEvent.click(screen.getByRole("button", { name: "Step instruction" }));
  expect(view.container.querySelector(".lab-readouts")).toHaveTextContent(
    "0x08 · 8",
  );
  fireEvent.click(screen.getByRole("tab", { name: /Memory/ }));
  expect(
    screen.getByRole("button", { name: "Address 0x00: 1" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Execution/ }));
  expect(view.container.querySelector(".lab-readouts")).toHaveTextContent(
    "0x08 · 8",
  );
  fireEvent.click(screen.getByRole("button", { name: "Previous cycle" }));
  expect(
    screen.getByRole("region", { name: "SILICON summary" }),
  ).toHaveTextContent("Microsteps 11");
});
test("Resonance has working source edits, waveform steps and probe history", () => {
  open(Resonance);
  fireEvent.click(screen.getByRole("tab", { name: /Emitters/ }));
  fireEvent.click(screen.getByRole("button", { name: "Add emitter at probe" }));
  expect(
    screen.getByRole("region", { name: "RESONANCE summary" }),
  ).toHaveTextContent("3 emitters");
  fireEvent.click(screen.getByRole("button", { name: "Step field" }));
  fireEvent.click(screen.getByRole("tab", { name: /Measurements/ }));
  expect(screen.getByText("8 / 512")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Probe x (cell)" }), {
    target: { value: "10" },
  });
  expect(screen.getByText("0 / 512")).toBeInTheDocument();
});
test("new workspaces provide roving keyboard tabs, pause on view change and focus-mode escape", () => {
  open(Kepler);
  fireEvent.click(screen.getByRole("button", { name: "Run", exact: true }));
  const tab = screen.getByRole("tab", { name: /System/ });
  fireEvent.keyDown(tab, { key: "End" });
  expect(screen.getByRole("tab", { name: /Integrators/ })).toHaveFocus();
  expect(
    screen.getByRole("region", { name: "KEPLER summary" }),
  ).toHaveTextContent("Paused");
  const toggle = screen.getByRole("button", { name: "Focus workspace" });
  fireEvent.click(toggle);
  expect(
    screen.getByRole("dialog", { name: "KEPLER workspace" }),
  ).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle).toHaveFocus();
  expect(document.body.style.overflow).toBe("");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
});
