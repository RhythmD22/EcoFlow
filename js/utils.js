const TOAST_DURATION = 2200;
const CONFETTI_COUNT = 40;
const CONFETTI_DURATION = 2500;

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replace(/\n/g, '<br>');
}

function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
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

async function showConfirm(title, message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 class="dialog-title" id="dlg-title">${title}</h2>
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          <button class="btn-cancel" id="dlg-cancel">Cancel</button>
          <button class="btn btn-primary" id="dlg-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (result) => {
      document.removeEventListener('keydown', esc);
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('#dlg-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('#dlg-ok').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', esc);
    overlay.querySelector('#dlg-ok').focus();

    function esc(e) {
      if (e.key === 'Escape') { close(false); return; }
      if (e.key === 'Tab') {
        const cancel = overlay.querySelector('#dlg-cancel');
        const ok = overlay.querySelector('#dlg-ok');
        if (e.shiftKey && document.activeElement === ok) { e.preventDefault(); cancel.focus(); }
        else if (!e.shiftKey && document.activeElement === cancel) { e.preventDefault(); ok.focus(); }
      }
    }
  });
}

async function showPrompt(title, message, defaultValue = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 class="dialog-title" id="dlg-title">${title}</h2>
        <p class="dialog-message">${message}</p>
        <input type="text" class="dialog-input" id="dlg-input" value="${escapeHTML(defaultValue)}" aria-label="${title}" autocomplete="off">
        <div class="dialog-actions">
          <button class="btn-cancel" id="dlg-cancel">Cancel</button>
          <button class="btn btn-primary" id="dlg-ok">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (result) => {
      document.removeEventListener('keydown', esc);
      overlay.remove();
      resolve(result);
    };

    const input = overlay.querySelector('#dlg-input');
    overlay.querySelector('#dlg-cancel').addEventListener('click', () => close(null));
    overlay.querySelector('#dlg-ok').addEventListener('click', () => close(input.value));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value); });
    document.addEventListener('keydown', esc);
    input.focus();

    function esc(e) {
      if (e.key === 'Escape') { close(null); return; }
      if (e.key === 'Tab') {
        const cancel = overlay.querySelector('#dlg-cancel');
        const ok = overlay.querySelector('#dlg-ok');
        const inp = overlay.querySelector('#dlg-input');
        const elements = [inp, cancel, ok].filter(Boolean);
        const cur = document.activeElement;
        const idx = elements.indexOf(cur);
        if (e.shiftKey) {
          const prev = idx <= 0 ? elements[elements.length - 1] : elements[idx - 1];
          e.preventDefault(); prev.focus();
        } else {
          const next = idx >= elements.length - 1 ? elements[0] : elements[idx + 1];
          e.preventDefault(); next.focus();
        }
      }
    }
  });
}

export { escapeHTML, showToast, spawnConfetti, showConfirm, showPrompt };