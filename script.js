(function () {
  const numberFormatter = new Intl.NumberFormat("en-US");

  const gate = document.getElementById("age-gate");
  const enterBtn = document.getElementById("age-enter");
  const leaveBtn = document.getElementById("age-leave");
  const browseAllBtn = document.getElementById("browse-all");
  const grid = document.getElementById("grid");
  const featuredContainer = document.getElementById("featured");
  const trendingContainer = document.getElementById("trending");
  const categoryBoard = document.getElementById("category-board");
  const qInput = document.getElementById("q");
  const categorySelect = document.getElementById("category");
  const pricingSelect = document.getElementById("pricing");
  const sortSelect = document.getElementById("sort");
  const ldItemList = document.getElementById("ld-itemlist");
  const statTotal = document.getElementById("stat-total");
  const statFree = document.getElementById("stat-free");
  const statUpdated = document.getElementById("stat-updated");

  const state = {
    sites: [],
    filtered: [],
    featured: [],
    categories: [],
    activeCategory: "",
  };

  function formatCategory(slug) {
    if (!slug) return "";
    return slug
      .toString()
      .split(/[-_\s]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatPopularity(value) {
    if (typeof value !== "number") return "";
    return `~${numberFormatter.format(value)} visits/mo`;
  }

  function ensureAge() {
    if (localStorage.getItem("adult_ok") === "1") {
      gate.classList.add("hidden");
    } else {
      gate.classList.remove("hidden");
    }
  }

  function handleEnter() {
    localStorage.setItem("adult_ok", "1");
    gate.classList.add("hidden");
  }

  function handleLeave() {
    window.location.href = "https://www.google.com";
  }

  function track(url) {
    // TODO: replace track() with real analytics endpoint
    return url;
  }

  function updateStats() {
    if (!statTotal || !statFree || !statUpdated) return;
    statTotal.textContent = state.sites.length.toString();
    const freeCount = state.sites.filter(
      (site) => site.pricing === "free" || site.pricing === "freemium",
    ).length;
    statFree.textContent = freeCount.toString();

    const latest = state.sites.reduce((acc, site) => {
      if (!site.createdAtDate) return acc;
      if (!acc || site.createdAtDate > acc) {
        return site.createdAtDate;
      }
      return acc;
    }, null);
    statUpdated.textContent = latest ? formatDate(latest) : "—";
  }

  function populateCategorySelect() {
    if (!categorySelect) return;
    categorySelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All categories";
    categorySelect.appendChild(defaultOption);

    const sortedCategories = [...state.categories].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    sortedCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = `${category.label} (${category.count})`;
      categorySelect.appendChild(option);
    });
  }

  function createCategoryTile({ id, label, count, description }) {
    const button = document.createElement("button");
    button.className = "category-tile";
    button.type = "button";
    button.dataset.category = id;

    const title = document.createElement("span");
    title.className = "category-title";
    title.textContent = label;

    const meta = document.createElement("span");
    meta.className = "category-meta";
    meta.textContent = `${count} tool${count === 1 ? "" : "s"}`;

    const desc = document.createElement("span");
    desc.className = "category-desc";
    desc.textContent = description;

    button.append(title, meta, desc);
    return button;
  }

  function renderCategoryBoard() {
    if (!categoryBoard) return;
    categoryBoard.innerHTML = "";
    if (!state.categories.length) return;

    const header = document.createElement("div");
    header.className = "category-header";

    const heading = document.createElement("h2");
    heading.textContent = "Browse by category";

    const hint = document.createElement("p");
    hint.textContent = "Jump straight to the type of AI tool you need.";

    header.append(heading, hint);

    const gridEl = document.createElement("div");
    gridEl.className = "category-grid";

    const allTile = createCategoryTile({
      id: "",
      label: "All tools",
      count: state.sites.length,
      description: "See every listing in one view.",
    });
    gridEl.appendChild(allTile);

    state.categories.forEach((category) => {
      const tile = createCategoryTile({
        id: category.id,
        label: category.label,
        count: category.count,
        description: category.description,
      });
      gridEl.appendChild(tile);
    });

    categoryBoard.append(header, gridEl);
    updateCategoryBoardActive();
  }

  function updateCategoryBoardActive() {
    if (!categoryBoard) return;
    const active = state.activeCategory || "";
    const tiles = categoryBoard.querySelectorAll("[data-category]");
    tiles.forEach((tile) => {
      if (tile.dataset.category === active) {
        tile.classList.add("active");
      } else {
        tile.classList.remove("active");
      }
    });
  }

  function renderFeatured() {
    if (!featuredContainer) return;
    featuredContainer.innerHTML = "";
    if (!state.featured.length) return;

    const heading = document.createElement("div");
    heading.className = "section-header";

    const title = document.createElement("h2");
    title.textContent = "Editor picks";
    const subtitle = document.createElement("p");
    subtitle.textContent =
      "Hand-checked tools that consistently impress creators.";
    heading.append(title, subtitle);

    const gridEl = document.createElement("div");
    gridEl.className = "featured-grid";

    state.featured.forEach((site, index) => {
      const card = document.createElement("article");
      card.className = "featured-card";
      card.setAttribute("data-testid", `featured-${site.id}`);

      const rank = document.createElement("span");
      rank.className = "featured-rank";
      rank.textContent = `#${index + 1}`;

      const header = document.createElement("div");
      header.className = "featured-header";

      const titleEl = document.createElement("h3");
      titleEl.className = "card-title";
      titleEl.textContent = site.name;

      const score = document.createElement("span");
      score.className = "card-score";
      score.textContent = `★ ${site.score.toFixed(1)}`;

      header.append(titleEl, score);

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.innerHTML = `<span>${site.categoryLabel}</span><span>${site.pricingLabel}</span>`;

      const description = document.createElement("p");
      description.className = "card-description";
      description.textContent = site.description;

      const features = document.createElement("ul");
      features.className = "card-feature-list";
      site.features.forEach((feature) => {
        const item = document.createElement("li");
        item.textContent = feature;
        features.appendChild(item);
      });

      const actions = document.createElement("div");
      actions.className = "card-actions";
      const link = document.createElement("a");
      link.href = track(site.url);
      link.target = "_blank";
      link.rel = "nofollow noopener";
      link.textContent = "Visit";
      actions.appendChild(link);

      card.append(rank, header, meta, description, features, actions);
      gridEl.appendChild(card);
    });

    featuredContainer.append(heading, gridEl);
  }

  function renderTrending() {
    if (!trendingContainer) return;
    trendingContainer.innerHTML = "";
    if (!state.sites.length) return;

    const trending = [...state.sites]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4);

    if (!trending.length) return;

    const header = document.createElement("div");
    header.className = "section-header";
    const title = document.createElement("h2");
    title.textContent = "Trending now";
    const subtitle = document.createElement("p");
    subtitle.textContent =
      "Hot picks gaining the most creator searches this month.";
    header.append(title, subtitle);

    const gridEl = document.createElement("div");
    gridEl.className = "trending-grid";

    trending.forEach((site) => {
      const card = document.createElement("article");
      card.className = "trending-card";
      card.setAttribute("data-testid", `trending-${site.id}`);

      const chip = document.createElement("span");
      chip.className = "card-chip";
      chip.textContent = site.categoryLabel;

      const titleEl = document.createElement("h3");
      titleEl.textContent = site.name;

      const meta = document.createElement("p");
      meta.className = "trending-meta";
      meta.textContent = formatPopularity(site.popularity);

      const description = document.createElement("p");
      description.className = "card-description";
      description.textContent = site.description;

      const actions = document.createElement("div");
      actions.className = "card-actions";
      const link = document.createElement("a");
      link.href = track(site.url);
      link.target = "_blank";
      link.rel = "nofollow noopener";
      link.textContent = "Visit";
      actions.appendChild(link);

      card.append(chip, titleEl, meta, description, actions);
      gridEl.appendChild(card);
    });

    trendingContainer.append(header, gridEl);
  }

  function renderGrid() {
    if (!grid) return;
    if (!state.filtered.length) {
      grid.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "empty-state";
      const title = document.createElement("h3");
      title.textContent = "No tools match your filters yet.";
      const body = document.createElement("p");
      body.textContent =
        "Try clearing a filter or search for a different keyword.";
      empty.append(title, body);
      grid.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    state.filtered.forEach((site) => {
      const card = document.createElement("article");
      card.className = "card";
      card.setAttribute("data-testid", `card-${site.id}`);

      const header = document.createElement("div");
      header.className = "card-header";

      const identity = document.createElement("div");
      identity.className = "card-identity";

      const avatar = document.createElement("span");
      avatar.className = "card-avatar";
      avatar.textContent = site.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const titleWrap = document.createElement("div");
      titleWrap.className = "card-title-wrap";

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = site.name;

      const subtitle = document.createElement("p");
      subtitle.className = "card-subtitle";
      subtitle.textContent = `${site.categoryLabel} • ${site.platforms.join(" · ")}`;

      titleWrap.append(title, subtitle);

      identity.append(avatar, titleWrap);

      const score = document.createElement("span");
      score.className = "card-score";
      score.textContent = `★ ${site.score.toFixed(1)}`;

      header.append(identity, score);

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.innerHTML = `<span>${site.pricingLabel}</span><span>${formatPopularity(
        site.popularity,
      )}</span><span>Launched ${formatDate(site.createdAtDate)}</span>`;

      const description = document.createElement("p");
      description.className = "card-description";
      description.textContent = site.description;

      const tags = document.createElement("div");
      tags.className = "card-tags";
      site.tags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "card-tag";
        chip.textContent = tag;
        tags.appendChild(chip);
      });

      const featureList = document.createElement("ul");
      featureList.className = "card-feature-list";
      site.features.forEach((feature) => {
        const item = document.createElement("li");
        item.textContent = feature;
        featureList.appendChild(item);
      });

      const actions = document.createElement("div");
      actions.className = "card-actions";
      const link = document.createElement("a");
      link.href = track(site.url);
      link.target = "_blank";
      link.rel = "nofollow noopener";
      link.textContent = "Visit";
      actions.appendChild(link);

      card.append(header, meta, description, tags, featureList, actions);
      fragment.appendChild(card);
    });

    grid.innerHTML = "";
    grid.appendChild(fragment);
  }

  function updateItemList() {
    if (!ldItemList) return;
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: state.filtered.map((site, index) => ({
        "@type": "ListItem",
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
        const haystack = [
          site.name,
          site.description,
          ...(site.tags || []),
          ...(site.features || []),
        ]
          .join(" ")
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
        case "score-desc":
          return b.score - a.score;
        case "pop-desc":
          return b.popularity - a.popularity;
        case "alpha-asc":
          return a.name.localeCompare(b.name);
        case "alpha-desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return (
            (b.createdAtDate?.getTime() || 0) -
            (a.createdAtDate?.getTime() || 0)
          );
        default:
          return 0;
      }
    });

    const defaultFilters =
      !query && !category && !pricing && sortSelect.value === "score-desc";

    if (defaultFilters && state.featured.length) {
      const featuredIds = new Set(state.featured.map((site) => site.id));
      results = results.filter((site) => !featuredIds.has(site.id));
    }

    state.activeCategory = category;
    state.filtered = results;

    updateCategoryBoardActive();
    renderGrid();
    updateItemList();
  }

  function computeCategories(data) {
    const counts = data.reduce((acc, site) => {
      const id = site.category;
      if (!acc.has(id)) {
        acc.set(id, { id, label: site.categoryLabel, count: 0 });
      }
      const entry = acc.get(id);
      entry.count += 1;
      return acc;
    }, new Map());

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({
        ...entry,
        description: `Top ${entry.label.toLowerCase()} builders and platforms.`,
      }));
  }

  function computeFeatured(data) {
    return [...data].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  function handleCategoryBoardClick(event) {
    const tile = event.target.closest("[data-category]");
    if (!tile) return;
    const value = tile.dataset.category || "";
    const isActive = state.activeCategory === value;
    categorySelect.value = isActive ? "" : value;
    state.activeCategory = categorySelect.value;
    applyFilters();
    grid.scrollIntoView({ behavior: "smooth" });
  }

  function handleBrowseAll() {
    qInput.value = "";
    categorySelect.value = "";
    pricingSelect.value = "";
    sortSelect.value = "score-desc";
    state.activeCategory = "";
    applyFilters();
    grid.scrollIntoView({ behavior: "smooth" });
  }

  async function init() {
    ensureAge();

    enterBtn.addEventListener("click", handleEnter);
    leaveBtn.addEventListener("click", handleLeave);
    browseAllBtn?.addEventListener("click", handleBrowseAll);
    categoryBoard?.addEventListener("click", handleCategoryBoardClick);

    qInput.addEventListener("input", applyFilters);
    categorySelect.addEventListener("change", () => {
      state.activeCategory = categorySelect.value;
      applyFilters();
    });
    pricingSelect.addEventListener("change", applyFilters);
    sortSelect.addEventListener("change", applyFilters);

    try {
      const res = await fetch("data/sites.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load directory");
      const raw = await res.text();
      const cleaned = raw
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .trim();
      const data = JSON.parse(cleaned).map((site) => ({
        ...site,
        categoryLabel: formatCategory(site.category),
        pricingLabel: formatCategory(site.pricing),
        createdAtDate: site.createdAt ? new Date(site.createdAt) : null,
      }));
      state.sites = data;
      state.featured = computeFeatured(data);
      state.categories = computeCategories(data);
      updateStats();
      populateCategorySelect();
      renderCategoryBoard();
      renderFeatured();
      renderTrending();
      applyFilters();
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
