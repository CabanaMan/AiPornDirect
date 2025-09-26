import { createSearch } from './search.js';

function applyFilters({ cards, slugs, category, pricing }) {
  cards.forEach((card) => {
    const cardCategories = JSON.parse(card.dataset.categories || '[]');
    const slug = card.dataset.slug;
    const cardPricing = card.dataset.pricing || 'all';
    const matchesCategory = category === 'all' || cardCategories.includes(category);
    const matchesSearch = !slugs || slugs.has(slug);
    const matchesPricing = pricing === 'all' || pricing === cardPricing;
    if (matchesCategory && matchesSearch && matchesPricing) {
      card.removeAttribute('hidden');
    } else {
      card.setAttribute('hidden', 'hidden');
    }
  });
}

async function initDirectoryUI() {
  const searchInput = document.getElementById('search');
  const cards = Array.from(document.querySelectorAll('.listing'));
  if (!cards.length) return;
  const categoryButtons = Array.from(document.querySelectorAll('#category-filter .filter-chip'));
  const pricingButtons = Array.from(document.querySelectorAll('#pricing-filter .filter-chip'));
  let currentCategory = 'all';
  let currentPricing = 'all';
  let currentSlugs = new Set(cards.map((card) => card.dataset.slug));
  const search = await createSearch();

  function updateUI() {
    applyFilters({ cards, slugs: currentSlugs, category: currentCategory, pricing: currentPricing });
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.category;
      categoryButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
      updateUI();
    });
  });

  pricingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentPricing = button.dataset.pricing;
      pricingButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
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
