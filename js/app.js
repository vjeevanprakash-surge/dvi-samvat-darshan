/**
 * Dvi-Samvat Darshan — Main Application Orchestrator
 * Initializes panchang, mandala, navigation, and renders all screens.
 */

import { getAppDate, formatGregorianDate, DEFAULT_LOCATION, LOCATIONS, REGIONS, deviceLocation } from './utils.js';
import { computePanchang, panchangForDate } from './panchang.js';
import { findFestivals, getUpcomingFestivals, getAllFestivals } from './festivals.js';
import { initMandala, updateMandala } from './mandala.js';

// ============================================================
//  APP STATE
// ============================================================
let panchang = null;
let festivals = [];
let upcomingFestivals = [];
const LOCATION_STORAGE_KEY = 'samvat.location';
let currentLocation = loadSavedLocation();
let currentLang = 'en';
let timeOffsetHours = 0; // Phase 2: Time scrubbing
let audioEnabled = true; // Enabled by default
let audioCtx = null;
let converterDefaultDate = null; // date the converter was last auto-filled with
const REFRESH_INTERVAL_MS = 60 * 1000;

// ============================================================
//  INITIALIZATION
// ============================================================
window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(255,0,0,0.9);color:white;padding:20px;z-index:9999;font-family:monospace;white-space:pre-wrap';
    errDiv.textContent = `Error: ${msg}\nLine: ${lineNo}\nColumn: ${columnNo}\nURL: ${url}`;
    document.body.appendChild(errDiv);
    return false;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // 1. Compute panchang for the current date
    updatePanchang();

    // 2. Initialize mandala canvas
    initMandala('mandalaCanvas');
    updateMandala(panchang);

    // 3. Render Dashboard
    refreshUI();

    // 4. Setup Navigation & Listeners
    setupNavigation();
    setupSettings();
    setupDateConverter();
    setupTimeScrubber();
    setupAudioToggle();
    setupAutoRefresh();

    // 5. Offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.warn('Service worker registration failed', err));
    }

    console.log('🕉️ Dvi-Samvat Darshan initialized', panchang);
}

function updatePanchang() {
    const prevPanchang = panchang;
    const baseDate = getAppDate();
    const offsetDate = new Date(baseDate.getTime() + timeOffsetHours * 60 * 60 * 1000);
    
    panchang = computePanchang(offsetDate, currentLocation);
    festivals = findFestivals(panchang);
    upcomingFestivals = getUpcomingFestivals(offsetDate, 10, currentLocation);

    // Detect transitions for sound cues (Phase 4)
    if (prevPanchang && audioEnabled) {
        if (prevPanchang.tithi.index !== panchang.tithi.index) playChime('tithi');
        else if (prevPanchang.nakshatra.index !== panchang.nakshatra.index) playChime('nakshatra');
    }
}

// ============================================================
//  AMBIENT SOUNDSCAPES (Phase 4)
// ============================================================
function setupAudioToggle() {
    const btn = document.getElementById('btn-audio-toggle');
    const icon = document.getElementById('audio-icon');
    if (!btn) return;

    // Set initial icon state based on enabled status
    icon.textContent = audioEnabled ? '🔊' : '🔇';
    if (audioEnabled) btn.classList.add('active');

    // Browser security: Init AudioContext on first user interaction
    const initAudio = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioEnabled) playChime('welcome');
        }
        document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);

    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger the initAudio twice
        audioEnabled = !audioEnabled;
        icon.textContent = audioEnabled ? '🔊' : '🔇';
        btn.classList.toggle('active', audioEnabled);
        
        if (audioEnabled && audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    });
}

function playChime(type) {
    if (!audioEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'tithi') {
        // Deep Tibetan bowl sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now); // A2
        osc.frequency.exponentialRampToValueAtTime(108, now + 3);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 4);
        osc.start(now);
        osc.stop(now + 4);
    } else if (type === 'nakshatra') {
        // Higher bell sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
        osc.start(now);
        osc.stop(now + 2);
    } else {
        // Subtle welcome chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        osc.start(now);
        osc.stop(now + 1);
    }
}

function refreshUI() {
    renderHeader();
    renderTimeline();
    renderDetailChips();
    renderMoonInfo();
    renderRingLabels();
    renderFestivals();
}

// ============================================================
//  AUTO-REFRESH: keep "now" current while the page stays open
// ============================================================
function setupAutoRefresh() {
    const tick = () => {
        if (document.hidden) return;
        updatePanchang();
        updateMandala(panchang);
        refreshUI();
        syncConverterDate();
    };
    setInterval(tick, REFRESH_INTERVAL_MS);
    // Background tabs throttle timers, so catch up as soon as the page is visible again.
    document.addEventListener('visibilitychange', tick);
}

// ============================================================
//  TIME SCRUBBING (Phase 2)
// ============================================================
function setupTimeScrubber() {
    const scrubber = document.getElementById('time-scrubber');
    const status = document.getElementById('scrub-status');
    const resetBtn = document.getElementById('btn-reset-time');
    
    if (!scrubber) return;
    
    scrubber.addEventListener('input', (e) => {
        timeOffsetHours = parseInt(e.target.value);
        
        // Update status text
        if (timeOffsetHours === 0) {
            status.textContent = 'Present Time';
            resetBtn.style.display = 'none';
        } else {
            const absHours = Math.abs(timeOffsetHours);
            const direction = timeOffsetHours > 0 ? 'Future' : 'Past';
            status.textContent = `${absHours}h into ${direction}`;
            resetBtn.style.display = 'inline-block';
        }
        
        // Re-compute and update
        updatePanchang();
        updateMandala(panchang);
        refreshUI();
    });
    
    resetBtn.addEventListener('click', () => {
        timeOffsetHours = 0;
        scrubber.value = 0;
        status.textContent = 'Present Time';
        resetBtn.style.display = 'none';
        
        updatePanchang();
        updateMandala(panchang);
        refreshUI();
    });
}

// ============================================================
//  RENDER: HEADER (Samvat badges, location, date, tithi)
// ============================================================
function renderHeader() {
    const vsBadge = document.getElementById('vs-badge');
    if (vsBadge) vsBadge.textContent = `VS ${panchang.samvat.vikram.year} – ${panchang.samvat.vikram.name}`;

    const shakaBadge = document.getElementById('shaka-badge');
    if (shakaBadge) shakaBadge.textContent = `Shaka ${panchang.samvat.shaka.year} – ${panchang.samvat.shaka.name}`;

    const dateEl = document.getElementById('gregorian-date');
    if (dateEl) {
        const baseDate = getAppDate();
        const offsetDate = new Date(baseDate.getTime() + timeOffsetHours * 60 * 60 * 1000);
        dateEl.textContent = formatGregorianDate(offsetDate);
    }

    const tithiEl = document.getElementById('tithi-headline');
    if (tithiEl) tithiEl.textContent = panchang.tithi.fullName;

    const locEl = document.getElementById('loc-name');
    if (locEl) locEl.textContent = `${currentLocation.name}, ${currentLocation.state}`;
}

// ============================================================
//  RENDER: TIMELINE BADGES
// ============================================================
function renderTimeline() {
    const container = document.getElementById('timeline-badges');
    if (!container) return;

    container.innerHTML = `
        <div class="timeline-badge" title="Sunrise">
            <span class="badge-icon">☀️</span>
            <span class="badge-label">${panchang.sun.sunrise}</span>
        </div>
        <div class="timeline-badge" title="Sunset">
            <span class="badge-icon">🌅</span>
            <span class="badge-label">${panchang.sun.sunset}</span>
        </div>
        <div class="timeline-badge abhijit" title="Abhijit Muhurta - Most Auspicious">
            <span class="badge-icon">✨</span>
            <span>Abhijit</span>
            <span class="badge-label">${panchang.kaals.abhijit.startStr}–${panchang.kaals.abhijit.endStr}</span>
        </div>
        <div class="timeline-badge brahma" title="Brahma Muhurta - Sacred Pre-dawn">
            <span class="badge-icon">🕉️</span>
            <span>Brahma</span>
            <span class="badge-label">${panchang.kaals.brahma.startStr}–${panchang.kaals.brahma.endStr}</span>
        </div>
        <div class="timeline-badge rahu" title="Rahu Kaal - Inauspicious">
            <span class="badge-icon">⚠️</span>
            <span>Rahu</span>
            <span class="badge-label">${panchang.kaals.rahu.startStr}–${panchang.kaals.rahu.endStr}</span>
        </div>
        <div class="timeline-badge gulika" title="Gulika Kaal - Inauspicious">
            <span class="badge-icon">🔮</span>
            <span>Gulika</span>
            <span class="badge-label">${panchang.kaals.gulika.startStr}–${panchang.kaals.gulika.endStr}</span>
        </div>
        <div class="timeline-badge yama" title="Yamaganda Kaal - Inauspicious">
            <span class="badge-icon">💀</span>
            <span>Yama</span>
            <span class="badge-label">${panchang.kaals.yama.startStr}–${panchang.kaals.yama.endStr}</span>
        </div>
    `;
}

// ============================================================
//  RENDER: DETAIL CHIPS (Vaara, Karana)
// ============================================================
function renderDetailChips() {
    const container = document.getElementById('detail-chips');
    if (!container) return;

    container.innerHTML = `
        <div class="detail-chip">
            <span class="chip-label">Vaara</span>
            <span>${panchang.vaara}</span>
        </div>
        <div class="detail-chip">
            <span class="chip-label">Karana</span>
            <span>${panchang.karana.first} / ${panchang.karana.second}</span>
        </div>
        <div class="detail-chip">
            <span class="chip-label">Month</span>
            <span>${panchang.lunarMonth}</span>
        </div>
    `;
}

// ============================================================
//  RENDER: MOON INFO
// ============================================================
function renderMoonInfo() {
    const el = document.getElementById('moon-info');
    if (!el) return;

    el.innerHTML = `
        🌙 <span class="moon-phase-name">${panchang.moon.phaseName}</span>
        &nbsp;·&nbsp; ${panchang.moon.illumination}% illumination
    `;
}

// ============================================================
//  RENDER: RING LABELS
// ============================================================
function renderRingLabels() {
    const container = document.getElementById('ring-labels');
    if (!container) return;

    const yogaColor = panchang.yoga.auspicious ? 'var(--auspicious)' : 'var(--cautionary)';

    container.innerHTML = `
        <div class="ring-label tithi-label" onclick="scrollToSection('detail-chips')">
            <span class="label-icon">${panchang.tithi.isShukla ? '🌓' : '🌗'}</span>
            <span class="label-title">Tithi</span>
            <span class="label-value">${panchang.tithi.name}</span>
            <span class="label-title" style="margin-top:2px">${panchang.tithi.paksha} · ${Math.round(panchang.tithi.progress * 100)}%</span>
        </div>
        <div class="ring-label nakshatra-label" onclick="scrollToSection('detail-chips')">
            <span class="label-icon">${panchang.nakshatra.symbol}</span>
            <span class="label-title">Nakshatra</span>
            <span class="label-value">${panchang.nakshatra.name}</span>
            <span class="label-title" style="margin-top:2px">${panchang.nakshatra.deity}</span>
        </div>
        <div class="ring-label yoga-label" onclick="scrollToSection('detail-chips')">
            <span class="label-icon">${panchang.yoga.icon}</span>
            <span class="label-title">Yoga</span>
            <span class="label-value" style="color:${yogaColor}">${panchang.yoga.name}</span>
            <span class="label-title" style="margin-top:2px">${panchang.yoga.auspicious ? '✨ Auspicious' : '⚡ Cautionary'}</span>
        </div>
    `;
}

// ============================================================
//  RENDER: FESTIVAL CARDS
// ============================================================
function renderFestivals() {
    const container = document.getElementById('festival-cards');
    if (!container) return;

    let html = '';
    
    // Today's festivals
    if (festivals.length > 0) {
        festivals.forEach(f => {
            html += createFestivalCard(f, 'Today');
        });
    }

    // Upcoming festivals
    upcomingFestivals.forEach(f => {
        const countdown = f.daysAway === 0 ? 'Today' : f.daysAway === 1 ? '1 day' : `${f.daysAway} days`;
        html += createFestivalCard(f, countdown);
    });

    container.innerHTML = html;
}

function createFestivalCard(f, countdown) {
    let displayName = f.name;
    if (currentLang === 'hi' && f.nameHi) displayName = f.nameHi;
    if (currentLang === 'kn' && f.nameKn) displayName = f.nameKn;

    return `
        <div class="festival-card theme-${f.visualTheme || 'divine'}" onclick="openFestivalModal('${f.name}')">
            <div class="festival-card-header">
                <div>
                    <span class="festival-theme-icon">${f.icon || '🪔'}</span>
                    <span class="festival-name">${displayName}</span>
                    <div class="festival-date">${f.date || ''}</div>
                </div>
                <span class="festival-countdown">${countdown}</span>
            </div>
            <div class="festival-rituals">${f.significance ? f.significance.substring(0, 60) + '...' : ''}</div>
        </div>
    `;
}

// ============================================================
//  FESTIVAL MODAL
// ============================================================
window.openFestivalModal = function(name) {
    const all = getAllFestivals();
    let f = festivals.find(x => x.name === name) || upcomingFestivals.find(x => x.name === name) || all.find(x => x.name === name);
    if (!f) return;

    let tags = '';
    if (f.importance === 'major') tags += '<span class="modal-tag puja">📍 Major Festival</span>';
    
    const ritualsHtml = f.rituals ? f.rituals.map(r => `<li>${r}</li>`).join('') : '<li>No specific rituals listed.</li>';

    let titleName = f.name;
    if (currentLang === 'hi' && f.nameHi) titleName = f.nameHi;
    if (currentLang === 'kn' && f.nameKn) titleName = f.nameKn;

    document.getElementById('modal-body').innerHTML = `
        <button class="modal-close" onclick="closeFestivalModal()">✕</button>
        <div style="font-size:2.5rem;margin-bottom:10px">${f.icon || '🪔'}</div>
        <div class="modal-title">${titleName}</div>
        <div class="modal-subtitle">${f.lunarMonth || ''} ${f.paksha || ''} ${f.tithi || ''}</div>
        <div class="modal-section">
            <div class="modal-section-title">Significance</div>
            <div class="modal-text">${f.significance}</div>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Rituals</div>
            <ul class="modal-ritual-list">${ritualsHtml}</ul>
        </div>
        <div class="modal-section">
            <div class="modal-section-title">Details</div>
            <div>${tags}</div>
        </div>
    `;
    document.getElementById('festival-modal').style.display = 'flex';
};

window.closeFestivalModal = function() {
    document.getElementById('festival-modal').style.display = 'none';
};

// ============================================================
//  NAVIGATION
// ============================================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screen = item.getAttribute('data-screen');
            switchScreen(screen);
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    document.getElementById('festival-modal').addEventListener('click', (e) => {
        if (e.target.id === 'festival-modal') closeFestivalModal();
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    window.scrollTo(0, 0);

    if (screenId === 'festivals') renderFullFestivalList();
}

function renderFullFestivalList() {
    const container = document.getElementById('festival-full-list');
    if (!container) return;

    const all = getAllFestivals();
    let html = '';
    all.forEach(f => {
        html += createFestivalCard(f, 'Annual');
    });
    container.innerHTML = html;
}

// ============================================================
//  SETTINGS & LOCATION
// ============================================================
function setupSettings() {
    setupLocationPicker();

    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            refreshUI();
            if (document.getElementById('screen-festivals').classList.contains('active')) {
                renderFullFestivalList();
            }
        });
    }
}

function loadSavedLocation() {
    try {
        const saved = JSON.parse(localStorage.getItem(LOCATION_STORAGE_KEY));
        if (saved?.id === 'current' && Number.isFinite(saved.lat) && Number.isFinite(saved.lng)) {
            return deviceLocation(saved.lat, saved.lng);
        }
        if (saved?.id && LOCATIONS[saved.id]) return LOCATIONS[saved.id];
    } catch { /* storage unavailable or unreadable: use the default */ }
    return DEFAULT_LOCATION;
}

function saveLocation(location) {
    const { id, lat, lng } = location;
    try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(id === 'current' ? { id, lat, lng } : { id }));
    } catch { /* storage unavailable: the choice lasts for this visit only */ }
}

function setLocation(location) {
    currentLocation = location;
    saveLocation(location);
    updatePanchang();
    updateMandala(panchang);
    refreshUI();
    showLocationSetting();
}

function showLocationSetting(message) {
    document.getElementById('settings-loc').textContent =
        message || `${currentLocation.name}, ${currentLocation.state}`;
    if (!message) document.getElementById('loc-select').value = currentLocation.id;
}

function setupLocationPicker() {
    const select = document.getElementById('loc-select');
    const groups = REGIONS.map(region => {
        const options = Object.values(LOCATIONS)
            .filter(loc => loc.region === region)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('');
        return `<optgroup label="${region} India">${options}</optgroup>`;
    });
    select.innerHTML =
        ('geolocation' in navigator ? '<option value="current">📍 Use my location</option>' : '') +
        groups.join('');
    showLocationSetting();

    select.addEventListener('change', () => {
        if (select.value !== 'current') {
            setLocation(LOCATIONS[select.value]);
            return;
        }
        showLocationSetting('Finding your location…');
        navigator.geolocation.getCurrentPosition(
            pos => setLocation(deviceLocation(pos.coords.latitude, pos.coords.longitude)),
            err => {
                showLocationSetting(); // put the dropdown back on the previous choice
                showLocationSetting(err.code === err.PERMISSION_DENIED
                    ? 'Location access was denied. Pick a city instead.'
                    : "Couldn't get your location. Pick a city instead.");
            },
            { timeout: 15000, maximumAge: 10 * 60 * 1000 }
        );
    });

    // The header badge is a shortcut to the picker.
    const badge = document.getElementById('location-badge');
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.title = 'Change location';
    badge.style.cursor = 'pointer';
    const openSettings = () => document.querySelector('.nav-item[data-screen="settings"]').click();
    badge.addEventListener('click', openSettings);
    badge.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(); }
    });
}

// ============================================================
//  DATE CONVERTER
// ============================================================
function localISODate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('-');
}

/** Roll the converter's default date over at midnight, unless the user picked another date. */
function syncConverterDate() {
    const input = document.getElementById('conv-date');
    const today = localISODate(getAppDate());
    if (converterDefaultDate === null || input.value === converterDefaultDate) input.value = today;
    converterDefaultDate = today;
}

function setupDateConverter() {
    syncConverterDate();

    const btn = document.getElementById('btn-convert');
    if (btn) {
        btn.addEventListener('click', () => {
            const dateStr = document.getElementById('conv-date').value;
            if (!dateStr) return;
            const [y, m, d] = dateStr.split('-').map(Number);
            const p = panchangForDate(y, m, d, currentLocation);
            
            document.getElementById('conv-result').innerHTML = `
                <div class="conv-row"><span class="conv-label">Vikram Samvat</span><span class="conv-value">${p.samvat.vikram.year}</span></div>
                <div class="conv-row"><span class="conv-label">Tithi</span><span class="conv-value">${p.tithi.fullName}</span></div>
                <div class="conv-row"><span class="conv-label">Nakshatra</span><span class="conv-value">${p.nakshatra.name}</span></div>
                <div class="conv-row"><span class="conv-label">Vaara</span><span class="conv-value">${p.vaara}</span></div>
            `;
        });
    }
}

// ============================================================
//  UTILITIES
// ============================================================
window.scrollToSection = function(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};
