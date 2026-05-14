/* ═══════════════════════════════════════════════════
   js/ui/catalog.js — UI do Catálogo de Produtos
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.catalog = (() => {

  function render() {
    renderCategoryFilters();
    renderGrid();
    bindSearch();
  }

  function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const activeCategory = App.state.getKey('activeCatalogCategory');

    container.innerHTML = App.catalog.categories.map(cat => `
      <button
        class="filter-chip ${activeCategory === cat.id ? 'active' : ''}"
        data-category="${cat.id}"
      >
        ${cat.emoji} ${cat.label}
      </button>
    `).join('');

    container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        App.state.setActiveCatalogCategory(btn.dataset.category);
        renderCategoryFilters();
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const container = document.getElementById('catalog-grid');
    if (!container) return;

    const category = App.state.getKey('activeCatalogCategory');
    const query    = App.state.getKey('catalogSearch');

    // Obtém produtos filtrados
    let products = query
      ? App.catalog.search(query)
      : App.catalog.getByCategory(category);

    if (!products.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">Nenhum produto encontrado</div>
          <div class="empty-desc">Tente outra categoria ou termo de busca</div>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => {
      const selected = App.state.isItemSelected(product.id);
      const priceRange = getPriceRange(product.id);
      return `
        <div
          class="product-card ${selected ? 'selected' : ''}"
          data-product-id="${product.id}"
          role="button"
          tabindex="0"
          aria-pressed="${selected}"
          aria-label="${product.name} — clique para ${selected ? 'remover da' : 'adicionar à'} lista"
        >
          <div class="product-emoji">${product.emoji}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-unit">${product.defaultQty} ${product.unit}</div>
          ${priceRange ? `<div class="product-prices">${priceRange}</div>` : ''}
        </div>
      `;
    }).join('');

    // Eventos de clique e teclado
    container.querySelectorAll('.product-card').forEach(card => {
      const handler = () => {
        App.state.toggleItem(card.dataset.productId);
        renderGrid();
        App.tabs.updateBadges();
        const isNowSelected = App.state.isItemSelected(card.dataset.productId);
        App.toast[isNowSelected ? 'success' : 'info'](
          isNowSelected ? 'Adicionado à lista' : 'Removido da lista',
          App.catalog.getById(card.dataset.productId)?.name
        );
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
    });
  }

  /**
   * Retorna faixa de preços do produto entre as lojas ativas.
   * @param {string} productId
   * @returns {string|null}
   */
  function getPriceRange(productId) {
    const stores = App.state.getActiveStores();
    const prices = stores
      .map(s => App.state.getPrice(s.id, productId))
      .filter(p => p != null);

    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  }

  function bindSearch() {
    const input = document.getElementById('catalog-search');
    if (!input || input.dataset.bound) return;
    input.dataset.bound = '1';

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        App.state.setCatalogSearch(input.value);
        renderGrid();
      }, 200);
    });
  }

  return { render };

})();
