#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

function extractTag(content, tag) {
  const match = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractMeta(content, name) {
  const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  const match = content.match(regex);
  if (!match) return '';
  const contentMatch = match[0].match(/content=["']([^"']*)["']/i);
  return contentMatch ? contentMatch[1].trim() : '';
}

function extractCanonical(content) {
  const regex = /<link[^>]+rel=["']canonical["'][^>]*>/i;
  const match = content.match(regex);
  if (!match) return '';
  const hrefMatch = match[0].match(/href=["']([^"']*)["']/i);
  return hrefMatch ? hrefMatch[1].trim() : '';
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonLdCount(content) {
  const matches = content.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi);
  return matches ? matches.length : 0;
}

function extractLinks(content, baseUrl) {
  const hrefs = new Set();
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const raw = match[1];
    if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#')) continue;
    try {
      const url = new URL(raw, baseUrl);
      if (url.origin === baseUrl.origin) {
        url.hash = '';
        hrefs.add(url.toString());
      }
    } catch (error) {
      // ignore invalid URLs
    }
  }
  return Array.from(hrefs);
}

async function checkLinks(urls) {
  const issues = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        let response = await fetch(url, { method: 'HEAD' });
        if (response.status === 405 || response.status === 501) {
          response = await fetch(url, { method: 'GET' });
        }
        if (!response.ok) {
          issues.push({ url, status: response.status });
        }
      } catch (error) {
        issues.push({ url, status: 'FETCH_ERROR' });
      }
    })
  );
  return issues;
}

function writeCsv(filePath, rows) {
  if (!rows.length) {
    return writeFile(filePath, 'type,page,value\n', 'utf8');
  }
  const header = Object.keys(rows[0]).join(',');
  const lines = rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  return writeFile(filePath, `${header}\n${lines.join('\n')}\n`, 'utf8');
}

async function loadData() {
  const [categoriesRaw, listingsRaw] = await Promise.all([
    readFile(resolve('data/categories.json'), 'utf8'),
    readFile(resolve('data/listings.json'), 'utf8')
  ]);
  const categories = JSON.parse(categoriesRaw).categories || [];
  const listings = JSON.parse(listingsRaw).listings || [];
  return { categories, listings };
}

async function auditPage(url, baseUrl) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const content = await response.text();
  const title = extractTag(content, 'title');
  const description = extractMeta(content, 'description');
  const canonical = extractCanonical(content);
  const h1Count = (content.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).length;
  const wordCount = stripTags(content).split(' ').filter(Boolean).length;
  const jsonLdCount = extractJsonLdCount(content);
  const links = extractLinks(content, baseUrl);
  const brokenLinks = await checkLinks(links);

  return {
    url,
    title,
    description,
    canonical,
    h1Count,
    wordCount,
    jsonLdCount,
    brokenLinks,
    links
  };
}

function normaliseUrl(url) {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.toString();
}

async function main() {
  const args = parseArgs(process.argv);
  const base = args.base || 'https://aiporndirect.com/';
  const baseUrl = new URL(base);

  const { categories } = await loadData();

  const targetUrls = new Set([normaliseUrl(baseUrl.toString())]);
  categories.forEach((category) => {
    if (category.path) {
      const url = new URL(category.path, baseUrl);
      targetUrls.add(normaliseUrl(url.toString()));
    }
  });

  const pages = [];
  for (const url of targetUrls) {
    try {
      const result = await auditPage(url, baseUrl);
      pages.push(result);
    } catch (error) {
      console.error(error.message);
    }
  }

  const titleMap = new Map();
  const descriptionMap = new Map();
  const duplicates = [];
  const errors = [];
  const thin = [];

  pages.forEach((page) => {
    if (page.title) {
      if (!titleMap.has(page.title)) {
        titleMap.set(page.title, []);
      }
      titleMap.get(page.title).push(page.url);
    }

    if (page.description) {
      if (!descriptionMap.has(page.description)) {
        descriptionMap.set(page.description, []);
      }
      descriptionMap.get(page.description).push(page.url);
    }

    if (!page.canonical) {
      errors.push({ type: 'missing_canonical', page: page.url, value: '' });
    }
    if (!page.description) {
      errors.push({ type: 'missing_description', page: page.url, value: '' });
    }
    if (page.h1Count !== 1) {
      errors.push({ type: 'h1_count', page: page.url, value: page.h1Count });
    }
    if (page.jsonLdCount < 1) {
      errors.push({ type: 'jsonld_missing', page: page.url, value: page.jsonLdCount });
    }
    if (page.brokenLinks.length) {
      page.brokenLinks.forEach((link) => {
        errors.push({ type: 'broken_link', page: page.url, value: `${link.url} (${link.status})` });
      });
    }
    if (page.wordCount < 200) {
      thin.push({ type: 'thin_content', page: page.url, value: page.wordCount });
    }
  });

  titleMap.forEach((urls, title) => {
    if (urls.length > 1) {
      duplicates.push({ type: 'duplicate_title', page: urls.join('|'), value: title });
    }
  });

  descriptionMap.forEach((urls, description) => {
    if (urls.length > 1) {
      duplicates.push({ type: 'duplicate_description', page: urls.join('|'), value: description });
    }
  });

  await Promise.all([
    writeCsv(resolve('duplicates.csv'), duplicates),
    writeCsv(resolve('errors.csv'), errors),
    writeCsv(resolve('thin.csv'), thin)
  ]);

  console.log(`Audited ${pages.length} page(s). Results saved to duplicates.csv, errors.csv, and thin.csv.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
