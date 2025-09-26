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

function createLdJson(tool) {
  const sameAs = [];
  if (tool.links?.homepage) sameAs.push(tool.links.homepage);
  if (tool.links?.twitter) sameAs.push(tool.links.twitter);
  if (tool.links?.discord) sameAs.push(tool.links.discord);
  return {
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
}

function sortTools(tools) {
  return [...tools].sort((a, b) => a.name.localeCompare(b.name));
}

function renderTemplate(template, context) {
  return env.render(template, {
    year: new Date().getFullYear(),
    ...context
  });
}

function buildSearchIndex(tools) {
  return tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    vendor: tool.vendor,
    categories: tool.categories || [],
    tags: tool.tags || [],
    description: tool.description
  }));
}

async function buildSite() {
  const categories = readJson(path.join(dataDir, 'categories.json'));
  const data = readJson(path.join(dataDir, 'tools.json'));
  const tools = sortTools(data.tools);

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  copyPublicAssets();
  copyStaticAssets();

  const indexHtml = renderTemplate('index.njk', {
    categories,
    tools,
    canonical: 'https://aiporndirect.com/'
  });
  writeFile(path.join(distDir, 'index.html'), indexHtml);

  categories.forEach((category) => {
    const categoryTools = tools.filter((tool) => tool.categories?.includes(category.id));
    const html = renderTemplate('category.njk', {
      title: `${category.name} — AiPornDirect`,
      description: category.description,
      category,
      tools: categoryTools,
      canonical: `https://aiporndirect.com/category/${category.id}/`
    });
    writeFile(path.join(distDir, 'category', category.id, 'index.html'), html);
  });

  tools.forEach((tool) => {
    const alternatives = tools
      .filter((candidate) => candidate.slug !== tool.slug && candidate.categories?.some((cat) => tool.categories.includes(cat)))
      .slice(0, 3);
    const html = renderTemplate('tool.njk', {
      tool,
      primaryCategory: tool.categories?.[0] || 'unknown',
      alternatives,
      ldjson: createLdJson(tool),
      canonical: `https://aiporndirect.com/tool/${tool.slug}/`
    });
    writeFile(path.join(distDir, 'tool', tool.slug, 'index.html'), html);
  });

  ['privacy', 'dmca', 'prohibited-content'].forEach((page) => {
    const html = renderTemplate(`${page}.njk`, {});
    const filename = page === 'prohibited-content' ? 'prohibited-content.html' : `${page}.html`;
    writeFile(path.join(distDir, filename), html);
  });

  const searchIndex = buildSearchIndex(tools);
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
