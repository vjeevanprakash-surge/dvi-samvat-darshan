/**
 * Dvi-Samvat Darshan — Festival Database & Matcher
 * Hindu festivals with tithi-based matching, significances, and visual themes.
 */

import { computePanchang, tithiIndexAt, isBhadraAt } from './panchang.js';
import { formatGregorianDate, DEFAULT_LOCATION } from './utils.js';

const FESTIVALS = [
    {
        name: 'Ugadi / Gudi Padwa',
        nameKn: 'ಯುಗಾದಿ',
        nameHi: 'गुड़ी पाड़वा',
        lunarMonth: 'Chaitra',
        paksha: 'Shukla',
        tithi: 'Pratipada',
        significance: 'Hindu New Year celebration marking the beginning of the Chaitra month. Celebrated as Ugadi in Karnataka/Andhra and Gudi Padwa in Maharashtra.',
        rituals: ['Prepare Ugadi Pachadi (six-taste dish)', 'Oil bath at sunrise', 'Decorate doorway with mango leaves', 'Listen to Panchanga Shravana', 'Raise Gudi flag (Maharashtra)'],
        regionalVariations: { 'Karnataka': 'Ugadi', 'Maharashtra': 'Gudi Padwa', 'Andhra Pradesh': 'Ugadi', 'Sindhi': 'Cheti Chand' },
        visualTheme: 'floral',
        importance: 'major',
        icon: '🌿'
    },
    {
        name: 'Rama Navami',
        nameKn: 'ಶ್ರೀ ರಾಮ ನವಮಿ',
        nameHi: 'राम नवमी',
        lunarMonth: 'Chaitra',
        paksha: 'Shukla',
        tithi: 'Navami',
        observance: 'madhyahna',
        significance: 'Birthday of Lord Rama, the seventh avatar of Vishnu. Celebrates dharma, righteousness, and ideal kingship.',
        rituals: ['Fast from sunrise to sunset', 'Recite Ramayana', 'Worship Rama idol at noon (birth time)', 'Distribute Panakam and Kosambari'],
        regionalVariations: { 'South India': 'Kalyanotsavam (celestial marriage)', 'North India': 'Rath Yatra processions' },
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🏹'
    },
    {
        name: 'Hanuman Jayanti',
        nameKn: 'ಹನುಮಾನ್ ಜಯಂತಿ',
        nameHi: 'हनुमान जयंती',
        lunarMonth: 'Chaitra',
        paksha: 'Shukla',
        tithi: 'Purnima',
        significance: 'Birthday of Lord Hanuman, the epitome of devotion, strength, and selfless service.',
        rituals: ['Recite Hanuman Chalisa', 'Offer sindoor and oil', 'Visit Hanuman temple', 'Distribute prasad'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🐒'
    },
    {
        name: 'Akshaya Tritiya',
        nameKn: 'ಅಕ್ಷಯ ತೃತೀಯ',
        nameHi: 'अक्षय तृतीया',
        lunarMonth: 'Vaishakha',
        paksha: 'Shukla',
        tithi: 'Tritiya',
        significance: 'One of the most auspicious days. The merit of any good deed is multiplied infinitely. Ideal for new beginnings and investments.',
        rituals: ['Purchase gold', 'Begin new ventures', 'Donate to charity', 'Perform Lakshmi-Narayana puja'],
        regionalVariations: {},
        visualTheme: 'golden',
        importance: 'major',
        icon: '✨'
    },
    {
        name: 'Narasimha Jayanti',
        nameKn: 'ನರಸಿಂಹ ಜಯಂತಿ',
        nameHi: 'नरसिंह जयंती',
        lunarMonth: 'Vaishakha',
        paksha: 'Shukla',
        tithi: 'Chaturdashi',
        observance: 'pradosh',
        significance: 'Appearance day of Lord Narasimha, the half-man half-lion avatar of Vishnu.',
        rituals: ['Fast until sunset', 'Abhishekam to Narasimha idol', 'Chant Narasimha Kavacham', 'Distribute panakam'],
        regionalVariations: {},
        visualTheme: 'fire',
        importance: 'major',
        icon: '🦁'
    },
    {
        name: 'Buddha Purnima',
        nameKn: 'ಬುದ್ಧ ಪೂರ್ಣಿಮಾ',
        nameHi: 'बुद्ध पूर्णिमा',
        lunarMonth: 'Vaishakha',
        paksha: 'Shukla',
        tithi: 'Purnima',
        significance: 'Birth, enlightenment, and parinirvana of Gautama Buddha.',
        rituals: ['Visit Buddhist temples', 'Meditate', 'Practice non-violence', 'Feed the poor'],
        regionalVariations: {},
        visualTheme: 'floral',
        importance: 'major',
        icon: '🪷'
    },
    {
        name: 'Ganga Saptami',
        nameKn: 'ಗಂಗಾ ಸಪ್ತಮಿ',
        nameHi: 'गंगा सप्तमी',
        lunarMonth: 'Vaishakha',
        paksha: 'Shukla',
        tithi: 'Saptami',
        significance: 'Day when Goddess Ganga was reborn after being swallowed by Sage Jahnu. Very auspicious for holy dips.',
        rituals: ['Holy dip in Ganga', 'Deepa-daan (offer lamps to river)', 'Perform Ganga Puja', 'Charity'],
        regionalVariations: { 'Varanasi': 'Ganga Pushkaralu' },
        visualTheme: 'divine-glow',
        importance: 'minor',
        icon: '🌊'
    },
    {
        name: 'Guru Purnima',
        nameKn: 'ಗುರು ಪೂರ್ಣಿಮಾ',
        nameHi: 'गुरु पूर्णिमा',
        lunarMonth: 'Ashadha',
        paksha: 'Shukla',
        tithi: 'Purnima',
        significance: 'Day to honor spiritual and academic teachers. Marks the birthday of Ved Vyasa who composed the Mahabharata.',
        rituals: ['Worship your Guru', 'Offer flowers and dakshina', 'Recite Guru Stotram', 'Meditation and satsang'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🙏'
    },
    {
        name: 'Nag Panchami',
        nameKn: 'ನಾಗ ಪಂಚಮಿ',
        nameHi: 'नाग पंचमी',
        lunarMonth: 'Shravana',
        paksha: 'Shukla',
        tithi: 'Panchami',
        significance: 'Worship of serpent deities (Nagas) for protection and blessings.',
        rituals: ['Offer milk to snake idols', 'Draw snake rangoli', 'Visit Nag temples', 'Avoid plowing fields'],
        regionalVariations: {},
        visualTheme: 'floral',
        importance: 'major',
        icon: '🐍'
    },
    {
        name: 'Varamahalakshmi Vrata',
        nameKn: 'ವರಮಹಾಲಕ್ಷ್ಮಿ ವ್ರತ',
        nameHi: 'वरमहालक्ष्मी व्रत',
        lunarMonth: 'Shravana',
        paksha: 'Shukla',
        tithi: 'Shukla-Friday', // Special handling needed usually, but approximate to Purnima week
        significance: 'Worship of Goddess Lakshmi for prosperity and well-being. Especially important in Karnataka and Andhra Pradesh.',
        rituals: ['Decorate Lakshmi Kalasha', 'Tie 9 threads', 'Offer lotus and fruits', 'Listen to Varalakshmi Katha'],
        regionalVariations: { 'Karnataka': 'Major women\'s festival' },
        visualTheme: 'golden',
        importance: 'major',
        icon: '🍯'
    },
    {
        name: 'Raksha Bandhan',
        nameKn: 'ರಕ್ಷಾ ಬಂಧನ',
        nameHi: 'रक्षा बंधन',
        lunarMonth: 'Shravana',
        paksha: 'Shukla',
        tithi: 'Purnima',
        observance: 'aparahna',
        avoidBhadra: true,
        significance: 'Festival celebrating the bond between brothers and sisters. A sacred thread is tied as a symbol of protection.',
        rituals: ['Sister ties rakhi on brother\'s wrist', 'Exchange sweets and gifts', 'Brother vows protection'],
        regionalVariations: { 'South India': 'Avani Avittam for Brahmins' },
        visualTheme: 'floral',
        importance: 'major',
        icon: '🧶'
    },
    {
        name: 'Krishna Janmashtami',
        nameKn: 'ಶ್ರೀ ಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ',
        nameHi: 'कृष्ण जन्माष्टमी',
        lunarMonth: 'Bhadrapada', // purnimanta; Shravana in the amanta reckoning
        paksha: 'Krishna',
        tithi: 'Ashtami',
        observance: 'nishita',
        significance: 'Birthday of Lord Krishna, the eighth avatar of Vishnu. Celebrated with midnight festivities marking the birth hour.',
        rituals: ['Fast until midnight', 'Midnight aarti and abhishekam', 'Dahi Handi (pot breaking)', 'Swing the baby Krishna idol'],
        regionalVariations: { 'Maharashtra': 'Dahi Handi', 'Mathura/Vrindavan': 'Grand Ras Lila' },
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🦚'
    },
    {
        name: 'Ganesh Chaturthi',
        nameKn: 'ಗಣೇಶ ಚತುರ್ಥಿ',
        nameHi: 'गणेश चतुर्थी',
        lunarMonth: 'Bhadrapada',
        paksha: 'Shukla',
        tithi: 'Chaturthi',
        observance: 'madhyahna',
        significance: 'Birthday of Lord Ganesha, the remover of obstacles. 10-day festival culminating in visarjan (immersion).',
        rituals: ['Install Ganesh idol', 'Offer modaks and durva grass', 'Chant Ganapati Atharvashirsha', 'Visarjan on Anant Chaturdashi'],
        regionalVariations: { 'Maharashtra': '10-day public festival', 'Karnataka': 'Gowri/Ganesh combined' },
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🐘'
    },
    {
        name: 'Anant Chaturdashi',
        nameKn: 'ಅನಂತ ಚತುರ್ದಶಿ',
        nameHi: 'अनंत चतुर्दशी',
        lunarMonth: 'Bhadrapada',
        paksha: 'Shukla',
        tithi: 'Chaturdashi',
        significance: 'Concluding day of Ganesha festival and worship of Lord Vishnu in his infinite (Ananta) form.',
        rituals: ['Ganesh Visarjan', 'Tie Anant thread with 14 knots', 'Listen to Anant Katha', 'Worship Anant Padmanabha'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '♾️'
    },
    {
        name: 'Navaratri / Durga Puja',
        nameKn: 'ನವರಾತ್ರಿ',
        nameHi: 'नवरात्रि',
        lunarMonth: 'Ashwin',
        paksha: 'Shukla',
        tithi: 'Pratipada',
        significance: 'Nine nights dedicated to Goddess Durga. Celebrates the victory of good over evil. Each day honors a different form of the Goddess.',
        rituals: ['Set up Golu/Bommai Kolu', 'Worship nine forms of Durga', 'Garba and Dandiya nights', 'Saraswati Puja on 9th day'],
        regionalVariations: { 'Karnataka': 'Dasara with Mysuru procession', 'Gujarat': 'Garba', 'Bengal': 'Durga Pujo' },
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🔱'
    },
    {
        name: 'Dussehra / Vijayadashami',
        nameKn: 'ವಿಜಯದಶಮಿ',
        nameHi: 'दशहरा',
        lunarMonth: 'Ashwin',
        paksha: 'Shukla',
        tithi: 'Dashami',
        observance: 'aparahna',
        significance: 'Victory of Rama over Ravana and Durga over Mahishasura. Day of triumph, new beginnings, and learning.',
        rituals: ['Burn Ravana effigies', 'Worship weapons and tools', 'Begin new studies (Vidyarambham)', 'Mysuru Dasara procession'],
        regionalVariations: { 'Mysuru': 'Grand Dasara with Jamboo Savari', 'North India': 'Ravana Dahan' },
        visualTheme: 'fire',
        importance: 'major',
        icon: '🏹'
    },
    {
        name: 'Karva Chauth',
        nameKn: 'ಕರ್ವಾ ಚೌತ್',
        nameHi: 'करवा चौथ',
        lunarMonth: 'Kartik',
        paksha: 'Krishna',
        tithi: 'Chaturthi',
        observance: 'pradosh',
        significance: 'Fasting day observed by married women for the longevity and safety of their husbands.',
        rituals: ['Waterless fast from sunrise', 'View moon through sieve', 'Receive first sip of water from husband', 'Apply mehndi'],
        regionalVariations: { 'North India': 'Extremely popular' },
        visualTheme: 'golden',
        importance: 'major',
        icon: '🌙'
    },
    {
        name: 'Deepavali / Diwali',
        nameKn: 'ದೀಪಾವಳಿ',
        nameHi: 'दीपावली',
        lunarMonth: 'Kartik',
        paksha: 'Krishna',
        tithi: 'Amavasya',
        observance: 'pradosh',
        significance: 'Festival of Lights. Celebrates the return of Rama to Ayodhya, victory of light over darkness, knowledge over ignorance.',
        rituals: ['Light oil lamps and diyas', 'Lakshmi Puja at dusk', 'Burst firecrackers', 'Exchange sweets and gifts', 'Rangoli at entrance'],
        regionalVariations: { 'Karnataka': 'Naraka Chaturdashi focus', 'North India': 'Lakshmi Puja on Amavasya' },
        visualTheme: 'diya',
        importance: 'major',
        icon: '🪔'
    },
    {
        name: 'Bhai Dooj',
        nameKn: 'ಭಾಯಿ ದೂಜ್',
        nameHi: 'भाई दूज',
        lunarMonth: 'Kartik',
        paksha: 'Shukla',
        tithi: 'Dwitiya',
        observance: 'aparahna',
        significance: 'Celebrating the love and bond between brothers and sisters, similar to Raksha Bandhan.',
        rituals: ['Sister applies tilak to brother', 'Brother gives gifts', 'Feast together', 'Sister prays for brother\'s long life'],
        regionalVariations: { 'Bengal': 'Bhai Phota', 'Maharashtra': 'Bhau Beej' },
        visualTheme: 'golden',
        importance: 'major',
        icon: '👫'
    },
    {
        name: 'Tulsi Vivah',
        nameKn: 'ತುಳಸಿ ವಿವಾಹ',
        nameHi: 'तुलसी विवाह',
        lunarMonth: 'Kartik',
        paksha: 'Shukla',
        tithi: 'Dwadashi',
        significance: 'Ceremonial marriage of the Tulsi plant (holy basil) to Lord Vishnu.',
        rituals: ['Decorate Tulsi plant', 'Perform marriage rituals', 'End of monsoon wedding season', 'Light lamps around Tulsi'],
        regionalVariations: {},
        visualTheme: 'floral',
        importance: 'major',
        icon: '🌿'
    },
    {
        name: 'Kartik Purnima',
        nameKn: 'ಕಾರ್ತಿಕ ಪೂರ್ಣಿಮಾ',
        nameHi: 'कार्तिक पूर्णिमा',
        lunarMonth: 'Kartik',
        paksha: 'Shukla',
        tithi: 'Purnima',
        significance: 'Dev Deepavali — the Diwali of the Gods. One of the most auspicious full moon nights.',
        rituals: ['Holy dip in rivers', 'Light lamps on river banks', 'Tripurari Purnima celebration', 'Visit Shiva temples'],
        regionalVariations: { 'Varanasi': 'Grand Dev Deepavali' },
        visualTheme: 'light',
        importance: 'major',
        icon: '🌕'
    },
    {
        name: 'Subramanya Sasthi',
        nameKn: 'ಸುಬ್ರಹ್ಮಣ್ಯ ಷಷ್ಠಿ',
        nameHi: 'सुब्रमण्य षष्ठी',
        lunarMonth: 'Margashirsha',
        paksha: 'Shukla',
        tithi: 'Shashthi',
        significance: 'Dedicated to Lord Subramanya (Kartikeya), the commander-in-chief of the celestial army.',
        rituals: ['Visit Subramanya temples', 'Perform Milk Abhishekam', 'Fast and Kavadi Attam', 'Recite Skanda Sasthi Kavasam'],
        regionalVariations: { 'Karnataka': 'Kukke Subramanya special', 'Tamil Nadu': 'Skanda Sasthi' },
        visualTheme: 'fire',
        importance: 'major',
        icon: '🐍'
    },
    {
        name: 'Makar Sankranti',
        nameKn: 'ಮಕರ ಸಂಕ್ರಾಂತಿ',
        nameHi: 'मकर संक्रांति',
        lunarMonth: null, // Solar festival
        gregorianMonth: 1,
        gregorianDay: 14,
        significance: 'Sun\'s transit into Capricorn (Makara). Marks the end of winter solstice and beginning of longer days. Harvest festival.',
        rituals: ['Fly kites', 'Prepare Ellu Bella (sesame-jaggery mix)', 'Exchange sugarcane', 'Holy dip in rivers'],
        regionalVariations: { 'Karnataka': 'Suggi (harvest)', 'Tamil Nadu': 'Pongal', 'Assam': 'Magh Bihu' },
        visualTheme: 'harvest',
        importance: 'major',
        icon: '☀️'
    },
    {
        name: 'Vasant Panchami',
        nameKn: 'ವಸಂತ ಪಂಚಮಿ',
        nameHi: 'बसंत पंचमी',
        lunarMonth: 'Magha',
        paksha: 'Shukla',
        tithi: 'Panchami',
        significance: 'Arrival of Spring and worship of Goddess Saraswati, the deity of knowledge and arts.',
        rituals: ['Wear yellow clothes', 'Worship books and musical instruments', 'Offer yellow sweets', 'Fly yellow kites'],
        regionalVariations: { 'Bengal': 'Major Saraswati Puja' },
        visualTheme: 'golden',
        importance: 'major',
        icon: '🎻'
    },
    {
        name: 'Maha Shivaratri',
        nameKn: 'ಮಹಾ ಶಿವರಾತ್ರಿ',
        nameHi: 'महा शिवरात्रि',
        lunarMonth: 'Phalguna', // purnimanta; Magha in the amanta reckoning
        paksha: 'Krishna',
        tithi: 'Chaturdashi',
        observance: 'nishita',
        significance: 'The great night of Lord Shiva. Night-long worship, fasting, and meditation on the formless divine.',
        rituals: ['All-night vigil (Jagaran)', 'Abhishekam with milk, honey, bel leaves', 'Chant Om Namah Shivaya', 'Fast the entire day'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🕉️'
    },
    {
        name: 'Holi',
        nameKn: 'ಹೋಳಿ',
        nameHi: 'होली',
        lunarMonth: 'Phalguna',
        paksha: 'Shukla',
        tithi: 'Purnima',
        significance: 'Festival of Colors. Celebrates the divine love of Radha-Krishna and the triumph of devotee Prahlada over evil.',
        rituals: ['Holika bonfire on eve', 'Play with colors and water', 'Drink thandai/bhang', 'Forgive old grudges'],
        regionalVariations: { 'Mathura': 'Lathmar Holi', 'Karnataka': 'Kamadahana focus' },
        visualTheme: 'holi-colors',
        importance: 'major',
        icon: '🎨'
    },
    // VRATS & SPECIAL DAYS
    {
        name: 'Ekadashi Vrat',
        nameKn: 'ಏಕಾದಶಿ',
        nameHi: 'एकादशी व्रत',
        lunarMonth: '*',
        paksha: '*',
        tithi: 'Ekadashi',
        significance: 'Sacred fasting day for Lord Vishnu. Occurs twice monthly.',
        rituals: ['Fast from grains', 'Vishnu Sahasranama'],
        visualTheme: 'divine-glow',
        importance: 'major',
        icon: '🕊️'
    },
    {
        name: 'Amavasya',
        nameKn: 'ಅಮಾವಾಸ್ಯೆ',
        nameHi: 'अमावस्या',
        lunarMonth: '*',
        paksha: 'Krishna',
        tithi: 'Amavasya',
        significance: 'New Moon day. Auspicious for honoring ancestors (Pitris).',
        rituals: ['Tarpanam rituals', 'Charity', 'Deepa Daan'],
        visualTheme: 'fire',
        importance: 'major',
        icon: '🌑'
    },
    {
        name: 'Pradosham',
        nameKn: 'ಪ್ರದೋಷ',
        nameHi: 'प्रदोष व्रत',
        lunarMonth: '*',
        paksha: '*',
        tithi: 'Trayodashi',
        observance: 'pradosh',
        significance: 'Dusk time period dedicated to Lord Shiva. Very auspicious for removing karma.',
        rituals: ['Shiva Abhishekam at sunset', 'Observe fast', 'Visit Shiva temple'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'minor',
        icon: '🔱'
    },
    {
        name: 'Sankashti Chaturthi',
        nameKn: 'ಸಂಕಷ್ಟಿ ಚತುರ್ಥಿ',
        nameHi: 'संकष्टी चतुर्थी',
        lunarMonth: '*',
        paksha: 'Krishna',
        tithi: 'Chaturthi',
        significance: 'Day to worship Lord Ganesha to remove obstacles and difficulties.',
        rituals: ['Fast from sunrise to moonrise', 'View the moon', 'Perform Ganesh Puja', 'Offer Modaks'],
        regionalVariations: {},
        visualTheme: 'divine-glow',
        importance: 'minor',
        icon: '🐘'
    }
];

/**
 * Find festivals matching a given panchang state
 */
export function findFestivals(panchang) {
    const matches = [];

    for (const fest of FESTIVALS) {
        // Solar festivals
        if (fest.gregorianMonth && fest.gregorianDay) {
            if (panchang.gregorian.month === fest.gregorianMonth &&
                panchang.gregorian.day === fest.gregorianDay) {
                matches.push(fest);
            }
            continue;
        }

        // Month-specific festivals are not held in an adhika (leap) month.
        if (panchang.isAdhikaMasa && fest.lunarMonth !== '*') continue;

        // Wildcard Tithis (Vrats)
        if (fest.lunarMonth === '*' || fest.lunarMonth === panchang.lunarMonth) {
            if (fest.paksha === '*' || fest.paksha === panchang.tithi.paksha) {
                if (fest.tithi === panchang.tithi.name) {
                    matches.push(fest);
                    continue;
                }
            }
        }

        // Special handling for Varamahalakshmi (simplified to Friday check if logic added, 
        // but for now keeping it as approximate)
        if (fest.name === 'Varamahalakshmi Vrata') {
            if (panchang.lunarMonth === 'Shravana' && panchang.tithi.paksha === 'Shukla' && 
                (panchang.tithi.name === 'Purnima' || panchang.tithi.index >= 10 && panchang.vaara === 'Shukravara')) {
                 matches.push(fest);
                 continue;
            }
        }

        // Standard Lunar festivals
        if (fest.lunarMonth === panchang.lunarMonth &&
            fest.paksha === panchang.tithi.paksha &&
            fest.tithi === panchang.tithi.name) {
            matches.push(fest);
        }
    }

    return matches;
}

// ============================================================
//  OBSERVANCE TIME (kaala-vyapti)
// ============================================================
// A festival falls on the civil day whose observance window its tithi occupies.
// Windows are in hours after local midnight, built from that day's sunrise and sunset:
// madhyahna / aparahna are the 3rd / 4th fifths of daylight, pradosh the three muhurtas
// after sunset, nishita the muhurta around the middle of the night.
const OBSERVANCE_WINDOWS = {
    sunrise:   (rise, set) => [rise, rise],
    madhyahna: (rise, set) => [rise + (set - rise) * 0.4, rise + (set - rise) * 0.6],
    aparahna:  (rise, set) => [rise + (set - rise) * 0.6, rise + (set - rise) * 0.8],
    pradosh:   (rise, set) => [set, set + 2.4],
    nishita:   (rise, set) => {
        const mid = (set + rise + 24) / 2;
        return [mid - 0.4, mid + 0.4];
    }
};

const observanceOf = fest => fest.observance || 'sunrise';

function hoursAfter(midnight, hours) {
    return new Date(midnight.getTime() + hours * 3600000);
}

/** Sunrise, sunset and the panchang at the midpoint of each observance window for one civil day. */
function observeDay(midnight, location) {
    const { sunriseDecimal: rise, sunsetDecimal: set } = computePanchang(hoursAfter(midnight, 6), location).sun;
    const windows = {};
    for (const [kaal, windowOf] of Object.entries(OBSERVANCE_WINDOWS)) {
        const [start, end] = windowOf(rise, set);
        windows[kaal] = { start, end, panchang: computePanchang(hoursAfter(midnight, (start + end) / 2)) };
    }
    return { midnight, windows, location };
}

/** Fraction of an observance window during which `tithi` prevails. */
function windowCoverage(midnight, window, tithi) {
    const SAMPLES = 9;
    let hits = 0;
    for (let s = 0; s < SAMPLES; s++) {
        const hours = window.start + (window.end - window.start) * s / (SAMPLES - 1);
        if (tithiIndexAt(hoursAfter(midnight, hours)) === tithi) hits++;
    }
    return hits / SAMPLES;
}

function nextMidnight(midnight) {
    const d = new Date(midnight);
    d.setDate(midnight.getDate() + 1);
    return d;
}

/**
 * Days (0 or 1) to postpone a festival that must avoid Bhadra (Vishti karana), such as
 * Raksha Bandhan. Keep the day if part of its observance window is free of Bhadra;
 * otherwise move to the next day if the tithi still prevails three muhurtas (2.4 h) after
 * that day's sunrise; otherwise keep the day — it is observed once Bhadra ends that night.
 */
function bhadraPostponement(midnight, kaal, tithi, location) {
    const { sunriseDecimal: rise, sunsetDecimal: set } = computePanchang(hoursAfter(midnight, 6), location).sun;
    const [start, end] = OBSERVANCE_WINDOWS[kaal](rise, set);
    const SAMPLES = 9;
    for (let s = 0; s < SAMPLES; s++) {
        const t = hoursAfter(midnight, start + (end - start) * s / (SAMPLES - 1));
        if (tithiIndexAt(t) === tithi && !isBhadraAt(t)) return 0;
    }

    const following = nextMidnight(midnight);
    const nextRise = computePanchang(hoursAfter(following, 6), location).sun.sunriseDecimal;
    return tithiIndexAt(hoursAfter(following, nextRise + 2.4)) === tithi ? 1 : 0;
}

/**
 * Festivals assigned by `day` (and possibly `next`, the following civil day), as
 * [dayOffset, festival] pairs with dayOffset 0 or 1.
 * - A tithi present in the window on both days goes to the day it covers more of
 *   (ties to the first), e.g. Bhai Dooj 2026: Dwitiya from ~14:10 Nov 10 → Nov 11.
 * - A tithi that falls entirely between the two window midpoints (kshaya relative to
 *   that window, e.g. Ugadi 2026, whose Pratipada ran 06:53 Mar 19 to before sunrise
 *   Mar 20) goes to whichever day's window it touches, else to the day it begins.
 */
function assignFestivals(day, next) {
    const assigned = [];
    for (const kaal of Object.keys(OBSERVANCE_WINDOWS)) {
        const here = day.windows[kaal];
        const there = next.windows[kaal];
        const tithiHere = here.panchang.tithi.index;

        // Offsets may reach 2 after a Bhadra postponement; days are flushed in order, so that is safe.
        const place = (offset, f, tithi) => {
            if (f.avoidBhadra) {
                offset += bhadraPostponement(offset ? next.midnight : day.midnight, kaal, tithi, day.location);
            }
            assigned.push([offset, f]);
        };

        const deferToNext = there.panchang.tithi.index === tithiHere &&
            windowCoverage(next.midnight, there, tithiHere) > windowCoverage(day.midnight, here, tithiHere);
        if (!deferToNext) {
            for (const f of findFestivals(here.panchang)) {
                if (observanceOf(f) === kaal) place(0, f, tithiHere);
            }
        }

        if ((there.panchang.tithi.index - tithiHere + 30) % 30 !== 2) continue;
        const skipped = (tithiHere + 1) % 30;

        const midHere = (here.start + here.end) / 2;
        let probeHours = null;
        for (let h = 1; h < 24; h++) { // a tithi lasts at least ~19 h
            if (tithiIndexAt(hoursAfter(day.midnight, midHere + h)) === skipped) {
                probeHours = midHere + h;
                break;
            }
        }
        if (probeHours === null) continue;
        const probe = computePanchang(hoursAfter(day.midnight, probeHours));

        const touches = (midnight, hours) => tithiIndexAt(hoursAfter(midnight, hours)) === skipped;
        const offset = kaal === 'sunrise' || touches(day.midnight, here.end) ? 0
            : touches(next.midnight, there.start) ? 1 : 0;
        for (const f of findFestivals(probe)) {
            if (observanceOf(f) === kaal) place(offset, f, skipped);
        }
    }
    return assigned;
}

/**
 * Get upcoming festivals (scans next 120 days dynamically)
 */
export function getUpcomingFestivals(startDate, limit = 5, location = DEFAULT_LOCATION) {
    const upcoming = [];
    const scanLimit = 120; // Look ahead 4 months
    const seenNames = new Set();

    // Add today's festivals to seenNames so we don't repeat them in "Upcoming"
    const todayPanchang = computePanchang(startDate, location);
    const todayFestivals = findFestivals(todayPanchang);
    todayFestivals.forEach(f => seenNames.add(f.name));

    const midnightOf = i => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Processing day i can place festivals on day i or i + 1, so day i is final once processed.
    const byDay = new Map();
    let next = observeDay(midnightOf(0), location);
    for (let i = 0; i <= scanLimit; i++) {
        const day = next;
        next = observeDay(midnightOf(i + 1), location);
        for (const [offset, f] of assignFestivals(day, next)) {
            if (!byDay.has(i + offset)) byDay.set(i + offset, []);
            byDay.get(i + offset).push(f);
        }

        // Day 0 is included: a festival scheduled for today whose tithi hasn't begun yet
        // (e.g. Diwali morning, before Amavasya) is not among the current-tithi matches above.
        for (const f of byDay.get(i) || []) {
            // Only show Major festivals in the "Upcoming" list to avoid clutter
            if (!seenNames.has(f.name) && f.importance === 'major') {
                upcoming.push({
                    ...f,
                    daysAway: i,
                    date: formatGregorianDate(day.midnight)
                });
                seenNames.add(f.name);
            }
        }
        byDay.delete(i);

        if (upcoming.length >= limit) break;
    }

    return upcoming;
}

/**
 * Get all festivals database
 */
export function getAllFestivals() {
    return FESTIVALS;
}
