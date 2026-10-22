import { afterEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Mnemosyne from "./Mnemosyne.jsx";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const open = () =>
  render(
    <MemoryRouter>
      <Mnemosyne />
    </MemoryRouter>,
  );
test("memory states step backward and replay without losing the current program", () => {
  open();
  const summary = screen.getByRole("region", { name: "MNEMOSYNE summary" });
  fireEvent.click(screen.getByRole("button", { name: "Next event" }));
  expect(summary).toHaveTextContent("Heap 8 / 704 B");
  fireEvent.click(screen.getByRole("button", { name: "Previous event" }));
  expect(summary).toHaveTextContent("Heap 0 / 704 B");
  fireEvent.click(screen.getByRole("button", { name: "Next event" }));
  expect(summary).toHaveTextContent("Event 1");
  fireEvent.click(screen.getByRole("tab", { name: /Analysis/ }));
  expect(screen.getByText("Reserved heap").parentElement).toHaveTextContent(
    "8 B",
  );
  fireEvent.click(screen.getByRole("tab", { name: /Memory/ }));
  expect(summary).toHaveTextContent("Event 1");
});
test("trace filtering selects an allocation lifetime and maps events back to bytes", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Run to end" }));
  fireEvent.change(screen.getByLabelText("Live object"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Trace this object" }));
  expect(screen.getByLabelText("Allocation filter")).toHaveValue("1");
  fireEvent.change(screen.getByLabelText("Event type"), {
    target: { value: "write" },
  });
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(3);
  fireEvent.click(within(rows[1]).getByRole("button", { name: "Show bytes" }));
  expect(screen.getByRole("tab", { name: /Memory/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    screen.getByRole("heading", { name: "Selected trace event" }),
  ).toBeInTheDocument();
});
test("record interpretation and reset use the selected demonstration", () => {
  open();
  fireEvent.change(screen.getByLabelText("Program", { exact: true }), {
    target: { value: "record" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run to end" }));
  fireEvent.click(screen.getByRole("tab", { name: /Structures/ }));
  fireEvent.change(screen.getByLabelText("Interpret address (decimal)"), {
    target: { value: "4164" },
  });
  fireEvent.change(screen.getByLabelText("Interpretation", { exact: true }), {
    target: { value: "float" },
  });
  expect(screen.getByText("3.5", { exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset program" }));
  expect(
    screen.getByRole("region", { name: "MNEMOSYNE summary" }),
  ).toHaveTextContent("Event 0");
});

test("trace inspection restores event-time bytes and retains future replay", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Run to end" }));
  fireEvent.click(screen.getByRole("tab", { name: /Trace/ }));
  fireEvent.change(screen.getByLabelText("Event type"), {
    target: { value: "write" },
  });
  const firstWrite = screen.getAllByRole("row")[1];
  fireEvent.click(
    within(firstWrite).getByRole("button", { name: "Show bytes" }),
  );
  const summary = screen.getByRole("region", { name: "MNEMOSYNE summary" });
  expect(summary).toHaveTextContent("Event 2");
  expect(summary).toHaveTextContent("Heap 8 / 704 B");
  expect(screen.getByText("2A 00 00 00 00 00 00 00")).toBeInTheDocument();
  expect(screen.getByLabelText("Follow memory activity")).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Next event" }));
  expect(summary).toHaveTextContent("Event 3");
  fireEvent.click(screen.getByRole("button", { name: "Run to end" }));
  expect(summary).toHaveTextContent("Event 20");
});
test("manual object and address selection pause playback and disable following", () => {
  open();
  fireEvent.click(screen.getByRole("button", { name: "Next event" }));
  fireEvent.click(screen.getByRole("button", { name: "Run", exact: true }));
  fireEvent.change(screen.getByLabelText("Live object"), {
    target: { value: "0" },
  });
  expect(
    screen.getByRole("region", { name: "MNEMOSYNE summary" }),
  ).toHaveTextContent("Paused");
  expect(screen.getByLabelText("Follow memory activity")).not.toBeChecked();
  fireEvent.click(screen.getByLabelText("Follow memory activity"));
  fireEvent.change(screen.getByLabelText("Inspect address (decimal)"), {
    target: { value: "4160" },
  });
  expect(screen.getByLabelText("Follow memory activity")).not.toBeChecked();
});
