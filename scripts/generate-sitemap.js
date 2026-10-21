import { writeFileSync } from "fs";
import { writeups } from "../src/data/writeups/index.js";

const siteUrl = "https://arknight38.github.io";

const staticRoutes = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "work", priority: "0.8", changefreq: "weekly" },
  { path: "lab", priority: "0.8", changefreq: "monthly" },
  { path: "writeups", priority: "0.9", changefreq: "weekly" },
  { path: "about", priority: "0.7", changefreq: "monthly" },
];

staticRoutes.push({ path: "resume", priority: "0.7", changefreq: "monthly" });

staticRoutes.push({
  path: "lab/spectra",
  priority: "0.8",
  changefreq: "monthly",
});

staticRoutes.push({
  path: "lab/huffman",
  priority: "0.8",
  changefreq: "monthly",
});

staticRoutes.push({
  path: "lab/neural",
  priority: "0.8",
  changefreq: "monthly",
});

for (const lab of ["kepler", "silicon", "resonance"])
  staticRoutes.push({
    path: `lab/${lab}`,
    priority: "0.8",
    changefreq: "monthly",
  });

for (const lab of [
  "spectra",
  "huffman",
  "neural",
  "kepler",
  "silicon",
  "resonance",
])
  staticRoutes.push({
    path: `lab/${lab}/writeup`,
    priority: "0.7",
    changefreq: "monthly",
  });

const dynamicRoutes = writeups.map((writeup) => ({
  path: `writeups/${writeup.id}`,
  priority: "0.8",
  changefreq: "monthly",
  lastmod: /^\d{4}$/.test(writeup.date) ? `${writeup.date}-01-01` : undefined,
}));

const allRoutes = [...staticRoutes, ...dynamicRoutes];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}/${route.path}</loc>
${route.lastmod ? `    <lastmod>${route.lastmod}</lastmod>\n` : ""}    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

writeFileSync("./public/sitemap.xml", sitemap);
console.log("Sitemap generated successfully!");
