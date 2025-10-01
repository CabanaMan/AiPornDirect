#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const MAX_URLS_PER_MAP = 50000;

function parseArgs(argv) {
  return argv.slice(2).reduce((acc, arg, index, array) => {
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = array[index + 1] && !array[index + 1].startsWith('--') ? array[index + 1] : true;
      acc[key] = value;
    }
    return acc;
  }, {});
}

function isoDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString();
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function buildUrlEntry(base, path, lastmod) {
  const url = new URL(path, base).toString();
  return { loc: url, lastmod: isoDate(lastmod) };
}

function buildXml(urls) {
  const nodes = urls
    .map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes}\n</urlset>\n`;
}

function buildIndexXml(base, maps) {
  const nodes = maps
    .map(({ filename, lastmod }) => {
      const loc = new URL(filename, base).toString();
      return `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes}\n</sitemapindex>\n`;
}

async function main() {
  const args = parseArgs(process.argv);
  const base = args.base || 'https://aiporndirect.com/';

  if (!base.startsWith('http')) {
    console.error('Base URL must include protocol, e.g. https://aiporndirect.com');
    process.exit(1);
  }

  const rootLastmod = isoDate();
  const categoriesPath = resolve('data/categories.json');
  const listingsPath = resolve('data/listings.json');

  const [categoriesRaw, listingsRaw] = await Promise.all([
    readFile(categoriesPath, 'utf8'),
    readFile(listingsPath, 'utf8')
  ]);

  const categories = JSON.parse(categoriesRaw).categories || [];
  const listings = JSON.parse(listingsRaw).listings || [];

  const urls = [buildUrlEntry(base, '/', rootLastmod)];

  categories.forEach((category) => {
    const categoryListings = listings.filter((listing) => listing.categories.includes(category.id));
    const lastmod = categoryListings.reduce((latest, listing) => {
      const reviewed = listing.lastReviewed ? new Date(listing.lastReviewed) : null;
      if (!reviewed) return latest;
      if (!latest || reviewed > latest) {
        return reviewed;
      }
      return latest;
    }, null);
    urls.push(buildUrlEntry(base, category.path || `/#${category.slug}`, lastmod ? lastmod.toISOString() : rootLastmod));
  });

  listings.forEach((listing) => {
    urls.push(buildUrlEntry(base, `/#${listing.slug}`, listing.lastReviewed || rootLastmod));
  });

  if (urls.length <= MAX_URLS_PER_MAP) {
    const xml = buildXml(urls);
    await writeFile(resolve('sitemap.xml'), xml, 'utf8');
    await writeFile(resolve('sitemap-index.xml'), buildIndexXml(base, [
      { filename: 'sitemap.xml', lastmod: isoDate() }
    ]), 'utf8');
    console.log(`Sitemap written with ${urls.length} URLs.`);
    return;
  }

  const chunks = chunkArray(urls, MAX_URLS_PER_MAP);
  const indexEntries = [];

  await Promise.all(
    chunks.map(async (chunk, chunkIndex) => {
      const filename = chunkIndex === 0 ? 'sitemap.xml' : `sitemap-${chunkIndex + 1}.xml`;
      const xml = buildXml(chunk);
      await writeFile(resolve(filename), xml, 'utf8');
      indexEntries.push({ filename, lastmod: isoDate() });
    })
  );

  indexEntries.sort((a, b) => a.filename.localeCompare(b.filename));
  const indexXml = buildIndexXml(base, indexEntries);
  await writeFile(resolve('sitemap-index.xml'), indexXml, 'utf8');
  console.log(`Generated sitemap index with ${chunks.length} files and ${urls.length} URLs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
