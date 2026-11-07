# 🕉️ Dvi-Samvat Darshan

**Hindu Panchang for Android, iOS and the web**, built around a 24-hour day clock that shows when the auspicious and avoided periods of the day fall, with Vikram and Shaka Samvat dating.

**🌐 Live app:** https://vjeevanprakash-surge.github.io/dvi-samvat-darshan/

## ✨ Features

- **Day clock:** a 24-hour dial with day and night, Brahma Muhurta and Abhijit on the outer track, Rahu, Gulika and Yamaganda Kaal on the inner track, and a "now" hand. Tap any arc or time to see what it means.
- **Today:** tithi, nakshatra, yoga, karana, weekday and moon phase, each with the time it changes. Step through days with the arrows.
- **Calendar:** a month grid marking Purnima, Amavasya and festivals; tap a day for its panchang or open its day clock.
- **Festivals:** the coming months' festivals and vrats with their observance rule, significance and rituals.
- **Location:** 78 Indian cities and 39 worldwide, or the device's location. Dates, sunrise, kaals and festival days are computed on that place's own clock, including daylight saving.
- **Offline calculation:** sidereal (Lahiri) positions, computed on the device.

## 🚀 Running it

The app lives in `mobile/` (Expo, React Native).

```bash
cd mobile
npm install
npx expo start
```

Press `a` for Android (an emulator or Expo Go on a phone), `i` for iOS, or `w` for the web.

Pushing to `main` builds the web version and deploys it to GitHub Pages (`.github/workflows/pages.yml`).

## 📁 Structure

```
├── js/                — Panchang engine (plain ES modules, shared)
│   ├── panchang.js    — Tithi, nakshatra, yoga, karana, kaals, limb change times
│   ├── festivals.js   — Festival database and observance rules
│   └── utils.js       — Astronomy, locations and time zones
├── mobile/            — The app (Expo Router)
│   └── src/
│       ├── app/       — Screens: Today, Calendar, Festivals, Settings
│       ├── components/ — Day clock, icons, cards
│       └── engine.ts  — Typed bridge to ../js
└── index.html, styles.css, js/app.js, js/mandala.js — The original web PWA (no longer deployed)
```

## 📅 Date & Calendar Conventions

The app follows the device's current date and time. Lunar months use the
purnimanta (North Indian) reckoning, and Vikram/Shaka years turn over at Chaitra
Shukla Pratipada (Ugadi / Gudi Padwa).
