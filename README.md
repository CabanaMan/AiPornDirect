# AiPornDirect

AiPornDirect is a static directory for mature AI products. The project validates contributor data against a strict JSON Schema, renders Nunjucks templates to HTML, and ships SEO-friendly enhancements like structured data, sitemaps, and client-side search.

## Features

- **Structured data** – `tools.json` is validated with Ajv against `src/schema/tools.schema.json`.
- **Static generation** – `scripts/build.mjs` renders templates into `/dist` using Nunjucks.
- **Search** – FlexSearch-powered JSON index enables fast client-side filtering.
- **SEO** – Automated sitemap, JSON-LD payloads, and age gate that preserves crawler access.
- **CI** – GitHub Actions run validation and the build on every push and pull request.

## Getting started

```bash
npm install
npm run check
```

During development run:

```bash
npm run dev
```

The watcher rebuilds `dist/` when templates, data, or public assets change. Preview the site locally with any static server, for example `npx http-server dist`.

## Data model

- `src/data/tools.json` – Directory entries that adhere to the schema and editorial guidelines.
- `src/data/categories.json` – Canonical list of category IDs and descriptions.
- `src/schema/tools.schema.json` – JSON Schema for validating tool entries.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for workflow expectations and editorial rules. All submissions must respect our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
