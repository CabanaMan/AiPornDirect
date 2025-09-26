# AiPornDirect

AiPornDirect curates an independent directory of AI porn sites gathered from manual research while keeping the static-site tooling that powered the earlier AI product directory. Each submission is validated against a schema, rendered into HTML with Nunjucks, and published with SEO-friendly enhancements like structured data, automated sitemaps, and client-side search.

## Features

- **Structured data** – `sites.json` is validated with Ajv against `src/schema/sites.schema.json`.
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

- `src/data/sites.json` – AI porn site listings gathered by the AiPornDirect editorial team, enriched with metadata and sorted by `rank`.
- `src/data/categories.json` – Canonical list of category IDs and descriptions.
- `src/schema/sites.schema.json` – JSON Schema for validating site entries.

### Updating the dataset

Because this environment blocks direct requests to adult domains, populate `src/data/sites.json` manually:

1. Collect the AI porn site names, ranks, and URLs from your own vetted research sources.
2. Map each row to the schema fields (slug, website, pricing, rating, votes, summary, highlights, etc.).
3. Save the entries in `src/data/sites.json`, keeping the object sorted by `rank`.
4. Run `npm run validate` to ensure the JSON passes schema checks before rebuilding.

The sample data shipped in this repo demonstrates the structure but is not exhaustive. Replace it with your full curated list before deploying.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for workflow expectations and editorial rules. All submissions must respect our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
