/**
 * HACKCHECK - UI Module
 * Handles the layout shell, sidebar, modals, and toasts.
 */

const UI = {
    _toastQueue: [],
    _toastTimer: null,

    init() {
        this._renderShell();
        this._bindNav();
        this._bindSidebarToggle();
        window.addEventListener('resize', Utils.debounce(() => this._handleResize(), 200));
    },

    _renderShell() {
        document.body.innerHTML = `
<div id="app">
  <!-- Sidebar -->
  <aside id="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <span class="brand-icon">⚡</span>
        <div class="brand-text">
          <span class="brand-name">HACKCHECK</span>
          <span class="brand-sub">Hackathon Registration</span>
        </div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <a class="nav-item" data-page="dashboard" href="#" aria-label="Dashboard">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span>Dashboard</span>
      </a>
      <a class="nav-item" data-page="scanner" href="#" aria-label="QR Scanner">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          <rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/>
          <rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/>
        </svg>
        <span>QR Scanner</span>
      </a>
      <a class="nav-item" data-page="teams" href="#" aria-label="Teams">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Teams</span>
      </a>
      <a class="nav-item" data-page="importCSV" href="#" aria-label="Import CSV">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>Import CSV</span>
      </a>
      <a class="nav-item" data-page="exportCSV" href="#" aria-label="Export CSV">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Export CSV</span>
      </a>
      <a class="nav-item" data-page="settings" href="#" aria-label="Settings">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Settings</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <div id="header-stats" class="sidebar-stats">0/0 Checked In</div>
    </div>
  </aside>

  <!-- Sidebar Overlay (mobile) -->
  <div id="sidebar-overlay" class="sidebar-overlay"></div>

  <!-- Main -->
  <div id="main-wrapper">
    <header id="topbar">
      <button id="sidebar-toggle" class="icon-btn" aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="topbar-brand">
        <span class="brand-icon-sm">⚡</span>
        <span class="topbar-title">HACKCHECK</span>
      </div>
      <div class="topbar-right">
        <div id="header-stats-top" class="topbar-stat"></div>
        <button class="btn btn-accent btn-sm" onclick="App.navigateTo('scanner')" aria-label="Open QR Scanner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          </svg>
          Scan
        </button>
      </div>
    </header>

    <main id="main-content" role="main">
      <!-- Pages rendered here -->
    </main>
  </div>

  <!-- Toast Container -->
  <div id="toast-container" aria-live="polite"></div>

  <!-- Modal Container -->
  <div id="modal-container"></div>
</div>`;
    },

    _bindNav() {
        document.addEventListener('click', e => {
            const navItem = e.target.closest('[data-page]');
            if (navItem) {
                e.preventDefault();
                App.navigateTo(navItem.dataset.page);
            }
        });
    },

    _bindSidebarToggle() {
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebar-overlay').classList.toggle('active');
        });
        document.getElementById('sidebar-overlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('active');
        });
    },

    _handleResize() {
        if (window.innerWidth >= 768) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('active');
        }
    },

    // -------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // -------------------------------------------------------------------------
    toast(message, type = 'info', duration = 3500) {
        const id = Utils.uuid();
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.id = `toast-${id}`;
        el.setAttribute('role', 'alert');

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        el.innerHTML = `
          <span class="toast-icon">${icons[type] || 'ℹ'}</span>
          <span class="toast-msg">${Utils.escapeHtml(message)}</span>
          <button class="toast-close" aria-label="Close notification">×</button>
        `;

        el.querySelector('.toast-close').addEventListener('click', () => this.dismissToast(id));
        container.appendChild(el);
        setTimeout(() => el.classList.add('toast-visible'), 10);

        const timer = setTimeout(() => this.dismissToast(id), duration);
        el._dismissTimer = timer;
        return id;
    },

    dismissToast(id) {
        const el = document.getElementById(`toast-${id}`);
        if (!el) return;
        clearTimeout(el._dismissTimer);
        el.classList.remove('toast-visible');
        el.classList.add('toast-exit');
        setTimeout(() => el.remove(), 350);
    },

    // -------------------------------------------------------------------------
    // MODAL
    // -------------------------------------------------------------------------
    showModal({ title, body, actions = [], size = 'md' }) {
        const container = document.getElementById('modal-container');
        const id = `modal-${Utils.shortId()}`;
        container.innerHTML = `
          <div class="modal-backdrop" id="${id}-backdrop" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
            <div class="modal modal-${size}">
              <div class="modal-header">
                <h2 class="modal-title" id="${id}-title">${Utils.escapeHtml(title)}</h2>
                <button class="modal-close icon-btn" aria-label="Close">×</button>
              </div>
              <div class="modal-body">${body}</div>
              ${actions.length > 0 ? `<div class="modal-footer">${actions.map(a =>
            `<button class="btn ${a.class || 'btn-ghost'}" data-action="${a.id || ''}" ${a.attrs || ''}>${Utils.escapeHtml(a.label)}</button>`
        ).join('')}</div>` : ''}
            </div>
          </div>`;

        setTimeout(() => document.getElementById(`${id}-backdrop`).classList.add('modal-visible'), 10);

        // Close handlers
        container.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById(`${id}-backdrop`).addEventListener('click', e => {
            if (e.target === document.getElementById(`${id}-backdrop`)) this.closeModal();
        });

        // Action buttons
        actions.forEach(action => {
            const btn = container.querySelector(`[data-action="${action.id}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', action.handler);
            }
        });

        return id;
    },

    closeModal() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) return;
        backdrop.classList.remove('modal-visible');
        setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
        }, 250);
    },

    // -------------------------------------------------------------------------
    // CONFIRM DIALOG
    // -------------------------------------------------------------------------
    confirm({ title, message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', onConfirm, requireType = null }) {
        let bodyHtml = `<p class="modal-msg">${Utils.escapeHtml(message)}</p>`;
        if (requireType) {
            bodyHtml += `
              <div class="form-group mt-16">
                <label class="form-label">Type <strong>${Utils.escapeHtml(requireType)}</strong> to confirm:</label>
                <input type="text" id="confirm-type-input" class="form-input" placeholder="${Utils.escapeHtml(requireType)}" autocomplete="off" spellcheck="false"/>
              </div>`;
        }

        this.showModal({
            title,
            body: bodyHtml,
            size: 'sm',
            actions: [
                { label: 'Cancel', class: 'btn-ghost', id: 'cancel', handler: () => this.closeModal() },
                {
                    label: confirmLabel,
                    class: confirmClass,
                    id: 'confirm',
                    handler: () => {
                        if (requireType) {
                            const val = document.getElementById('confirm-type-input')?.value;
                            if (val !== requireType) {
                                document.getElementById('confirm-type-input').classList.add('input-error');
                                document.getElementById('confirm-type-input').focus();
                                return;
                            }
                        }
                        this.closeModal();
                        if (onConfirm) onConfirm();
                    }
                },
            ],
        });
    },

    // -------------------------------------------------------------------------
    // STAT CARD HELPER
    // -------------------------------------------------------------------------
    statCard({ label, value, icon, accent = false, color = null }) {
        const colorStyle = color ? `style="color:${color}"` : '';
        return `
          <div class="stat-card ${accent ? 'stat-card-accent' : ''}">
            <div class="stat-icon">${icon}</div>
            <div class="stat-value" ${colorStyle}>${Utils.escapeHtml(String(value))}</div>
            <div class="stat-label">${Utils.escapeHtml(label)}</div>
          </div>`;
    },

    // -------------------------------------------------------------------------
    // EMPTY STATE
    // -------------------------------------------------------------------------
    emptyState(icon, title, sub, action = '') {
        return `
          <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <div class="empty-title">${Utils.escapeHtml(title)}</div>
            <div class="empty-sub">${Utils.escapeHtml(sub)}</div>
            ${action}
          </div>`;
    },
};
