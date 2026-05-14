/* ═══════════════════════════════════════════════════
   js/ui/toast.js — Componente de notificações Toast
════════════════════════════════════════════════════ */

App.toast = (() => {

  const ICONS = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  };

  const DURATIONS = {
    success: 3500,
    error:   5000,
    warning: 4000,
    info:    3500,
  };

  function show({ type = 'info', title, message, duration }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const ms = duration || DURATIONS[type];
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type]}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <span class="toast-close" role="button" aria-label="Fechar">✕</span>
    `;

    // Fechar ao clicar no X
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));

    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(toast), ms);

    // Pausa o timer ao hover
    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(() => dismiss(toast), 1500));
  }

  function dismiss(toast) {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  return {
    success: (title, message) => show({ type: 'success', title, message }),
    error:   (title, message) => show({ type: 'error',   title, message }),
    warning: (title, message) => show({ type: 'warning', title, message }),
    info:    (title, message) => show({ type: 'info',    title, message }),
    show,
  };

})();
