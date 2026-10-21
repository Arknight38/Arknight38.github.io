import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WriteupBody from "./WriteupBody.jsx";

afterEach(cleanup);
test("contents links target rendered headings, including repeated and formatted headings", () => {
  const writeup = {
    id: "layout-test",
    tags: ["dsp"],
    content:
      "## **A filter**\n\nFirst section.\n\n## A filter\n\nSecond section.\n\n```js\n## not a heading\n```",
  };
  render(
    <MemoryRouter>
      <WriteupBody writeup={writeup} />
    </MemoryRouter>,
  );
  const nav = screen.getByRole("navigation", { name: "On this page" });
  const links = within(nav).getAllByRole("link");
  expect(links).toHaveLength(2);
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "#article-a-filter",
    "#article-a-filter-2",
  ]);
  for (const link of links)
    expect(document.getElementById(link.hash.slice(1))).toBeInTheDocument();
  expect(screen.getByText("First section.")).toBeInTheDocument();
  expect(screen.getByText("Second section.")).toBeInTheDocument();
});
