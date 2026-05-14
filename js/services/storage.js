/* ═══════════════════════════════════════════════════
   js/services/storage.js — Persistência em localStorage
   Isola toda lógica de serialização/deserialização.
════════════════════════════════════════════════════ */

App.storage = (() => {

  const KEYS = {
    PRICES:   'feira_prices_v1',
    LIST:     'feira_list_v1',
    LOCATION: 'feira_location_v1',
    LOG:      'feira_log_v1',
    PREFS:    'feira_prefs_v1',
  };

  function _save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('[Storage] Erro ao salvar:', key, e);
      return false;
    }
  }

  function _load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Storage] Erro ao carregar:', key, e);
      return null;
    }
  }

  function _remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignora */ }
  }

  return {
    // ── Preços ──────────────────────────────────────
    savePrices(prices)  { return _save(KEYS.PRICES, prices); },
    loadPrices()        { return _load(KEYS.PRICES); },
    clearPrices()       { _remove(KEYS.PRICES); },

    // ── Lista de compras ─────────────────────────────
    saveList(list)      { return _save(KEYS.LIST, list); },
    loadList()          { return _load(KEYS.LIST); },

    // ── Localização ──────────────────────────────────
    saveLocation(loc)   { return _save(KEYS.LOCATION, loc); },
    loadLocation()      { return _load(KEYS.LOCATION); },

    // ── Log ──────────────────────────────────────────
    saveLog(log)        { return _save(KEYS.LOG, log); },
    loadLog()           { return _load(KEYS.LOG); },

    // ── Preferências ─────────────────────────────────
    savePrefs(prefs)    { return _save(KEYS.PREFS, prefs); },
    loadPrefs()         { return _load(KEYS.PREFS); },

    /** Remove todos os dados do app */
    clearAll() {
      Object.values(KEYS).forEach(_remove);
    },
  };

})();
