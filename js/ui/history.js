/* ═══════════════════════════════════════════════════
   js/ui/history.js — UI de Histórico de Preços
   Gráficos de linha com Chart.js mostrando evolução
   do preço ao longo do tempo por produto e loja.
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.history = (() => {

  // Cores por loja (index → cor)
  const STORE_COLORS = ['#388e3c','#1976D2','#F57C00','#7B1FA2','#C62828'];
  const STORE_FILLS  = ['#388e3c22','#1976D222','#F57C0022','#7B1FA222','#C6282822'];

  let _chart = null;
  let _currentProductId = null;

  // ── Modal de histórico ─────────────────────────────
  function injectMarkup() {
    const modal = document.createElement('div');
    modal.id = 'history-modal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = `
      <div class="auth-modal-box" style="max-width:680px;width:100%" role="dialog" aria-label="Histórico de preços">
        <button class="auth-close" id="btn-history-close" aria-label="Fechar">✕</button>
        <div id="history-modal-content">
          <div class="loading-overlay"><div class="spinner spinner-lg"></div><p>Carregando histórico...</p></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-history-close')?.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  }

  function closeModal() {
    document.getElementById('history-modal')?.classList.remove('open');
    if (_chart) { _chart.destroy(); _chart = null; }
  }

  // ── Abre modal para um produto ─────────────────────
  async function openForProduct(productId) {
    const modal = document.getElementById('history-modal');
    if (!modal) return;

    _currentProductId = productId;
    const product = App.catalog.getById(productId);
    const content = document.getElementById('history-modal-content');
    content.innerHTML = `<div class="loading-overlay"><div class="spinner spinner-lg"></div><p>Carregando histórico...</p></div>`;
    modal.classList.add('open');

    try {
      const { by_store, stats } = await App.api.history.getByProduct(productId, 90);
      const stores = App.state.getActiveStores();
      renderChart(product, by_store, stats, stores);
    } catch (e) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">📉</div><div class="empty-title">Histórico indisponível</div><div class="empty-desc">${e.message}</div></div>`;
    }
  }

  function renderChart(product, byStore, stats, stores) {
    const content = document.getElementById('history-modal-content');
    if (!product) return;

    // Monta datasets para Chart.js
    const datasets = [];
    const storeEntries = Object.entries(byStore);

    storeEntries.forEach(([storeId, points], idx) => {
      const store = stores.find(s => s.id === storeId) || App.storesData.getById(storeId);
      if (!points.length) return;
      datasets.push({
        label:           store ? `${store.emoji} ${store.name}` : storeId,
        data:            points.map(p => ({ x: p.date, y: p.price })),
        borderColor:     STORE_COLORS[idx % STORE_COLORS.length],
        backgroundColor: STORE_FILLS[idx % STORE_FILLS.length],
        borderWidth:     2,
        pointRadius:     3,
        pointHoverRadius: 6,
        tension:         0.3,
        fill:            false,
      });
    });

    // Monta métricas de resumo
    const statsHTML = Object.entries(stats || {}).map(([storeId, s], idx) => {
      const store = stores.find(st => st.id === storeId) || App.storesData.getById(storeId);
      const color = STORE_COLORS[idx % STORE_COLORS.length];
      const trend = s.variation > 0 ? `▲ ${s.variation}%` : s.variation < 0 ? `▼ ${Math.abs(s.variation)}%` : '→ estável';
      const trendColor = s.variation > 0 ? 'var(--color-danger-text)' : s.variation < 0 ? 'var(--color-success-text)' : 'var(--color-text-secondary)';
      return `
        <div style="border-left:3px solid ${color};padding:8px 12px;border-radius:0 var(--radius-md) var(--radius-md) 0;background:var(--color-bg-muted)">
          <div style="font-size:12px;font-weight:600;margin-bottom:4px">${store ? store.name : storeId}</div>
          <div style="display:flex;gap:12px;font-size:12px;font-family:var(--font-mono)">
            <span>Mín: <strong>R$${s.min.toFixed(2)}</strong></span>
            <span>Máx: <strong>R$${s.max.toFixed(2)}</strong></span>
            <span>Atual: <strong>R$${s.last.toFixed(2)}</strong></span>
            <span style="color:${trendColor}">${trend}</span>
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div style="margin-bottom:16px">
        <h2 style="font-size:18px;font-weight:600;margin-bottom:4px">${product.emoji} ${product.name}</h2>
        <p style="font-size:13px;color:var(--color-text-secondary)">Evolução de preços nos últimos 90 dias</p>
      </div>

      ${statsHTML ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">${statsHTML}</div>` : ''}

      ${datasets.length ? `
        <div style="position:relative;height:280px;margin-bottom:16px">
          <canvas id="history-chart"></canvas>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${[30,60,90].map(d => `<button class="btn btn-sm btn-outline" data-days="${d}" onclick="App.ui.history._changeDays(${d})">${d} dias</button>`).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">Sem histórico ainda</div>
          <div class="empty-desc">Envie notas fiscais para este produto começar a construir o histórico de preços.</div>
        </div>
      `}
    `;

    if (!datasets.length) return;

    // Inicializa Chart.js
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;

    if (_chart) { _chart.destroy(); _chart = null; }

    // Usa Chart.js se disponível, fallback para SVG simples
    if (window.Chart) {
      _chart = new window.Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          interaction:         { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: R$${parseFloat(ctx.parsed.y).toFixed(2)}`,
              },
            },
          },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'day', displayFormats: { day: 'dd/MM' } },
              grid: { color: 'rgba(128,128,128,0.1)' },
              ticks: { font: { size: 11 } },
            },
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(128,128,128,0.1)' },
              ticks: {
                font: { size: 11 },
                callback: v => `R$${v.toFixed(2)}`,
              },
            },
          },
        },
      });
    } else {
      // Fallback SVG simples (sem Chart.js)
      renderFallbackChart(ctx.parentElement, datasets);
    }
  }

  function renderFallbackChart(container, datasets) {
    if (!datasets.length || !datasets[0].data.length) return;
    const allPrices = datasets.flatMap(d => d.data.map(p => p.y));
    const minP = Math.min(...allPrices) * 0.95;
    const maxP = Math.max(...allPrices) * 1.05;
    const allDates = datasets.flatMap(d => d.data.map(p => new Date(p.x).getTime()));
    const minD = Math.min(...allDates);
    const maxD = Math.max(...allDates);

    const W = 600; const H = 220;
    const pad = { top: 10, right: 10, bottom: 30, left: 50 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const toX = t => pad.left + (cW * (t - minD) / (maxD - minD || 1));
    const toY = v => pad.top + cH - (cH * (v - minP) / (maxP - minP || 1));

    let paths = '';
    datasets.forEach((ds, i) => {
      const pts = ds.data.map(p => `${toX(new Date(p.x).getTime())},${toY(p.y)}`).join(' ');
      paths += `<polyline points="${pts}" fill="none" stroke="${STORE_COLORS[i]}" stroke-width="2" stroke-linejoin="round"/>`;
    });

    container.innerHTML = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible">${paths}</svg>`;
  }

  async function _changeDays(days) {
    if (!_currentProductId) return;
    const product = App.catalog.getById(_currentProductId);
    const content = document.getElementById('history-modal-content');
    if (!content) return;
    try {
      const { by_store, stats } = await App.api.history.getByProduct(_currentProductId, days);
      const stores = App.state.getActiveStores();
      renderChart(product, by_store, stats, stores);
    } catch (e) {
      App.toast.error('Erro ao carregar histórico', e.message);
    }
  }

  // ── Tab de histórico global ─────────────────────────
  function render() {
    // Renderiza dentro da aba Comparar, como seção expansível
    // O histórico detalhado abre via modal ao clicar no produto
  }

  return {
    init() { injectMarkup(); injectChartJS(); },
    openForProduct,
    closeModal,
    render,
    _changeDays, // exposto para inline onclick
  };

  function injectChartJS() {
    if (window.Chart) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.3/chart.umd.min.js';
    // Após Chart.js, carrega adapter de tempo
    script.onload = () => {
      const adapter = document.createElement('script');
      adapter.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js';
      document.head.appendChild(adapter);
    };
    document.head.appendChild(script);
  }

})();
