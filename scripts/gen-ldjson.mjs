import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'src', 'data', 'tools.json');
const distDir = path.join(rootDir, 'dist', 'ldjson');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const tool of data.tools) {
  const sameAs = [];
  if (tool.links?.homepage) sameAs.push(tool.links.homepage);
  if (tool.links?.twitter) sameAs.push(tool.links.twitter);
  if (tool.links?.discord) sameAs.push(tool.links.discord);
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'AI NSFW Tool',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: tool.pricing
    },
    url: `https://aiporndirect.com/tool/${tool.slug}/`,
    sameAs
  };
  const filePath = path.join(distDir, `${tool.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

console.log(`Generated ${data.tools.length} JSON-LD payloads.`);
