# 🕉️ Dvi-Samvat Darshan

**Premium Hindu Panchang** with a living digital mandala, dual calendar view (Vikram Samvat + Shaka Samvat), and immersive festival experiences.

**🌐 Live app:** https://vjeevanprakash-surge.github.io/dvi-samvat-darshan/ — open it on a phone and use "Add to Home Screen" to install it.

## ✨ Features

- **Mandala Dashboard** — Three concentric rings (Tithi, Nakshatra, Yoga) with animated central moon
- **Dual Samvat** — Vikram & Shaka calendar badges
- **Offline Panchang** — Astronomical calculations for tithi, nakshatra, yoga, karana
- **Festival Tracking** — 15+ major Hindu festivals with significance, rituals, countdowns
- **Timeline Badges** — Sunrise, sunset, Rahu Kaal, Gulika Kaal
- **PWA** — Installable, offline-first, mobile-optimized

## 🚀 Usage

Use the [live app](https://vjeevanprakash-surge.github.io/dvi-samvat-darshan/), or run it locally. Serve the folder over HTTP — opening `index.html` straight from disk (`file://`) won't work, because ES modules and the service worker need an HTTP origin.

- `pwsh -File serve.ps1` → http://localhost:8765
- or any static server: `npx serve .`

## 🎨 Design

Vedic-inspired dark theme with saffron-gold-indigo palette, sacred geometry, micro-animations, and responsive mobile-first layout.

## 📁 Structure

```
├── index.html        — App shell
├── styles.css        — Design system
├── js/
│   ├── app.js        — Main orchestrator
│   ├── panchang.js   — Offline panchang engine
│   ├── mandala.js    — Canvas mandala renderer
│   ├── festivals.js  — Festival database
│   └── utils.js      — Date/math utilities
├── manifest.json     — PWA manifest
└── sw.js             — Service worker
```

## 📅 Date & Calendar Conventions

The dashboard follows the device's current date and time. Lunar months use the
purnimanta (North Indian) reckoning, and Vikram/Shaka years turn over at Chaitra
Shukla Pratipada (Ugadi / Gudi Padwa).
