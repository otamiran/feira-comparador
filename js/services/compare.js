/* ═══════════════════════════════════════════════════
   js/services/compare.js — Lógica de comparação de preços
   Toda a matemática de comparação fica aqui.
   Funções puras — sem efeitos colaterais.
════════════════════════════════════════════════════ */

App.compare = (() => {

  /**
   * Formata valor em moeda brasileira.
   * @param {number|null} value
   * @returns {string}
   */
  function formatCurrency(value) {
    if (value == null || isNaN(value)) return '—';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Retorna os preços de um produto em todas as lojas ativas,
   * ajustados pela quantidade selecionada.
   *
   * @param {string} productId
   * @param {number} qty
   * @param {object[]} stores - lojas ativas
   * @returns {{ storeId, price, adjustedPrice, available }[]}
   */
  function getProductPrices(productId, qty, stores) {
    return stores.map(store => {
      const unitPrice = App.state.getPrice(store.id, productId);
      return {
        storeId: store.id,
        storeName: store.name,
        unitPrice,
        adjustedPrice: unitPrice != null ? unitPrice * qty : null,
        available: unitPrice != null,
      };
    });
  }

  /**
   * Classifica um preço como 'best', 'worst' ou 'middle'
   * com base nos preços disponíveis de um produto.
   *
   * @param {number|null} price
   * @param {number[]} availablePrices
   * @returns {'best'|'worst'|'middle'|'na'}
   */
  function classifyPrice(price, availablePrices) {
    if (price == null) return 'na';
    if (availablePrices.length < 2) return 'middle';
    const min = Math.min(...availablePrices);
    const max = Math.max(...availablePrices);
    if (price === min) return 'best';
    if (price === max) return 'worst';
    return 'middle';
  }

  /**
   * Gera a tabela completa de comparação.
   *
   * @param {object[]} selectedList - [{ product, qty }]
   * @param {object[]} stores       - lojas ativas
   * @returns {object} resultado completo
   */
  function buildCompareTable(selectedList, stores) {
    if (!selectedList.length || !stores.length) {
      return { rows: [], totals: {}, storeRanking: [], bestStoreId: null, savings: 0, coverage: {} };
    }

    const rows = [];
    const totals = {};       // { storeId: totalAdjustedPrice }
    const coverage = {};     // { storeId: { found, total } }

    // Inicializa totais e cobertura
    stores.forEach(s => {
      totals[s.id] = 0;
      coverage[s.id] = { found: 0, total: selectedList.length };
    });

    // Processa cada produto
    selectedList.forEach(({ product, qty }) => {
      const prices = getProductPrices(product.id, qty, stores);
      const available = prices.filter(p => p.available).map(p => p.adjustedPrice);

      const cells = prices.map(p => {
        const cls = classifyPrice(p.adjustedPrice, available);
        if (p.available) {
          totals[p.storeId] += p.adjustedPrice;
          coverage[p.storeId].found++;
        }
        return { storeId: p.storeId, unitPrice: p.unitPrice, adjustedPrice: p.adjustedPrice, cls };
      });

      // Variação percentual do produto
      let variation = 0;
      let variationPct = 0;
      if (available.length >= 2) {
        const min = Math.min(...available);
        const max = Math.max(...available);
        variation = max - min;
        variationPct = ((max - min) / min) * 100;
      }

      rows.push({ product, qty, cells, variation, variationPct });
    });

    // Ordena lojas por total (menor primeiro)
    const storeRanking = [...stores].sort((a, b) => totals[a.id] - totals[b.id]);
    const bestStoreId = storeRanking[0]?.id || null;
    const worstTotal  = Math.max(...Object.values(totals));
    const bestTotal   = Math.min(...Object.values(totals));
    const savings     = worstTotal - bestTotal;

    return { rows, totals, storeRanking, bestStoreId, savings, coverage };
  }

  /**
   * Ordena as linhas da tabela por critério.
   * @param {object[]} rows
   * @param {'variation'|'name'|'category'} criterion
   * @returns {object[]}
   */
  function sortRows(rows, criterion = 'category') {
    return [...rows].sort((a, b) => {
      switch (criterion) {
        case 'variation': return b.variationPct - a.variationPct;
        case 'name':      return a.product.name.localeCompare(b.product.name, 'pt-BR');
        case 'category':  return a.product.category.localeCompare(b.product.category, 'pt-BR');
        default: return 0;
      }
    });
  }

  /**
   * Retorna os N produtos com maior variação de preço.
   * @param {object[]} rows
   * @param {number} n
   * @returns {object[]}
   */
  function topVariation(rows, n = 5) {
    return [...rows]
      .filter(r => r.variationPct > 0)
      .sort((a, b) => b.variationPct - a.variationPct)
      .slice(0, n);
  }

  /**
   * Sugere uma "estratégia mista" de compras:
   * qual loja comprar cada produto para minimizar custo total.
   * @param {object[]} rows
   * @param {object[]} stores
   * @returns {{ totalMixed, byStore, savings }}
   */
  function mixedStrategy(rows, stores) {
    const byStore = {};
    stores.forEach(s => { byStore[s.id] = { store: s, items: [], subtotal: 0 }; });

    let totalMixed = 0;
    let totalBestSingle = Math.min(
      ...stores.map(s =>
        rows.reduce((acc, r) => {
          const cell = r.cells.find(c => c.storeId === s.id);
          return acc + (cell?.adjustedPrice ?? 0);
        }, 0)
      )
    );

    rows.forEach(row => {
      const available = row.cells.filter(c => c.adjustedPrice != null);
      if (!available.length) return;
      const best = available.reduce((a, b) => a.adjustedPrice < b.adjustedPrice ? a : b);
      byStore[best.storeId].items.push({ product: row.product, qty: row.qty, price: best.adjustedPrice });
      byStore[best.storeId].subtotal += best.adjustedPrice;
      totalMixed += best.adjustedPrice;
    });

    return {
      totalMixed,
      byStore,
      savings: totalBestSingle - totalMixed,
    };
  }

  return {
    formatCurrency,
    getProductPrices,
    classifyPrice,
    buildCompareTable,
    sortRows,
    topVariation,
    mixedStrategy,
  };

})();
