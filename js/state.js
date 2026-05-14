/* ═══════════════════════════════════════════════════
   js/state.js — Gerenciamento de estado
   Fonte única de verdade da aplicação.
   Atualizado: suporte a usuário autenticado e sync backend.
════════════════════════════════════════════════════ */

App.state = (() => {

  let _state = {
    activeTab:             'catalog',
    selectedItems:         {},     // { productId: { qty, listItemId? } }
    prices:                {},     // { storeId: { productId: price } }
    priceLog:              [],
    userLocation:          null,
    activeStoreIds:        [],
    searchRadius:          5,
    activeCatalogCategory: 'all',
    catalogSearch:         '',
    compareSort:           'category',
    currentUser:           null,
  };

  const _listeners = {};

  function _notify(keys) {
    const affected = Array.isArray(keys) ? keys : [keys];
    affected.forEach(key => (_listeners[key] || []).forEach(fn => fn(_state[key])));
    (_listeners['any'] || []).forEach(fn => fn(_state));
  }

  return {
    get()       { return { ..._state }; },
    getKey(key) { return _state[key]; },

    subscribe(key, fn) {
      if (!_listeners[key]) _listeners[key] = [];
      _listeners[key].push(fn);
    },

    setActiveTab(tab) { _state.activeTab = tab; _notify('activeTab'); },

    // ── Auth ──────────────────────────────────────────
    setCurrentUser(user) { _state.currentUser = user; _notify('currentUser'); },
    getCurrentUser()     { return _state.currentUser; },
    isLoggedIn()         { return Boolean(_state.currentUser); },

    // ── Itens selecionados ────────────────────────────
    toggleItem(productId) {
      if (_state.selectedItems[productId]) {
        delete _state.selectedItems[productId];
      } else {
        const product = App.catalog.getById(productId);
        _state.selectedItems[productId] = { qty: product?.defaultQty || 1 };
      }
      _notify('selectedItems');
      App.storage.saveList(_state.selectedItems);
    },

    setItemQty(productId, qty) {
      if (!_state.selectedItems[productId]) return;
      _state.selectedItems[productId].qty = Math.max(0.01, qty);
      _notify('selectedItems');
      App.storage.saveList(_state.selectedItems);
    },

    setItemBackendId(productId, listItemId) {
      if (_state.selectedItems[productId]) {
        _state.selectedItems[productId].listItemId = listItemId;
      }
    },

    removeItem(productId) {
      delete _state.selectedItems[productId];
      _notify('selectedItems');
      App.storage.saveList(_state.selectedItems);
    },

    clearList() {
      _state.selectedItems = {};
      _notify('selectedItems');
      App.storage.saveList({});
    },

    isItemSelected(productId) { return Boolean(_state.selectedItems[productId]); },
    getSelectedCount()        { return Object.keys(_state.selectedItems).length; },

    getSelectedList() {
      return Object.entries(_state.selectedItems).map(([id, data]) => ({
        product: App.catalog.getById(id), qty: data.qty,
      })).filter(i => i.product);
    },

    loadSavedList() {
      const saved = App.storage.loadList();
      if (saved) { _state.selectedItems = saved; _notify('selectedItems'); }
    },

    setListFromBackend(items) {
      _state.selectedItems = {};
      (items || []).forEach(({ product_id, qty, id }) => {
        _state.selectedItems[product_id] = { qty, listItemId: id };
      });
      App.storage.saveList(_state.selectedItems);
      _notify('selectedItems');
    },

    // ── Preços ────────────────────────────────────────
    initPrices() {
      const saved = App.storage.loadPrices();
      if (saved) {
        _state.prices = saved;
      } else {
        _state.prices = {};
        App.storesData.list.forEach(store => {
          _state.prices[store.id] = { ...(App.storesData.initialPrices[store.id] || {}) };
        });
      }
      _notify('prices');
    },

    setPricesFromBackend(grouped) {
      const flat = {};
      Object.entries(grouped).forEach(([storeId, products]) => {
        flat[storeId] = {};
        Object.entries(products).forEach(([productId, data]) => {
          flat[storeId][productId] = typeof data === 'object' ? data.price : data;
        });
      });
      _state.prices = flat;
      App.storage.savePrices(flat);
      _notify('prices');
    },

    getPrice(storeId, productId) { return _state.prices?.[storeId]?.[productId] ?? null; },

    setPrice(storeId, productId, price) {
      if (!_state.prices[storeId]) _state.prices[storeId] = {};
      const old = _state.prices[storeId][productId];
      _state.prices[storeId][productId] = price;

      const store   = App.storesData.getById(storeId);
      const product = App.catalog.getById(productId);
      if (store && product) {
        _state.priceLog.unshift({
          storeId, storeName: store.name,
          productId, productName: product.name,
          oldPrice: old, newPrice: price,
          date: new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' }),
          time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
        });
        if (_state.priceLog.length > 50) _state.priceLog.pop();
      }

      App.storage.savePrices(_state.prices);
      _notify(['prices', 'priceLog']);
    },

    getPriceLog() { return [..._state.priceLog]; },

    // ── Localização ───────────────────────────────────
    setUserLocation(loc) { _state.userLocation = loc; _notify('userLocation'); },
    setActiveStores(ids) { _state.activeStoreIds = ids; _notify('activeStoreIds'); },
    setSearchRadius(km)  { _state.searchRadius = km; _notify('searchRadius'); },

    getActiveStores() {
      if (!_state.activeStoreIds.length) return App.storesData.list;
      return _state.activeStoreIds.map(id => App.storesData.getById(id)).filter(Boolean);
    },

    // ── Catálogo ──────────────────────────────────────
    setActiveCatalogCategory(cat) { _state.activeCatalogCategory = cat; _notify('activeCatalogCategory'); },
    setCatalogSearch(q)           { _state.catalogSearch = q; _notify('catalogSearch'); },

    // ── Comparador ────────────────────────────────────
    setCompareSort(sort) { _state.compareSort = sort; _notify('compareSort'); },
  };

})();
