import { createSearch } from './search.js';

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
  let currentCategory = 'all';
  let currentSlugs = new Set(cards.map((card) => card.dataset.slug));
  const search = await createSearch();

  function updateUI() {
    applyFilters({ cards, slugs: currentSlugs, category: currentCategory });
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

  updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
  initDirectoryUI();
});
