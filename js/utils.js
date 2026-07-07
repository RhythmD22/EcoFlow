import { EcoData } from './data.js';
import { Icons } from './icons.js';

const TOAST_DURATION = 2200;
const CONFETTI_COUNT = 40;
const CONFETTI_DURATION = 2500;

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

function toggleHabitAndRefresh(appData, habitId, dateKey = null) {
  const added = EcoData.toggleHabit(appData, habitId, dateKey);
  EcoData.refreshData(appData);
  if (added) {
    showToast(`${Icons.tree} Habit logged!`, 'success');
  }
  return added;
}

function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  let removed = false;
  const remove = () => { if (!removed) { removed = true; toast.remove(); } };

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', remove);
    setTimeout(remove, 600);
  }, TOAST_DURATION);
}

function spawnConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  const colors = ['#4ade80', '#6ee7b7', '#34d399', '#a3e635', '#bbf7d0', '#38bdf8'];
  document.body.appendChild(container);

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1 + Math.random() * 1.5}s`;
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${4 + Math.random() * 6}px`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), CONFETTI_DURATION);
}

function _createDialog({ title, message, extraContent = null, resolveValue }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'dlg-title');

    const h2 = document.createElement('h2');
    h2.className = 'dialog-title';
    h2.id = 'dlg-title';
    h2.textContent = title;

    const p = document.createElement('p');
    p.className = 'dialog-message';
    p.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.id = 'dlg-cancel';
    cancelBtn.textContent = 'Cancel';

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-primary';
    okBtn.id = 'dlg-ok';
    okBtn.textContent = 'OK';

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(h2);
    dialog.appendChild(p);

    if (extraContent) {
      dialog.appendChild(extraContent);
    }

    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = (result) => {
      document.removeEventListener('keydown', esc);
      overlay.remove();
      resolve(result);
    };

    cancelBtn.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
    document.addEventListener('keydown', esc);

    okBtn.addEventListener('click', () => {
      if (resolveValue) {
        close(resolveValue());
      } else {
        close(true);
      }
    });

    function trapTab(e) {
      if (e.key === 'Escape') { close(null); return; }
      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    function esc(e) {
      if (e.key === 'Escape') { close(null); return; }
      trapTab(e);
    }
  });
}

function showConfirm(title, message) {
  return _createDialog({ title, message });
}

function showPrompt(title, message, defaultValue = '') {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dialog-input';
  input.id = 'dlg-input';
  input.value = defaultValue;
  input.setAttribute('aria-label', title);
  input.setAttribute('autocomplete', 'off');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const okBtn = document.getElementById('dlg-ok');
      if (okBtn) okBtn.click();
    }
  });

  return _createDialog({
    title,
    message,
    extraContent: input,
    resolveValue: () => input.value,
  });
}

function debugWarn(...args) {
  if (localStorage.getItem('ecoflow_debug') === '1') console.warn(...args);
}

export { escapeHTML, toggleHabitAndRefresh, showToast, spawnConfetti, showConfirm, showPrompt, debugWarn, cssVar };