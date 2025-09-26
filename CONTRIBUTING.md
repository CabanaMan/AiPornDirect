# Contributing to AiPornDirect

Thanks for helping build a transparent, safety-first directory of AI porn sites for adults.

## Workflow

1. **Discuss** – Open an issue using the appropriate template before submitting a pull request.
2. **Fork and branch** – Use `feat/*` or `fix/*` branch names. Main is protected.
3. **Validate data** – Run `npm run validate` to ensure new entries in `src/data/sites.json` satisfy the JSON schema and editorial checks.
4. **Build locally** – Run `npm run build` to render templates into `/dist`. Preview static files with any HTTP server.
5. **Tests** – `npm run check` executes validation and the build pipeline. CI must pass before merge.
6. **PR style** – Use Conventional Commits in your branch history. Summaries should mention compliance considerations.

## Adding a site

- Collect the details requested in the issue template (rank, URL, pricing, summary, highlights, tags, and provenance).
- Add the record to `src/data/sites.json`, keeping entries sorted by rank and ensuring the slug matches the URL.
- Ensure descriptions are unique (200+ words recommended) and include compliance, safety, and monetization context.
- Update `lastChecked` with the review date.

## Content standards

- We refuse listings that allow CSAM, non-consensual content, real-person deepfakes without consent, or other illegal material.
- Every site must disclose its age gate, consent, and moderation approach.
- Affiliate links are welcome but must be marked in the JSON entry.

## Need help?

Email [team@aiporndirect.com](mailto:team@aiporndirect.com) or join our private maintainer channel.
