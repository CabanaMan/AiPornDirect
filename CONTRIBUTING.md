# Contributing to AiPornDirect

Thanks for helping build a transparent, safety-first directory of AI tools for adults.

## Workflow

1. **Discuss** – Open an issue using the appropriate template before submitting a pull request.
2. **Fork and branch** – Use `feat/*` or `fix/*` branch names. Main is protected.
3. **Validate data** – Run `npm run validate` to ensure new entries satisfy the JSON schema and editorial checks.
4. **Build locally** – Run `npm run build` to render templates into `/dist`. Preview static files with any HTTP server.
5. **Tests** – `npm run check` executes validation and the build pipeline. CI must pass before merge.
6. **PR style** – Use Conventional Commits in your branch history. Summaries should mention compliance considerations.

## Adding a tool

- Copy the `new_tool.yml` issue template fields into `src/data/tools.json` once approved.
- Ensure descriptions are unique (200+ words recommended) and include compliance, safety, and monetization context.
- Update `updatedAt` with the review date.

## Content standards

- We refuse listings that allow CSAM, non-consensual content, real-person deepfakes without consent, or other illegal material.
- Every tool must disclose its age gate, consent, and moderation approach.
- Affiliate links are welcome but must be marked in the JSON entry.

## Need help?

Email [team@aiporndirect.com](mailto:team@aiporndirect.com) or join our private maintainer channel.
