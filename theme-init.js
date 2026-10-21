// Apply the saved palette before the app paints. Dark is the portfolio default.
try {
  const theme = localStorage.getItem("portfolio-theme") === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#faf7fc" : "#111210");
} catch {
  document.documentElement.dataset.theme = "dark";
}
