# AiPornDirect Static Directory

AiPornDirect is a static, adult-only directory that curates compliant AI pornography generators, voice tools, marketplaces, and chat companions. The site is built from JSON data, rendered in the browser, and deployable to any static host such as Vercel or Netlify.

## Project structure

```
index.html            # Main landing page with age gate and directory layout
styles.css            # Core styles tuned for low CLS and fast rendering
script.js             # Client-side rendering, search, and structured data injection
data/                 # JSON sources for categories and listings
partials/             # Shared HTML snippets (head, breadcrumbs, related blocks)
assets/js/            # Node utilities for sitemap and QA automation
privacy.txt, terms.txt
robots.txt, sitemap.xml, sitemap-index.xml
vercel.json           # Hosting headers and security policy
images/               # SVG artwork used for hero and listing thumbnails
```

## Requirements

* Node.js 18 or later (uses the built-in `fetch` API and ES modules)
* No build step is required—deploy the root directory as static assets.

## Commands

### Generate sitemaps

```
node assets/js/generate-sitemaps.js --base https://aiporndirect.com
```

* Reads `data/categories.json` and `data/listings.json`.
* Writes `sitemap.xml` (and additional files if the URL count exceeds 50,000) and a coordinating `sitemap-index.xml`.
* Always include the absolute production base URL when running before deployment.

### Run the QA audit

```
node assets/js/qa-audit.js --base https://aiporndirect.com
```

* Crawls the homepage and any internal URLs derived from `data/categories.json`.
* Checks for duplicate titles/descriptions, canonical tags, JSON-LD blocks, single-H1 enforcement, thin content, and broken internal links.
* Outputs CSV reports in the project root: `duplicates.csv`, `errors.csv`, and `thin.csv`.

### Lighthouse (Core Web Vitals budget)

Target budgets (mobile, 4G throttling):

* **Largest Contentful Paint (LCP):** ≤ 2.5 s
* **Cumulative Layout Shift (CLS):** ≤ 0.10
* **Total Blocking Time (TBT):** ≤ 200 ms

Run Lighthouse in headless mode after starting a local server (for example with `npx http-server .`):

```
npx lighthouse https://localhost:8080 --preset=perf --throttling.cpuSlowdownMultiplier=4 --throttling.rttMs=150 --throttling.throughputKbps=1638 --form-factor=mobile --view
```

## Deployment (Vercel)

1. Push the repository to Vercel and select the root directory as the project.
2. Ensure the build command is left empty and the output directory is `.`.
3. After each deployment, verify:
   * `https://aiporndirect.com/robots.txt` – confirms crawl directives and sitemap reference.
   * `https://aiporndirect.com/sitemap.xml` and `https://aiporndirect.com/sitemap-index.xml` – confirm the generated URLs and `<lastmod>` timestamps.
   * The age gate modal appears before content and respects localStorage for returning adults.
4. Use the QA audit script before every release to catch regressions.

## Compliance and safety

* Every outbound affiliate link includes `rel="sponsored nofollow"`.
* Listings are rendered only after the 18+ confirmation flag is stored in localStorage.
* No assets or copy mention minors. The privacy and terms documents reiterate the adults-only policy.

## Testing locally

Serve the directory using any static server (for example `npx http-server .`) and visit `http://localhost:8080/`. Confirm:

* Only one `<h1>` renders per page.
* Breadcrumb navigation and related blocks appear for each category.
* FAQ accordions expand/collapse correctly and remain keyboard accessible.
