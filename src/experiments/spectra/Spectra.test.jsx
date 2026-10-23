import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Spectra from "./Spectra.jsx";
let frame;
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
    vi.fn((callback) => {
      frame = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const open = () =>
  render(
    <MemoryRouter>
      <Spectra />
    </MemoryRouter>,
  );
const tab = (name) => screen.getByRole("tab", { name: new RegExp(name) });

test("views separate plots and controls while retaining the shared settings", () => {
  const view = open();
  expect(view.container.querySelectorAll("canvas")).toHaveLength(2);
  expect(
    screen.queryByRole("heading", { name: /Pole \/ zero plane/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Frequency 1 value" }),
    { target: { value: "64" } },
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "Oscilloscope motion" }),
    { target: { value: "slow" } },
  );
  fireEvent.click(tab("Filter"));
  expect(view.container.querySelectorAll("canvas")).toHaveLength(1);
  expect(
    screen.getByRole("heading", { name: /Pole \/ zero plane/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("combobox", { name: "Signal source" }),
  ).not.toBeInTheDocument();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Pole radius value" }),
    { target: { value: "0.7" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Active", exact: true }));
  fireEvent.click(tab("Spectrogram"));
  expect(view.container.querySelectorAll("canvas")).toHaveLength(1);
  expect(
    screen.getByRole("img", { name: "Spectrogram", exact: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("spinbutton", { name: "Frequency 1 value" }),
  ).toHaveValue(64);
  fireEvent.click(tab("Signal"));
  expect(
    screen.getByRole("combobox", { name: "Oscilloscope motion" }),
  ).toHaveValue("slow");
  fireEvent.click(tab("Filter"));
  expect(
    screen.getByRole("spinbutton", { name: "Pole radius value" }),
  ).toHaveValue(0.7);
  expect(screen.getByRole("button", { name: "Bypassed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  fireEvent.click(tab("Signal"));
  fireEvent.click(screen.getByRole("button", { name: "Enable biquad filter" }));
  expect(
    screen.getByRole("button", { name: "Enable biquad filter" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("img", { name: "Oscilloscope", exact: true }),
  ).toBeInTheDocument();
});

test("presets apply across views and reset restores signal and filter defaults", () => {
  open();
  fireEvent.click(tab("Filter"));
  fireEvent.change(
    screen.getByRole("combobox", { name: "Example configuration" }),
    { target: { value: "notch" } },
  );
  expect(
    screen.getByRole("spinbutton", { name: "Zero angle value" }),
  ).toHaveValue(33.8);
  fireEvent.click(tab("Signal"));
  expect(
    screen.getByRole("spinbutton", { name: "Frequency 2 value" }),
  ).toHaveValue(96);
  fireEvent.change(screen.getByRole("combobox", { name: "Signal source" }), {
    target: { value: "noise" },
  });
  expect(
    screen.getByRole("spinbutton", { name: "Frequency 1 value" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reset", exact: true }));
  expect(screen.getByRole("combobox", { name: "Signal source" })).toHaveValue(
    "dual",
  );
  expect(
    screen.getByRole("combobox", { name: "Oscilloscope motion" }),
  ).toHaveValue("stable");
  fireEvent.click(tab("Filter"));
  expect(
    screen.getByRole("spinbutton", { name: "Pole radius value" }),
  ).toHaveValue(0.85);
});

test("switching views retains live engine measurements and held transport state", () => {
  open();
  act(() => frame(100));
  act(() => frame(400));
  const summary = screen.getByLabelText("Signal summary").textContent;
  expect(summary).not.toContain("RMS 0.000");
  fireEvent.click(screen.getByRole("button", { name: "Pause", exact: true }));
  fireEvent.click(tab("Filter"));
  expect(screen.getByLabelText("Signal summary")).toHaveTextContent(summary);
  expect(
    screen.getByRole("button", { name: "Run", exact: true }),
  ).toBeInTheDocument();
  act(() => frame(700));
  expect(screen.getByLabelText("Signal summary")).toHaveTextContent(summary);
});

test("keyboard tabs wrap and focus mode exits with Escape without resetting parameters", () => {
  open();
  fireEvent.keyDown(tab("Signal"), { key: "End" });
  expect(tab("Spectrogram")).toHaveFocus();
  fireEvent.keyDown(tab("Spectrogram"), { key: "ArrowRight" });
  expect(tab("Signal")).toHaveFocus();
  fireEvent.keyDown(tab("Signal"), { key: "ArrowLeft" });
  expect(tab("Spectrogram")).toHaveFocus();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Frequency 1 value" }),
    { target: { value: "72" } },
  );
  const focus = screen.getByRole("button", { name: "Focus workspace" });
  fireEvent.click(focus);
  expect(
    screen.getByRole("dialog", { name: "SPECTRA workspace" }),
  ).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(focus).toHaveFocus();
  expect(
    screen.getByRole("spinbutton", { name: "Frequency 1 value" }),
  ).toHaveValue(72);
});
