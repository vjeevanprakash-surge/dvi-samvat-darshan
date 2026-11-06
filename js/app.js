/**
 * Dvi-Samvat Darshan — Main Application Orchestrator
 * Initializes panchang, mandala, navigation, and renders all screens.
 */

import { getAppDate, formatGregorianDate, DEFAULT_LOCATION } from './utils.js';
import { computePanchang, panchangForDate } from './panchang.js';
import { findFestivals, getUpcomingFestivals, getAllFestivals } from './festivals.js';
import { initMandala, updateMandala } from './mandala.js';

// ============================================================
//  APP STATE
// ============================================================
let panchang = null;
let festivals = [];
let upcomingFestivals = [];
let currentLocation = DEFAULT_LOCATION;
let currentLang = 'en';
let timeOffsetHours = 0; // Phase 2: Time scrubbing
let audioEnabled = true; // Enabled by default
let audioCtx = null;

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
    upcomingFestivals = getUpcomingFestivals(offsetDate, 10);

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
        html += createFestivalCard(f, `${f.daysAway} days`);
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
    const locSelect = document.getElementById('loc-select');
    if (locSelect) {
        locSelect.addEventListener('change', (e) => {
            // In a real app, update location object here
            panchang = computePanchang(getAppDate(), currentLocation);
            updateMandala(panchang);
            refreshUI();
        });
    }

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

// ============================================================
//  DATE CONVERTER
// ============================================================
function setupDateConverter() {
    const today = getAppDate();
    document.getElementById('conv-date').value = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    const btn = document.getElementById('btn-convert');
    if (btn) {
        btn.addEventListener('click', () => {
            const dateStr = document.getElementById('conv-date').value;
            if (!dateStr) return;
            const [y, m, d] = dateStr.split('-').map(Number);
            const p = panchangForDate(y, m, d);
            
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
