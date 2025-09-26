import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'src', 'data', 'sites.json');
const publicPath = path.join(rootDir, 'public', 'sitemap.xml');

const base = 'https://aiporndirect.com';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const siteUrls = data.sites.map((site) => `${base}/site/${site.slug}/`);
const categoryUrls = Array.from(
  new Set(
    data.sites.flatMap((site) => site.categories || []).map((category) => `${base}/category/${category}/`)
  )
);

const urls = [
  `${base}/`,
  `${base}/privacy.html`,
  `${base}/dmca.html`,
  `${base}/prohibited-content.html`,
  ...siteUrls,
  ...categoryUrls
];

const body = urls
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

fs.writeFileSync(publicPath, xml, 'utf8');
console.log(`Sitemap updated with ${urls.length} URLs.`);
