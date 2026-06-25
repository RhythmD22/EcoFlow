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
- [PWA Support](#progressive-web-app-pwa-support)
- [API Integrations](#api-integrations)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---------|------------|
| Habit Tracking | 16 pre-built sustainability habits across 6 categories (Transport, Food, Energy, Shopping, Waste, Water) |
| Custom Habits | Create your own habits with category, icon, and CO₂ impact |
| Calendar History | Tap the date pill to open a month-view calendar — log habits for any past date with green dots showing which days have activity |
| Carbon Tree | Animated SVG tree with woody brown trunk that grows branches and leaves as you log actions — crown appears at 60+ actions |
| Daily Streaks | Visual streak counter with progress bar and flaming celebrations at 7-day milestones |
| Daily Challenge | Randomized sustainability challenge each day with CO₂ bonus rewards |
| AI Coach | Gemini 3.1 Flash Lite-powered chat with sustainability advice and a full offline fallback with 12 response patterns |
| Barcode Scanner | Enter a barcode or scan with your camera to look up any food product's Eco-Score, packaging, origins, and eco-labels via Open Food Facts |
| Impact Dashboard | Total CO₂ saved, carbon equivalents (trees planted, car miles avoided, water/energy saved), and category breakdown with per-category bars |
| Weekly Heatmap | 7-day grid showing habit completion density like a contribution graph |
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
| No Build Step | Vanilla HTML, CSS, and JavaScript — no npm, no bundler, no framework |

---

## Demo

To run locally:

```bash
git clone https://github.com/rhythmd22/EcoFlow.git
cd EcoFlow
python3 -m http.server 8080
```

Open `http://localhost:8080/EcoFlow/` in your browser.

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

Open `http://localhost:8000/EcoFlow/` in your browser.

---

## Architecture

```
EcoFlow/
├── index.html                  # SPA shell with 6 <template> elements
├── css/
│   ├── styles.css              # Design tokens, reset, layout, components, theme overrides (801 lines)
│   └── pages.css               # Page-specific styles: Home, Habits, Coach, Impact, Settings, Scan (1,236 lines)
├── js/
│   ├── app.js                  # SPA router, all page init, theme, dialogs, toasts, confetti
│   ├── data.js                 # localStorage CRUD, habits, streaks, challenges, date-aware toggling
│   ├── coach.js                # Gemini API + offline simulated responses (12 patterns)
│   └── scan.js                 # Open Food Facts API v3.6 integration, barcode lookup, recent scans cache
├── manifest.json               # PWA manifest
├── service-worker.js           # Offline caching and install flow
├── .env                        # API key template (for reference)
└── .gitignore
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
| PWA | Service Worker API, Web App Manifest |

No npm packages, no build steps, no framework. All visual effects (glassmorphism, orb animations, confetti, chart-like bars) are pure CSS.

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

No dependencies to install, no environment variables to configure.

### Adding a Gemini API Key (Optional)

The AI Coach works offline with simulated responses out of the box. To enable real AI-powered coaching:

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Tap the Settings icon in the app header
3. Paste your key and tap Save

Your key is stored in `localStorage` on your device only. It is never sent anywhere except directly to Google's Gemini API.

---

## Progressive Web App (PWA) Support

EcoFlow can be installed on mobile devices:

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the Share button and select **Add to Home Screen** (iOS) or the install prompt (Android)
3. The app launches in standalone full-screen mode with offline support

The service worker caches all assets and CDN dependencies with a cache-first strategy. API calls to Gemini are excluded from caching.

---

## API Integrations

### Gemini 3.1 Flash Lite

- **Purpose:** AI-powered sustainability coaching chat
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`
- **Key required:** Yes (free tier available at [Google AI Studio](https://aistudio.google.com/apikey))
- **Fallback:** 12 pre-written response patterns covering food waste, transportation, energy, fashion, water, diet, recycling, and general sustainability advice
- **Limits:** 1,500 requests/day on free tier

### Open Food Facts v3.6

- **Purpose:** Product barcode lookup — Eco-Score (A–E), packaging materials, origin countries, eco-labels
- **Endpoint:** `https://world.openfoodfacts.org/api/v3.6/product/{barcode}.json`
- **Key required:** No — only a custom `User-Agent` header
- **Rate limit:** 15 requests/min per IP
- **Camera scanning:** Built on `html5-qrcode` (CDN) — supports EAN-13, UPC-A, QR, Code-128 on rear camera at 10 fps. Requires HTTPS on mobile.

---

## License

MIT © [Rhythm Desai](LICENSE)