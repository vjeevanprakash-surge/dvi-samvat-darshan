/**
 * Dvi-Samvat Darshan — Utility Functions
 * Date helpers, location utils, formatting
 */

const IST = { country: 'India', timezone: 'Asia/Kolkata', utcOffset: 5.5 };

export const LOCATIONS = {
    bengaluru: { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, ...IST },
    delhi:     { id: 'delhi', name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, ...IST },
    mumbai:    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, ...IST },
    chennai:   { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, ...IST },
    kolkata:   { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, ...IST },
    varanasi:  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, ...IST },
    ujjain:    { id: 'ujjain', name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885, ...IST },
    hyderabad: { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, ...IST }
};

export const DEFAULT_LOCATION = LOCATIONS.bengaluru;

/**
 * A location for the device's own coordinates. Its clock is the device's time zone,
 * which is the clock all of the app's local times are read on.
 */
export function deviceLocation(lat, lng) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    return {
        id: 'current',
        name: 'Current location',
        state: `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lng).toFixed(2)}°${ew}`,
        lat,
        lng,
        utcOffset: -new Date().getTimezoneOffset() / 60
    };
}

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
