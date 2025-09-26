import { createSearch } from './search.js';

const AGE_COOKIE_NAME = 'aipd_age_verified';
const AGE_COOKIE_DAYS = 30;

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  return document.cookie.split('; ').find((row) => row.startsWith(name + '='))?.split('=')[1];
}

function initAgeGate() {
  const isBot = /bot|crawl|spider|slurp|duckduck|bingpreview/i.test(navigator.userAgent);
  if (isBot) return;
  const modal = document.getElementById('age-gate');
  if (!modal) return;
  if (getCookie(AGE_COOKIE_NAME) === '1') {
    return;
  }
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  const enterButton = document.getElementById('age-gate-enter');
  const form = document.getElementById('age-gate-form');
  let hasConfirmed = false;

  const confirmEntry = () => {
    if (hasConfirmed) return;
    hasConfirmed = true;
    setCookie(AGE_COOKIE_NAME, '1', AGE_COOKIE_DAYS);
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  };

  const handleActivation = (event) => {
    if (event) {
      event.preventDefault?.();
    }
    confirmEntry();
  };

  if (form) {
    form.addEventListener('submit', handleActivation);
  }

  if (enterButton) {
    enterButton.addEventListener('click', handleActivation);
    enterButton.addEventListener(
      'pointerup',
      (event) => {
        if (event.pointerType === 'touch') {
          handleActivation(event);
        }
      },
      { passive: false },
    );
    enterButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        confirmEntry();
      }
    });
    enterButton.focus();
  }
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
  const cards = Array.from(document.querySelectorAll('.tool-card'));
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
  initAgeGate();
  initDirectoryUI();
});
