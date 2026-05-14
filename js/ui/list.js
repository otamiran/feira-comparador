/* ═══════════════════════════════════════════════════
   js/ui/list.js — UI da Lista de Compras
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.list = (() => {

  function render() {
    const container = document.getElementById('list-content');
    if (!container) return;

    const selected = App.state.getSelectedList();
    const subtitle = document.getElementById('list-subtitle');

    // Atualiza subtitle
    if (subtitle) {
      subtitle.textContent = selected.length
        ? `${selected.length} item(s) — ajuste as quantidades para comparar preços`
        : 'Sua lista está vazia — vá ao Catálogo para adicionar itens';
    }

    if (!selected.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">Lista vazia</div>
          <div class="empty-desc">Acesse o Catálogo, selecione os produtos que você compra e ajuste as quantidades aqui.</div>
          <button class="btn btn-primary" id="btn-go-catalog">Ir ao Catálogo</button>
        </div>
      `;
      document.getElementById('btn-go-catalog')?.addEventListener('click', () => {
        App.state.setActiveTab('catalog');
      });
      return;
    }

    // Agrupa por categoria para melhor organização visual
    const byCategory = {};
    selected.forEach(item => {
      const cat = item.product.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    });

    const catInfo = {};
    App.catalog.categories.forEach(c => { catInfo[c.id] = c; });

    let html = '<div class="list-items">';

    Object.entries(byCategory).forEach(([catId, items]) => {
      const cat = catInfo[catId] || { label: catId, emoji: '📦' };
      html += `<div class="list-category-label">${cat.emoji} ${cat.label}</div>`;

      items.forEach(({ product, qty }) => {
        const priceInfo = getBestPrice(product.id);
        html += `
          <div class="list-item" data-product-id="${product.id}">
            <div class="list-item-emoji">${product.emoji}</div>
            <div class="list-item-info">
              <div class="list-item-name">${product.name}</div>
              <div class="list-item-sub">
                ${priceInfo ? `A partir de ${priceInfo}` : 'Sem preços registrados'}
              </div>
            </div>
            <div class="list-item-right">
              <!-- Stepper de quantidade -->
              <div class="qty-stepper" aria-label="Quantidade de ${product.name}">
                <button class="qty-btn" data-action="dec" data-id="${product.id}" aria-label="Diminuir">−</button>
                <input
                  class="qty-input"
                  type="number"
                  min="0.01"
                  step="${getStep(product.unit)}"
                  value="${qty}"
                  data-id="${product.id}"
                  aria-label="Quantidade"
                />
                <span class="qty-unit">${product.unit}</span>
                <button class="qty-btn" data-action="inc" data-id="${product.id}" aria-label="Aumentar">+</button>
              </div>
              <!-- Remover -->
              <button class="btn btn-ghost btn-icon" data-remove="${product.id}" aria-label="Remover ${product.name}">🗑️</button>
            </div>
          </div>
        `;
      });
    });

    html += '</div>';
    container.innerHTML = html;
    bindEvents(container);
    bindHeaderButtons();
  }

  function getStep(unit) {
    if (['g', 'ml'].includes(unit)) return 50;
    if (['kg', 'L'].includes(unit)) return 0.5;
    return 1;
  }

  function getBestPrice(productId) {
    const stores = App.state.getActiveStores();
    const prices = stores
      .map(s => App.state.getPrice(s.id, productId))
      .filter(p => p != null);
    if (!prices.length) return null;
    const min = Math.min(...prices);
    return min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function bindEvents(container) {
    // Stepper buttons
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id    = btn.dataset.id;
        const input = container.querySelector(`.qty-input[data-id="${id}"]`);
        if (!input) return;
        const step  = parseFloat(input.step) || 1;
        let   val   = parseFloat(input.value) || 0;
        val = btn.dataset.action === 'inc' ? val + step : Math.max(step, val - step);
        val = Math.round(val * 100) / 100;
        input.value = val;
        App.state.setItemQty(id, val);
      });
    });

    // Qty input change
    container.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', () => {
        const val = parseFloat(input.value);
        if (val > 0) App.state.setItemQty(input.dataset.id, val);
      });
    });

    // Remove buttons
    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.remove;
        const product = App.catalog.getById(id);
        App.state.removeItem(id);
        App.toast.info('Item removido', product?.name);
        render();
        App.tabs.updateBadges();
      });
    });
  }

  function bindHeaderButtons() {
    document.getElementById('btn-clear-list')?.addEventListener('click', () => {
      if (!App.state.getSelectedCount()) return;
      if (confirm('Limpar toda a lista de compras?')) {
        App.state.clearList();
        App.toast.info('Lista limpa', 'Todos os itens foram removidos');
        render();
        App.tabs.updateBadges();
      }
    });

    document.getElementById('btn-go-compare')?.addEventListener('click', () => {
      App.state.setActiveTab('compare');
    });
  }

  return { render };

})();
