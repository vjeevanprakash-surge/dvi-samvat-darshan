/**
 * Dvi-Samvat Darshan — Mandala Canvas Renderer
 * Three concentric rings: Tithi (inner), Nakshatra (middle), Yoga (outer)
 * Central animated moon with phase/illumination display.
 * Karana sub-segments inside Tithi ring.
 */

import { NAKSHATRA_DATA, YOGA_DATA } from './panchang.js';

// ============================================================
//  CONSTANTS & COLORS
// ============================================================
const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

const COLORS = {
    bg: '#08080F',
    bgRing: 'rgba(18, 18, 32, 0.5)',
    saffron: '#FF9933',
    gold: '#FFD700',
    goldMuted: '#B8860B',
    maroon: '#800000',
    indigo: '#4B0082',
    indigoLight: '#7B42A9',
    shukla: '#E8E8F0',
    shuklaBright: '#FFFFFF',
    krishna: '#4B0082',
    krishnaBright: '#7B42A9',
    auspicious: '#43AA8B',
    cautionary: '#E76F51',
    textPrimary: '#F0E6D3',
    textSecondary: '#A89B8C',
    textMuted: '#6B5F52',
    moonSurface: '#E8E0D0',
    moonShadow: '#1A1A2E',
    moonCrater: 'rgba(0,0,0,0.1)',
    ringGap: '#08080F',
    particleGold: 'rgba(255, 215, 0, 0.6)',
};

// Ring radii (proportional to canvas size)
const RING = {
    moonRadius: 0.12,      // Central moon
    tithiInner: 0.145,     // Tithi ring inner
    tithiOuter: 0.21,      // Tithi ring outer
    karanaInner: 0.145,    // Karana sub-segments (inside tithi)
    karanaOuter: 0.17,     // Karana boundary
    nakshatraInner: 0.225, // Nakshatra ring inner
    nakshatraOuter: 0.32,  // Nakshatra ring outer
    yogaInner: 0.335,      // Yoga ring inner
    yogaOuter: 0.43,       // Yoga ring outer
    navagrahaInner: 0.445, // Navagraha ring (outermost)
    navagrahaOuter: 0.48,
};

// ============================================================
//  STATE
// ============================================================
let canvas, ctx;
let width, height, cx, cy, scale;
let animFrame;
let time = 0;
let panchangData = null;
let displayedPanchangData = null; // For smoothing
let particles = [];
let geometryRotation = 0;
let planetHoverIdx = -1;

// ============================================================
//  INITIALIZATION
// ============================================================
export function initMandala(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    
    // Add click interactivity
    canvas.addEventListener('click', handleMandalaClick);
    canvas.addEventListener('mousemove', handleMandalaHover);
    
    initParticles();
    animate();
}

function handleMandalaHover(e) {
    if (!displayedPanchangData) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) / scale;
    const angle = normalizeDeg(radToDeg(Math.atan2(dy, dx)) + 90);

    if (dist >= RING.navagrahaInner && dist <= RING.navagrahaOuter) {
        // Find closest planet
        let closestIdx = -1;
        let minDist = 15;
        displayedPanchangData.planets.forEach((p, i) => {
            const diff = Math.abs(normalizeDeg(p.lon - angle));
            if (diff < minDist) {
                minDist = diff;
                closestIdx = i;
            }
        });
        planetHoverIdx = closestIdx;
        canvas.style.cursor = planetHoverIdx !== -1 ? 'pointer' : 'default';
    } else {
        planetHoverIdx = -1;
        canvas.style.cursor = 'default';
    }
}

function handleMandalaClick(e) {
    if (!displayedPanchangData) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate distance from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) / scale;
    
    let message = '';
    let title = '';
    
    if (dist < RING.moonRadius) {
        title = 'Moon';
        message = `${displayedPanchangData.moon.phaseName} (${displayedPanchangData.moon.illumination}% lit)`;
    } else if (dist < RING.tithiOuter) {
        title = 'Tithi Ring';
        message = `Current: ${displayedPanchangData.tithi.name} (${displayedPanchangData.tithi.paksha} Paksha)`;
    } else if (dist < RING.nakshatraOuter) {
        title = 'Nakshatra Ring';
        message = `Current: ${displayedPanchangData.nakshatra.name} (Deity: ${displayedPanchangData.nakshatra.deity})`;
    } else if (dist < RING.yogaOuter) {
        title = 'Yoga Ring';
        message = `Current: ${displayedPanchangData.yoga.name} (${displayedPanchangData.yoga.auspicious ? 'Auspicious' : 'Inauspicious'})`;
    } else if (dist < RING.navagrahaOuter) {
        if (planetHoverIdx !== -1) {
            const p = displayedPanchangData.planets[planetHoverIdx];
            title = p.name;
            message = `Symbol: ${p.symbol} · Longitude: ${Math.round(p.lon)}°`;
        } else {
            title = 'Navagraha Ring';
            message = 'The 9 celestial bodies influencing your Karma.';
        }
    }
    
    if (title) {
        showMandalaToast(title, message);
    }
}

function showMandalaToast(title, message) {
    // Create a temporary toast overlay
    let toast = document.getElementById('mandala-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mandala-toast';
        toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(18,18,32,0.9);border:1px solid var(--gold);padding:20px;border-radius:16px;z-index:1000;text-align:center;backdrop-filter:blur(10px);box-shadow:0 0 30px rgba(0,0,0,0.5);pointer-events:none;animation:float-in 0.3s ease-out;';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `<div style="color:var(--gold);font-weight:700;margin-bottom:5px;text-transform:uppercase;letter-spacing:1px">${title}</div><div style="color:white;font-size:1.1rem">${message}</div>`;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => { toast.style.display = 'none'; }, 500);
    }, 2500);
}


function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 500);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = size;
    height = size;
    cx = width / 2;
    cy = height / 2;
    scale = width / 2;
}

// ============================================================
//  UPDATE PANCHANG DATA
// ============================================================
export function updateMandala(data) {
    panchangData = data;
    if (!displayedPanchangData) {
        displayedPanchangData = JSON.parse(JSON.stringify(data));
    }
}

// ============================================================
//  SMOOTHING (Phase 2 & 3)
// ============================================================
function updateSmoothing() {
    if (!panchangData || !displayedPanchangData) return;
    
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpAngle = (a, b, t) => {
        let diff = (b - a) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        return a + diff * t;
    };
    
    // Smoothly interpolate progress values
    displayedPanchangData.tithi.progress = lerp(displayedPanchangData.tithi.progress, panchangData.tithi.progress, 0.1);
    displayedPanchangData.moon.illumination = lerp(displayedPanchangData.moon.illumination, panchangData.moon.illumination, 0.1);
    
    // Smoothly interpolate planet positions
    if (panchangData.planets) {
        panchangData.planets.forEach((p, i) => {
            displayedPanchangData.planets[i].lon = lerpAngle(displayedPanchangData.planets[i].lon, p.lon, 0.1);
        });
    }

    // Discrete values swap when they change
    displayedPanchangData.tithi.name = panchangData.tithi.name;
    displayedPanchangData.tithi.isShukla = panchangData.tithi.isShukla;
    displayedPanchangData.nakshatra.index = panchangData.nakshatra.index;
    displayedPanchangData.nakshatra.name = panchangData.nakshatra.name;
    displayedPanchangData.nakshatra.deity = panchangData.nakshatra.deity;
    displayedPanchangData.yoga = panchangData.yoga;
    displayedPanchangData.moon.phaseName = panchangData.moon.phaseName;
    displayedPanchangData.moon.elongation = panchangData.moon.elongation;
}

// ============================================================
//  DRAW: NAVAGRAHA RING (Phase 3)
// ============================================================
function drawNavagrahaRing() {
    if (!displayedPanchangData || !displayedPanchangData.planets) return;

    const innerR = RING.navagrahaInner * scale;
    const outerR = RING.navagrahaOuter * scale;
    const midR = (innerR + outerR) / 2;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, TAU);
    ctx.lineWidth = outerR - innerR;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.04)';
    ctx.stroke();

    // Draw planets
    displayedPanchangData.planets.forEach((p, i) => {
        const angle = degToRad(p.lon - 90);
        const px = cx + Math.cos(angle) * midR;
        const py = cy + Math.sin(angle) * midR;
        const isHovered = (i === planetHoverIdx);

        // Planet Glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, scale * 0.05);
        glow.addColorStop(0, `${p.color}44`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, scale * 0.05, 0, TAU);
        ctx.fill();

        // Planet Orb
        ctx.beginPath();
        ctx.arc(px, py, isHovered ? 6 : 4, 0, TAU);
        ctx.fillStyle = p.color;
        if (isHovered) {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Planet Symbol (only if hovered or certain planets)
        if (isHovered) {
            ctx.font = `${scale * 0.035}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(p.symbol, px, py - scale * 0.04);
            
            ctx.font = `600 ${scale * 0.02}px Outfit, sans-serif`;
            ctx.fillText(p.name.toUpperCase(), px, py + scale * 0.04);
        }
    });
}

function normalizeDeg(deg) {
    deg = deg % 360;
    if (deg < 0) deg += 360;
    return deg;
}

function degToRad(deg) { return deg * Math.PI / 180; }
function radToDeg(rad) { return rad * 180 / Math.PI; }

// ============================================================
//  SACRED GEOMETRY (Phase 1)
// ============================================================
function drawSacredGeometry() {
    if (!displayedPanchangData) return;
    
    const isAuspicious = displayedPanchangData.yoga.auspicious;
    const rotationSpeed = isAuspicious ? 0.0008 : 0.0003;
    geometryRotation += rotationSpeed;
    
    const pulse = 1 + 0.02 * Math.sin(time * 0.001);
    const radius = RING.yogaOuter * scale * 1.1 * pulse;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(geometryRotation);
    
    ctx.beginPath();
    const color = isAuspicious ? 'rgba(67, 170, 139, 0.12)' : 'rgba(231, 111, 81, 0.08)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    const petals = 12;
    for (let i = 0; i < petals; i++) {
        ctx.rotate(TAU / petals);
        ctx.beginPath();
        ctx.ellipse(radius * 0.45, 0, radius * 0.45, radius * 0.18, 0, 0, TAU);
        ctx.stroke();
    }
    
    ctx.restore();
}

// ============================================================
//  PARTICLES (subtle golden sparkle around mandala)
// ============================================================
function initParticles() {
    particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            angle: Math.random() * TAU,
            radius: 0.35 + Math.random() * 0.12,
            speed: 0.0003 + Math.random() * 0.0005,
            size: 0.5 + Math.random() * 1.5,
            opacity: 0.2 + Math.random() * 0.5,
            phase: Math.random() * TAU
        });
    }
}

function drawParticles() {
    for (const p of particles) {
        p.angle += p.speed;
        const flicker = 0.5 + 0.5 * Math.sin(time * 0.002 + p.phase);
        const x = cx + Math.cos(p.angle) * p.radius * scale;
        const y = cy + Math.sin(p.angle) * p.radius * scale;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, TAU);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity * flicker})`;
        ctx.fill();
    }
}

// ============================================================
//  DRAW: CENTRAL MOON
// ============================================================
function drawMoon() {
    if (!displayedPanchangData) return;

    const r = RING.moonRadius * scale;
    const illumination = displayedPanchangData.moon.illumination / 100;
    const elongation = displayedPanchangData.moon.elongation;

    // Moon glow
    const glowRadius = r * 1.6;
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowRadius);
    glow.addColorStop(0, `rgba(255, 215, 0, ${0.08 + 0.05 * Math.sin(time * 0.002)})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, TAU);
    ctx.fill();

    // Moon surface (full disc)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();

    // Base surface
    const surfaceGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
    surfaceGrad.addColorStop(0, '#F5ECD7');
    surfaceGrad.addColorStop(0.7, '#D4C8A8');
    surfaceGrad.addColorStop(1, '#B8A888');
    ctx.fillStyle = surfaceGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Subtle craters
    const craters = [
        { x: -0.3, y: -0.2, r: 0.12 },
        { x: 0.2, y: 0.3, r: 0.08 },
        { x: -0.1, y: 0.35, r: 0.1 },
        { x: 0.4, y: -0.1, r: 0.07 },
        { x: -0.35, y: 0.1, r: 0.06 },
        { x: 0.1, y: -0.4, r: 0.09 },
    ];
    for (const c of craters) {
        ctx.beginPath();
        ctx.arc(cx + c.x * r, cy + c.y * r, c.r * r, 0, TAU);
        ctx.fillStyle = COLORS.moonCrater;
        ctx.fill();
    }

    // Shadow overlay for phase
    // For Shukla (waxing), shadow is on the left; for Krishna (waning), shadow is on the right
    const isWaxing = elongation < 180;
    const phaseAngle = isWaxing ? elongation : (360 - elongation);
    const shadowX = isWaxing ? -1 : 1;

    // Calculate terminator position
    const terminatorCos = Math.cos((phaseAngle / 180) * Math.PI);

    ctx.beginPath();
    // Draw shadow as an elliptical overlay
    if (illumination < 0.98) {
        ctx.fillStyle = `rgba(8, 8, 15, ${0.85})`;
        // Shadow half
        ctx.beginPath();
        ctx.arc(cx, cy, r, -HALF_PI, HALF_PI, !isWaxing);
        // Terminator (elliptical edge)
        ctx.ellipse(cx, cy, Math.abs(terminatorCos) * r, r, 0, HALF_PI, -HALF_PI, isWaxing ? (terminatorCos > 0) : (terminatorCos < 0));
        ctx.fill();
    }

    ctx.restore();

    // Moon border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + 0.1 * Math.sin(time * 0.003)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Illumination text
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = `600 ${r * 0.35}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${panchangData.moon.illumination}%`, cx, cy + r * 0.55);
}

// ============================================================
//  DRAW: TITHI RING (INNERMOST)
// ============================================================
function drawTithiRing() {
    if (!displayedPanchangData) return;

    const innerR = RING.tithiInner * scale;
    const outerR = RING.tithiOuter * scale;
    const progress = displayedPanchangData.tithi.progress;
    const isShukla = displayedPanchangData.tithi.isShukla;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, (innerR + outerR) / 2, 0, TAU);
    ctx.lineWidth = outerR - innerR;
    ctx.strokeStyle = 'rgba(30, 30, 50, 0.6)';
    ctx.stroke();

    // Progress arc (clockwise from top)
    const startAngle = -HALF_PI;
    const endAngle = startAngle + progress * TAU;

    const progressColor = isShukla ? COLORS.shukla : COLORS.krishnaBright;
    const progressGlow = isShukla ? 'rgba(232, 232, 240, 0.3)' : 'rgba(123, 66, 169, 0.3)';

    // Glow behind progress
    ctx.save();
    ctx.shadowColor = progressGlow;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, (innerR + outerR) / 2, startAngle, endAngle);
    ctx.lineWidth = outerR - innerR;
    ctx.lineCap = 'butt';

    // Gradient along the arc
    const grad = ctx.createLinearGradient(
        cx + Math.cos(startAngle) * outerR,
        cy + Math.sin(startAngle) * outerR,
        cx + Math.cos(endAngle) * outerR,
        cy + Math.sin(endAngle) * outerR
    );
    if (isShukla) {
        grad.addColorStop(0, 'rgba(200, 200, 220, 0.7)');
        grad.addColorStop(1, COLORS.shuklaBright);
    } else {
        grad.addColorStop(0, 'rgba(75, 0, 130, 0.7)');
        grad.addColorStop(1, COLORS.krishnaBright);
    }
    ctx.strokeStyle = grad;
    ctx.stroke();
    ctx.restore();

    // Progress end dot (pulsing)
    const dotPulse = 1 + 0.15 * Math.sin(time * 0.004);
    const dotX = cx + Math.cos(endAngle) * ((innerR + outerR) / 2);
    const dotY = cy + Math.sin(endAngle) * ((innerR + outerR) / 2);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4 * dotPulse, 0, TAU);
    ctx.fillStyle = isShukla ? COLORS.shuklaBright : COLORS.krishnaBright;
    ctx.fill();

    // Bloom particles on auspicious tithis (Tritiya, Panchami, etc.)
    const auspiciousTithis = [0, 2, 4, 6, 10, 14]; // Pratipada, Tritiya, Panchami, Saptami, Ekadashi, Purnima
    const tithiIdx = displayedPanchangData.tithi.index % 15;
    if (auspiciousTithis.includes(tithiIdx)) {
        for (let i = 0; i < 4; i++) {
            const sparkAngle = endAngle + (Math.random() - 0.5) * 0.3;
            const sparkR = ((innerR + outerR) / 2) + (Math.random() - 0.5) * (outerR - innerR);
            const sparkX = cx + Math.cos(sparkAngle) * sparkR;
            const sparkY = cy + Math.sin(sparkAngle) * sparkR;
            const sparkOpacity = 0.3 + 0.4 * Math.sin(time * 0.005 + i);
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 1.5, 0, TAU);
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkOpacity})`;
            ctx.fill();
        }
    }

    // Tithi label along the ring
    ctx.save();
    ctx.fillStyle = isShukla ? 'rgba(232,232,240,0.9)' : 'rgba(123,66,169,0.9)';
    ctx.font = `500 ${scale * 0.028}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelAngle = startAngle + progress * TAU * 0.5;
    const labelR = outerR + scale * 0.01;
    // Don't draw if progress is too small
    if (progress > 0.1) {
        ctx.save();
        ctx.translate(cx + Math.cos(labelAngle) * (innerR - scale * 0.01), cy + Math.sin(labelAngle) * (innerR - scale * 0.01));
        ctx.rotate(labelAngle + HALF_PI);
        // ctx.fillText(panchangData.tithi.name, 0, 0); // Too cluttered, skip
        ctx.restore();
    }
    ctx.restore();
}

// ============================================================
//  DRAW: KARANA SUB-SEGMENTS (inside Tithi ring)
// ============================================================
function drawKaranaSegments() {
    if (!displayedPanchangData) return;

    const innerR = RING.karanaInner * scale;
    const outerR = RING.karanaOuter * scale;

    // Two karanas per tithi — show as two halves
    const startAngle = -HALF_PI;
    const halfArc = Math.PI; // Each karana = half of tithi

    // First karana
    ctx.beginPath();
    ctx.arc(cx, cy, (innerR + outerR) / 2, startAngle, startAngle + halfArc);
    ctx.lineWidth = outerR - innerR - 2;
    ctx.strokeStyle = 'rgba(255, 153, 51, 0.25)';
    ctx.stroke();

    // Second karana
    ctx.beginPath();
    ctx.arc(cx, cy, (innerR + outerR) / 2, startAngle + halfArc, startAngle + TAU);
    ctx.lineWidth = outerR - innerR - 2;
    ctx.strokeStyle = 'rgba(75, 0, 130, 0.25)';
    ctx.stroke();

    // Dividers
    for (let i = 0; i < 2; i++) {
        const angle = startAngle + i * halfArc;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}

// ============================================================
//  DRAW: NAKSHATRA RING (MIDDLE) — 27 segments
// ============================================================
function drawNakshatraRing() {
    if (!displayedPanchangData) return;

    const innerR = RING.nakshatraInner * scale;
    const outerR = RING.nakshatraOuter * scale;
    const midR = (innerR + outerR) / 2;
    const segArc = TAU / 27;
    const activeIdx = displayedPanchangData.nakshatra.index;

    for (let i = 0; i < 27; i++) {
        const startAngle = -HALF_PI + i * segArc;
        const endAngle = startAngle + segArc;
        const isActive = (i === activeIdx);

        // Segment arc
        ctx.beginPath();
        ctx.arc(cx, cy, midR, startAngle + 0.01, endAngle - 0.01);
        ctx.lineWidth = outerR - innerR - 2;
        ctx.lineCap = 'butt';

        if (isActive) {
            // Active segment: bright with glow
            const color = NAKSHATRA_DATA[i].color;
            ctx.strokeStyle = color;
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 12 + 4 * Math.sin(time * 0.003);
            ctx.stroke();
            ctx.restore();

            // Symbol in active segment
            const midAngle = (startAngle + endAngle) / 2;
            const symbolR = midR;
            const sx = cx + Math.cos(midAngle) * symbolR;
            const sy = cy + Math.sin(midAngle) * symbolR;

            // Pulsing background circle
            const pulseSize = (outerR - innerR) * 0.3 * (1 + 0.15 * Math.sin(time * 0.004));
            ctx.beginPath();
            ctx.arc(sx, sy, pulseSize, 0, TAU);
            ctx.fillStyle = `rgba(255, 215, 0, ${0.15 + 0.1 * Math.sin(time * 0.004)})`;
            ctx.fill();

            // Symbol text
            ctx.font = `${scale * 0.04}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(NAKSHATRA_DATA[i].symbol, sx, sy);
        } else {
            // Inactive segments: dimmed
            ctx.strokeStyle = `rgba(${hexToRgb(NAKSHATRA_DATA[i].color)}, 0.15)`;
            ctx.stroke();
        }
    }

    // Segment dividers
    for (let i = 0; i < 27; i++) {
        const angle = -HALF_PI + i * segArc;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
}

// ============================================================
//  DRAW: YOGA RING (OUTERMOST) — wide flowing arc
// ============================================================
function drawYogaRing() {
    if (!displayedPanchangData) return;

    const innerR = RING.yogaInner * scale;
    const outerR = RING.yogaOuter * scale;
    const midR = (innerR + outerR) / 2;
    const ringWidth = outerR - innerR;
    const yoga = displayedPanchangData.yoga;
    const isAuspicious = yoga.auspicious;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, TAU);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = 'rgba(30, 30, 50, 0.4)';
    ctx.stroke();

    // Animated flowing gradient
    const waveOffset = time * 0.0005; // Slow clockwise rotation

    // Create gradient that sweeps around
    const gradStart = -HALF_PI + waveOffset;
    const gradEnd = gradStart + TAU;

    // Draw the yoga arc as a full ring with animated gradient feel
    const segments = 60;
    for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const segStart = -HALF_PI + t * TAU + waveOffset;
        const segEnd = segStart + (TAU / segments) + 0.02;

        // Wave intensity
        const wave = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * TAU * 2 + time * 0.002));

        let r, g, b;
        if (isAuspicious) {
            // Gold-green for auspicious
            r = Math.floor(67 + (255 - 67) * wave * 0.5);
            g = Math.floor(170 + (215 - 170) * wave * 0.5);
            b = Math.floor(139 * (1 - wave * 0.3));
        } else {
            // Amber-red for cautionary
            r = Math.floor(231 * wave);
            g = Math.floor(111 * wave);
            b = Math.floor(81 * (1 - wave * 0.3));
        }

        ctx.beginPath();
        ctx.arc(cx, cy, midR, segStart, segEnd);
        ctx.lineWidth = ringWidth;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + 0.4 * wave})`;
        ctx.stroke();
    }

    // Yoga icon at the "active" position (top)
    const iconAngle = -HALF_PI;
    const iconX = cx + Math.cos(iconAngle) * midR;
    const iconY = cy + Math.sin(iconAngle) * midR;

    // Glow behind icon
    const iconPulse = 1 + 0.1 * Math.sin(time * 0.003);
    ctx.beginPath();
    ctx.arc(iconX, iconY, ringWidth * 0.45 * iconPulse, 0, TAU);
    ctx.fillStyle = isAuspicious
        ? `rgba(67, 170, 139, ${0.3 + 0.15 * Math.sin(time * 0.003)})`
        : `rgba(231, 111, 81, ${0.3 + 0.15 * Math.sin(time * 0.003)})`;
    ctx.fill();

    // Icon
    ctx.font = `${scale * 0.045}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(yoga.icon, iconX, iconY);

    // Yoga name (below icon, outside ring)
    ctx.fillStyle = isAuspicious ? COLORS.auspicious : COLORS.cautionary;
    ctx.font = `600 ${scale * 0.032}px Outfit, sans-serif`;
    ctx.save();
    ctx.shadowColor = isAuspicious ? COLORS.auspicious : COLORS.cautionary;
    ctx.shadowBlur = 8;
    ctx.fillText(yoga.name, iconX, iconY - ringWidth * 0.8);
    ctx.restore();
}

// ============================================================
//  DRAW: RING SEPARATORS (gaps between rings)
// ============================================================
function drawRingSeparators() {
    const gaps = [
        RING.tithiOuter,
        RING.nakshatraInner,
        RING.nakshatraOuter,
        RING.yogaInner,
        RING.yogaOuter,
        RING.navagrahaInner,
    ];

    for (const r of gaps) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, TAU);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// ============================================================
//  DRAW: RING LABELS (around the outermost edge)
// ============================================================
function drawRingIdentifiers() {
    if (!displayedPanchangData) return;

    const outerEdge = RING.yogaOuter * scale + scale * 0.03;

    ctx.save();
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = `300 ${scale * 0.024}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Tithi label (bottom-left)
    const tAngle = Math.PI * 0.75;
    ctx.fillText('TITHI', cx + Math.cos(tAngle) * (RING.tithiOuter * scale + scale * 0.015), cy + Math.sin(tAngle) * (RING.tithiOuter * scale + scale * 0.015));

    ctx.restore();
}

// ============================================================
//  ANIMATION LOOP
// ============================================================
function animate() {
    time = performance.now();
    draw();
    animFrame = requestAnimationFrame(animate);
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    if (!panchangData) {
        // Loading state
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = `400 14px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Loading Panchang...', cx, cy);
        return;
    }

    updateSmoothing();

    // Draw from outside in
    drawSacredGeometry();
    drawParticles();
    drawNavagrahaRing();
    drawYogaRing();
    drawRingSeparators();
    drawNakshatraRing();
    drawTithiRing();
    drawKaranaSegments();
    drawMoon();
}

// ============================================================
//  UTILITY: hex color to rgb string
// ============================================================
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
    }
    return '200, 200, 200';
}

// ============================================================
//  CLEANUP
// ============================================================
export function destroyMandala() {
    if (animFrame) cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', resize);
}
