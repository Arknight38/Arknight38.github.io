# Saku Grossarth — Portfolio

Electrical and computer engineering projects, technical writeups, and interactive experiments.

[Live portfolio](https://arknight38.github.io/)

## Development

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

```sh
npm run lint
npm run test:run
npm run build
npm run preview
```

## Source

- `src/app/`: portfolio pages, navigation, article reader, and theme palettes.
- `src/data/writeups/`: preserved project articles and metadata.
- `src/experiments/spectra/`: signal generation, FFT, biquad filtering, and plots.
- `src/experiments/huffman/`: ARK1 compression, tree construction, and byte inspection.
- `src/experiments/neural/`: network training, decision maps, and gradient tracing.
- `src/experiments/shared/`: separate lab writeups and experiment/reading navigation.
- `public/`: favicon, routing fallback, theme initialization, robots, and sitemap.

Experiment READMEs document numerical behavior, archive compatibility, and verification. Processing stays in the browser; no backend or private credentials are needed. The selected light/dark palette is saved locally when browser storage is available.

## Publishing

GitHub Actions runs lint, tests, and a production build for pull requests and pushes to `master` or `main`. A successful push to `master` publishes that validated build to the existing `gh-pages` branch. GitHub Pages serves that branch at the live URL above.

The sitemap is generated from the article index during the build. Clean URLs use `public/404.html` to return to the app; original hash-style links are also supported. Build output (`dist/`), dependencies, and local development drafts are excluded from source control.
