import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicPath = path.join(rootDir, 'public', 'sitemap.xml');
const rootSitemapPath = path.join(rootDir, 'sitemap.xml');
const sitemapIndexPath = path.join(rootDir, 'sitemap-index.xml');

const base = process.env.SITEMAP_BASE?.replace(/\/+$/u, '') || 'https://aiporndirect.com';

const canonicalDocuments = ['privacy.txt', 'terms.txt'];

const urls = [
  `${base}/`,
  ...canonicalDocuments.map((doc) => `${base}/${doc}`)
];

const buildSitemap = (entries) => {
  const body = entries.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

const xml = buildSitemap(urls);
const today = new Date().toISOString().split('T')[0];

fs.writeFileSync(publicPath, xml, 'utf8');
fs.writeFileSync(rootSitemapPath, xml, 'utf8');

const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${base}/sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n</sitemapindex>\n`;

fs.writeFileSync(sitemapIndexPath, indexXml, 'utf8');

console.log(`Sitemap updated with ${urls.length} URLs.`);
