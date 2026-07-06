import { initTheme } from './theme.js';
import { setNavigator } from './nav.js';
import { showToast } from './utils.js';
import { EcoWeather } from './weather.js';
import { EcoAQI } from './aqi.js';
import { EcoClimate } from './climate.js';
import { initHome } from './index.js';
import { initHabits } from './habits-page.js';
import { initCoach } from './coach-page.js';
import { initImpact } from './impact-page.js';
import { initSettings } from './settings-page.js';
import { prefetchApiStatus } from './api-status.js';
import { initScan, getScanCleanup } from './scan-page.js';

(() => {
  'use strict';

  const routeMap = {
    home: { template: 'template-home', heading: 'EcoFlow', title: 'EcoFlow - Sustainability Coach' },
    habits: { template: 'template-habits', heading: 'Habits', title: 'Habits - EcoFlow' },
    coach: { template: 'template-coach', heading: 'Coach', title: 'Coach - EcoFlow' },
    impact: { template: 'template-impact', heading: 'Impact', title: 'Impact - EcoFlow' },
    scan: { template: 'template-scan', heading: 'Scan', title: 'Scan - EcoFlow' },
    settings: { template: 'template-settings', heading: 'Settings', title: 'Settings - EcoFlow' },
  };

  let currentRoute = 'home';

  function navigateTo(route) {
    if (currentRoute === 'scan' && route !== 'scan') {
      const cleanup = getScanCleanup();
      if (cleanup) cleanup();
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

    document.getElementById('page-title').textContent = spec.heading;
    document.title = spec.title;

    document.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    switch (route) {
      case 'home': initHome(); break;
      case 'habits': initHabits(); break;
      case 'coach': initCoach(); break;
      case 'impact': initImpact(); break;
      case 'scan': initScan(); break;
      case 'settings': initSettings(); break;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });

    root.setAttribute('tabindex', '-1');
    root.focus({ preventScroll: true });
  }

  function init() {
    initTheme();
    setNavigator(navigateTo);

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

    document.body.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link && !link.closest('.nav-item')) {
        const route = link.dataset.route;
        if (route) navigateTo(route);
      }
    });

    prefetchApiStatus();
    navigateTo('home');

    if (!localStorage.getItem('ecoflow_data')) {
      showToast('Welcome to EcoFlow ✦ Log a habit to begin', 'success');
    }

    EcoAQI.fetchAQI().catch(() => { });
    EcoWeather.fetchWeather()
      .catch(() => { })
      .then(() => EcoClimate.fetchCountryEmissions().catch(() => { }));

    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      navigator.serviceWorker.register('/service-worker.js').catch(() => { });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();