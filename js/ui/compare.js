/* ═══════════════════════════════════════════════════
   js/ui/compare.js — UI de Comparação de Preços
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.compare = (() => {

  const fmt = App.compare.formatCurrency;

  function render() {
    const container = document.getElementById('compare-content');
    if (!container) return;

    const selected = App.state.getSelectedList();
    const stores   = App.state.getActiveStores();

    if (!selected.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚖️</div>
          <div class="empty-title">Nenhum item na lista</div>
          <div class="empty-desc">Adicione produtos no Catálogo para comparar preços entre as lojas.</div>
          <button class="btn btn-primary" onclick="App.state.setActiveTab('catalog')">Ir ao Catálogo</button>
        </div>
      `;
      return;
    }

    if (!stores.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <div class="empty-title">Nenhuma loja encontrada</div>
          <div class="empty-desc">Configure sua localização ou aumente o raio de busca.</div>
          <button class="btn btn-primary" onclick="App.state.setActiveTab('stores')">Ver Lojas</button>
        </div>
      `;
      return;
    }

    const sort   = App.state.getKey('compareSort');
    const result = App.compare.buildCompareTable(selected, stores);
    const rows   = App.compare.sortRows(result.rows, 'category');

    let html = '<div class="compare-wrapper">';

    // ── Métricas resumidas ──────────────────────────
    const bestStore  = App.storesData.getById(result.bestStoreId);
    const bestTotal  = result.totals[result.bestStoreId] || 0;
    const totalItems = selected.length;

    html += `
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-label">itens comparados</div>
          <div class="metric-value">${totalItems}</div>
          <div class="metric-sub">em ${stores.length} lojas</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">melhor total</div>
          <div class="metric-value" style="color:var(--color-primary-500)">${fmt(bestTotal)}</div>
          <div class="metric-sub">${bestStore ? bestStore.name : '—'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">economia possível</div>
          <div class="metric-value" style="color:var(--color-warning-text)">${fmt(result.savings)}</div>
          <div class="metric-sub">vs. loja mais cara</div>
        </div>
      </div>
    `;

    // ── Banner da melhor loja ───────────────────────
    if (bestStore) {
      const coveragePct = Math.round((result.coverage[result.bestStoreId]?.found / totalItems) * 100);
      html += `
        <div class="best-banner">
          <span class="trophy">🏆</span>
          <div class="content">
            <div class="title">${bestStore.emoji} ${bestStore.name} — Melhor opção</div>
            <div class="sub">Menor total para sua lista · ${coveragePct}% dos itens disponíveis</div>
          </div>
          <div class="price">${fmt(bestTotal)}</div>
        </div>
      `;
    }

    // ── Opções de ordenação ─────────────────────────
    html += `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:13px;color:var(--color-text-secondary)">Ordenar itens por:</span>
        <div style="display:flex;gap:6px">
          ${[['category','Categoria'],['name','Nome A-Z'],['variation','Maior variação']].map(([val,label]) =>
            `<button class="btn btn-sm ${sort===val?'btn-primary':'btn-outline'}" data-sort="${val}">${label}</button>`
          ).join('')}
        </div>
      </div>
    `;

    // ── Tabela de comparação ────────────────────────
    const sortedRows = App.compare.sortRows(rows, sort);
    html += buildTable(sortedRows, stores, result);

    // ── Aviso de cobertura parcial ──────────────────
    const hasPartial = stores.some(s => result.coverage[s.id]?.found < totalItems);
    if (hasPartial) {
      html += `
        <p style="font-size:12px;color:var(--color-text-tertiary);margin-top:8px">
          ⚠ Totais marcados com * são parciais — nem todos os produtos têm preço registrado nessa loja.
          Envie notas fiscais para melhorar a cobertura.
        </p>
      `;
    }

    // ── Estratégia mista ────────────────────────────
    const mixed = App.compare.mixedStrategy(sortedRows, stores);
    if (mixed.savings > 0.01 && stores.length > 1) {
      html += buildMixedStrategy(mixed);
    }

    html += '</div>';
    container.innerHTML = html;

    // Bind sort buttons
    container.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        App.state.setCompareSort(btn.dataset.sort);
        render();
      });
    });

    // Bind sort select (se existir no header)
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect && !sortSelect.dataset.bound) {
      sortSelect.dataset.bound = '1';
      sortSelect.addEventListener('change', () => {
        App.state.setCompareSort(sortSelect.value);
        render();
      });
    }
  }

  function buildTable(rows, stores, result) {
    const colW = stores.length > 3 ? '90px' : '120px';

    let thead = `<tr>
      <th style="min-width:160px">Produto</th>
      <th style="min-width:60px;text-align:center">Qtd</th>
    `;
    stores.forEach(s => {
      const cov = result.coverage[s.id];
      const partial = cov.found < cov.total ? '*' : '';
      thead += `
        <th class="store-col" style="min-width:${colW}">
          ${s.emoji} ${s.name}${partial}
        </th>
      `;
    });
    thead += '</tr>';

    let tbody = '';
    let lastCategory = null;

    rows.forEach(({ product, qty, cells }) => {
      // Separador de categoria (quando ordenado por categoria)
      if (product.category !== lastCategory && App.state.getKey('compareSort') === 'category') {
        const cat = App.catalog.categories.find(c => c.id === product.category);
        if (cat) {
          const colSpan = stores.length + 2;
          tbody += `
            <tr>
              <td colspan="${colSpan}" style="background:var(--color-bg-muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-tertiary);padding:6px 14px">
                ${cat.emoji} ${cat.label}
              </td>
            </tr>
          `;
        }
        lastCategory = product.category;
      }

      tbody += `<tr>
        <td>
          <span style="font-weight:500">${product.emoji} ${product.name}</span>
        </td>
        <td style="text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--color-text-secondary)">
          ${qty} ${product.unit}
        </td>
      `;

      cells.forEach(cell => {
        tbody += `<td class="td-store">
          <span class="price-pill ${cell.cls}">
            ${cell.adjustedPrice != null
              ? cell.adjustedPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : '—'}
          </span>
        </td>`;
      });

      tbody += '</tr>';
    });

    // Linha de total
    tbody += '<tr class="total-row"><td colspan="2">Total estimado</td>';
    stores.forEach(s => {
      const isB = s.id === result.bestStoreId;
      const partial = result.coverage[s.id]?.found < result.coverage[s.id]?.total ? '*' : '';
      tbody += `<td class="td-store" style="${isB?'color:var(--color-primary-600)':''}">
        ${fmt(result.totals[s.id])}${partial}
      </td>`;
    });
    tbody += '</tr>';

    return `
      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
    `;
  }

  function buildMixedStrategy(mixed) {
    const entries = Object.values(mixed.byStore).filter(b => b.items.length > 0);
    if (!entries.length) return '';

    let html = `
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-header">
          <div>
            <div class="card-title">🧠 Estratégia de Compra Mista</div>
            <div class="card-subtitle">
              Comprando cada item na loja mais barata, você economiza
              <strong style="color:var(--color-primary-500)">${fmt(mixed.savings)}</strong>
              em relação à melhor loja única
            </div>
          </div>
          <span class="badge badge-success">Economia ${fmt(mixed.savings)}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
    `;

    entries.forEach(entry => {
      html += `
        <div style="border:1px solid var(--color-border-light);border-radius:var(--radius-md);padding:12px">
          <div style="font-weight:600;margin-bottom:8px;font-size:14px">${entry.store.emoji} ${entry.store.name}</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${entry.items.map(i => `
              <div style="display:flex;justify-content:space-between;font-size:12px">
                <span>${i.product.emoji} ${i.product.name} <span style="color:var(--color-text-tertiary)">${i.qty}${i.product.unit}</span></span>
                <span style="font-family:var(--font-mono)">${fmt(i.price)}</span>
              </div>
            `).join('')}
          </div>
          <div style="border-top:1px solid var(--color-border-light);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:13px;font-weight:600">
            <span>Subtotal</span>
            <span style="font-family:var(--font-mono)">${fmt(entry.subtotal)}</span>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
  }

  return { render };

})();
