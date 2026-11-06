/**
 * Dvi-Samvat Darshan — Offline Panchang Engine
 * Simplified astronomical calculations for Hindu calendar elements.
 * Uses low-precision solar/lunar longitude formulas.
 */

import {
    degToRad, radToDeg, normalizeDeg, julianCenturies,
    formatTime, DEFAULT_LOCATION, zonedInfo, zonedDateTime
} from './utils.js';

// ============================================================
//  TITHI NAMES
// ============================================================
const TITHI_NAMES = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

const PAKSHA_NAMES = [
    'Shukla', 'Shukla', 'Shukla', 'Shukla', 'Shukla',
    'Shukla', 'Shukla', 'Shukla', 'Shukla', 'Shukla',
    'Shukla', 'Shukla', 'Shukla', 'Shukla', 'Shukla',
    'Krishna', 'Krishna', 'Krishna', 'Krishna', 'Krishna',
    'Krishna', 'Krishna', 'Krishna', 'Krishna', 'Krishna',
    'Krishna', 'Krishna', 'Krishna', 'Krishna', 'Krishna'
];

// ============================================================
//  NAKSHATRA NAMES & COLORS
// ============================================================
export const NAKSHATRA_DATA = [
    { name: 'Ashwini', deity: 'Ashwini Kumaras', symbol: '🐴', color: '#FF6B35' },
    { name: 'Bharani', deity: 'Yama', symbol: '🔥', color: '#E63946' },
    { name: 'Krittika', deity: 'Agni', symbol: '🔥', color: '#FF9933' },
    { name: 'Rohini', deity: 'Brahma', symbol: '🐂', color: '#FFD700' },
    { name: 'Mrigashira', deity: 'Soma', symbol: '🦌', color: '#90BE6D' },
    { name: 'Ardra', deity: 'Rudra', symbol: '💧', color: '#577590' },
    { name: 'Punarvasu', deity: 'Aditi', symbol: '🏹', color: '#43AA8B' },
    { name: 'Pushya', deity: 'Brihaspati', symbol: '🌸', color: '#F9C74F' },
    { name: 'Ashlesha', deity: 'Nagas', symbol: '🐍', color: '#6A0572' },
    { name: 'Magha', deity: 'Pitris', symbol: '👑', color: '#800000' },
    { name: 'Purva Phalguni', deity: 'Bhaga', symbol: '🛏️', color: '#E07A5F' },
    { name: 'Uttara Phalguni', deity: 'Aryaman', symbol: '☀️', color: '#F2CC8F' },
    { name: 'Hasta', deity: 'Savitar', symbol: '✋', color: '#81B29A' },
    { name: 'Chitra', deity: 'Vishvakarma', symbol: '💎', color: '#E63946' },
    { name: 'Swati', deity: 'Vayu', symbol: '🌬️', color: '#457B9D' },
    { name: 'Vishakha', deity: 'Indra-Agni', symbol: '⚡', color: '#E76F51' },
    { name: 'Anuradha', deity: 'Mitra', symbol: '🌺', color: '#264653' },
    { name: 'Jyeshtha', deity: 'Indra', symbol: '👂', color: '#2A9D8F' },
    { name: 'Mula', deity: 'Nirriti', symbol: '🦁', color: '#4B0082' },
    { name: 'Purva Ashadha', deity: 'Apas', symbol: '🌊', color: '#F4A261' },
    { name: 'Uttara Ashadha', deity: 'Vishvedevas', symbol: '🐘', color: '#E9C46A' },
    { name: 'Shravana', deity: 'Vishnu', symbol: '👂', color: '#2196F3' },
    { name: 'Dhanishta', deity: 'Vasus', symbol: '🥁', color: '#FF5722' },
    { name: 'Shatabhisha', deity: 'Varuna', symbol: '💊', color: '#009688' },
    { name: 'Purva Bhadrapada', deity: 'Aja Ekapada', symbol: '⚔️', color: '#795548' },
    { name: 'Uttara Bhadrapada', deity: 'Ahir Budhnya', symbol: '🐍', color: '#607D8B' },
    { name: 'Revati', deity: 'Pushan', symbol: '🐟', color: '#8BC34A' }
];

// ============================================================
//  YOGA NAMES
// ============================================================
export const YOGA_DATA = [
    { name: 'Vishkambha', auspicious: false, icon: '⚡' },
    { name: 'Priti', auspicious: true, icon: '🪷' },
    { name: 'Ayushman', auspicious: true, icon: '🪷' },
    { name: 'Saubhagya', auspicious: true, icon: '🪷' },
    { name: 'Shobhana', auspicious: true, icon: '🪷' },
    { name: 'Atiganda', auspicious: false, icon: '⚡' },
    { name: 'Sukarma', auspicious: true, icon: '🪷' },
    { name: 'Dhriti', auspicious: true, icon: '🪷' },
    { name: 'Shula', auspicious: false, icon: '⚡' },
    { name: 'Ganda', auspicious: false, icon: '⚡' },
    { name: 'Vriddhi', auspicious: true, icon: '🪷' },
    { name: 'Dhruva', auspicious: true, icon: '🪷' },
    { name: 'Vyaghata', auspicious: false, icon: '⚡' },
    { name: 'Harshana', auspicious: true, icon: '🪷' },
    { name: 'Vajra', auspicious: false, icon: '⚡' },
    { name: 'Siddhi', auspicious: true, icon: '🪷' },
    { name: 'Vyatipata', auspicious: false, icon: '⚡' },
    { name: 'Variyan', auspicious: true, icon: '🪷' },
    { name: 'Parigha', auspicious: false, icon: '⚡' },
    { name: 'Shiva', auspicious: true, icon: '🪷' },
    { name: 'Siddha', auspicious: true, icon: '🪷' },
    { name: 'Sadhya', auspicious: true, icon: '🪷' },
    { name: 'Shubha', auspicious: true, icon: '🪷' },
    { name: 'Shukla', auspicious: true, icon: '🪷' },
    { name: 'Brahma', auspicious: true, icon: '🪷' },
    { name: 'Indra', auspicious: true, icon: '🪷' },
    { name: 'Vaidhriti', auspicious: false, icon: '⚡' }
];

// ============================================================
//  KARANA NAMES
// ============================================================
const KARANA_NAMES = [
    'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja',
    'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Nagava', 'Kimstughna'
];

// ============================================================
//  MONTH NAMES
// ============================================================
const LUNAR_MONTHS = [
    'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha',
    'Shravana', 'Bhadrapada', 'Ashwin', 'Kartik',
    'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
];

// ============================================================
//  SAMVAT YEAR NAMES (60-year cycle)
// ============================================================
const SAMVAT_YEAR_NAMES = [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramodoota', 'Prajothpatti',
    'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatu',
    'Ishwara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vishu',
    'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikruti', 'Khara',
    'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
    'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava',
    'Shubhakrut', 'Shobhakrut', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Keelaka', 'Saumya', 'Sadharana', 'Virodhikrut',
    'Pareedhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukti', 'Siddharthi', 'Raudri', 'Durmathi',
    'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya'
];

// ============================================================
//  SUN LONGITUDE (Low precision — Jean Meeus simplified)
// ============================================================
function sunLongitude(jd) {
    const T = julianCenturies(jd);
    // Geometric mean longitude
    let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    // Mean anomaly
    let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    M = normalizeDeg(M);
    const Mrad = degToRad(M);
    // Equation of center
    const C = (1.914602 - 0.004817 * T) * Math.sin(Mrad) +
        (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
        0.000289 * Math.sin(3 * Mrad);
    // Sun's true longitude
    let sunLon = L0 + C;
    // Apparent longitude (nutation correction)
    const omega = 125.04 - 1934.136 * T;
    sunLon = sunLon - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
    return normalizeDeg(sunLon);
}

// ============================================================
//  MOON LONGITUDE (Low precision)
// ============================================================
function moonLongitude(jd) {
    const T = julianCenturies(jd);
    // Mean longitude
    let Lp = 218.3165 + 481267.8813 * T;
    // Mean elongation
    let D = 297.8502 + 445267.1115 * T;
    // Mean anomaly (Sun)
    let M = 357.5291 + 35999.0503 * T;
    // Mean anomaly (Moon)
    let Mp = 134.9634 + 477198.8676 * T;
    // Argument of latitude
    let F = 93.2720 + 483202.0175 * T;

    Lp = normalizeDeg(Lp);
    D = normalizeDeg(D);
    M = normalizeDeg(M);
    Mp = normalizeDeg(Mp);
    F = normalizeDeg(F);

    const Drad = degToRad(D), Mrad = degToRad(M),
        Mprad = degToRad(Mp), Frad = degToRad(F);

    // Principal perturbations
    let lon = Lp
        + 6.289 * Math.sin(Mprad)
        + 1.274 * Math.sin(2 * Drad - Mprad)
        + 0.658 * Math.sin(2 * Drad)
        + 0.214 * Math.sin(2 * Mprad)
        - 0.186 * Math.sin(Mrad)
        - 0.114 * Math.sin(2 * Frad)
        + 0.059 * Math.sin(2 * Drad - 2 * Mprad)
        + 0.057 * Math.sin(2 * Drad - Mrad - Mprad)
        + 0.053 * Math.sin(2 * Drad + Mprad)
        + 0.046 * Math.sin(2 * Drad - Mrad)
        - 0.041 * Math.sin(Mrad - Mprad)
        - 0.035 * Math.sin(Drad)
        - 0.031 * Math.sin(Mprad + Mrad);

    return normalizeDeg(lon);
}

// ============================================================
//  SUNRISE / SUNSET (simplified for a location)
// ============================================================
/**
 * Sunrise and sunset as decimal hours on the location's standard clock (NOAA solar
 * equations: equation of time plus the hour angle for a −0.833° apparent horizon).
 */
function sunriseSunset(jd, lat, lng, utcOffset) {
    const T = julianCenturies(jd);
    const L0 = degToRad(normalizeDeg(280.46646 + 36000.76983 * T));
    const M = degToRad(normalizeDeg(357.52911 + 35999.05029 * T));
    const e = 0.016708634 - 0.000042037 * T;
    const epsilon = degToRad(23.439291 - 0.0130042 * T);
    const y = Math.tan(epsilon / 2) ** 2;

    const equationOfTimeMinutes = 4 * radToDeg(
        y * Math.sin(2 * L0) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
        - 0.5 * y * y * Math.sin(4 * L0) - 1.25 * e * e * Math.sin(2 * M));
    const declination = Math.asin(Math.sin(epsilon) * Math.sin(degToRad(sunLongitude(jd))));

    const latRad = degToRad(lat);
    const cosH = (Math.sin(degToRad(-0.833)) - Math.sin(latRad) * Math.sin(declination)) /
        (Math.cos(latRad) * Math.cos(declination));
    const solarNoon = 12 - lng / 15 + utcOffset - equationOfTimeMinutes / 60;

    if (cosH > 1 || cosH < -1) {
        // Polar night or midnight sun: no sunrise; fall back to a 12-hour day around noon.
        return { sunrise: solarNoon - 6, sunset: solarNoon + 6 };
    }
    const halfDay = radToDeg(Math.acos(cosH)) / 15;
    return { sunrise: solarNoon - halfDay, sunset: solarNoon + halfDay };
}

// ============================================================
//  RAHU KAAL (standard weekday-based)
// ============================================================
function rahuKaal(dayOfWeek, sunriseHour, sunsetHour) {
    // Rahu Kaal periods by weekday (0=Sun, 1=Mon, ...)
    // Period number from sunrise (each = (sunset-sunrise)/8)
    const rahuPeriods = [8, 2, 7, 5, 6, 4, 3]; // Sun through Sat
    const periodDuration = (sunsetHour - sunriseHour) / 8;
    const periodIndex = rahuPeriods[dayOfWeek] - 1;
    const start = sunriseHour + periodIndex * periodDuration;
    return {
        start: start,
        end: start + periodDuration,
        startStr: formatTime(start),
        endStr: formatTime(start + periodDuration)
    };
}

// ============================================================
//  GULIKA KAAL
// ============================================================
function gulikaKaal(dayOfWeek, sunriseHour, sunsetHour) {
    const gulikaPeriods = [7, 6, 5, 4, 3, 2, 1]; // Sun through Sat
    const periodDuration = (sunsetHour - sunriseHour) / 8;
    const periodIndex = gulikaPeriods[dayOfWeek] - 1;
    const start = sunriseHour + periodIndex * periodDuration;
    return {
        start: start,
        end: start + periodDuration,
        startStr: formatTime(start),
        endStr: formatTime(start + periodDuration)
    };
}

// ============================================================
//  YAMAGANDA KAAL
// ============================================================
function yamagandaKaal(dayOfWeek, sunriseHour, sunsetHour) {
    const yamaPeriods = [5, 4, 3, 2, 1, 7, 6]; // Sun through Sat
    const periodDuration = (sunsetHour - sunriseHour) / 8;
    const periodIndex = yamaPeriods[dayOfWeek] - 1;
    const start = sunriseHour + periodIndex * periodDuration;
    return {
        start: start,
        end: start + periodDuration,
        startStr: formatTime(start),
        endStr: formatTime(start + periodDuration)
    };
}

// ============================================================
//  ABHIJIT MUHURTA
// ============================================================
function abhijitMuhurta(sunriseHour, sunsetHour) {
    const noon = (sunriseHour + sunsetHour) / 2;
    const duration = (sunsetHour - sunriseHour) / 15; // 1 Muhurta = 1/15th of daytime
    return {
        start: noon - duration / 2,
        end: noon + duration / 2,
        startStr: formatTime(noon - duration / 2),
        endStr: formatTime(noon + duration / 2)
    };
}

// ============================================================
//  MOON PHASE / ILLUMINATION
// ============================================================
function moonPhase(sunLon, moonLon) {
    let elongation = normalizeDeg(moonLon - sunLon);
    const illumination = (1 - Math.cos(degToRad(elongation))) / 2 * 100;

    let phaseName;
    if (elongation < 12) phaseName = 'New Moon';
    else if (elongation < 90) phaseName = 'Waxing Crescent';
    else if (elongation < 100) phaseName = 'First Quarter';
    else if (elongation < 168) phaseName = 'Waxing Gibbous';
    else if (elongation < 192) phaseName = 'Full Moon';
    else if (elongation < 270) phaseName = 'Waning Gibbous';
    else if (elongation < 280) phaseName = 'Last Quarter';
    else if (elongation < 348) phaseName = 'Waning Crescent';
    else phaseName = 'New Moon';

    return { illumination, phaseName, elongation };
}

// ============================================================
//  NAVAGRAHA (Planetary Positions — Simplified)
// ============================================================
// Keplerian elements at J2000 and their rates per Julian century, J2000 ecliptic and
// equinox (Standish, "Keplerian Elements for Approximate Positions of the Major
// Planets", JPL, valid 1800–2050): [a (AU), e, I, L, long. perihelion, long. node] (deg).
const ORBITAL_ELEMENTS = {
    mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
              [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venus:   [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
              [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    earth:   [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
              [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    mars:    [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
              [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
              [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturn:  [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
              [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]]
};

/** Heliocentric ecliptic rectangular coordinates (AU, J2000 frame). */
function heliocentricPosition(T, planet) {
    const [base, rate] = ORBITAL_ELEMENTS[planet];
    const [a, e, I, L, peri, node] = base.map((v, i) => v + rate[i] * T);

    const M = degToRad(normalizeDeg(L - peri));
    let E = M + e * Math.sin(M);
    for (let i = 0; i < 6; i++) {
        E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const w = degToRad(peri - node), O = degToRad(node), inc = degToRad(I);
    const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(inc);
    return {
        x: (cw * cO - sw * sO * ci) * xOrb + (-sw * cO - cw * sO * ci) * yOrb,
        y: (cw * sO + sw * cO * ci) * xOrb + (-sw * sO + cw * cO * ci) * yOrb
    };
}

/** Geocentric tropical longitude (equinox of date) of a planet, in degrees. */
function planetLongitude(jd, planet) {
    if (!ORBITAL_ELEMENTS[planet] || planet === 'earth') return 0;
    const T = julianCenturies(jd);
    const p = heliocentricPosition(T, planet);
    const earth = heliocentricPosition(T, 'earth');
    const lonJ2000 = radToDeg(Math.atan2(p.y - earth.y, p.x - earth.x));
    const precession = 1.396971 * T; // general precession in longitude since J2000
    return normalizeDeg(lonJ2000 + precession);
}

function rahuLongitude(jd) {
    const T = julianCenturies(jd);
    // Mean longitude of ascending node
    let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T;
    return normalizeDeg(omega);
}

// ============================================================
//  AMANTA LUNAR MONTH
// ============================================================
const SYNODIC_ELONGATION_PER_DAY = 360 / 29.530589;

function lahiriAyanamsa(jd) {
    return 23.853 + 0.0139689 * (jd - 2451545.0) / 365.25;
}

/** The new moon nearest to an estimate that is within a few days of it. */
function refineNewMoon(t) {
    for (let i = 0; i < 4; i++) {
        let elong = normalizeDeg(moonLongitude(t) - sunLongitude(t));
        if (elong > 180) elong -= 360;
        t -= elong / SYNODIC_ELONGATION_PER_DAY;
    }
    return t;
}

/** Sidereal sign of the Sun: 0 = Mesha … 11 = Meena. */
function siderealRashi(jd) {
    return Math.floor(normalizeDeg(sunLongitude(jd) - lahiriAyanamsa(jd)) / 30);
}

/**
 * The amanta month containing jd: `index` into LUNAR_MONTHS (0 = Chaitra), named after the
 * sidereal sign the Sun occupies at the month's opening new moon (Sun in Meena → Chaitra),
 * and `adhika` when the Sun stays in that sign until the closing new moon — a leap month
 * with no sankranti, which takes the name of the month that follows it.
 */
function amantaMonth(jd) {
    const elong = normalizeDeg(moonLongitude(jd) - sunLongitude(jd));
    const opening = refineNewMoon(jd - elong / SYNODIC_ELONGATION_PER_DAY);
    const closing = refineNewMoon(opening + 29.530589);
    const rashi = siderealRashi(opening);
    return { index: (rashi + 1) % 12, adhika: siderealRashi(closing) === rashi };
}

// ============================================================
//  MAIN: Compute full Panchang for a date
// ============================================================
export function computePanchang(date, location = DEFAULT_LOCATION) {
    // Calendar date, weekday and clock offset as they are at the location.
    const local = zonedInfo(date, location.timezone);
    const { year, month, day, utcOffset } = local;
    const dayOfWeek = local.weekday;

    const jd = date.getTime() / 86400000 + 2440587.5;
    const jdSunrise = jd;

    const sunLon = sunLongitude(jdSunrise);
    const moonLon = moonLongitude(jdSunrise);

    // Nakshatras, yogas and graha positions are reckoned on the sidereal zodiac.
    const ayanamsa = lahiriAyanamsa(jdSunrise);
    const sidereal = lon => normalizeDeg(lon - ayanamsa);
    const sidSunLon = sidereal(sunLon);
    const sidMoonLon = sidereal(moonLon);

    // --- NAVAGRAHA ---
    const rahuLon = sidereal(rahuLongitude(jdSunrise));
    const planets = [
        { name: 'Surya', symbol: '☀️', lon: sidSunLon, color: '#FF9933' },
        { name: 'Chandra', symbol: '🌙', lon: sidMoonLon, color: '#FFFFFF' },
        { name: 'Mangala', symbol: '🔴', lon: sidereal(planetLongitude(jdSunrise, 'mars')), color: '#E63946' },
        { name: 'Budha', symbol: '🟢', lon: sidereal(planetLongitude(jdSunrise, 'mercury')), color: '#43AA8B' },
        { name: 'Guru', symbol: '🟡', lon: sidereal(planetLongitude(jdSunrise, 'jupiter')), color: '#FFD700' },
        { name: 'Shukra', symbol: '⚪', lon: sidereal(planetLongitude(jdSunrise, 'venus')), color: '#F0E6D3' },
        { name: 'Shani', symbol: '🔵', lon: sidereal(planetLongitude(jdSunrise, 'saturn')), color: '#4B0082' },
        { name: 'Rahu', symbol: '🌑', lon: rahuLon, color: '#6A0572' },
        { name: 'Ketu', symbol: '☄️', lon: normalizeDeg(rahuLon + 180), color: '#800000' }
    ];

    // --- TITHI ---
    let tithiAngle = normalizeDeg(moonLon - sunLon);
    let tithiIndex = Math.floor(tithiAngle / 12);
    if (tithiIndex >= 30) tithiIndex = 29;
    const tithiProgress = (tithiAngle % 12) / 12; // 0-1 progress through current tithi
    const tithiName = TITHI_NAMES[tithiIndex];
    const pakshaName = PAKSHA_NAMES[tithiIndex];
    const isShukla = pakshaName === 'Shukla';

    // --- NAKSHATRA ---
    let nakshatraIndex = Math.floor(sidMoonLon / (360 / 27));
    if (nakshatraIndex >= 27) nakshatraIndex = 26;
    const nakshatra = NAKSHATRA_DATA[nakshatraIndex];

    // --- YOGA ---
    let yogaAngle = normalizeDeg(sidSunLon + sidMoonLon);
    let yogaIndex = Math.floor(yogaAngle / (360 / 27));
    if (yogaIndex >= 27) yogaIndex = 26;
    const yoga = YOGA_DATA[yogaIndex];

    // --- KARANA ---
    let karanaNumber = Math.floor(tithiAngle / 6);
    let karanaIndex;
    if (karanaNumber === 0) karanaIndex = 10; // Kimstughna
    else if (karanaNumber >= 57) karanaIndex = 7 + (karanaNumber - 57); // Fixed karanas
    else karanaIndex = ((karanaNumber - 1) % 7);
    const karanaName = KARANA_NAMES[karanaIndex];

    // Second karana of the tithi
    let karana2Number = karanaNumber + 1;
    let karana2Index;
    if (karana2Number >= 57) karana2Index = 7 + (karana2Number - 57);
    else karana2Index = ((karana2Number - 1) % 7);
    const karana2Name = KARANA_NAMES[karana2Index] || KARANA_NAMES[0];

    // --- SUNRISE / SUNSET ---
    const { sunrise, sunset } = sunriseSunset(jd, location.lat, location.lng, utcOffset);

    // --- KAALS ---
    const rahu = rahuKaal(dayOfWeek, sunrise, sunset);
    const gulika = gulikaKaal(dayOfWeek, sunrise, sunset);
    const yama = yamagandaKaal(dayOfWeek, sunrise, sunset);
    const abhijit = abhijitMuhurta(sunrise, sunset);
    const brahma = {
        start: sunrise - 1.5,
        end: sunrise - 0.75,
        startStr: formatTime(sunrise - 1.5),
        endStr: formatTime(sunrise - 0.75)
    };

    // --- MOON PHASE ---
    const moon = moonPhase(sunLon, moonLon);

    // --- LUNAR MONTH ---
    const amanta = amantaMonth(jd);
    const amantaIndex = amanta.index;
    // Krishna paksha belongs to the next month in the purnimanta (North Indian) reckoning,
    // which is what the festival database uses. An adhika month is bounded by new moons in
    // both reckonings, so its Krishna paksha stays in the adhika month.
    const isAdhikaMasa = amanta.adhika;
    const lunarMonthIndex = isShukla || isAdhikaMasa ? amantaIndex : (amantaIndex + 1) % 12;
    const lunarMonth = LUNAR_MONTHS[lunarMonthIndex];
    const lunarMonthLabel = isAdhikaMasa ? `Adhika ${lunarMonth}` : lunarMonth;

    // --- SAMVATS ---
    // Both years turn over at Chaitra Shukla Pratipada (Ugadi / Gudi Padwa, March–April).
    // An adhika Chaitra still belongs to the outgoing year; the new year starts with nija Chaitra.
    const beforeNewYear = month <= 4 &&
        (amantaIndex >= 9 || (amantaIndex === 0 && isAdhikaMasa)); // Pausha … Phalguna, or adhika Chaitra
    const vikramYear = year + (beforeNewYear ? 56 : 57);
    const shakaYear = year - (beforeNewYear ? 79 : 78);
    // 60-year Jovian cycle; the two calendars sit at different offsets within it.
    const vikramYearName = SAMVAT_YEAR_NAMES[(vikramYear + 9) % 60];
    const shakaYearName = SAMVAT_YEAR_NAMES[(shakaYear + 11) % 60];

    // --- VAARA (Day of week) ---
    const vaaraNames = ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara',
        'Guruvara', 'Shukravara', 'Shanivara'];
    const vaara = vaaraNames[dayOfWeek];

    return {
        gregorian: { year, month, day, dayOfWeek },
        tithi: {
            index: tithiIndex,
            name: tithiName,
            paksha: pakshaName,
            isShukla,
            progress: tithiProgress,
            fullName: `${lunarMonthLabel} ${pakshaName} ${tithiName}`,
            remaining: `${Math.round((1 - tithiProgress) * 100)}%`
        },
        nakshatra: {
            index: nakshatraIndex,
            ...nakshatra
        },
        yoga: {
            index: yogaIndex,
            ...yoga
        },
        karana: {
            first: karanaName,
            second: karana2Name,
            index: karanaIndex
        },
        moon: {
            illumination: Math.round(moon.illumination),
            phaseName: moon.phaseName,
            elongation: moon.elongation
        },
        sun: {
            sunrise: formatTime(sunrise),
            sunset: formatTime(sunset),
            sunriseDecimal: sunrise,
            sunsetDecimal: sunset
        },
        kaals: {
            rahu,
            gulika,
            yama,
            abhijit,
            brahma
        },
        lunarMonth,
        isAdhikaMasa,
        vaara,
        samvat: {
            vikram: { year: vikramYear, name: vikramYearName },
            shaka: { year: shakaYear, name: shakaYearName }
        },
        planets,
        // Raw astronomical data
        _raw: { sunLon, moonLon, tithiAngle, jd }
    };
}

/**
 * Tithi index (0–29) at a moment, without the rest of the panchang.
 */
export function tithiIndexAt(date) {
    return Math.min(29, Math.floor(elongationAt(date) / 12));
}

/**
 * Whether Bhadra (Vishti karana, the 7th of the repeating karanas) prevails at a moment.
 */
export function isBhadraAt(date) {
    const karanaNumber = Math.floor(elongationAt(date) / 6); // 0–59, two per tithi
    return karanaNumber >= 1 && karanaNumber <= 56 && (karanaNumber - 1) % 7 === 6;
}

function elongationAt(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    return normalizeDeg(moonLongitude(jd) - sunLongitude(jd));
}

/**
 * Compute panchang for a different date (for date converter)
 */
export function panchangForDate(year, month, day, location = DEFAULT_LOCATION) {
    // A day's tithi is the one prevailing at sunrise at the location.
    const { timezone } = location;
    const sunrise = computePanchang(zonedDateTime(year, month, day, 6, timezone), location).sun.sunriseDecimal;
    return computePanchang(zonedDateTime(year, month, day, sunrise, timezone), location);
}
