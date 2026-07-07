function getPreferredTheme() {
  const saved = localStorage.getItem('ecoflow_theme');
  if (saved === 'dark') return 'dark';
  if (saved === 'light') return 'light';
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
    theme = 'light';
  }
  localStorage.setItem('ecoflow_theme', theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0d1510' : '#f1f7f3');
  }

  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());

  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('ecoflow_theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

export { initTheme };