/* ═══════════════════════════════════════════════════
   js/ui/auth.js — UI de autenticação
   Modal de login/cadastro + menu do usuário logado
════════════════════════════════════════════════════ */

App.ui = App.ui || {};

App.ui.auth = (() => {

  // ── Injeção do HTML no DOM ─────────────────────────
  function injectMarkup() {
    // Modal overlay
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = `
      <div class="auth-modal-box" role="dialog" aria-modal="true" aria-label="Autenticação">
        <button class="auth-close" id="btn-auth-close" aria-label="Fechar">✕</button>

        <!-- Abas -->
        <div class="auth-tabs">
          <button class="auth-tab active" data-auth-tab="login">Entrar</button>
          <button class="auth-tab" data-auth-tab="register">Criar conta</button>
        </div>

        <!-- Login -->
        <div id="auth-panel-login" class="auth-panel active">
          <p class="auth-intro">Acesse sua lista de compras e histórico de preços em qualquer dispositivo.</p>
          <div class="auth-form">
            <div class="form-group">
              <label class="form-label" for="login-email">E-mail</label>
              <input class="form-input" id="login-email" type="email" placeholder="seu@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Senha</label>
              <input class="form-input" id="login-password" type="password" placeholder="••••••" autocomplete="current-password" />
            </div>
            <div id="auth-login-error" class="auth-error" style="display:none"></div>
            <button class="btn btn-primary btn-full" id="btn-do-login">
              Entrar na conta
            </button>
          </div>
        </div>

        <!-- Cadastro -->
        <div id="auth-panel-register" class="auth-panel">
          <p class="auth-intro">Crie sua conta gratuita para salvar listas e acompanhar variações de preço.</p>
          <div class="auth-form">
            <div class="form-group">
              <label class="form-label" for="reg-name">Nome</label>
              <input class="form-input" id="reg-name" type="text" placeholder="Seu nome" autocomplete="name" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">E-mail</label>
              <input class="form-input" id="reg-email" type="email" placeholder="seu@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Senha (mínimo 6 caracteres)</label>
              <input class="form-input" id="reg-password" type="password" placeholder="••••••" autocomplete="new-password" />
            </div>
            <div style="display:grid;grid-template-columns:1fr 80px;gap:8px">
              <div class="form-group">
                <label class="form-label" for="reg-city">Cidade (opcional)</label>
                <input class="form-input" id="reg-city" type="text" placeholder="Santa Rita" />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-state">UF</label>
                <input class="form-input" id="reg-state" type="text" placeholder="PB" maxlength="2" style="text-transform:uppercase" />
              </div>
            </div>
            <div id="auth-reg-error" class="auth-error" style="display:none"></div>
            <button class="btn btn-primary btn-full" id="btn-do-register">
              Criar conta grátis
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Botão de login na sidebar
    const sidebarUser = document.createElement('div');
    sidebarUser.id = 'sidebar-user';
    sidebarUser.className = 'sidebar-user';
    sidebarUser.innerHTML = `
      <div id="user-logged-out" class="user-state">
        <button class="btn-user-login" id="btn-open-auth">
          <span class="user-avatar-placeholder">👤</span>
          <span>Entrar / Cadastrar</span>
        </button>
      </div>
      <div id="user-logged-in" class="user-state" style="display:none">
        <div class="user-info-row">
          <div class="user-avatar" id="user-avatar-initials">JD</div>
          <div class="user-details">
            <span class="user-name" id="sidebar-user-name">João</span>
            <span class="user-email" id="sidebar-user-email">j@email.com</span>
          </div>
          <button class="btn-user-logout" id="btn-logout" title="Sair">⎋</button>
        </div>
      </div>
    `;

    // Insere antes da localização na sidebar
    const locEl = document.querySelector('.sidebar-location');
    if (locEl) locEl.before(sidebarUser);

    bindEvents(modal);
  }

  function bindEvents(modal) {
    // Fechar modal
    document.getElementById('btn-auth-close')?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    // Abas
    modal.querySelectorAll('.auth-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.authTab));
    });

    // Login
    document.getElementById('btn-do-login')?.addEventListener('click', doLogin);
    document.getElementById('login-password')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });

    // Cadastro
    document.getElementById('btn-do-register')?.addEventListener('click', doRegister);

    // Abrir modal
    document.getElementById('btn-open-auth')?.addEventListener('click', open);

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  }

  // ── Tab switching ─────────────────────────────────
  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.authTab === tab));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === `auth-panel-${tab}`));
    clearErrors();
  }

  function clearErrors() {
    document.querySelectorAll('.auth-error').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) { btn.disabled = loading; btn.textContent = loading ? 'Aguarde...' : btn.dataset.label; }
  }

  // ── Ações de auth ─────────────────────────────────
  async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) return showError('auth-login-error', 'Preencha e-mail e senha');

    const btn = document.getElementById('btn-do-login');
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    clearErrors();

    try {
      const user = await App.api.auth.login(email, pass);
      onLoginSuccess(user);
    } catch (e) {
      showError('auth-login-error', e.message || 'Erro ao fazer login');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar na conta';
    }
  }

  async function doRegister() {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-password').value;
    const city  = document.getElementById('reg-city').value.trim();
    const state = document.getElementById('reg-state').value.trim().toUpperCase();

    if (!name || !email || !pass) return showError('auth-reg-error', 'Preencha nome, e-mail e senha');
    if (pass.length < 6) return showError('auth-reg-error', 'Senha deve ter pelo menos 6 caracteres');

    const btn = document.getElementById('btn-do-register');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';
    clearErrors();

    try {
      const user = await App.api.auth.register(email, pass, name, city, state);
      onLoginSuccess(user);
    } catch (e) {
      showError('auth-reg-error', e.message || 'Erro ao criar conta');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Criar conta grátis';
    }
  }

  async function doLogout() {
    App.api.auth.logout();
    App.state.setCurrentUser(null);
    App.state.clearList();
    updateSidebarUI(null);
    App.toast.info('Até logo!', 'Sessão encerrada');
    // Recarrega preços do backend (mas sem lista pessoal)
    await App.appInit.loadPricesFromAPI();
    App.tabs.updateBadges();
    App.ui.catalog.render();
  }

  // ── Após login bem-sucedido ────────────────────────
  async function onLoginSuccess(user) {
    App.state.setCurrentUser(user);
    updateSidebarUI(user);
    close();
    App.toast.success(`Bem-vindo, ${user.name.split(' ')[0]}!`);

    // Carrega lista do backend e sincroniza
    await App.appInit.syncListFromAPI();
    App.tabs.updateBadges();

    // Recarrega preços atualizados
    await App.appInit.loadPricesFromAPI();
    if (App.state.getKey('activeTab') === 'compare') App.ui.compare.render();
    if (App.state.getKey('activeTab') === 'list')    App.ui.list.render();
  }

  function updateSidebarUI(user) {
    const loggedOut = document.getElementById('user-logged-out');
    const loggedIn  = document.getElementById('user-logged-in');
    if (!loggedOut || !loggedIn) return;

    if (user) {
      loggedOut.style.display = 'none';
      loggedIn.style.display  = '';
      const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
      document.getElementById('user-avatar-initials').textContent = initials;
      document.getElementById('sidebar-user-name').textContent    = user.name.split(' ')[0];
      document.getElementById('sidebar-user-email').textContent   = user.email;
    } else {
      loggedOut.style.display = '';
      loggedIn.style.display  = 'none';
    }
  }

  // ── Modal open/close ──────────────────────────────
  function open(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('open');
      switchTab(tab);
      setTimeout(() => document.getElementById('login-email')?.focus(), 100);
    }
  }

  function close() {
    document.getElementById('auth-modal')?.classList.remove('open');
    clearErrors();
  }

  return {
    init() {
      injectMarkup();
      injectStyles();
    },
    open,
    close,
    updateSidebarUI,
    onLoginSuccess,
  };

  // ── Estilos do componente ─────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .auth-modal-overlay {
        display: none;
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: var(--z-modal);
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .auth-modal-overlay.open { display: flex; }
      .auth-modal-box {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-xl);
        padding: var(--space-6);
        width: 100%;
        max-width: 420px;
        position: relative;
        animation: auth-in .2s ease;
      }
      @keyframes auth-in { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
      .auth-close {
        position: absolute; top: 14px; right: 14px;
        font-size: 16px; color: var(--color-text-tertiary);
        padding: 4px 8px; border-radius: var(--radius-sm);
      }
      .auth-close:hover { background: var(--color-bg-muted); }
      .auth-tabs {
        display: flex; gap: 2px;
        background: var(--color-bg-muted);
        border-radius: var(--radius-md);
        padding: 3px; margin-bottom: var(--space-4);
      }
      .auth-tab {
        flex: 1; padding: 8px;
        font-size: var(--text-sm); font-weight: var(--weight-medium);
        border-radius: 6px; color: var(--color-text-secondary);
        transition: all .15s;
      }
      .auth-tab.active {
        background: var(--color-bg-card);
        color: var(--color-text-primary);
        border: 0.5px solid var(--color-border-light);
      }
      .auth-intro {
        font-size: var(--text-sm); color: var(--color-text-secondary);
        margin-bottom: var(--space-4); line-height: 1.5;
      }
      .auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
      .auth-panel { display: none; }
      .auth-panel.active { display: block; }
      .auth-error {
        background: var(--color-danger-bg); color: var(--color-danger-text);
        border: 1px solid var(--color-danger-border);
        border-radius: var(--radius-md); padding: 8px 12px;
        font-size: var(--text-sm);
      }

      /* Sidebar user widget */
      .sidebar-user {
        border-top: 1px solid rgba(255,255,255,.07);
        padding: 12px 14px;
      }
      .btn-user-login {
        display: flex; align-items: center; gap: 8px;
        width: 100%; padding: 8px 10px;
        border-radius: var(--radius-md);
        color: var(--sidebar-text); font-size: var(--text-sm);
        transition: all .15s;
      }
      .btn-user-login:hover { background: var(--sidebar-hover-bg); color: white; }
      .user-avatar-placeholder { font-size: 18px; }
      .user-state { width: 100%; }
      .user-info-row {
        display: flex; align-items: center; gap: 8px;
      }
      .user-avatar {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: var(--color-primary-700);
        color: white; font-size: 12px; font-weight: 600;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .user-details { flex: 1; min-width: 0; }
      .user-name { display: block; font-size: 13px; color: white; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .user-email { display: block; font-size: 11px; color: var(--sidebar-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .btn-user-logout {
        font-size: 16px; color: var(--sidebar-text);
        padding: 4px; border-radius: var(--radius-sm);
        flex-shrink: 0;
      }
      .btn-user-logout:hover { color: white; }
    `;
    document.head.appendChild(style);
  }

})();
