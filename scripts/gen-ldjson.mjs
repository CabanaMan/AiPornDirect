import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'src', 'data', 'sites.json');
const distDir = path.join(rootDir, 'dist', 'ldjson');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const site of data.sites) {
  const sameAs = [];
  if (site.website) sameAs.push(site.website);
  if (site.social?.twitter) sameAs.push(site.social.twitter);
  if (site.social?.discord) sameAs.push(site.social.discord);
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.website,
    description: site.summary,
    inLanguage: site.languages?.[0] || 'en',
    mainEntityOfPage: `https://aiporndirect.com/site/${site.slug}/`,
    sameAs
  };
  const filePath = path.join(distDir, `${site.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

console.log(`Generated ${data.sites.length} JSON-LD payloads.`);
