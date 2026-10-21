import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NeuralLab from "./NeuralLab.jsx";
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const open = () =>
  render(
    <MemoryRouter>
      <NeuralLab />
    </MemoryRouter>,
  );
test("a single-sample trace applies exactly one update and reset clears it", () => {
  open();
  fireEvent.click(screen.getByRole("tab", { name: /Gradient trace/ }));
  fireEvent.click(screen.getByRole("button", { name: "Start trace" }));
  fireEvent.click(screen.getByRole("button", { name: "Next: loss" }));
  expect(screen.getByText(/L = −y log/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next: gradients" }));
  expect(screen.getByText(/∂L\/∂w₁/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Apply single-sample update" }),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByText(/1 additional single-sample updates/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Training/ }));
  fireEvent.click(screen.getByRole("button", { name: "Reset weights" }));
  fireEvent.click(screen.getByRole("tab", { name: /Gradient trace/ }));
  expect(
    screen.getByRole("button", { name: "Start trace" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/additional single-sample updates/),
  ).not.toBeInTheDocument();
});
test("removing hidden layers leaves a three-parameter linear model and a valid inspector", () => {
  const view = open();
  fireEvent.change(screen.getByRole("combobox", { name: "Hidden layers" }), {
    target: { value: "0" },
  });
  expect(
    screen.getByRole("combobox", { name: "Neurons per layer" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("tab", { name: /Network/ }));
  expect(
    view.container.querySelectorAll(".neural-neurons button"),
  ).toHaveLength(1);
  expect(
    screen.getByRole("heading", { name: "Output neuron", exact: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Current training summary" }),
  ).toHaveTextContent("Parameters 3");
  fireEvent.click(screen.getByRole("tab", { name: /Training/ }));
  fireEvent.click(screen.getByRole("button", { name: "Step epoch" }));
  expect(
    screen.getByRole("region", { name: "Current training summary" }),
  ).toHaveTextContent("Epochs 1");
});
test("held-out datasets and keyboard point edits remain usable", () => {
  const view = open();
  fireEvent.change(screen.getByRole("combobox", { name: "Experiment" }), {
    target: { value: "circles" },
  });
  expect(
    screen.getByRole("region", { name: "Current training summary" }),
  ).toHaveTextContent("64 training / 16 held out");
  fireEvent.click(screen.getByRole("button", { name: "Add 1 at probe" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    view.container.querySelectorAll(
      'select[aria-label="Selected data point"] option',
    ),
  ).toHaveLength(82);
  fireEvent.click(screen.getByRole("button", { name: "Remove selected" }));
  expect(
    view.container.querySelectorAll(
      'select[aria-label="Selected data point"] option',
    ),
  ).toHaveLength(81);
});

test("selecting spirals loads a usable optimizer and architecture, and the preset is recoverable", () => {
  open();
  fireEvent.change(screen.getByRole("combobox", { name: "Experiment" }), {
    target: { value: "spiral" },
  });
  expect(
    screen.queryByText(
      /Spiral preset loaded|A harder boundary|Fresh seeded weights/,
    ),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Hidden layers" })).toHaveValue(
    "2",
  );
  expect(
    screen.getByRole("combobox", { name: "Neurons per layer" }),
  ).toHaveValue("8");
  expect(screen.getByRole("combobox", { name: "Optimizer" })).toHaveValue(
    "adam",
  );
  expect(screen.getByRole("spinbutton", { name: "Learning rate" })).toHaveValue(
    0.01,
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Hidden layers" }), {
    target: { value: "0" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Optimizer" }), {
    target: { value: "sgd" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reload spiral preset" }));
  expect(screen.getByRole("combobox", { name: "Hidden layers" })).toHaveValue(
    "2",
  );
  expect(screen.getByRole("combobox", { name: "Optimizer" })).toHaveValue(
    "adam",
  );
  fireEvent.click(screen.getByRole("tab", { name: /Training/ }));
  expect(
    screen.getByRole("button", { name: "Train", exact: true }),
  ).toBeInTheDocument();
});

test("views preserve model progress, edited data, neuron selection and trace stage", () => {
  const view = open();
  fireEvent.click(screen.getByRole("button", { name: "Add 1 at probe" }));
  fireEvent.click(screen.getByRole("tab", { name: /Training/ }));
  fireEvent.click(screen.getByRole("button", { name: "Step epoch" }));
  const summary = screen.getByRole("region", {
    name: "Current training summary",
  });
  expect(summary).toHaveTextContent("5 training / 0 held out");
  expect(summary).toHaveTextContent("Epochs 1");
  fireEvent.click(screen.getByRole("tab", { name: /Network/ }));
  fireEvent.change(screen.getByRole("combobox", { name: "Layer to inspect" }), {
    target: { value: "1" },
  });
  expect(
    view.container.querySelectorAll(".neural-neurons button"),
  ).toHaveLength(1);
  fireEvent.change(screen.getByRole("slider", { name: "Probe x1" }), {
    target: { value: "0.3" },
  });
  fireEvent.click(screen.getByRole("tab", { name: /Gradient trace/ }));
  expect(screen.getByRole("combobox", { name: "Trace neuron" })).toHaveValue(
    "1:0",
  );
  fireEvent.click(screen.getByRole("button", { name: "Start trace" }));
  fireEvent.click(screen.getByRole("button", { name: "Next: loss" }));
  const captured = screen.getByText(/L = −y log/).textContent;
  fireEvent.click(screen.getByRole("tab", { name: /Data & model/ }));
  fireEvent.click(screen.getByRole("tab", { name: /Gradient trace/ }));
  expect(screen.getByText(/L = −y log/)).toHaveTextContent(captured);
  expect(summary).toHaveTextContent("Epochs 1");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(
    screen.queryByRole("combobox", { name: "Experiment" }),
  ).not.toBeInTheDocument();
});

test("tab navigation pauses training and focus mode exits without resetting the model", () => {
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 123),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  open();
  const dataTab = screen.getByRole("tab", { name: /Data & model/ });
  fireEvent.keyDown(dataTab, { key: "ArrowRight" });
  const trainingTab = screen.getByRole("tab", { name: /Training/ });
  expect(trainingTab).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Step epoch" }));
  fireEvent.click(screen.getByRole("button", { name: "Train", exact: true }));
  expect(
    screen.getByRole("button", { name: "Pause", exact: true }),
  ).toBeInTheDocument();
  fireEvent.keyDown(trainingTab, { key: "End" });
  expect(screen.getByRole("tab", { name: /Gradient trace/ })).toHaveFocus();
  expect(
    screen.getByRole("region", { name: "Current training summary" }),
  ).toHaveTextContent("Ⅱ Paused");
  expect(cancelAnimationFrame).toHaveBeenCalledWith(123);
  const toggle = screen.getByRole("button", { name: "Focus workspace" });
  fireEvent.click(toggle);
  expect(
    screen.getByRole("dialog", { name: "Neural Lab workspace" }),
  ).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(toggle).toHaveFocus();
  expect(
    screen.getByRole("region", { name: "Current training summary" }),
  ).toHaveTextContent("Epochs 1");
});
