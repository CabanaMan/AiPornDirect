const storageKey = 'aiporndirect-age-confirmed';

async function fetchJSON(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

function confirmAge() {
  localStorage.setItem(storageKey, 'true');
  const ageGate = document.getElementById('age-gate');
  const main = document.getElementById('main-content');
  if (ageGate) {
    ageGate.remove();
  }
  if (main) {
    main.hidden = false;
    main.focus();
  }
}

function setupAgeGate() {
  const button = document.getElementById('age-confirm');
  if (localStorage.getItem(storageKey) === 'true') {
    confirmAge();
    return;
  }
  if (button) {
    button.addEventListener('click', () => {
      confirmAge();
    });
  }
}

function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.className) {
    el.className = options.className;
  }
  if (options.text) {
    el.textContent = options.text;
  }
  if (options.html) {
    el.innerHTML = options.html;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, value);
      }
    });
  }
  return el;
}

function injectItemListJSONLD(sectionName, urls){
  if (!urls || !urls.length) return;
  const el=document.createElement('script');
  el.type='application/ld+json';
  el.textContent=JSON.stringify({
    "@context":"https://schema.org",
    "@type":"ItemList",
    "name":sectionName,
    "itemListElement": urls.map((u,i)=>({
      "@type":"ListItem","position":i+1,"url":u
    }))
  });
  document.head.appendChild(el);
}

async function loadPartial(selector, url) {
  const container = document.querySelector(selector);
  if (!container) return;
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return;
    const html = await res.text();
    container.innerHTML = html;
  } catch (error) {
    console.warn('Partial failed to load', url, error);
  }
}

function renderBreadcrumbs() {
  const container = document.getElementById('breadcrumb-container');
  if (!container) return;
  container.innerHTML = '';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.className = 'breadcrumb';
  const list = document.createElement('ol');
  list.className = 'breadcrumb-list';

  const items = [
    { name: 'Home', url: '/' },
    { name: 'AI Porn Tools Directory', url: '#main-content' }
  ];

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    if (index < items.length - 1) {
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.name;
      li.appendChild(link);
    } else {
      li.textContent = item.name;
      li.setAttribute('aria-current', 'page');
    }
    list.appendChild(li);
  });

  nav.appendChild(list);
  container.appendChild(nav);

  const breadcrumbJson = document.getElementById('breadcrumb-jsonld');
  if (breadcrumbJson) {
    breadcrumbJson.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `https://aiporndirect.com${item.url}`
      }))
    });
  }
}

function buildListingCard(listing) {
  const article = createElement('article', {
    className: 'listing-card',
    attrs: {
      id: listing.slug,
      'data-tags': listing.tags.join(' '),
      'data-name': listing.name.toLowerCase()
    }
  });

  const media = createElement('div', { className: 'listing-media' });
  const picture = document.createElement('picture');
  const img = createElement('img', {
    className: 'card-thumb',
    attrs: {
      src: listing.image?.src || '',
      alt: `${listing.name} screenshot`,
      width: 320,
      height: 180,
      loading: 'lazy',
      decoding: 'async'
    }
  });
  picture.appendChild(img);
  media.appendChild(picture);
  article.appendChild(media);

  const content = createElement('div', { className: 'listing-content' });
  const title = createElement('h3', { text: listing.name });
  content.appendChild(title);

  const summary = createElement('p', { className: 'listing-summary', text: listing.summary });
  content.appendChild(summary);

  const featureList = createElement('ul', { className: 'listing-features' });
  listing.features.forEach((feature) => {
    const li = createElement('li', { text: feature });
    featureList.appendChild(li);
  });
  content.appendChild(featureList);

  const meta = createElement('div', { className: 'listing-meta' });
  meta.appendChild(createElement('span', { className: 'badge', text: listing.pricing }));
  listing.tags.forEach((tag) => {
    meta.appendChild(createElement('span', { className: 'badge', text: tag }));
  });
  content.appendChild(meta);

  const link = createElement('a', {
    className: 'button-link',
    text: `Visit ${listing.name}`,
    attrs: {
      href: listing.url,
      target: '_blank',
      rel: 'sponsored nofollow noopener'
    }
  });
  content.appendChild(link);

  const disclosure = createElement('p', {
    className: 'disclosure-text',
    text: listing.disclosure
  });
  content.appendChild(disclosure);

  article.appendChild(content);
  return article;
}

function buildRelatedBlock(category, categories, listingsMap) {
  const relatedContainer = createElement('div', { className: 'related-block' });
  const relatedCategories = createElement('div');
  const relatedCategoriesTitle = createElement('h3', { text: 'Related categories' });
  const relatedCatList = createElement('ul', { className: 'related-list' });

  category.relatedCategories.forEach((relatedId) => {
    const related = categories.find((cat) => cat.id === relatedId);
    if (!related) return;
    const li = document.createElement('li');
    const link = createElement('a', {
      text: related.name,
      attrs: { href: related.path }
    });
    li.appendChild(link);
    relatedCatList.appendChild(li);
  });

  relatedCategories.appendChild(relatedCategoriesTitle);
  relatedCategories.appendChild(relatedCatList);
  relatedContainer.appendChild(relatedCategories);

  const relatedToolsTitle = createElement('h3', { text: 'Related tools' });
  const relatedToolsList = createElement('ul', { className: 'related-list' });

  category.relatedTools.forEach((listingId) => {
    const listing = listingsMap.get(listingId);
    if (!listing) return;
    const li = document.createElement('li');
    const link = createElement('a', {
      text: listing.name,
      attrs: { href: `#${listing.slug}` }
    });
    li.appendChild(link);
    relatedToolsList.appendChild(li);
  });

  relatedContainer.appendChild(relatedToolsTitle);
  relatedContainer.appendChild(relatedToolsList);
  return relatedContainer;
}

function renderCategories(categories, listings) {
  const container = document.getElementById('category-sections');
  if (!container) return;
  container.innerHTML = '';
  const listingsMap = new Map(listings.map((item) => [item.id, item]));

  categories.forEach((category, index) => {
    const section = createElement('section', {
      className: 'category',
      attrs: {
        id: category.id,
        tabindex: '-1',
        'data-category-position': String(index + 1)
      }
    });

    const header = createElement('div', { className: 'category-header' });
    const textWrapper = createElement('div');
    const heading = createElement('h2', { text: category.name });
    heading.id = `${category.id}-heading`;
    textWrapper.appendChild(heading);
    const description = createElement('p', { className: 'category-description', text: category.description });
    textWrapper.appendChild(description);
    header.appendChild(textWrapper);

    const figure = createElement('figure');
    const picture = document.createElement('picture');
    const img = createElement('img', {
      attrs: {
        src: category.heroImage,
        alt: `${category.name} illustration`,
        width: 720,
        height: 480,
        loading: 'lazy',
        decoding: 'async'
      }
    });
    picture.appendChild(img);
    figure.appendChild(picture);
    header.appendChild(figure);

    section.appendChild(header);

    const categoryListings = listings.filter((listing) => listing.categories.includes(category.id));
    const grid = createElement('div', { className: 'listing-grid' });

    categoryListings.forEach((listing) => {
      grid.appendChild(buildListingCard(listing));
    });

    section.appendChild(grid);
    section.appendChild(buildRelatedBlock(category, categories, listingsMap));
    container.appendChild(section);

    const canonicalUrls = categoryListings
      .map((listing) => listing.canonical || `https://aiporndirect.com/vendor/${listing.slug}/`)
      .filter(Boolean);
    injectItemListJSONLD(`${category.name} AI tools`, canonicalUrls);
  });
}

function initFilter() {
  const input = document.getElementById('filter-input');
  if (!input) return;
  input.addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    const cards = document.querySelectorAll('.listing-card');
    cards.forEach((card) => {
      const name = card.getAttribute('data-name');
      const tags = card.getAttribute('data-tags');
      const textMatch = `${name} ${tags}`;
      card.style.display = textMatch.includes(query) ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    setupAgeGate();
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
    await loadPartial('#breadcrumb-container', 'partials/breadcrumbs.html');

    const [categoryData, listingData] = await Promise.all([
      fetchJSON('data/categories.json'),
      fetchJSON('data/listings.json')
    ]);

    renderBreadcrumbs();
    renderCategories(categoryData.categories, listingData.listings);
    initFilter();
  } catch (error) {
    console.error('Failed to initialise directory', error);
  }
});
