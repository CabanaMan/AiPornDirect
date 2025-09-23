(function () {
  const gate = document.getElementById('age-gate');
  const enterBtn = document.getElementById('age-enter');
  const leaveBtn = document.getElementById('age-leave');
  const grid = document.getElementById('grid');
  const featuredContainer = document.getElementById('featured');
  const qInput = document.getElementById('q');
  const categorySelect = document.getElementById('category');
  const pricingSelect = document.getElementById('pricing');
  const sortSelect = document.getElementById('sort');
  const ldItemList = document.getElementById('ld-itemlist');

  const state = {
    sites: [],
    filtered: [],
    featured: [],
  };

  function ensureAge() {
    if (localStorage.getItem('adult_ok') === '1') {
      gate.classList.add('hidden');
    } else {
      gate.classList.remove('hidden');
    }
  }

  function handleEnter() {
    localStorage.setItem('adult_ok', '1');
    gate.classList.add('hidden');
  }

  function handleLeave() {
    window.location.href = 'https://www.google.com';
  }

  function track(url) {
    // TODO: replace track() with real analytics endpoint
    return url;
  }

  function renderFeatured() {
    if (!featuredContainer) return;
    featuredContainer.innerHTML = '';

    if (!state.featured.length) return;

    const heading = document.createElement('h2');
    heading.textContent = 'Featured';

    const gridEl = document.createElement('div');
    gridEl.className = 'featured-grid';

    state.featured.forEach((site) => {
      const card = document.createElement('article');
      card.className = 'featured-card';
      card.setAttribute('data-testid', `card-${site.id}`);

      const header = document.createElement('div');
      header.className = 'card-header';

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = site.name;

      const score = document.createElement('span');
      score.className = 'card-score';
      score.textContent = `★ ${site.score.toFixed(1)}`;

      header.append(title, score);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `<span>${site.category}</span><span>${site.pricing}</span>`;

      const tags = document.createElement('div');
      tags.className = 'card-tags';
      site.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'card-tag';
        chip.textContent = tag;
        tags.appendChild(chip);
      });

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const link = document.createElement('a');
      link.href = track(site.url);
      link.target = '_blank';
      link.rel = 'nofollow noopener';
      link.textContent = 'Visit';
      actions.appendChild(link);

      card.append(header, meta, tags, actions);
      gridEl.appendChild(card);
    });

    featuredContainer.append(heading, gridEl);
  }

  function renderGrid() {
    console.time('render');
    const fragment = document.createDocumentFragment();

    state.filtered.forEach((site) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('data-testid', `card-${site.id}`);

      const header = document.createElement('div');
      header.className = 'card-header';

      const title = document.createElement('h3');
      title.className = 'card-title';
      title.textContent = site.name;

      const score = document.createElement('span');
      score.className = 'card-score';
      score.textContent = `★ ${site.score.toFixed(1)}`;

      header.append(title, score);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.innerHTML = `<span>${site.category}</span><span>${site.pricing}</span>`;

      const tags = document.createElement('div');
      tags.className = 'card-tags';
      site.tags.forEach((tag) => {
        const chip = document.createElement('span');
        chip.className = 'card-tag';
        chip.textContent = tag;
        tags.appendChild(chip);
      });

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const link = document.createElement('a');
      link.href = track(site.url);
      link.target = '_blank';
      link.rel = 'nofollow noopener';
      link.textContent = 'Visit';
      actions.appendChild(link);

      card.append(header, meta, tags, actions);
      fragment.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
    console.timeEnd('render');
  }

  function updateItemList() {
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: state.filtered.map((site, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: site.name,
        url: site.url,
      })),
    };
    ldItemList.textContent = JSON.stringify(itemList, null, 2);
  }

  function applyFilters() {
    const query = qInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const pricing = pricingSelect.value;

    let results = [...state.sites];

    if (query) {
      results = results.filter((site) => {
        const haystack = [site.name, ...(site.tags || [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    if (category) {
      results = results.filter((site) => site.category === category);
    }

    if (pricing) {
      results = results.filter((site) => site.pricing === pricing);
    }

    const sort = sortSelect.value;
    results.sort((a, b) => {
      switch (sort) {
        case 'score-desc':
          return b.score - a.score;
        case 'pop-desc':
          return b.popularity - a.popularity;
        case 'alpha-asc':
          return a.name.localeCompare(b.name);
        case 'alpha-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    const defaultFilters =
      !query && !category && !pricing && sortSelect.value === 'score-desc';

    if (defaultFilters && state.featured.length) {
      const featuredIds = new Set(state.featured.map((site) => site.id));
      results = results.filter((site) => !featuredIds.has(site.id));
    }

    state.filtered = results;
    renderGrid();
    updateItemList();
  }

  async function init() {
    ensureAge();

    enterBtn.addEventListener('click', handleEnter);
    leaveBtn.addEventListener('click', handleLeave);

    qInput.addEventListener('input', applyFilters);
    categorySelect.addEventListener('change', applyFilters);
    pricingSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);

    try {
      const res = await fetch('data/sites.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load directory');
      const raw = await res.text();
      const cleaned = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .trim();
      const data = JSON.parse(cleaned);
      state.sites = data;
      state.featured = [...data]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      renderFeatured();
      applyFilters();
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
