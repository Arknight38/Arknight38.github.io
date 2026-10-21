import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, test } from "vitest";

const source = readFileSync("./public/route-init.js", "utf8");
function resolve(url, blocked = false) {
  const location = new URL(url, "https://arknight38.github.io");
  const history = {
    replaceState: (_state, _title, next) => {
      location.href = new URL(next, location).href;
    },
  };
  const sessionStorage = {
    getItem: () => {
      if (blocked) throw new Error("Storage blocked");
      return null;
    },
    removeItem: () => {},
  };
  runInNewContext(source, {
    location,
    history,
    sessionStorage,
    URLSearchParams,
  });
  return location.pathname + location.search + location.hash;
}
test("Pages fallback restores a deep link with query and section without storage", () => {
  const route = "/lab/huffman/writeup?source=archive#what-ark1-stores";
  expect(resolve("/?portfolio-route=" + encodeURIComponent(route), true)).toBe(
    route,
  );
});
test("original hash links and repository-prefixed home links remain usable", () => {
  expect(resolve("/Arknight38.github.io/#/writeups/arkvisor")).toBe(
    "/writeups/arkvisor",
  );
  expect(resolve("/Arknight38.github.io")).toBe("/");
});
test("normal routes stay intact and redirect values cannot leave the site", () => {
  expect(resolve("/lab/neural")).toBe("/lab/neural");
  const invalid = "/?portfolio-route=" + encodeURIComponent("//example.com");
  expect(resolve(invalid)).toBe(invalid);
});
