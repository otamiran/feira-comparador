/* ═══════════════════════════════════════════════════
   js/ui/nf.js — UI de Processamento de Nota Fiscal
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.nf = (() => {

  const fmt = App.compare.formatCurrency;

  function render() {
    const container = document.getElementById('nf-content');
    if (!container) return;

    const stores = App.storesData.list;
    const storeOptions = stores.map(s =>
      `<option value="${s.id}">${s.emoji} ${s.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="nf-grid">

        <!-- ── Coluna esquerda: entrada ── -->
        <div class="nf-form-area">

          <!-- Info -->
          <div class="card card-sm" style="background:var(--color-info-bg);border-color:var(--color-info-border)">
            <p style="font-size:13px;color:var(--color-info-text);line-height:1.6">
              ℹ️ <strong>Como funciona:</strong> Envie uma foto ou cole o texto da sua nota fiscal.
              A IA identifica os produtos e atualiza os preços da loja selecionada automaticamente.
              Quanto mais notas enviadas, mais precisa fica a comparação.
            </p>
          </div>

          <!-- Seleção de loja -->
          <div class="form-group">
            <label class="form-label">Estabelecimento da nota</label>
            <select class="select-input" id="nf-store-select" style="width:100%">
              ${storeOptions}
            </select>
          </div>

          <!-- Upload de arquivo -->
          <div>
            <label class="form-label" style="margin-bottom:6px;display:block">Enviar arquivo (foto ou texto)</label>
            <div class="upload-area" id="nf-upload-area" role="button" tabindex="0" aria-label="Área de upload da nota fiscal">
              <div class="upload-icon">📸</div>
              <div class="upload-title">Clique ou arraste a nota aqui</div>
              <div class="upload-sub">JPG, PNG, WEBP, TXT — máx. 10MB</div>
            </div>
            <input type="file" id="nf-file-input" accept="image/jpeg,image/png,image/webp,text/plain" style="display:none" />
          </div>

          <!-- Divisor -->
          <div class="divider-label">ou cole o texto</div>

          <!-- Área de texto -->
          <div class="form-group">
            <label class="form-label" for="nf-text-input">Texto da nota fiscal</label>
            <textarea
              class="form-input form-textarea"
              id="nf-text-input"
              style="width:100%;min-height:140px"
              placeholder="Cole aqui o texto da nota, ex:&#10;TOMATE KG............R$  3,50&#10;CEBOLA KG............R$  2,99&#10;FRANGO KG............R$  8,99"
            ></textarea>
          </div>

          <button class="btn btn-primary btn-full" id="btn-process-nf">
            🤖 Processar com IA
          </button>
        </div>

        <!-- ── Coluna direita: resultado ── -->
        <div id="nf-result-panel">
          ${renderResultPlaceholder()}
        </div>
      </div>

      <!-- Log de notas processadas -->
      ${renderNFLog()}
    `;

    bindEvents(container);
  }

  function renderResultPlaceholder() {
    return `
      <div class="card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;text-align:center;color:var(--color-text-secondary)">
        <div style="font-size:48px;margin-bottom:16px;opacity:.4">🧾</div>
        <div style="font-size:15px;font-weight:500;margin-bottom:8px">Aguardando processamento</div>
        <div style="font-size:13px">Envie uma nota fiscal ou cole o texto ao lado para extrair os preços automaticamente.</div>
      </div>
    `;
  }

  function renderNFLog() {
    const log = App.state.getPriceLog().slice(0, 10);
    if (!log.length) return '';

    return `
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-header">
          <div class="card-title">📋 Últimas atualizações via NF</div>
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
              <span class="log-date">${entry.date}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function bindEvents(container) {
    // Upload area
    const uploadArea = container.querySelector('#nf-upload-area');
    const fileInput  = container.querySelector('#nf-file-input');

    uploadArea?.addEventListener('click', () => fileInput?.click());
    uploadArea?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
    });

    // Drag and drop
    uploadArea?.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea?.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });

    fileInput?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) processFile(file);
    });

    // Processar com texto
    container.querySelector('#btn-process-nf')?.addEventListener('click', () => {
      const text    = container.querySelector('#nf-text-input').value.trim();
      const storeId = container.querySelector('#nf-store-select').value;
      if (!text) {
        App.toast.warning('Campo vazio', 'Cole o texto da nota fiscal ou envie um arquivo');
        return;
      }
      processText(text, storeId);
    });
  }

  function getSelectedStoreId() {
    return document.getElementById('nf-store-select')?.value;
  }

  async function processFile(file) {
    const storeId = getSelectedStoreId();
    showLoading();
    try {
      const result = await App.nf.processFile(file, storeId, onProgress);
      showResult(result, storeId);
      if (result.updated > 0) {
        App.toast.success(
          `${result.updated} preço(s) atualizado(s)`,
          `${App.storesData.getById(storeId)?.name}`
        );
      }
    } catch (e) {
      showError(e.message);
      App.toast.error('Erro ao processar nota', e.message);
    }
  }

  async function processText(text, storeId) {
    showLoading();
    try {
      const result = await App.nf.processText(text, storeId, onProgress);
      showResult(result, storeId);
      if (result.updated > 0) {
        App.toast.success(
          `${result.updated} preço(s) atualizado(s)`,
          `${App.storesData.getById(storeId)?.name}`
        );
      }
    } catch (e) {
      showError(e.message);
      App.toast.error('Erro ao processar nota', e.message);
    }
  }

  let _progressInterval = null;
  let _progressPct = 0;

  function onProgress({ pct, message }) {
    _progressPct = pct;
    const bar = document.getElementById('nf-progress-bar');
    const msg = document.getElementById('nf-progress-msg');
    if (bar) bar.style.width = `${pct}%`;
    if (msg) msg.textContent = message;
  }

  function showLoading() {
    const panel = document.getElementById('nf-result-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="height:100%;min-height:300px">
        <div class="loading-overlay">
          <div class="spinner spinner-lg"></div>
          <div id="nf-progress-msg" style="font-size:14px;font-weight:500">Inicializando...</div>
          <div class="progress" style="width:100%;max-width:300px">
            <div class="progress-bar" id="nf-progress-bar" style="width:10%"></div>
          </div>
          <div style="font-size:12px;color:var(--color-text-tertiary);text-align:center;max-width:280px">
            A IA está lendo a nota e identificando os produtos cadastrados no sistema.
          </div>
        </div>
      </div>
    `;
  }

  function showResult(result, storeId) {
    const panel = document.getElementById('nf-result-panel');
    if (!panel) return;

    const store = App.storesData.getById(storeId);
    const { totalFound, updated, skipped, rawItems, storeNameFound, dateFound } = result;

    const matchedItems  = rawItems.filter(i => i.matched);
    const unmatchedItems = rawItems.filter(i => !i.matched);

    panel.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">✅ Nota processada</div>
            <div class="card-subtitle">
              ${store?.emoji} ${store?.name}
              ${dateFound ? ` · ${dateFound}` : ''}
              ${storeNameFound ? ` · "${storeNameFound}"` : ''}
            </div>
          </div>
        </div>

        <!-- Métricas -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
          <div style="text-align:center;padding:10px;background:var(--color-bg-muted);border-radius:var(--radius-md)">
            <div style="font-size:22px;font-weight:600">${totalFound}</div>
            <div style="font-size:11px;color:var(--color-text-secondary)">encontrados</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--color-success-bg);border-radius:var(--radius-md)">
            <div style="font-size:22px;font-weight:600;color:var(--color-success-text)">${updated}</div>
            <div style="font-size:11px;color:var(--color-success-text)">atualizados</div>
          </div>
          <div style="text-align:center;padding:10px;background:var(--color-bg-muted);border-radius:var(--radius-md)">
            <div style="font-size:22px;font-weight:600;color:var(--color-text-tertiary)">${skipped}</div>
            <div style="font-size:11px;color:var(--color-text-tertiary)">não associados</div>
          </div>
        </div>

        <!-- Itens associados -->
        ${matchedItems.length ? `
          <div style="margin-bottom:12px">
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-tertiary);margin-bottom:6px">
              ✅ Associados ao catálogo
            </div>
            ${matchedItems.map(item => {
              const product = App.catalog.getById(item.itemId);
              const conf = { high: '🟢', medium: '🟡', low: '🔴' }[item.confidence] || '⚪';
              return `
                <div class="nf-item-row">
                  <div>
                    <div class="nf-item-name">${item.foundName}</div>
                    <div class="nf-item-match">→ ${product ? product.name : item.itemId} ${conf}</div>
                  </div>
                  <div class="nf-item-price">${fmt(item.unitPrice)}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- Itens não associados -->
        ${unmatchedItems.length ? `
          <div>
            <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-tertiary);margin-bottom:6px">
              ❓ Não associados
            </div>
            ${unmatchedItems.map(item => `
              <div class="nf-item-row">
                <div>
                  <div class="nf-item-name">${item.foundName}</div>
                  <div class="nf-item-no-match">Produto não encontrado no catálogo</div>
                </div>
                <div class="nf-item-price" style="color:var(--color-text-tertiary)">${fmt(item.unitPrice)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function showError(message) {
    const panel = document.getElementById('nf-result-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="card" style="min-height:200px">
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Erro ao processar</div>
          <div class="empty-desc">${message}</div>
          <button class="btn btn-outline" onclick="App.ui.nf.render()">Tentar novamente</button>
        </div>
      </div>
    `;
  }

  return { render };

})();
