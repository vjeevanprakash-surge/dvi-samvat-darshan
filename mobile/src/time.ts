import { zonedInfo, type CivilDate } from './engine';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Decimal hours (e.g. 10.6) as "10:36". */
export function formatHours(hours: number): string {
    let minutes = Math.round(hours * 60);
    minutes = ((minutes % 1440) + 1440) % 1440;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Decimal hours of the wall clock at a place. */
export function clockHours(date: Date, timeZone: string): number {
    const z = zonedInfo(date, timeZone);
    return z.hour + z.minute / 60 + z.second / 3600;
}

export function civilOf(date: Date, timeZone: string): CivilDate {
    const z = zonedInfo(date, timeZone);
    return { year: z.year, month: z.month, day: z.day };
}

export function sameCivil(a: CivilDate, b: CivilDate): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function addDays(c: CivilDate, days: number): CivilDate {
    const d = new Date(Date.UTC(c.year, c.month - 1, c.day + days));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function weekdayOf(c: CivilDate): number {
    return new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay();
}

/** "Fri, 6 Nov" */
export function shortDate(c: CivilDate): string {
    return `${WEEKDAYS[weekdayOf(c)].slice(0, 3)}, ${c.day} ${MONTHS[c.month - 1].slice(0, 3)}`;
}

/** "Friday, 6 November 2026" */
export function longDate(c: CivilDate): string {
    return `${WEEKDAYS[weekdayOf(c)]}, ${c.day} ${MONTHS[c.month - 1]} ${c.year}`;
}

export const monthName = (month: number) => MONTHS[month - 1];
export const weekdayName = (weekday: number) => WEEKDAYS[weekday];

/** A moment as "10:50", or "Sat 10:50" when it falls on a different day from `day`. */
export function momentLabel(date: Date, day: CivilDate, timeZone: string): string {
    const z = zonedInfo(date, timeZone);
    const time = `${pad(z.hour)}:${pad(z.minute)}`;
    return sameCivil(day, z) ? time : `${WEEKDAYS[z.weekday].slice(0, 3)} ${time}`;
}

/** 43 → "43 min", 95 → "1 h 35 min" */
export function duration(minutes: number): string {
    const m = Math.max(0, Math.round(minutes));
    return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}
