/* ═══════════════════════════════════════════════════
   js/services/api.js — Cliente da API REST
   
   Centraliza todas as chamadas ao backend.
   Gerencia tokens, refresh automático e erros.
   
   Configure a URL base em: App.api.BASE_URL
════════════════════════════════════════════════════ */

App.api = (() => {

  // ── Configuração ───────────────────────────────────
  // Em desenvolvimento: 'http://localhost:3001'
  // Em produção: URL do seu backend (Railway, Render, etc.)
 const BASE_URL = 'https://feira-backend-production.up.railway.app';

  // ── Tokens em memória (mais seguro que localStorage para access token) ──
  let _accessToken  = null;
  let _refreshToken = localStorage.getItem('feira_refresh_token');
  let _refreshing   = false;
  let _refreshQueue = [];

  // ── Core fetch ─────────────────────────────────────

  async function request(method, path, body = null, opts = {}) {
    const url  = `${BASE_URL}${path}`;
    const hdrs = { 'Content-Type': 'application/json' };

    if (_accessToken && !opts.skipAuth) {
      hdrs['Authorization'] = `Bearer ${_accessToken}`;
    }

    const res = await fetch(url, {
      method,
      headers: hdrs,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Token expirado → tenta refresh automático
    if (res.status === 401 && !opts.skipRefresh && _refreshToken) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        // Refaz a requisição original com novo token
        return request(method, path, body, { ...opts, skipRefresh: true });
      }
      // Refresh falhou → desloga
      logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data   = data;
      throw err;
    }

    return data;
  }

  async function attemptRefresh() {
    if (_refreshing) {
      // Aguarda o refresh em andamento
      return new Promise(resolve => _refreshQueue.push(resolve));
    }
    _refreshing = true;
    try {
      const data = await request('POST', '/api/auth/refresh',
        { refresh_token: _refreshToken },
        { skipAuth: true, skipRefresh: true }
      );
      setTokens(data.access_token, data.refresh_token);
      _refreshQueue.forEach(fn => fn(true));
      _refreshQueue = [];
      return true;
    } catch {
      _refreshQueue.forEach(fn => fn(false));
      _refreshQueue = [];
      return false;
    } finally {
      _refreshing = false;
    }
  }

  function setTokens(access, refresh) {
    _accessToken  = access;
    _refreshToken = refresh;
    if (refresh) localStorage.setItem('feira_refresh_token', refresh);
  }

  function logout() {
    _accessToken  = null;
    _refreshToken = null;
    localStorage.removeItem('feira_refresh_token');
    localStorage.removeItem('feira_user');
  }

  // ── Multipart upload (para imagens de NF) ─────────

  async function uploadFile(path, file, fields = {}) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));

    const res = await fetch(`${BASE_URL}${path}`, {
      method:  'POST',
      headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
      body:    form,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  // ─────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────
  return {

    get BASE_URL() { return BASE_URL; },
    get isLoggedIn() { return Boolean(_accessToken || _refreshToken); },

    // ── Auth ──────────────────────────────────────────
    auth: {
      async register(email, password, name, city, state) {
        const data = await request('POST', '/api/auth/register', { email, password, name, city, state }, { skipAuth: true });
        setTokens(data.access_token, data.refresh_token);
        localStorage.setItem('feira_user', JSON.stringify(data.user));
        return data.user;
      },

      async login(email, password) {
        const data = await request('POST', '/api/auth/login', { email, password }, { skipAuth: true });
        setTokens(data.access_token, data.refresh_token);
        localStorage.setItem('feira_user', JSON.stringify(data.user));
        return data.user;
      },

      async me() {
        const data = await request('GET', '/api/auth/me');
        localStorage.setItem('feira_user', JSON.stringify(data.user));
        return data.user;
      },

      logout() {
        logout();
        localStorage.removeItem('feira_user');
      },

      // Tenta restaurar sessão do refresh token salvo
      async restore() {
        if (!_refreshToken) return null;
        try {
          const refreshed = await attemptRefresh();
          if (!refreshed) return null;
          return await this.me();
        } catch {
          logout();
          return null;
        }
      },

      getCachedUser() {
        try { return JSON.parse(localStorage.getItem('feira_user')); }
        catch { return null; }
      },
    },

    // ── Preços ────────────────────────────────────────
    prices: {
      async getAll()          { return request('GET', '/api/prices'); },
      async getByStore(id)    { return request('GET', `/api/prices/${id}`); },
      async getByProduct(id)  { return request('GET', `/api/prices/product/${id}`); },
      async update(store_id, product_id, unit_price, source = 'manual') {
        return request('POST', '/api/prices', { store_id, product_id, unit_price, source });
      },
    },

    // ── Lista de compras ──────────────────────────────
    lists: {
      async get()           { return request('GET', '/api/lists'); },
      async sync(items)     { return request('PUT', '/api/lists/items', { items }); },
      async addItem(product_id, qty) { return request('POST', '/api/lists/items', { product_id, qty }); },
      async updateQty(itemId, qty)   { return request('PATCH', `/api/lists/items/${itemId}`, { qty }); },
      async removeItem(itemId)       { return request('DELETE', `/api/lists/items/${itemId}`); },
      async clear()                  { return request('DELETE', '/api/lists/items'); },
    },

    // ── Nota Fiscal ───────────────────────────────────
    nf: {
      async processFile(file, store_id) {
        return uploadFile('/api/nf/photo', file, { store_id });
      },
      async processText(text, store_id) {
        return request('POST', '/api/nf/photo', { text, store_id });
      },
      async processSefaz(access_key, store_id) {
        return request('POST', '/api/nf/sefaz', { access_key, store_id });
      },
      async getHistory() { return request('GET', '/api/nf/history'); },
    },

    // ── Histórico de preços ────────────────────────────
    history: {
      async getByProduct(productId, days = 90) {
        return request('GET', `/api/history/${productId}?days=${days}`);
      },
      async getByProductStore(productId, storeId, days = 90) {
        return request('GET', `/api/history/${productId}/${storeId}?days=${days}`);
      },
      async topVariation() {
        return request('GET', '/api/history/summary/top-variation');
      },
    },

    // ── Lojas ─────────────────────────────────────────
    stores: {
      async getAll()                       { return request('GET', '/api/stores'); },
      async getNearby(lat, lng, radius=5)  {
        return request('GET', `/api/stores/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      },
    },
  };

})();
