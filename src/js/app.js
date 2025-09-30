import { createSearch } from './search.js';

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toTimestamp(value, fallback = 0) {
  if (!value) return fallback;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : fallback;
}

function getCardName(card) {
  const datasetName = card.dataset.name || '';
  if (datasetName.trim()) {
    return datasetName.trim().toLowerCase();
  }
  const heading = card.querySelector('h3, h2');
  return heading ? heading.textContent.trim().toLowerCase() : '';
}

function compareCards(a, b, sortKey) {
  const nameA = getCardName(a);
  const nameB = getCardName(b);

  switch (sortKey) {
    case 'rating': {
      const ratingDiff = toNumber(b.dataset.rating, -Infinity) - toNumber(a.dataset.rating, -Infinity);
      if (ratingDiff !== 0) return ratingDiff;
      const voteDiff = toNumber(b.dataset.votes, 0) - toNumber(a.dataset.votes, 0);
      if (voteDiff !== 0) return voteDiff;
      return nameA.localeCompare(nameB);
    }
    case 'votes': {
      const voteDiff = toNumber(b.dataset.votes, 0) - toNumber(a.dataset.votes, 0);
      if (voteDiff !== 0) return voteDiff;
      const ratingDiff = toNumber(b.dataset.rating, -Infinity) - toNumber(a.dataset.rating, -Infinity);
      if (ratingDiff !== 0) return ratingDiff;
      return nameA.localeCompare(nameB);
    }
    case 'alphabetical':
      return nameA.localeCompare(nameB);
    case 'recent': {
      const recentDiff = toTimestamp(b.dataset.lastChecked) - toTimestamp(a.dataset.lastChecked);
      if (recentDiff !== 0) return recentDiff;
      return nameA.localeCompare(nameB);
    }
    case 'rank':
    default: {
      const rankDiff = toNumber(a.dataset.rank, Number.POSITIVE_INFINITY) - toNumber(b.dataset.rank, Number.POSITIVE_INFINITY);
      if (rankDiff !== 0) return rankDiff;
      return nameA.localeCompare(nameB);
    }
  }
}

function sortCards(cards, sortKey) {
  return [...cards].sort((a, b) => compareCards(a, b, sortKey));
}

function applyFilters({ cards, slugs, category }) {
  cards.forEach((card) => {
    const cardCategories = JSON.parse(card.dataset.categories || '[]');
    const slug = card.dataset.slug;
    const matchesCategory = category === 'all' || cardCategories.includes(category);
    const matchesSearch = !slugs || slugs.has(slug);
    if (matchesCategory && matchesSearch) {
      card.removeAttribute('hidden');
    } else {
      card.setAttribute('hidden', 'hidden');
    }
  });
}

async function initDirectoryUI() {
  const searchInput = document.getElementById('search');
  const cards = Array.from(document.querySelectorAll('.site-card'));
  if (!cards.length) return;
  const categoryButtons = Array.from(document.querySelectorAll('#category-filter .filter-chip'));
  const grid = document.getElementById('site-grid');
  const sortSelect = document.getElementById('sort-order');
  let currentCategory = 'all';
  let currentSlugs = new Set(cards.map((card) => card.dataset.slug));
  let currentSort = (sortSelect && sortSelect.value) || 'rank';
  const search = await createSearch();

  function reorderCards() {
    if (!grid) return;
    const sortedCards = sortCards(cards, currentSort);
    sortedCards.forEach((card) => {
      grid.appendChild(card);
    });
  }

  function updateUI() {
    applyFilters({ cards, slugs: currentSlugs, category: currentCategory });
    reorderCards();
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.category;
      categoryButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      updateUI();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', async (event) => {
      const value = event.target.value || '';
      const results = await search(value);
      currentSlugs = new Set(results);
      updateUI();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      currentSort = event.target.value;
      updateUI();
    });
  }

  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  initDirectoryUI();
});
