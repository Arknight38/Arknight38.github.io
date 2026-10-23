import { afterEach, expect, test } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Huffman from "./Huffman.jsx";
import { archive, buildModel } from "./codec.js";
afterEach(cleanup);
const open = () =>
  render(
    <MemoryRouter>
      <Huffman />
    </MemoryRouter>,
  );
test("editing text and tracing a leaf exposes the real code without creator-facing copy", () => {
  const view = open();
  const defaultBytes = new TextEncoder().encode(
    screen.getByRole("textbox", { name: "Input text" }).value,
  );
  expect(
    archive(buildModel(defaultBytes), "message.txt").bytes.length,
  ).toBeLessThan(defaultBytes.length);
  fireEvent.change(screen.getByRole("combobox", { name: "Load an example" }), {
    target: { value: "banana" },
  });
  fireEvent.click(screen.getByRole("tab", { name: /Trace codes/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Trace byte D", exact: true }),
  );
  expect(
    screen.getByText("D → 1110 · 4 bits per occurrence"),
  ).toBeInTheDocument();
  expect(view.container.textContent).not.toMatch(/your C\+\+|your Huffman/i);
  fireEvent.click(screen.getByRole("tab", { name: /Build tree/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Return to initial forest" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Next merge" }));
  expect(
    screen.getByText("Merge 1: combine weights 1 + 1 → 2."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Input/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "Input text" }), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("tab", { name: /Build tree/ }));
  expect(
    screen.getByText("Add some text to start weaving a code."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("✓ Byte-for-byte round trip verified"),
  ).toBeInTheDocument();
});
test("binary files are read locally and can be replaced with text", async () => {
  open();
  const bytes = Uint8Array.from([0, 255, 0, 13, 10]);
  fireEvent.change(screen.getByLabelText("Input file"), {
    target: {
      files: [
        {
          name: "binary.bin",
          size: bytes.length,
          arrayBuffer: async () => bytes.buffer,
        },
      ],
    },
  });
  await waitFor(() =>
    expect(
      within(screen.getByRole("group", { name: "Binary input" })).getByText(
        "binary.bin",
      ),
    ).toBeInTheDocument(),
  );
  expect(screen.getByText("5 B · binary input")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Return to text" }));
  expect(
    screen.getByRole("textbox", { name: "Input text" }),
  ).toBeInTheDocument();
});
test("archive import presents a real decoded download and rejects invalid content", async () => {
  open();
  const bytes = archive(
    buildModel(new TextEncoder().encode("archive test")),
    "recovered.txt",
  ).bytes;
  fireEvent.change(screen.getByLabelText("ARK1 archive"), {
    target: {
      files: [
        {
          name: "test.ark",
          size: bytes.length,
          arrayBuffer: async () => bytes.buffer,
        },
      ],
    },
  });
  await screen.findByText("Archive decoded");
  expect(screen.getByText("recovered.txt · 12 B")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Save decoded file" }),
  ).toBeInTheDocument();
  const invalid = new Uint8Array([0, 1, 2]);
  fireEvent.change(screen.getByLabelText("ARK1 archive"), {
    target: {
      files: [
        { name: "bad.ark", size: 3, arrayBuffer: async () => invalid.buffer },
      ],
    },
  });
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an ARK1 archive",
    ),
  );
});

test("workspace views preserve source, construction and code selection", () => {
  open();
  fireEvent.change(screen.getByRole("combobox", { name: "Load an example" }), {
    target: { value: "banana" },
  });
  const tree = screen.getByRole("tab", { name: /Build tree/ });
  fireEvent.click(tree);
  fireEvent.click(screen.getByRole("button", { name: "Next merge" }));
  fireEvent.keyDown(tree, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: /Trace codes/ })).toHaveFocus();
  fireEvent.click(
    screen.getByRole("button", { name: "Trace byte D", exact: true }),
  );
  fireEvent.change(screen.getByRole("searchbox", { name: "Find a byte" }), {
    target: { value: "D" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Bitstream preview" }));
  fireEvent.click(tree);
  expect(
    screen.getByText("Merge 1: combine weights 1 + 1 → 2."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Trace codes/ }));
  expect(screen.getByRole("searchbox")).toHaveValue("D");
  expect(
    screen.getByRole("button", { name: "Trace byte D", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: "Bitstream preview" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(
    screen.queryByRole("textbox", { name: "Input text" }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("tab", { name: /Trace codes/ }), {
    key: "Home",
  });
  expect(screen.getByRole("textbox", { name: "Input text" })).toHaveValue(
    "BANANA_BANDANA",
  );
});
test("codebook search can recover from no matches and focus mode exits with Escape", () => {
  open();
  fireEvent.click(screen.getByRole("tab", { name: /Trace codes/ }));
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "no such byte" },
  });
  expect(screen.getByText(/No matching bytes/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByRole("searchbox")).toHaveValue("");
  const toggle = screen.getByRole("button", { name: "Focus workspace" });
  fireEvent.click(toggle);
  expect(
    screen.getByRole("dialog", { name: "ARBOR workspace" }),
  ).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(toggle).toHaveFocus();
});

test("output byte pages match the downloadable archive including the header boundary", () => {
  const view = open();
  const input = new TextEncoder().encode(
    screen.getByRole("textbox", { name: "Input text" }).value,
  );
  const packed = archive(buildModel(input), "message.txt");
  fireEvent.click(screen.getByRole("tab", { name: /Output bytes/ }));
  const assertPage = (start, end) => {
    const cells = [
      ...view.container.querySelectorAll(".huff-hex-table tbody button"),
    ];
    expect(cells).toHaveLength(end - start);
    cells.forEach((cell, i) =>
      expect(cell.textContent).toBe(
        packed.bytes[start + i].toString(16).toUpperCase().padStart(2, "0"),
      ),
    );
  };
  assertPage(0, 256);
  expect(
    screen.getByRole("button", { name: /Offset 0x00000000/ }),
  ).toHaveAccessibleName(/Magic.*hex 41/);
  const boundary = packed.headerBytes
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(`Offset 0x${boundary}`) }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Encoded payload");
  fireEvent.click(screen.getByRole("button", { name: "Next bytes" }));
  assertPage(256, packed.bytes.length);
  expect(screen.getByRole("button", { name: "Next bytes" })).toBeDisabled();
  fireEvent.click(screen.getByRole("tab", { name: /Input/ }));
  fireEvent.click(screen.getByRole("tab", { name: /Output bytes/ }));
  expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Input/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "Input text" }), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("tab", { name: /Output bytes/ }));
  expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  expect(view.container.querySelectorAll(".huff-hex-payload")).toHaveLength(0);
});
