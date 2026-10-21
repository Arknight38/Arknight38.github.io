import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next === "light" ? "#faf7fc" : "#111210");
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch {
      /* Theme still works when browser storage is unavailable. */
    }
    setTheme(next);
  }
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
