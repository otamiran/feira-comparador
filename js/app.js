/* ═══════════════════════════════════════════════════
 js/app.js — Inicialização da aplicação
 Versão multi-usuário com backend e autenticação.
════════════════════════════════════════════════════ */
const API_BASE = 'https://feira-backend-production.up.railway.app/api';
App.appInit = {};

// ── Funções de inicialização ──────────────────────
App.appInit.loadPricesFromAPI = async function () {
 try {
 const { prices } = await App.api.prices.getAll();
 App.state.setPricesFromBackend(prices);
 if (App.state.getKey('activeTab') === 'catalog') App.ui.catalog.render();
 if (App.state.getKey('activeTab') === 'compare') App.ui.compare.render();
 } catch (e) {
 console.warn('[App] Backend indisponível, modo offline:', e.message);
 }
};

App.appInit.syncListFromAPI = async function () {
 if (!App.state.isLoggedIn()) return;
 try {
 const { items } = await App.api.lists.get();
 App.state.setListFromBackend(items);
 App.tabs.updateBadges();
 if (App.state.getKey('activeTab') === 'list') App.ui.list.render();
 if (App.state.getKey('activeTab') === 'compare') App.ui.compare.render();
 } catch (e) {
 console.warn('[App] Falha ao sincronizar lista:', e.message);
 }
};

App.appInit.pushListToAPI = async function () {
 if (!App.state.isLoggedIn()) return;
 const items = App.state.getSelectedList().map(({ product, qty }) => ({ product_id: product.id, qty }));
 try { await App.api.lists.sync(items); }
 catch (e) { console.warn('[App] Falha ao salvar lista no backend:', e.message); }
};

// ── Inicialização principal ───────────────────────
(async function initApp() {
 const overlay = document.createElement('div');
 overlay.id = 'sidebar-overlay';
 overlay.className = 'sidebar-overlay';
 overlay.addEventListener('click', () => {
 document.getElementById('sidebar')?.classList.remove('open');
 overlay.classList.remove('visible');
 });
 document.body.appendChild(overlay);
 App.ui.auth.init();
 App.ui.history.init();
 App.state.initPrices();
 const cachedUser = App.api.auth.getCachedUser();
 if (cachedUser) {
 App.state.setCurrentUser(cachedUser);
 App.ui.auth.updateSidebarUI(cachedUser);
 }
 App.api.auth.restore().then(user => {
 if (user) {
 App.state.setCurrentUser(user);
 App.ui.auth.updateSidebarUI(user);
 App.appInit.syncListFromAPI();
 } else if (cachedUser) {
 App.state.setCurrentUser(null);
 App.ui.auth.updateSidebarUI(null);
 }
 });
 if (!App.state.getSelectedCount()) App.state.loadSavedList();
 const savedLoc = App.storage.loadLocation();
 if (savedLoc) {
 App.state.setUserLocation(savedLoc);
 updateLocationDisplay(savedLoc);
 refreshNearbyStores(savedLoc);
 } else {
 App.state.setActiveStores(App.storesData.list.map(s => s.id));
 }
 App.appInit.loadPricesFromAPI();
 App.tabs.init();
 document.getElementById('btn-refresh-location')?.addEventListener('click', () => requestLocation(false));
 App.state.subscribe('prices', () => {
 if (App.state.getKey('activeTab') === 'catalog') App.ui.catalog.render();
 });
 App.state.subscribe('selectedItems', () => {
 if (App.state.getKey('activeTab') === 'compare') App.ui.compare.render();
 });
 App.ui.catalog.render();
 setTimeout(() => { if (!savedLoc) requestLocation(true); }, 1000);
 console.info('[App] Comparador de Feira v2 iniciado.');
})();

// ── Funções auxiliares ────────────────────────────
async function requestLocation(silent = false) {
 if (!silent) App.toast.info('Detectando localização...');
 try {
 const loc = await App.location.getLocation();
 App.state.setUserLocation(loc);
 App.storage.saveLocation(loc);
 refreshNearbyStores(loc);
 updateLocationDisplay(loc);
 if (!silent) {
 App.toast.success('Localização atualizada', `${loc.city}, ${loc.state}`);
 if (App.state.getKey('activeTab') === 'stores') App.ui.stores.render();
 }
 } catch (e) {
 if (!silent) App.toast.warning('Localização indisponível', e.message);
 App.state.setActiveStores(App.storesData.list.map(s => s.id));
 }
}

function refreshNearbyStores(loc) {
 const radius = App.state.getKey('searchRadius');
 const nearby = App.location.getNearbyStores(loc, radius);
 const ids = nearby.length ? nearby.map(s => s.id) : App.storesData.list.map(s => s.id);
 App.state.setActiveStores(ids);
}

function updateLocationDisplay(loc) {
 const nameEl = document.getElementById('loc-name');
 const subEl = document.getElementById('loc-sub');
 if (nameEl) nameEl.textContent = `${loc.city}${loc.state ? ', ' + loc.state : ''}`;
 if (subEl) subEl.textContent = 'localização atual';
}
