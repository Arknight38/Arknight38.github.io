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
});
const open = () =>
  render(
    <MemoryRouter>
      <NeuralLab />
    </MemoryRouter>,
  );
test("a single-sample trace applies exactly one update and reset clears it", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Start trace" }));
  fireEvent.click(screen.getByRole("button", { name: "Next: loss" }));
  expect(screen.getByText(/L = −y log/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next: gradients" }));
  expect(screen.getByText(/∂L\/∂w₁/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Apply single-sample update" }),
  );
  expect(
    screen.getByRole("status", { name: "Training status" }),
  ).toHaveTextContent("One sample gradient-descent update applied");
  expect(
    screen.getByText(/1 additional single-sample updates/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset weights" }));
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
  expect(
    view.container.querySelectorAll(".neural-neurons button"),
  ).toHaveLength(1);
  expect(
    screen.getByRole("heading", { name: "Output neuron", exact: true }),
  ).toBeInTheDocument();
  expect(view.container.querySelector(".neural-metrics")).toHaveTextContent(
    "Parameters3",
  );
  fireEvent.click(screen.getByRole("button", { name: "Step epoch" }));
  expect(view.container.querySelector(".neural-metrics")).toHaveTextContent(
    "Full epochs1",
  );
});
test("held-out datasets and keyboard point edits remain usable", () => {
  const view = open();
  fireEvent.change(screen.getByRole("combobox", { name: "Experiment" }), {
    target: { value: "circles" },
  });
  expect(screen.getByText(/Held out \/ 16 points/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add 1 at probe" }));
  expect(
    screen.getByRole("status", { name: "Training status" }),
  ).toHaveTextContent("Data edited");
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
  expect(
    screen.getByRole("button", { name: "Train", exact: true }),
  ).toBeInTheDocument();
});
