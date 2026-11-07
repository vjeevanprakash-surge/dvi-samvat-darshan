import { useMemo } from 'react';
import {
    computePanchang, panchangForDate, limbSpan, getUpcomingFestivals, zonedDateTime, type CivilDate, type Limb
} from './engine';
import { useApp } from './state';
import { useTheme, type PeriodColors } from './theme';
import { civilOf, clockHours, sameCivil, momentLabel, weekdayName, weekdayOf } from './time';

export type PeriodId = keyof PeriodColors;

export type Period = {
    id: PeriodId;
    name: string;
    start: number;
    end: number;
    good: boolean;
    color: string;
    meaning: string;
};

const PERIOD_INFO: Record<PeriodId, { name: string; good: boolean; meaning: string }> = {
    brahma: {
        name: 'Brahma Muhurta', good: true,
        meaning: 'The quiet hour and a half before sunrise. Traditionally kept for meditation, prayer and study.',
    },
    gulika: {
        name: 'Gulika Kaal', good: false,
        meaning: 'Ruled by Gulika, son of Saturn. Whatever begins now is said to repeat, so important new starts are usually avoided.',
    },
    rahu: {
        name: 'Rahu Kaal', good: false,
        meaning: 'One-eighth of the daylight hours, ruled by Rahu. Avoided for starting new work, journeys and major purchases.',
    },
    abhijit: {
        name: 'Abhijit Muhurta', good: true,
        meaning: 'The window around local noon. Considered auspicious for beginning almost any task.',
    },
    yama: {
        name: 'Yamaganda', good: false,
        meaning: 'Ruled by Yama. Avoided for new beginnings and setting out on travel.',
    },
};

const PERIOD_ORDER: PeriodId[] = ['brahma', 'gulika', 'rahu', 'abhijit', 'yama'];

export type LimbRow = { label: string; value: string; note: string };

/** Everything the Today screen shows for the viewed day at the chosen location. */
export function useDay() {
    const { location, viewDate, now } = useApp();
    const tz = location.timezone;
    const today = civilOf(now, tz);
    const day: CivilDate = viewDate ?? today;
    const isToday = sameCivil(day, today);
    const dayKey = `${location.id}|${location.lat}|${day.year}-${day.month}-${day.day}`;
    // Recompute the live view once a minute; other days never change.
    const minuteKey = isToday ? Math.floor(now.getTime() / 60000) : 0;

    const model = useMemo(() => {
        const p = isToday ? computePanchang(now, location) : panchangForDate(day.year, day.month, day.day, location);
        const sunrise: number = p.sun.sunriseDecimal;
        const sunset: number = p.sun.sunsetDecimal;
        // The moment the limbs are read at: now for today, sunrise for any other day.
        const moment = isToday ? now : zonedDateTime(day.year, day.month, day.day, sunrise, tz);

        const periods: Omit<Period, 'color'>[] = PERIOD_ORDER.map(id => ({
            id,
            ...PERIOD_INFO[id],
            start: p.kaals[id].start,
            end: p.kaals[id].end,
        }));

        const until = (limb: Limb) => momentLabel(limbSpan(limb, moment).end, day, tz);
        const karanaNext = p.karana.second && p.karana.second !== p.karana.first ? `, then ${p.karana.second}` : '';
        const limbs: LimbRow[] = [
            { label: 'Tithi', value: `${p.tithi.name}`, note: `${p.tithi.paksha} · until ${until('tithi')}` },
            { label: 'Nakshatra', value: p.nakshatra.name, note: `until ${until('nakshatra')}` },
            { label: 'Yoga', value: p.yoga.name, note: `until ${until('yoga')}` },
            { label: 'Karana', value: p.karana.first, note: `until ${until('karana')}${karanaNext}` },
            { label: 'Vaara', value: p.vaara, note: weekdayName(weekdayOf(day)) },
            { label: 'Moon', value: p.moon.phaseName, note: `${p.moon.illumination}% lit` },
        ];

        const monthLabel = p.tithi.fullName.slice(0, -(p.tithi.name.length + p.tithi.paksha.length + 2));
        return {
            panchang: p,
            sunrise,
            sunset,
            periods,
            limbs,
            eyebrow: `${monthLabel} · ${p.tithi.paksha} paksha`,
            title: p.tithi.name as string,
            samvat: `Vikram Samvat ${p.samvat.vikram.year} ${p.samvat.vikram.name} · Shaka ${p.samvat.shaka.year}`,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayKey, minuteKey]);

    const festivals = useMemo(() => {
        const from = isToday ? now : zonedDateTime(day.year, day.month, day.day, 12, tz);
        return getUpcomingFestivals(from, 4, location, { includeToday: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayKey, isToday]);

    const { periodColors } = useTheme();
    // Colours sit outside the day's model so a theme change doesn't recompute the panchang.
    const periods = useMemo(
        () => model.periods.map(p => ({ ...p, color: periodColors[p.id] })),
        [model.periods, periodColors],
    );

    return {
        ...model,
        periods,
        festivals,
        day,
        today,
        isToday,
        location,
        nowHours: isToday ? clockHours(now, tz) : null,
    };
}
