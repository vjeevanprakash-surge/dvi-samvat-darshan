/**
 * Dvi-Samvat Darshan — Utility Functions
 * Date helpers, location utils, formatting
 */

// Order and labels of the location picker's groups.
export const REGIONS = [
    { id: 'North', label: 'North India' },
    { id: 'West', label: 'West India' },
    { id: 'Central', label: 'Central India' },
    { id: 'East', label: 'East India' },
    { id: 'Northeast', label: 'Northeast India' },
    { id: 'South', label: 'South India' },
    { id: 'SouthAsia', label: 'Nepal, Sri Lanka & Bangladesh' },
    { id: 'AsiaPacific', label: 'Southeast Asia & Pacific' },
    { id: 'MiddleEastAfrica', label: 'Middle East & Africa' },
    { id: 'Europe', label: 'Europe' },
    { id: 'Americas', label: 'Americas' }
];

// [id, name, state or country, region, latitude, longitude, IANA time zone (default India)].
// Ids are saved in users' browsers: never rename one.
const CITIES = [
    ['delhi', 'New Delhi', 'Delhi', 'North', 28.6139, 77.2090],
    ['agra', 'Agra', 'Uttar Pradesh', 'North', 27.1767, 78.0081],
    ['amritsar', 'Amritsar', 'Punjab', 'North', 31.6340, 74.8723],
    ['ayodhya', 'Ayodhya', 'Uttar Pradesh', 'North', 26.7922, 82.1998],
    ['chandigarh', 'Chandigarh', 'Chandigarh', 'North', 30.7333, 76.7794],
    ['dehradun', 'Dehradun', 'Uttarakhand', 'North', 30.3165, 78.0322],
    ['haridwar', 'Haridwar', 'Uttarakhand', 'North', 29.9457, 78.1642],
    ['jammu', 'Jammu', 'Jammu & Kashmir', 'North', 32.7266, 74.8570],
    ['kanpur', 'Kanpur', 'Uttar Pradesh', 'North', 26.4499, 80.3319],
    ['kurukshetra', 'Kurukshetra', 'Haryana', 'North', 29.9695, 76.8783],
    ['leh', 'Leh', 'Ladakh', 'North', 34.1526, 77.5771],
    ['lucknow', 'Lucknow', 'Uttar Pradesh', 'North', 26.8467, 80.9462],
    ['ludhiana', 'Ludhiana', 'Punjab', 'North', 30.9010, 75.8573],
    ['mathura', 'Mathura', 'Uttar Pradesh', 'North', 27.4924, 77.6737],
    ['prayagraj', 'Prayagraj', 'Uttar Pradesh', 'North', 25.4358, 81.8463],
    ['rishikesh', 'Rishikesh', 'Uttarakhand', 'North', 30.0869, 78.2676],
    ['shimla', 'Shimla', 'Himachal Pradesh', 'North', 31.1048, 77.1734],
    ['srinagar', 'Srinagar', 'Jammu & Kashmir', 'North', 34.0837, 74.7973],
    ['varanasi', 'Varanasi', 'Uttar Pradesh', 'North', 25.3176, 82.9739],

    ['mumbai', 'Mumbai', 'Maharashtra', 'West', 19.0760, 72.8777],
    ['ahmedabad', 'Ahmedabad', 'Gujarat', 'West', 23.0225, 72.5714],
    ['ajmer', 'Ajmer', 'Rajasthan', 'West', 26.4521, 74.6399],
    ['dwarka', 'Dwarka', 'Gujarat', 'West', 22.2442, 68.9685],
    ['jaipur', 'Jaipur', 'Rajasthan', 'West', 26.9124, 75.7873],
    ['jodhpur', 'Jodhpur', 'Rajasthan', 'West', 26.2389, 73.0243],
    ['kolhapur', 'Kolhapur', 'Maharashtra', 'West', 16.7050, 74.2433],
    ['nashik', 'Nashik', 'Maharashtra', 'West', 19.9975, 73.7898],
    ['panaji', 'Panaji', 'Goa', 'West', 15.4909, 73.8278],
    ['pandharpur', 'Pandharpur', 'Maharashtra', 'West', 17.6792, 75.3290],
    ['pune', 'Pune', 'Maharashtra', 'West', 18.5204, 73.8567],
    ['rajkot', 'Rajkot', 'Gujarat', 'West', 22.3039, 70.8022],
    ['shirdi', 'Shirdi', 'Maharashtra', 'West', 19.7645, 74.4762],
    ['somnath', 'Somnath', 'Gujarat', 'West', 20.8880, 70.4013],
    ['surat', 'Surat', 'Gujarat', 'West', 21.1702, 72.8311],
    ['udaipur', 'Udaipur', 'Rajasthan', 'West', 24.5854, 73.7125],
    ['vadodara', 'Vadodara', 'Gujarat', 'West', 22.3072, 73.1812],

    ['ujjain', 'Ujjain', 'Madhya Pradesh', 'Central', 23.1765, 75.7885],
    ['bhopal', 'Bhopal', 'Madhya Pradesh', 'Central', 23.2599, 77.4126],
    ['indore', 'Indore', 'Madhya Pradesh', 'Central', 22.7196, 75.8577],
    ['jabalpur', 'Jabalpur', 'Madhya Pradesh', 'Central', 23.1815, 79.9864],
    ['nagpur', 'Nagpur', 'Maharashtra', 'Central', 21.1458, 79.0882],
    ['omkareshwar', 'Omkareshwar', 'Madhya Pradesh', 'Central', 22.2459, 76.1512],
    ['raipur', 'Raipur', 'Chhattisgarh', 'Central', 21.2514, 81.6296],

    ['kolkata', 'Kolkata', 'West Bengal', 'East', 22.5726, 88.3639],
    ['bhubaneswar', 'Bhubaneswar', 'Odisha', 'East', 20.2961, 85.8245],
    ['gaya', 'Gaya', 'Bihar', 'East', 24.7914, 85.0002],
    ['patna', 'Patna', 'Bihar', 'East', 25.5941, 85.1376],
    ['port-blair', 'Port Blair', 'Andaman & Nicobar', 'East', 11.6234, 92.7265],
    ['puri', 'Puri', 'Odisha', 'East', 19.8135, 85.8312],
    ['ranchi', 'Ranchi', 'Jharkhand', 'East', 23.3441, 85.3096],

    ['agartala', 'Agartala', 'Tripura', 'Northeast', 23.8315, 91.2868],
    ['gangtok', 'Gangtok', 'Sikkim', 'Northeast', 27.3389, 88.6065],
    ['guwahati', 'Guwahati', 'Assam', 'Northeast', 26.1445, 91.7362],
    ['imphal', 'Imphal', 'Manipur', 'Northeast', 24.8170, 93.9368],
    ['shillong', 'Shillong', 'Meghalaya', 'Northeast', 25.5788, 91.8933],

    ['bengaluru', 'Bengaluru', 'Karnataka', 'South', 12.9716, 77.5946],
    ['chennai', 'Chennai', 'Tamil Nadu', 'South', 13.0827, 80.2707],
    ['hyderabad', 'Hyderabad', 'Telangana', 'South', 17.3850, 78.4867],
    ['coimbatore', 'Coimbatore', 'Tamil Nadu', 'South', 11.0168, 76.9558],
    ['guruvayur', 'Guruvayur', 'Kerala', 'South', 10.5945, 76.0369],
    ['hubballi', 'Hubballi', 'Karnataka', 'South', 15.3647, 75.1240],
    ['kanchipuram', 'Kanchipuram', 'Tamil Nadu', 'South', 12.8342, 79.7036],
    ['kanyakumari', 'Kanyakumari', 'Tamil Nadu', 'South', 8.0883, 77.5385],
    ['kochi', 'Kochi', 'Kerala', 'South', 9.9312, 76.2673],
    ['kozhikode', 'Kozhikode', 'Kerala', 'South', 11.2588, 75.7804],
    ['madurai', 'Madurai', 'Tamil Nadu', 'South', 9.9252, 78.1198],
    ['mangaluru', 'Mangaluru', 'Karnataka', 'South', 12.9141, 74.8560],
    ['mysuru', 'Mysuru', 'Karnataka', 'South', 12.2958, 76.6394],
    ['rameswaram', 'Rameswaram', 'Tamil Nadu', 'South', 9.2876, 79.3129],
    ['thanjavur', 'Thanjavur', 'Tamil Nadu', 'South', 10.7870, 79.1378],
    ['thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', 'South', 8.5241, 76.9366],
    ['thrissur', 'Thrissur', 'Kerala', 'South', 10.5276, 76.2144],
    ['tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', 'South', 10.7905, 78.7047],
    ['tirupati', 'Tirupati', 'Andhra Pradesh', 'South', 13.6288, 79.4192],
    ['udupi', 'Udupi', 'Karnataka', 'South', 13.3409, 74.7421],
    ['vijayawada', 'Vijayawada', 'Andhra Pradesh', 'South', 16.5062, 80.6480],
    ['visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', 'South', 17.6868, 83.2185],
    ['warangal', 'Warangal', 'Telangana', 'South', 17.9689, 79.5941],

    ['kathmandu', 'Kathmandu', 'Nepal', 'SouthAsia', 27.7172, 85.3240, 'Asia/Kathmandu'],
    ['colombo', 'Colombo', 'Sri Lanka', 'SouthAsia', 6.9271, 79.8612, 'Asia/Colombo'],
    ['dhaka', 'Dhaka', 'Bangladesh', 'SouthAsia', 23.8103, 90.4125, 'Asia/Dhaka'],

    ['singapore', 'Singapore', 'Singapore', 'AsiaPacific', 1.3521, 103.8198, 'Asia/Singapore'],
    ['kuala-lumpur', 'Kuala Lumpur', 'Malaysia', 'AsiaPacific', 3.1390, 101.6869, 'Asia/Kuala_Lumpur'],
    ['bangkok', 'Bangkok', 'Thailand', 'AsiaPacific', 13.7563, 100.5018, 'Asia/Bangkok'],
    ['bali', 'Denpasar (Bali)', 'Indonesia', 'AsiaPacific', -8.6705, 115.2126, 'Asia/Makassar'],
    ['hong-kong', 'Hong Kong', 'Hong Kong', 'AsiaPacific', 22.3193, 114.1694, 'Asia/Hong_Kong'],
    ['sydney', 'Sydney', 'Australia', 'AsiaPacific', -33.8688, 151.2093, 'Australia/Sydney'],
    ['melbourne', 'Melbourne', 'Australia', 'AsiaPacific', -37.8136, 144.9631, 'Australia/Melbourne'],
    ['perth', 'Perth', 'Australia', 'AsiaPacific', -31.9505, 115.8605, 'Australia/Perth'],
    ['auckland', 'Auckland', 'New Zealand', 'AsiaPacific', -36.8485, 174.7633, 'Pacific/Auckland'],
    ['suva', 'Suva', 'Fiji', 'AsiaPacific', -18.1416, 178.4419, 'Pacific/Fiji'],

    ['dubai', 'Dubai', 'UAE', 'MiddleEastAfrica', 25.2048, 55.2708, 'Asia/Dubai'],
    ['muscat', 'Muscat', 'Oman', 'MiddleEastAfrica', 23.5880, 58.3829, 'Asia/Muscat'],
    ['doha', 'Doha', 'Qatar', 'MiddleEastAfrica', 25.2854, 51.5310, 'Asia/Qatar'],
    ['kuwait-city', 'Kuwait City', 'Kuwait', 'MiddleEastAfrica', 29.3759, 47.9774, 'Asia/Kuwait'],
    ['nairobi', 'Nairobi', 'Kenya', 'MiddleEastAfrica', -1.2921, 36.8219, 'Africa/Nairobi'],
    ['durban', 'Durban', 'South Africa', 'MiddleEastAfrica', -29.8587, 31.0218, 'Africa/Johannesburg'],
    ['port-louis', 'Port Louis', 'Mauritius', 'MiddleEastAfrica', -20.1609, 57.5012, 'Indian/Mauritius'],

    ['london', 'London', 'United Kingdom', 'Europe', 51.5074, -0.1278, 'Europe/London'],
    ['leicester', 'Leicester', 'United Kingdom', 'Europe', 52.6369, -1.1398, 'Europe/London'],
    ['amsterdam', 'Amsterdam', 'Netherlands', 'Europe', 52.3676, 4.9041, 'Europe/Amsterdam'],
    ['frankfurt', 'Frankfurt', 'Germany', 'Europe', 50.1109, 8.6821, 'Europe/Berlin'],
    ['paris', 'Paris', 'France', 'Europe', 48.8566, 2.3522, 'Europe/Paris'],

    ['new-york', 'New York', 'USA', 'Americas', 40.7128, -74.0060, 'America/New_York'],
    ['washington-dc', 'Washington, D.C.', 'USA', 'Americas', 38.9072, -77.0369, 'America/New_York'],
    ['atlanta', 'Atlanta', 'USA', 'Americas', 33.7490, -84.3880, 'America/New_York'],
    ['chicago', 'Chicago', 'USA', 'Americas', 41.8781, -87.6298, 'America/Chicago'],
    ['houston', 'Houston', 'USA', 'Americas', 29.7604, -95.3698, 'America/Chicago'],
    ['dallas', 'Dallas', 'USA', 'Americas', 32.7767, -96.7970, 'America/Chicago'],
    ['san-francisco', 'San Francisco', 'USA', 'Americas', 37.7749, -122.4194, 'America/Los_Angeles'],
    ['los-angeles', 'Los Angeles', 'USA', 'Americas', 34.0522, -118.2437, 'America/Los_Angeles'],
    ['seattle', 'Seattle', 'USA', 'Americas', 47.6062, -122.3321, 'America/Los_Angeles'],
    ['toronto', 'Toronto', 'Canada', 'Americas', 43.6532, -79.3832, 'America/Toronto'],
    ['vancouver', 'Vancouver', 'Canada', 'Americas', 49.2827, -123.1207, 'America/Vancouver'],
    ['port-of-spain', 'Port of Spain', 'Trinidad & Tobago', 'Americas', 10.6549, -61.5019, 'America/Port_of_Spain'],
    ['georgetown', 'Georgetown', 'Guyana', 'Americas', 6.8013, -58.1551, 'America/Guyana'],
    ['paramaribo', 'Paramaribo', 'Suriname', 'Americas', 5.8520, -55.2038, 'America/Paramaribo']
];

export const LOCATIONS = Object.fromEntries(CITIES.map(([id, name, state, region, lat, lng, timezone = 'Asia/Kolkata']) =>
    [id, { id, name, state, region, lat, lng, timezone }]));

export const DEFAULT_LOCATION = LOCATIONS.bengaluru;

/** The device's IANA time zone, e.g. "Asia/Kolkata". */
export function deviceTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Whether two IANA names are the same zone; aliases such as Asia/Kolkata and Asia/Calcutta match. */
export function sameTimeZone(a, b) {
    const canonical = tz => new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone;
    return canonical(a) === canonical(b);
}

/** A location for the device's own coordinates, on the device's time zone. */
export function deviceLocation(lat, lng) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    return {
        id: 'current',
        name: 'Current location',
        state: `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lng).toFixed(2)}°${ew}`,
        lat,
        lng,
        timezone: deviceTimeZone()
    };
}

// ============================================================
//  TIME ZONES: a location's wall clock
// ============================================================
const zonedFormatters = new Map();

function zonedFormatter(timeZone) {
    let formatter = zonedFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone, hourCycle: 'h23',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric'
        });
        zonedFormatters.set(timeZone, formatter);
    }
    return formatter;
}

// Offsets can only change on 15-minute boundaries (every zone's offset and transition time is
// a multiple of 15 minutes), so one Intl lookup per zone per quarter hour is exact.
const QUARTER_HOUR_MS = 15 * 60 * 1000;
const offsetCache = new Map();

function utcOffsetAt(date, timeZone) {
    const slot = Math.floor(date.getTime() / QUARTER_HOUR_MS);
    const key = `${timeZone}|${slot}`;
    let offset = offsetCache.get(key);
    if (offset === undefined) {
        const instant = new Date(slot * QUARTER_HOUR_MS);
        const p = {};
        for (const { type, value } of zonedFormatter(timeZone).formatToParts(instant)) p[type] = value;
        const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
        offset = Math.round((wallAsUtc - instant.getTime()) / 60000) / 60;
        if (offsetCache.size > 20000) offsetCache.clear();
        offsetCache.set(key, offset);
    }
    return offset;
}

/**
 * Calendar date, clock time, weekday (0 = Sunday) and `utcOffset` — hours the zone is ahead
 * of UTC (5.5 for India, -4 for New York in summer) — of an instant in a time zone.
 */
export function zonedInfo(date, timeZone) {
    const utcOffset = utcOffsetAt(date, timeZone);
    const wall = new Date(date.getTime() + utcOffset * 3600000);
    return {
        year: wall.getUTCFullYear(), month: wall.getUTCMonth() + 1, day: wall.getUTCDate(),
        hour: wall.getUTCHours(), minute: wall.getUTCMinutes(), second: wall.getUTCSeconds(),
        weekday: wall.getUTCDay(), utcOffset
    };
}

export const zonedParts = zonedInfo;

export function utcOffsetHours(date, timeZone) {
    return zonedInfo(date, timeZone).utcOffset;
}

/** The instant at which a time zone's clock reads the given date and decimal hour. */
export function zonedDateTime(year, month, day, hours, timeZone) {
    const wall = Date.UTC(year, month - 1, day) + hours * 3600000;
    let t = wall - utcOffsetHours(new Date(wall), timeZone) * 3600000;
    t = wall - utcOffsetHours(new Date(t), timeZone) * 3600000; // settle across a DST change
    return new Date(t);
}

/** The calendar date in a time zone, shifted by whole days: { year, month, day }. */
export function zonedDate(date, timeZone, dayOffset = 0) {
    const p = zonedParts(date, timeZone);
    const d = new Date(Date.UTC(p.year, p.month - 1, p.day + dayOffset));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Short time zone name for display, e.g. "GMT+5:30", "EST", "GMT+11". */
export function timeZoneLabel(timeZone, date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(date);
    return parts.find(p => p.type === 'timeZoneName')?.value || timeZone;
}

/**
 * Get current app date (now)
 */
export function getAppDate() {
    return new Date();
}

/**
 * Format date for display, as the calendar reads in the given time zone
 */
export function formatGregorianDate(date, timeZone = deviceTimeZone()) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const p = zonedParts(date, timeZone);
    return `${days[p.weekday]}, ${months[p.month - 1]} ${p.day}, ${p.year}`;
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
