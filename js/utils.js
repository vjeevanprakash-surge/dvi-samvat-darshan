/**
 * Dvi-Samvat Darshan — Utility Functions
 * Date helpers, location utils, formatting
 */

const IST = { country: 'India', timezone: 'Asia/Kolkata', utcOffset: 5.5 };

// Order in which the location picker groups cities.
export const REGIONS = ['North', 'West', 'Central', 'East', 'Northeast', 'South'];

// [id, name, state, region, latitude, longitude]. Ids are saved in users' browsers: never rename one.
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
    ['warangal', 'Warangal', 'Telangana', 'South', 17.9689, 79.5941]
];

export const LOCATIONS = Object.fromEntries(CITIES.map(([id, name, state, region, lat, lng]) =>
    [id, { id, name, state, region, lat, lng, ...IST }]));

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
