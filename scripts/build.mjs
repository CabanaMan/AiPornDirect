import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nunjucks from 'nunjucks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const templateDir = path.join(srcDir, 'templates');
const dataDir = path.join(srcDir, 'data');
const cssDir = path.join(srcDir, 'css');
const jsDir = path.join(srcDir, 'js');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

function titleCase(value = '') {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const env = nunjucks.configure(templateDir, {
  autoescape: true,
  noCache: true
});

env.addFilter('title', titleCase);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeFile(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

function copyPublicAssets() {
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }
}

function copyStaticAssets() {
  if (fs.existsSync(cssDir)) {
    fs.cpSync(cssDir, path.join(distDir, 'css'), { recursive: true });
  }
  if (fs.existsSync(jsDir)) {
    fs.cpSync(jsDir, path.join(distDir, 'js'), { recursive: true });
  }
}

function createLdJson(site) {
  const sameAs = [];
  if (site.website) sameAs.push(site.website);
  if (site.social?.twitter) sameAs.push(site.social.twitter);
  if (site.social?.discord) sameAs.push(site.social.discord);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.website,
    description: site.summary,
    inLanguage: site.languages?.[0] || 'en',
    mainEntityOfPage: `https://aiporndirect.com/site/${site.slug}/`,
    sameAs
  };
}

function sortSites(sites) {
  return [...sites].sort((a, b) => {
    if (typeof a.rank === 'number' && typeof b.rank === 'number') {
      return a.rank - b.rank;
    }
    return a.name.localeCompare(b.name);
  });
}

function renderTemplate(template, context) {
  return env.render(template, {
    year: new Date().getFullYear(),
    ...context
  });
}

function buildSearchIndex(sites) {
  return sites.map((site) => ({
    slug: site.slug,
    name: site.name,
    categories: site.categories || [],
    tags: site.tags || [],
    description: site.summary,
    website: site.website
  }));
}

async function buildSite() {
  const categories = readJson(path.join(dataDir, 'categories.json'));
  const data = readJson(path.join(dataDir, 'sites.json'));
  const sites = sortSites(data.sites);

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  copyPublicAssets();
  copyStaticAssets();

  const latestCheck = sites.reduce((latest, site) => {
    if (!site.lastChecked) return latest;
    const current = new Date(site.lastChecked);
    if (!latest || current > latest) {
      return current;
    }
    return latest;
  }, null);
  const lastUpdated = latestCheck ? latestCheck.toISOString().slice(0, 10) : null;

  const indexHtml = renderTemplate('index.njk', {
    categories,
    sites,
    lastUpdated,
    canonical: 'https://aiporndirect.com/'
  });
  writeFile(path.join(distDir, 'index.html'), indexHtml);

  categories.forEach((category) => {
    const categorySites = sites.filter((site) => site.categories?.includes(category.id));
    const html = renderTemplate('category.njk', {
      title: `${category.name} — AiPornDirect`,
      description: category.description,
      category,
      sites: categorySites,
      lastUpdated,
      canonical: `https://aiporndirect.com/category/${category.id}/`
    });
    writeFile(path.join(distDir, 'category', category.id, 'index.html'), html);
  });

  sites.forEach((site) => {
    const alternatives = sites
      .filter((candidate) => candidate.slug !== site.slug && candidate.categories?.some((cat) => site.categories.includes(cat)))
      .slice(0, 3);
    const html = renderTemplate('site.njk', {
      site,
      primaryCategory: site.categories?.[0] || 'unknown',
      alternatives,
      ldjson: createLdJson(site),
      canonical: `https://aiporndirect.com/site/${site.slug}/`
    });
    writeFile(path.join(distDir, 'site', site.slug, 'index.html'), html);
  });

  ['privacy', 'dmca', 'prohibited-content'].forEach((page) => {
    const html = renderTemplate(`${page}.njk`, {});
    const filename = page === 'prohibited-content' ? 'prohibited-content.html' : `${page}.html`;
    writeFile(path.join(distDir, filename), html);
  });

  const searchIndex = buildSearchIndex(sites);
  writeFile(path.join(distDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log('Build complete.');
}

function watch() {
  console.log('Watching for changes...');
  let building = false;
  let queued = false;

  const triggerBuild = () => {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    buildSite()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        building = false;
        if (queued) {
          queued = false;
          triggerBuild();
        }
      });
  };

  triggerBuild();

  const watcher = fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (filename.startsWith('dist')) return;
    if (filename.startsWith('node_modules')) return;
    triggerBuild();
  });

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
}

if (process.argv.includes('--watch')) {
  watch();
} else {
  buildSite().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
