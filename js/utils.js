/**
 * Dvi-Samvat Darshan — Utility Functions
 * Date helpers, location utils, formatting
 */

export const DEFAULT_LOCATION = {
    name: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    lat: 12.9716,
    lng: 77.5946,
    timezone: 'Asia/Kolkata',
    utcOffset: 5.5
};

/**
 * Get current app date (now)
 */
export function getAppDate() {
    return new Date();
}

/**
 * Format date for display
 */
export function formatGregorianDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeDeg(deg) {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
}

/**
 * Julian Day Number from Gregorian date
 */
export function gregorianToJD(year, month, day) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) +
        Math.floor(30.6001 * (month + 1)) +
        day + B - 1524.5;
}

/**
 * Julian centuries from J2000.0
 */
export function julianCenturies(jd) {
    return (jd - 2451545.0) / 36525.0;
}

/**
 * Format hours (decimal) to HH:MM string
 */
export function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Lerp between two values
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
