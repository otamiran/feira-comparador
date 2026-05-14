/* ═══════════════════════════════════════════════════
   js/ui/tabs.js — Controle de navegação por abas
════════════════════════════════════════════════════ */

App.tabs = (() => {

  function init() {
    // Botões da sidebar
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        App.state.setActiveTab(tab);
        // Fecha sidebar no mobile
        if (window.innerWidth < 768) closeMobileSidebar();
      });
    });

    // Botão mobile menu
    document.getElementById('btn-mobile-menu')
      ?.addEventListener('click', toggleMobileSidebar);

    // Escuta mudanças de tab
    App.state.subscribe('activeTab', render);

    // Escuta mudanças na lista para atualizar badge
    App.state.subscribe('selectedItems', updateBadges);

    // Escuta mudanças nas lojas ativas
    App.state.subscribe('activeStoreIds', updateStoreBadge);

    render(App.state.getKey('activeTab'));
  }

  function render(activeTab) {
    // Atualiza painéis
    document.querySelectorAll('.tab-panel').forEach(panel => {
      const isActive = panel.id === `tab-${activeTab}`;
      panel.classList.toggle('active', isActive);
    });

    // Atualiza botões da nav
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });

    // Renderiza o conteúdo da aba ativa
    switch (activeTab) {
      case 'catalog': App.ui.catalog.render(); break;
      case 'list':    App.ui.list.render();    break;
      case 'compare': App.ui.compare.render(); break;
      case 'stores':  App.ui.stores.render();  break;
      case 'nf':      App.ui.nf.render();      break;
    }
  }

  function updateBadges() {
    const count = App.state.getSelectedCount();
    const badge = document.getElementById('badge-list');
    const mobileBadge = document.getElementById('mobile-badge');
    if (badge) {
      badge.textContent = count;
      badge.dataset.count = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
    if (mobileBadge) mobileBadge.textContent = count;
  }

  function updateStoreBadge() {
    const stores = App.state.getActiveStores();
    const badge = document.getElementById('badge-stores');
    if (badge) {
      badge.textContent = stores.length;
      badge.dataset.count = stores.length;
    }
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('visible');
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }

  return { init, render, updateBadges };

})();
