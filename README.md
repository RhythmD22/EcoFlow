# EcoFlow

> AI-powered personal sustainability coach — track habits, grow your carbon tree, and get personalized coaching, all from the browser with no sign-up and no server.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#progressive-web-app-pwa-support)

---

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Install](#install)
- [Architecture](#architecture)
- [Design System](#design-system)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Integrations](#api-integrations)
- [PWA Support](#progressive-web-app-pwa-support)
- [License](#license)

---

## Features

| Feature | Description |
|---------|------------|
| Habit Tracking | 16 pre-built sustainability habits across 6 categories (Transport, Food, Energy, Shopping, Waste, Water) |
| Custom Habits | Create your own habits with category, icon, and CO₂ impact |
| Calendar History | Tap the date pill to open a month-view calendar — log habits for any past date with green dots showing which days have activity |
| Carbon Tree | Animated SVG tree that grows branch by branch — 13 individual leaves appear incrementally across 21 thresholds, with a 3-stage crown reveal (glow → full → animation) |
| Daily Streaks | Compact streak bar with day counter integrated into the tree stats — confetti at 7-day milestones |
| Daily Challenge | Randomized sustainability challenge each day with CO₂ bonus rewards |
| AI Coach | Gemini 3.1 Flash Lite-powered chat with sustainability advice, weather, air quality, and national emissions-aware suggestions, and a full offline fallback with 13 response patterns |
| Barcode Scanner | Enter a barcode or scan with your camera to look up any food product's Eco-Score, packaging, origins, and eco-labels via Open Food Facts |
| Impact Dashboard | Total CO₂ saved, carbon equivalents (trees planted, car miles avoided, water/energy saved), and category breakdown with per-category bars |
| Weekly Heatmap | 7-day grid with 5-level intensity showing habit completion density |
| Light / Dark Theme | System-aware `prefers-color-scheme` with manual toggle (sun/moon), persisted to `localStorage` |
| Custom Dialogs | Frosted-glass confirm and prompt dialogs with green accent buttons, keyboard support, and backdrop dismiss |
| Confetti Celebrations | Spark animations on challenge completions and streak milestones |
| Toast Notifications | Non-intrusive confirmations with Lucide SVG icons for every action |
| Frosted Glass UI | `backdrop-filter: blur()` glassmorphism on every card, header, and navigation with green-tinted surfaces |
| Animated Background | Floating gradient orbs behind the entire app with a noise texture overlay |
| Local Storage | All data persisted in `localStorage` — no account, no server, no sign-up |
| Export/Reset | Export full data as JSON or reset everything with one click |
| Responsive PWA | Install on mobile for a native app-like experience with offline support, full-screen standalone mode, and `safe-area-inset` handling |
| Accessibility | `role="dialog"`, `role="checkbox"`, `aria-checked`, `aria-pressed`, skip-to-main-content link, `:focus-visible` glow rings, `prefers-reduced-motion`, heading hierarchy, WCAG 2.1 AA color contrast |
| No Build Step | Vanilla HTML, CSS, and JavaScript — no bundler, no framework. Dev tooling via npm (ESLint) |

---

## Demo

To run locally:

```bash
git clone https://github.com/rhythmd22/EcoFlow.git
cd EcoFlow
python3 -m http.server 8080
```

Open `http://localhost:8080/` in your browser, or scan the QR code on the desktop landing page with your phone.

---

## Install

```bash
git clone https://github.com/rhythmd22/EcoFlow.git
cd EcoFlow
```

Then serve the directory with any static web server:

```bash
python3 -m http.server
```

Open `http://localhost:8000/` in your browser.

---

## Architecture

```
EcoFlow/
├── index.html                  # SPA shell with 6 <template> elements
├── css/
│   ├── styles.css              # Design tokens, reset, layout, components, theme overrides (994 lines)
│   ├── index.css               # Home page styles
│   ├── habits.css              # Habits page styles (366 lines)
│   ├── coach.css               # AI Coach chat styles
│   ├── impact.css              # Impact dashboard styles
│   ├── settings.css            # Settings page styles
│   └── scan.css                # Barcode scanner page styles
├── js/
│   ├── app.js                  # SPA router, navigation, page initialization
│   ├── theme.js                # Light/dark theme persistence and toggle
│   ├── nav.js                  # Navigation state shared across modules
│   ├── constants.js            # App constants and pre-built habit definitions
│   ├── data.js                 # localStorage CRUD, habit tracking, streaks, challenges
│   ├── icons.js                # Lucide SVG icon definitions (inline, 16 icons)
│   ├── utils.js                # Shared utilities: toasts, dialogs, confetti, escapeHTML
│   ├── index.js                # Home page: tree animation, streaks, challenges, quick-log
│   ├── habits-page.js          # Habits page: calendar, category filters, heatmap, custom habits
│   ├── coach.js                # Gemini API integration + 13 offline fallback response patterns
│   ├── coach-page.js           # AI Coach chat UI initialization
│   ├── impact-page.js          # Impact dashboard: CO₂ equivalents, category breakdown
│   ├── settings-page.js        # Settings page: API keys, data export/reset
│   ├── scan.js                 # Open Food Facts API v3.6, barcode lookup, recent scans
│   ├── scan-page.js            # Scanner page: camera scanning (html5-qrcode), product display
│   ├── weather.js              # OpenWeatherMap API, geolocation, weather-based suggestions
│   ├── aqi.js                  # OpenAQ API, real-time air quality data
│   ├── climate.js              # World Bank API, national CO₂ per capita comparisons
│   └── geo.js                  # Shared geolocation + Nominatim reverse geocoding
├── images/
│   └── QR.svg                  # QR code for desktop → mobile redirect
├── icon.svg                                # Vector PWA icon (source)
├── icon-maskable.svg                       # Maskable icon variant (source)
├── android-chrome-192x192.png              # PWA icon 192x192
├── android-chrome-512x512.png              # PWA icon 512x512
├── android-chrome-maskable-192x192.png     # Android adaptive icon 192x192
├── android-chrome-maskable-512x512.png     # Android adaptive icon 512x512
├── apple-touch-icon.png                    # iOS home screen 180x180
├── apple-touch-icon-120x120.png            # iOS home screen 120x120
├── apple-touch-icon-152x152.png            # iOS home screen 152x152
├── apple-touch-icon-167x167.png            # iOS home screen 167x167
├── favicon.ico                             # Multi-resolution favicon (16+32+48)
├── manifest.json                           # PWA Web App Manifest
├── service-worker.js                       # Offline caching and install flow
├── .gitignore
├── package.json                            # npm scripts (lint)
├── eslint.config.js                        # ESLint flat config
├── package-lock.json                       # Dependency lock file
├── LICENSE
```

The app is a single-page application. All views live as `<template>` elements inside `index.html`. The router in `app.js` clones templates into `#app-root` on navigation. Data flows through `localStorage` via `data.js` and is consumed by page-specific init functions. There is no build step or bundler.

**Design decisions:**
- `<template>`-based SPA instead of multi-page HTML (keeps navigation instant)
- Inline SVG icons instead of icon libraries (zero external dependencies)
- ES modules with `import/export` (native browser support, no bundler)
- `localStorage` for persistence (works offline, no server, no privacy concerns)
- `backdrop-filter` glassmorphism on all containers (modern iOS/Android feel)
- CSS `@layer` organization (tokens → reset → layout → components → pages → animations)
- `.glass` and `.glass-card` reusable CSS classes (consistent frosted effect everywhere)

---

## Design System

EcoFlow uses a green-tinted dark theme with frosted glass surfaces and a full light theme:

### Dark Theme (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-body` | `#0d1510` | Page background |
| `--glass-bg` | `rgba(16, 34, 22, 0.55)` | Frosted card surfaces |
| `--glass-blur` | `22px` | Backdrop blur radius |
| `--brand` | `#4ade80` | Primary buttons, active nav, highlights |
| `--text-primary` | `#f0fdf4` | Headings, body text |
| `--text-secondary` | `#9ca3a0` | Secondary text |
| `--text-tertiary` | `#88928c` | Captions, hints |

### Light Theme (`[data-theme="light"]`)

| Token | Value | Contrast | Usage |
|-------|-------|----------|-------|
| `--bg-body` | `#f1f7f3` | — | Page background |
| `--glass-bg` | `rgba(255, 255, 255, 0.65)` | — | Frosted card surfaces |
| `--brand` | `#15803d` | 5.0:1 | Darker forest green for readability |
| `--text-primary` | `#0d1711` | 16.3:1 | Headings, body text |
| `--text-secondary` | `#56635b` | 5.9:1 | Secondary text |
| `--text-tertiary` | `#5f6b62` | 5.2:1 | Captions, hints |
| `--text-on-brand` | `#f0fdf4` | 5.5:1 | Button text on green |

All text tokens meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text).

### Woody Brown

| Token | Value | Usage |
|-------|-------|-------|
| `--wood-dark` | `#5C3A1E` | Tree trunk base |
| `--wood` | `#7c5e3a` | Tree trunk, all branches |
| `--wood-light` | `#a0764a` | Ground line |
| `--wood-glint` | `#c49a6c` | Highlight accents |

### Theme Toggle

A sun/moon button in the header switches between themes. Persists to `localStorage`. Falls back to `prefers-color-scheme` on first visit. Live-listens for OS theme changes. PWA `theme-color` meta tag updates dynamically.

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#34d399` | Completions, success states |
| `--warning` | `#fbbf24` | Amber accents |
| `--danger` | `#f87171` | Delete actions |
| `--info` | `#38bdf8` | Water/ocean category accents |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system font stack | Body text, UI |
| `--font-display` | Newsreader, Georgia | Headings, large numbers |

### Glass Component

All cards, headers, and navigation share a consistent frosted glass pattern:

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(22px) saturate(1.3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}
```

The animated background layer (floating gradient orbs + noise texture) creates the visual interest behind the glass surfaces. All SVG icons use Lucide (MIT-licensed inline SVGs, no icon font dependency).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Core | HTML5, CSS3, JavaScript (ES6+ modules) |
| Storage | `localStorage` |
| AI | Google Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) — optional, auto-falls back to offline responses |
| Barcode Scanning | [html5-qrcode](https://github.com/mebjas/html5-qrcode) (CDN) — camera-based barcode detection |
| Product Data | [Open Food Facts API v3.6](https://world.openfoodfacts.org/) — no key required |
| Iconography | [Lucide](https://lucide.dev) — inline SVG icons (MIT licensed) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter), [Newsreader](https://fonts.google.com/specimen/Newsreader) (Google Fonts) |
| Hosting | GitHub Pages (or any static host) |
| Weather | [OpenWeatherMap](https://openweathermap.org/api) — current weather for habit suggestions |
| Air Quality | [OpenAQ](https://openaq.org) — real-time AQI for outdoor activity recommendations |
| Climate Data | [World Bank](https://data.worldbank.org) — national CO2 per capita for impact comparisons |
| PWA | Service Worker API, Web App Manifest |
| Linting | ESLint (`eslint.config.js`) |

No build steps, no framework. Dev dependencies via npm for linting. All visual effects (glassmorphism, orb animations, confetti, chart-like bars) are pure CSS.

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)

### Local Setup

1. Clone the repository
2. Start a local server from the project directory:
   ```bash
   python3 -m http.server
   ```
3. Open `http://localhost:8000/EcoFlow/` in your browser

No environment variables to configure. For dev tooling (linting), install npm dependencies:
   ```bash
   npm install
   ```

### Adding a Gemini API Key (Optional)

The AI Coach works offline with simulated responses out of the box. To enable real AI-powered coaching:

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Tap the Settings icon in the app header
3. Paste your key and tap Save

Your key is stored in `localStorage` on your device only. It is never sent anywhere except directly to Google's Gemini API.

### npm Scripts

```bash
npm run lint        # ESLint check on js/ and service-worker.js
```

---

## API Integrations

### Gemini 3.1 Flash Lite

- **Purpose:** AI-powered sustainability coaching chat
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`
- **Key required:** Yes (free tier available at [Google AI Studio](https://aistudio.google.com/apikey))
- **Fallback:** 13 pre-written response patterns covering food waste, transportation, energy, fashion, water, diet, recycling, air quality, emissions comparisons, weather-aware tips, and general sustainability advice
- **Limits:** 500 requests/day on free tier

### Open Food Facts v3.6

- **Purpose:** Product barcode lookup — Eco-Score (A–E), packaging materials, origin countries, eco-labels
- **Endpoint:** `https://world.openfoodfacts.org/api/v3.6/product/{barcode}.json`
- **Key required:** No — only a custom `User-Agent` header
- **Rate limit:** 15 requests/min per IP
- **Camera scanning:** Built on `html5-qrcode` (CDN) — supports EAN-13, UPC-A, QR, Code-128 on rear camera at 10 fps. Requires HTTPS on mobile.

### OpenWeatherMap

- **Purpose:** Context-aware habit suggestions based on local weather — biking on sunny days, energy-saving tips during cold snaps
- **Endpoint:** `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric`
- **Key required:** Yes (free account at [OpenWeatherMap](https://openweathermap.org/api))
- **Permissions:** Browser geolocation required (shared across Weather, AQI, and Climate modules)
- **Caching:** 15-minute in-memory cache to minimize API calls
- **Fallback:** If no key, location denied, or API fails — the coach defaults to general sustainability advice
- **Limits:** 1,000 calls/day on free tier

### OpenAQ

- **Purpose:** Real-time air quality data to recommend outdoor vs. indoor activities
- **Endpoint:** `https://api.openaq.org/v3/locations?coordinates={lat},{lon}&radius=10000` (locations) + `/v3/locations/{id}/latest` (measurements)
- **Key required:** No — optional API key available for higher rate limits
- **Permissions:** Browser geolocation required (shared via Geo module)
- **Parameters tracked:** PM2.5, PM10, NO₂, O₃
- **Caching:** 30-minute in-memory cache
- **Fallback:** If no data available, defaults to general sustainability advice
- **Use cases:** "AQI: 32 — great day to bike" / "High pollution — stay indoors, reduce energy demand"

### World Bank Climate Data

- **Purpose:** Show how the user's personal CO₂ savings compare to national per-capita averages
- **Endpoint:** `https://api.worldbank.org/v2/country/{code}/indicator/EN.GHG.CO2.PC.CE.AR5?format=json`
- **Key required:** No
- **Permissions:** Country detected via Nominatim reverse geocoding (free, no key) or OpenWeatherMap
- **Caching:** 24-hour in-memory cache
- **Fallback:** Global average (4,700 kg/person/year) if country data unavailable
- **Use cases:** "You've saved 14.3 kg this week. The average person in the US emits 13,600 kg/year — you've offset 0.1% of that."

---

## Progressive Web App (PWA) Support

EcoFlow can be installed on mobile devices:

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the Share button and select **Add to Home Screen** (iOS) or the install prompt (Android)
3. The app launches in standalone full-screen mode with offline support

The service worker caches all assets and CDN dependencies with a cache-first strategy. API calls to Gemini are excluded from caching.

---

## License

MIT © [Rhythm Desai](LICENSE)