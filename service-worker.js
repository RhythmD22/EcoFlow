const CACHE_NAME = 'ecoflow-v1.0';

const urlsToCache = [
  '/EcoFlow/',
  '/EcoFlow/index.html',
  '/EcoFlow/css/styles.css',
  '/EcoFlow/css/index.css',
  '/EcoFlow/css/habits.css',
  '/EcoFlow/css/coach.css',
  '/EcoFlow/css/impact.css',
  '/EcoFlow/css/settings.css',
  '/EcoFlow/css/scan.css',
  '/EcoFlow/js/app.js',
  '/EcoFlow/js/icons.js',
  '/EcoFlow/js/constants.js',
  '/EcoFlow/js/data.js',
  '/EcoFlow/js/coach.js',
  '/EcoFlow/js/coach-page.js',
  '/EcoFlow/js/scan.js',
  '/EcoFlow/js/scan-page.js',
  '/EcoFlow/js/index.js',
  '/EcoFlow/js/habits-page.js',
  '/EcoFlow/js/impact-page.js',
  '/EcoFlow/js/settings-page.js',
  '/EcoFlow/js/weather.js',
  '/EcoFlow/js/aqi.js',
  '/EcoFlow/js/climate.js',
  '/EcoFlow/js/geo.js',
  '/EcoFlow/js/theme.js',
  '/EcoFlow/js/nav.js',
  '/EcoFlow/js/utils.js',
  '/EcoFlow/manifest.json',
  '/EcoFlow/icon.svg',
  '/EcoFlow/favicon.ico',
  '/EcoFlow/apple-touch-icon.png',
  '/EcoFlow/apple-touch-icon-120x120.png',
  '/EcoFlow/apple-touch-icon-152x152.png',
  '/EcoFlow/apple-touch-icon-167x167.png',
  '/EcoFlow/android-chrome-192x192.png',
  '/EcoFlow/android-chrome-512x512.png',
  '/EcoFlow/android-chrome-maskable-192x192.png',
  '/EcoFlow/android-chrome-maskable-512x512.png',
  '/EcoFlow/images/QR.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(() => { }))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});