import { EcoData } from './data.js';
import { initTheme } from './theme.js';
import { initHome } from './index.js';
import { initHabits } from './habits-page.js';
import { initCoach } from './coach-page.js';
import { initImpact } from './impact-page.js';
import { initSettings } from './settings-page.js';
import { initScan } from './scan-page.js';

(() => {
  'use strict';

  const routeMap = {
    home: { template: 'template-home', title: 'EcoFlow' },
    habits: { template: 'template-habits', title: 'Habits' },
    coach: { template: 'template-coach', title: 'Coach' },
    impact: { template: 'template-impact', title: 'Impact' },
    scan: { template: 'template-scan', title: 'Scan' },
    settings: { template: 'template-settings', title: 'Settings' },
  };

  let currentRoute = 'home';

  function navigateTo(route) {
    if (currentRoute === 'scan' && route !== 'scan' && window._ecoScanCleanup) {
      window._ecoScanCleanup();
    }

    if (route === currentRoute && document.querySelector(`[data-page="${route}"]`)) return;
    if (!routeMap[route]) return;

    currentRoute = route;
    const spec = routeMap[route];
    const template = document.getElementById(spec.template);
    if (!template) return;

    const root = document.getElementById('app-root');
    root.innerHTML = '';
    root.appendChild(template.content.cloneNode(true));

    document.getElementById('page-title').textContent = spec.title;
    document.title = `${spec.title} — EcoFlow`;

    document.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    const appData = EcoData.load();

    switch (route) {
      case 'home': initHome(appData); break;
      case 'habits': initHabits(appData); break;
      case 'coach': initCoach(appData); break;
      case 'impact': initImpact(appData); break;
      case 'scan': initScan(navigateTo); break;
      case 'settings': initSettings(appData); break;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
  }

  function init() {
    initTheme();

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route) navigateTo(route);
      });
    });

    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (currentRoute === 'settings') navigateTo('home');
        else navigateTo('settings');
      });
    }

    navigateTo('home');

    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker.register('/EcoFlow/service-worker.js').catch(() => { });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();