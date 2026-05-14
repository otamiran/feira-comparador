/* ═══════════════════════════════════════════════════
   js/ui/stores.js — UI dos Estabelecimentos
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.stores = (() => {

  const fmt = App.compare.formatCurrency;

  function render() {
    const container = document.getElementById('stores-content');
    if (!container) return;

    const userLoc = App.state.getKey('userLocation');
    const stores  = App.storesData.list.map(store => {
      const dist = userLoc
        ? App.location.haversine(userLoc, store.coords)
        : null;
      return { ...store, distance: dist };
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));

    const selected = App.state.getSelectedList();
    const hasItems = selected.length > 0;

    // Calcula totais por loja (se houver itens na lista)
    const totals = {};
    if (hasItems) {
      const result = App.compare.buildCompareTable(selected, stores);
      Object.assign(totals, result.totals);
    }

    const bestTotal = hasItems
      ? Math.min(...stores.map(s => totals[s.id] || Infinity).filter(v => v < Infinity))
      : null;

    let html = '';

    // ── Painel de localização ──────────────────────
    html += renderLocationPanel(userLoc);

    // ── Lista de lojas ─────────────────────────────
    html += '<div class="stores-list">';
    stores.forEach(store => {
      const total   = totals[store.id];
      const isBest  = hasItems && total === bestTotal && bestTotal != null;
      const distStr = store.distance != null
        ? App.location.formatDistance(store.distance)
        : null;

      html += `
        <div class="store-card ${isBest ? 'best' : ''}">
          <div class="store-avatar">${store.emoji}</div>
          <div class="store-info">
            <div class="store-name">
              ${store.name}
              ${isBest ? '<span class="badge badge-success" style="margin-left:8px">Melhor preço</span>' : ''}
            </div>
            <div class="store-meta">
              ${distStr ? `📍 ${distStr} · ` : ''}
              ⭐ ${store.rating} · ${store.typeLabel}
            </div>
            <div class="store-meta" style="margin-top:2px">${store.openingHours}</div>
            ${store.acceptNF
              ? '<span class="badge badge-info" style="margin-top:4px">🧾 Aceita Nota Fiscal</span>'
              : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${hasItems && total != null
              ? `<div class="store-total">${fmt(total)}</div>
                 <div class="store-total-sub">total estimado</div>`
              : `<div style="font-size:12px;color:var(--color-text-tertiary)">Adicione itens<br>para ver preços</div>`
            }
          </div>
        </div>
      `;
    });
    html += '</div>';

    // ── Log de atualizações de preço ───────────────
    const log = App.state.getPriceLog().slice(0, 15);
    if (log.length) {
      html += `
        <div class="card" style="margin-top:var(--space-5)">
          <div class="card-header">
            <div class="card-title">📋 Histórico de Atualizações</div>
            <span class="badge badge-neutral">${log.length} registros</span>
          </div>
          <div class="price-log">
            ${log.map(entry => `
              <div class="price-log-item">
                <span class="log-dot"></span>
                <span><strong>${entry.storeName}</strong> — ${entry.productName}</span>
                ${entry.oldPrice != null
                  ? `<span style="color:var(--color-danger-text);font-family:var(--font-mono);font-size:12px">${fmt(entry.oldPrice)}</span>
                     <span style="color:var(--color-text-tertiary)">→</span>`
                  : ''}
                <span style="color:var(--color-success-text);font-family:var(--font-mono);font-size:12px">${fmt(entry.newPrice)}</span>
                <span class="log-date">${entry.date} ${entry.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    bindEvents(container);
  }

  function renderLocationPanel(userLoc) {
    const radius = App.state.getKey('searchRadius');

    return `
      <div class="card card-sm" style="margin-bottom:var(--space-4)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📍</span>
            <div>
              <div style="font-weight:600">${userLoc ? `${userLoc.city}${userLoc.state ? ', ' + userLoc.state : ''}` : 'Localização não detectada'}</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">
                ${userLoc ? `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}` : 'Permita o acesso à localização'}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <label style="font-size:13px;color:var(--color-text-secondary)">Raio:</label>
            <input type="number" class="input-sm" id="radius-input-stores" value="${radius}" min="1" max="50" />
            <span style="font-size:13px;color:var(--color-text-secondary)">km</span>
            <button class="btn btn-outline btn-sm" id="btn-update-location">🔄 Atualizar</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(container) {
    // Raio de busca
    const radiusInput = container.querySelector('#radius-input-stores');
    radiusInput?.addEventListener('change', () => {
      const val = parseInt(radiusInput.value) || 5;
      App.state.setSearchRadius(val);
      refreshNearbyStores();
    });

    // Atualizar localização
    container.querySelector('#btn-update-location')?.addEventListener('click', async () => {
      App.toast.info('Atualizando localização...');
      try {
        const loc = await App.location.getLocation();
        App.state.setUserLocation(loc);
        App.storage.saveLocation(loc);
        refreshNearbyStores();
        updateLocationDisplay(loc);
        App.toast.success('Localização atualizada', `${loc.city}, ${loc.state}`);
        render();
      } catch (e) {
        App.toast.error('Erro de localização', e.message);
      }
    });
  }

  function refreshNearbyStores() {
    const loc = App.state.getKey('userLocation');
    if (!loc) return;
    const radius = App.state.getKey('searchRadius');
    const nearby = App.location.getNearbyStores(loc, radius);
    App.state.setActiveStores(nearby.map(s => s.id));
  }

  function updateLocationDisplay(loc) {
    const nameEl = document.getElementById('loc-name');
    const subEl  = document.getElementById('loc-sub');
    if (nameEl) nameEl.textContent = `${loc.city}${loc.state ? ', ' + loc.state : ''}`;
    if (subEl)  subEl.textContent  = 'localização atual';
  }

  return { render, refreshNearbyStores, updateLocationDisplay };

})();
