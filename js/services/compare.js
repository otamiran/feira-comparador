/* ═══════════════════════════════════════════════════
   js/ui/compare.js — Comparação com data e fonte dos preços
   ATUALIZADO: exibe data da última atualização e badge
   de fonte (SEFAZ / NF usuário / Parceiro / Manual)
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.compare = (() => {

  const fmt = App.compare.formatCurrency;

  /* ── Badge de fonte / confiança ───────────────────
     Cada preço no banco tem: source, last_updated, confidence_score
  ─────────────────────────────────────────────────── */
  function sourceBadge(source, confidence) {
    const map = {
      sefaz_xml:   { label: 'SEFAZ',     color: '#0f5132', bg: '#d1e7dd', icon: '✓' },
      partner_xml: { label: 'Parceiro',  color: '#084298', bg: '#cfe2ff', icon: '🤝' },
      nf_photo:    { label: 'NF usuário',color: '#664d03', bg: '#fff3cd', icon: '📷' },
      nf_text:     { label: 'NF usuário',color: '#664d03', bg: '#fff3cd', icon: '📝' },
      manual:      { label: 'Manual',    color: '#6c757d', bg: '#e9ecef', icon: '✏️' },
    };
    const s = map[source] || map.manual;
    const conf = confidence ? `${Math.round(confidence * 100)}%` : '';
    return `<span style="
      display:inline-flex;align-items:center;gap:3px;
      font-size:10px;font-weight:600;letter-spacing:.02em;
      padding:2px 6px;border-radius:4px;white-space:nowrap;
      background:${s.bg};color:${s.color};border:none;
    ">${s.icon} ${s.label}${conf ? ' · ' + conf : ''}</span>`;
  }

  /* ── Formata a data de forma amigável ─────────────
     "hoje", "ontem", "há 3 dias", "15/05/25"
  ─────────────────────────────────────────────────── */
  function friendlyDate(isoDate) {
    if (!isoDate) return null;
    const d     = new Date(isoDate);
    const now   = new Date();
    const diffMs  = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMs / 3600000);
    const diffD   = Math.floor(diffMs / 86400000);

    if (diffMin < 1)  return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    if (diffH   < 24) return `há ${diffH}h`;
    if (diffD   === 0) return 'hoje';
    if (diffD   === 1) return 'ontem';
    if (diffD   < 7)  return `há ${diffD} dias`;
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }

  /* ── Obtém metadados do preço para exibição ───────
     Tenta pegar do backend (App._pricesMeta) ou usa fallback
  ─────────────────────────────────────────────────── */
  function getPriceMeta(storeId, productId) {
    return App._pricesMeta?.[storeId]?.[productId] || null;
  }

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
        </div>`;
      return;
    }

    if (!stores.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <div class="empty-title">Nenhuma loja encontrada</div>
          <button class="btn btn-primary" onclick="App.state.setActiveTab('stores')">Ver Lojas</button>
        </div>`;
      return;
    }

    const sort   = App.state.getKey('compareSort');
    const result = App.compare.buildCompareTable(selected, stores);
    const rows   = App.compare.sortRows(result.rows, sort);

    let html = '<div class="compare-wrapper">';

    // ── Métricas ────────────────────────────────────
    const bestStore = App.storesData.getById(result.bestStoreId);
    const bestTotal = result.totals[result.bestStoreId] || 0;

    html += `
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-label">itens comparados</div>
          <div class="metric-value">${selected.length}</div>
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
      </div>`;

    // ── Banner melhor loja ──────────────────────────
    if (bestStore) {
      const cov = Math.round((result.coverage[result.bestStoreId]?.found / selected.length) * 100);
      html += `
        <div class="best-banner">
          <span class="trophy">🏆</span>
          <div class="content">
            <div class="title">${bestStore.emoji} ${bestStore.name} — Melhor opção</div>
            <div class="sub">Menor total para sua lista · ${cov}% dos itens disponíveis</div>
          </div>
          <div class="price">${fmt(bestTotal)}</div>
        </div>`;
    }

    // ── Ordenação ───────────────────────────────────
    html += `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:13px;color:var(--color-text-secondary)">Ordenar por:</span>
        <div style="display:flex;gap:6px">
          ${[['category','Categoria'],['name','Nome A-Z'],['variation','Maior variação']].map(([v,l]) =>
            `<button class="btn btn-sm ${sort===v?'btn-primary':'btn-outline'}" data-sort="${v}">${l}</button>`
          ).join('')}
        </div>
      </div>`;

    // ── Tabela ──────────────────────────────────────
    html += buildTable(rows, stores, result);

    // ── Legenda de fontes ───────────────────────────
    html += `
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px;padding:10px 14px;background:var(--color-bg-muted);border-radius:var(--radius-md)">
        <span style="font-size:11px;color:var(--color-text-tertiary);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Fonte:</span>
        ${sourceBadge('sefaz_xml', 0.99)}
        ${sourceBadge('partner_xml', 0.95)}
        ${sourceBadge('nf_photo', 0.82)}
        ${sourceBadge('manual', 0.60)}
        <span style="font-size:11px;color:var(--color-text-tertiary);margin-left:4px">· % = confiança do preço</span>
      </div>`;

    // ── Estratégia mista ────────────────────────────
    const mixed = App.compare.mixedStrategy(rows, stores);
    if (mixed.savings > 0.01 && stores.length > 1) {
      html += buildMixedStrategy(mixed);
    }

    html += '</div>';
    container.innerHTML = html;

    // Bind sort
    container.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => { App.state.setCompareSort(btn.dataset.sort); render(); });
    });

    // Bind hover em células de preço para mostrar tooltip de data
    container.querySelectorAll('[data-price-meta]').forEach(cell => {
      cell.addEventListener('mouseenter', e => showPriceTooltip(e, cell));
      cell.addEventListener('mouseleave', hidePriceTooltip);
    });
  }

  function buildTable(rows, stores, result) {
    const colW = stores.length > 3 ? '90px' : '120px';
    let thead = `<tr>
      <th style="min-width:160px">Produto</th>
      <th style="min-width:60px;text-align:center">Qtd</th>`;
    stores.forEach(s => {
      const partial = result.coverage[s.id]?.found < result.coverage[s.id]?.total ? '*' : '';
      thead += `<th class="store-col" style="min-width:${colW}">${s.emoji} ${s.name}${partial}</th>`;
    });
    thead += '</tr>';

    let tbody = '';
    let lastCat = null;

    rows.forEach(({ product, qty, cells }) => {
      // Separador de categoria
      if (product.category !== lastCat && App.state.getKey('compareSort') === 'category') {
        const cat = App.catalog.categories.find(c => c.id === product.category);
        if (cat) tbody += `<tr><td colspan="${stores.length + 2}" style="background:var(--color-bg-muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-tertiary);padding:6px 14px">${cat.emoji} ${cat.label}</td></tr>`;
        lastCat = product.category;
      }

      tbody += `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">${product.emoji}</span>
            <div>
              <div style="font-weight:500;font-size:13px">${product.name}</div>
            </div>
          </div>
        </td>
        <td style="text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--color-text-secondary)">
          ${qty} ${product.unit}
        </td>`;

      cells.forEach(cell => {
        const meta = getPriceMeta(cell.storeId, product.id);
        const dateStr = meta?.updated ? friendlyDate(meta.updated) : null;
        const metaJson = meta ? encodeURIComponent(JSON.stringify({
          date:   meta.updated,
          source: meta.source,
          conf:   meta.confidence,
          count:  meta.count,
        })) : '';

        tbody += `<td class="td-store">
          ${cell.adjustedPrice != null ? `
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px"
                 ${metaJson ? `data-price-meta="${metaJson}"` : ''}>
              <span class="price-pill ${cell.cls}">
                ${cell.adjustedPrice.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </span>
              ${meta?.source ? sourceBadge(meta.source, meta.confidence) : ''}
              ${dateStr ? `<span style="font-size:10px;color:var(--color-text-tertiary);white-space:nowrap">${dateStr}</span>` : ''}
            </div>
          ` : `<span class="price-pill na">—</span>`}
        </td>`;
      });

      tbody += '</tr>';
    });

    // Total
    tbody += '<tr class="total-row"><td colspan="2">Total estimado</td>';
    stores.forEach(s => {
      const isBest = s.id === result.bestStoreId;
      const partial = result.coverage[s.id]?.found < result.coverage[s.id]?.total ? '*' : '';
      tbody += `<td class="td-store" style="${isBest ? 'color:var(--color-primary-600)' : ''}">
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
      </div>`;
  }

  // ── Tooltip de detalhes do preço ───────────────────
  let _tooltip = null;
  function showPriceTooltip(e, cell) {
    try {
      const meta = JSON.parse(decodeURIComponent(cell.dataset.priceMeta));
      if (!meta.date) return;

      hidePriceTooltip();
      const tt = document.createElement('div');
      tt.id = 'price-tooltip';
      tt.style.cssText = `
        position:fixed;z-index:9999;
        background:var(--color-bg-card);
        border:1px solid var(--color-border-medium);
        border-radius:var(--radius-md);
        padding:10px 14px;
        box-shadow:var(--shadow-lg);
        font-size:12px;
        min-width:180px;
        pointer-events:none;
      `;
      const d = new Date(meta.date);
      const srcMap = { sefaz_xml:'SEFAZ (oficial)', partner_xml:'Parceiro', nf_photo:'Foto de NF', nf_text:'Texto de NF', manual:'Manual' };
      tt.innerHTML = `
        <div style="font-weight:600;margin-bottom:6px;color:var(--color-text-primary)">Detalhes do preço</div>
        <div style="color:var(--color-text-secondary);line-height:1.8">
          📅 <strong>Data:</strong> ${d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}<br>
          📡 <strong>Fonte:</strong> ${srcMap[meta.source] || meta.source}<br>
          ✅ <strong>Confiança:</strong> ${Math.round((meta.conf||0)*100)}%<br>
          🔢 <strong>Confirmações:</strong> ${meta.count || 1} nota(s)
        </div>`;

      document.body.appendChild(tt);
      _tooltip = tt;

      const rect = cell.getBoundingClientRect();
      tt.style.top  = `${rect.bottom + 6}px`;
      tt.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
    } catch {}
  }

  function hidePriceTooltip() {
    _tooltip?.remove();
    _tooltip = null;
  }

  function buildMixedStrategy(mixed) {
    const entries = Object.values(mixed.byStore).filter(b => b.items.length > 0);
    if (!entries.length) return '';
    return `
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-header">
          <div>
            <div class="card-title">🧠 Estratégia de Compra Mista</div>
            <div class="card-subtitle">
              Comprando cada item na loja mais barata, você economiza
              <strong style="color:var(--color-primary-500)">${fmt(mixed.savings)}</strong>
            </div>
          </div>
          <span class="badge badge-success">Economia ${fmt(mixed.savings)}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
          ${entries.map(entry => `
            <div style="border:1px solid var(--color-border-light);border-radius:var(--radius-md);padding:12px">
              <div style="font-weight:600;margin-bottom:8px;font-size:14px">${entry.store.emoji} ${entry.store.name}</div>
              <div style="display:flex;flex-direction:column;gap:4px">
                ${entry.items.map(i => `
                  <div style="display:flex;justify-content:space-between;font-size:12px">
                    <span>${i.product.emoji} ${i.product.name}</span>
                    <span style="font-family:var(--font-mono)">${fmt(i.price)}</span>
                  </div>`).join('')}
              </div>
              <div style="border-top:1px solid var(--color-border-light);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:13px;font-weight:600">
                <span>Subtotal</span>
                <span style="font-family:var(--font-mono)">${fmt(entry.subtotal)}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  return { render };
})();
