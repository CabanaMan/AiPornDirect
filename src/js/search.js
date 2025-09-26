const FLEXSEARCH_CDN = 'https://cdn.jsdelivr.net/npm/flexsearch@0.7.43/dist/flexsearch.bundle.min.js';
let documentIndex;
let indexReady;
let documents = [];

async function loadFlexSearch() {
  if (window.FlexSearch) {
    return window.FlexSearch;
  }
  try {
    const module = await import(/* @vite-ignore */ FLEXSEARCH_CDN);
    return module.default || module;
  } catch (error) {
    console.warn('FlexSearch failed to load, falling back to simple search.', error);
    return null;
  }
}

async function ensureIndex() {
  if (!indexReady) {
    indexReady = (async () => {
      const response = await fetch('/search-index.json', { cache: 'no-cache' });
      documents = await response.json();
      const FlexSearch = await loadFlexSearch();
      if (!FlexSearch) {
        return null;
      }
      documentIndex = new FlexSearch.Document({
        document: {
          id: 'slug',
          index: ['name', 'categories', 'tags', 'description', 'website']
        }
      });
      documents.forEach((doc) => documentIndex.add(doc));
      return documentIndex;
    })();
  }
  return indexReady;
}

function fallbackSearch(query) {
  if (!query) {
    return documents.map((doc) => doc.slug);
  }
  const normalized = query.toLowerCase();
  return documents
    .filter((doc) =>
      doc.name.toLowerCase().includes(normalized) ||
      (doc.description || '').toLowerCase().includes(normalized) ||
      doc.categories.some((c) => c.toLowerCase().includes(normalized)) ||
      doc.tags.some((t) => t.toLowerCase().includes(normalized)) ||
      (doc.website || '').toLowerCase().includes(normalized)
    )
    .map((doc) => doc.slug);
}

export async function createSearch() {
  await ensureIndex();
  return async function search(query) {
    if (!documents.length) {
      return [];
    }
    const trimmed = query.trim();
    if (!trimmed) {
      return documents.map((doc) => doc.slug);
    }
    const FlexSearch = window.FlexSearch;
    if (documentIndex && FlexSearch) {
      const hits = documentIndex.search(trimmed, { enrich: true });
      const slugs = new Set();
      hits.forEach((result) => {
        result.result.forEach((slug) => slugs.add(slug));
      });
      return Array.from(slugs);
    }
    return fallbackSearch(trimmed);
  };
}
