// The panchang engine is plain ES modules shared with the web PWA in ../js.
// Types inferred from the JavaScript are too loose or too narrow, so the bridge states them here.
import * as panchangJs from '../../js/panchang.js';
import * as festivalsJs from '../../js/festivals.js';
import * as utilsJs from '../../js/utils.js';

const P = panchangJs as any;
const F = festivalsJs as any;
const U = utilsJs as any;

export type Location = {
    id: string;
    name: string;
    state: string;
    region?: string;
    lat: number;
    lng: number;
    timezone: string;
};

export type CivilDate = { year: number; month: number; day: number };

type Span = { start: number; end: number; startStr: string; endStr: string };

export type Panchang = {
    gregorian: CivilDate & { dayOfWeek: number };
    tithi: { index: number; name: string; paksha: string; isShukla: boolean; progress: number; fullName: string };
    nakshatra: { index: number; name: string; [key: string]: unknown };
    yoga: { index: number; name: string; [key: string]: unknown };
    karana: { first: string; second: string; index: number };
    moon: { illumination: number; phaseName: string; elongation: number };
    sun: { sunrise: string; sunset: string; sunriseDecimal: number; sunsetDecimal: number };
    kaals: { rahu: Span; gulika: Span; yama: Span; abhijit: Span; brahma: Span };
    lunarMonth: string;
    isAdhikaMasa: boolean;
    vaara: string;
    samvat: { vikram: { year: number; name: string }; shaka: { year: number; name: string } };
};

export type Festival = {
    name: string;
    lunarMonth: string;
    paksha?: string;
    tithi?: string;
    observance?: string;
    significance: string;
    rituals?: string[];
    importance: string;
    daysAway: number;
    date: string;
    ymd: CivilDate;
};

export type Limb = 'tithi' | 'nakshatra' | 'yoga' | 'karana';

export const computePanchang: (date: Date, location: Location) => Panchang = P.computePanchang;
export const panchangForDate: (year: number, month: number, day: number, location: Location) => Panchang = P.panchangForDate;
export const limbSpan: (limb: Limb, date: Date) => { start: Date; end: Date } = P.limbSpan;

export const getUpcomingFestivals: (
    start: Date, limit: number, location: Location, options?: { includeToday?: boolean }
) => Festival[] = F.getUpcomingFestivals;

export const LOCATIONS: Record<string, Location> = U.LOCATIONS;
export const REGIONS: { id: string; label: string }[] = U.REGIONS;
export const DEFAULT_LOCATION: Location = U.DEFAULT_LOCATION;
export const deviceLocation: (lat: number, lng: number) => Location = U.deviceLocation;
export const zonedInfo: (date: Date, timeZone: string) => CivilDate & {
    hour: number; minute: number; second: number; weekday: number; utcOffset: number;
} = U.zonedInfo;
export const zonedDateTime: (year: number, month: number, day: number, hours: number, timeZone: string) => Date = U.zonedDateTime;
export const timeZoneLabel: (timeZone: string, date?: Date) => string = U.timeZoneLabel;
export const deviceTimeZone: () => string = U.deviceTimeZone;
export const sameTimeZone: (a: string, b: string) => boolean = U.sameTimeZone;
