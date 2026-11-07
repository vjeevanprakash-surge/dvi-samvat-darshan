import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayClock } from '@/components/DayClock';
import { Icon } from '@/components/Icon';
import { Card, DateTile, Eyebrow, SectionTitle } from '@/components/ui';
import { deviceTimeZone, sameTimeZone, timeZoneLabel } from '@/engine';
import { useApp } from '@/state';
import { colors, fonts } from '@/theme';
import { addDays, duration, formatHours, monthName, sameCivil, shortDate } from '@/time';
import { useDay, type Period, type PeriodId } from '@/useDay';

const WIDE = 900;

const daysBetween = (a: { year: number; month: number; day: number }, b: typeof a) =>
    Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);

function statusOf(p: Period, nowHours: number | null): string | null {
    if (nowHours === null) return null;
    if (nowHours >= p.start && nowHours < p.end) return `now, ends in ${duration((p.end - nowHours) * 60)}`;
    if (nowHours < p.start) return `starts in ${duration((p.start - nowHours) * 60)}`;
    return `ended ${formatHours(p.end)}`;
}

/** The period to highlight: the one in progress (avoid periods first), else the next one, else Rahu Kaal. */
function defaultPeriod(periods: Period[], nowHours: number | null): PeriodId {
    if (nowHours === null) return 'rahu';
    const current = periods.filter(p => nowHours >= p.start && nowHours < p.end).sort((a, b) => Number(a.good) - Number(b.good));
    if (current.length) return current[0].id;
    return periods.find(p => p.start > nowHours)?.id ?? 'rahu';
}

export default function TodayScreen() {
    const { setViewDate } = useApp();
    const d = useDay();
    const { width } = useWindowDimensions();
    const wide = width >= WIDE;

    const autoPeriod = defaultPeriod(d.periods, d.nowHours);
    // A pick belongs to one day and place; a new day or location starts from the current period again.
    const pickKey = `${d.location.id}|${d.day.year}-${d.day.month}-${d.day.day}`;
    const [pick, setPick] = useState<{ key: string; id: PeriodId } | null>(null);
    const setPicked = (id: PeriodId) => setPick({ key: pickKey, id });
    const selectedId = pick?.key === pickKey ? pick.id : autoPeriod;
    const selected = d.periods.find(p => p.id === selectedId)!;

    const goToDay = (offset: number) => {
        const next = addDays(d.day, offset);
        setViewDate(sameCivil(next, d.today) ? null : next);
    };

    const nowPeriod = d.nowHours === null ? null
        : d.periods.filter(p => d.nowHours! >= p.start && d.nowHours! < p.end).sort((a, b) => Number(a.good) - Number(b.good))[0];
    const isDaytime = d.nowHours !== null && d.nowHours >= d.sunrise && d.nowHours < d.sunset;

    const columnWidth = wide ? Math.min(460, (width - 64) / 2) : Math.min(width, 560) - 32;
    const dialSize = Math.min(columnWidth - 24, 340);
    const chipWidth = (columnWidth - 8) / 2;

    const header = (
        <View style={styles.headerRow}>
            <Pressable onPress={() => router.navigate('/settings')} style={styles.locationButton}
                accessibilityRole="button" accessibilityLabel={`Change location, currently ${d.location.name}`}>
                <Icon name="pin" size={18} color={colors.accent} />
                <Text style={styles.locationText} numberOfLines={1}>{d.location.name}</Text>
                <Icon name="chevronDown" size={16} color={colors.muted} />
            </Pressable>
            <View style={styles.dateNav}>
                <Pressable onPress={() => goToDay(-1)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Previous day">
                    <Icon name="chevronLeft" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.dateText}>{shortDate(d.day)}</Text>
                <Pressable onPress={() => goToDay(1)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Next day">
                    <Icon name="chevronRight" size={20} color={colors.text} />
                </Pressable>
            </View>
        </View>
    );

    const titleBlock = (
        <View style={{ gap: 4 }}>
            <View style={styles.titleRow}>
                <Eyebrow style={{ color: colors.accent }}>{d.eyebrow}</Eyebrow>
                {!d.isToday && (
                    <Pressable onPress={() => setViewDate(null)} style={styles.todayPill} accessibilityRole="button">
                        <Text style={styles.todayPillText}>Back to today</Text>
                    </Pressable>
                )}
            </View>
            <Text style={styles.title} accessibilityRole="header">{d.title}</Text>
            <Text style={styles.subtle}>{d.samvat}</Text>
        </View>
    );

    const center = d.nowHours !== null ? (
        <>
            <Eyebrow>{sameTimeZone(d.location.timezone, deviceTimeZone()) ? 'Now' : `Now · ${timeZoneLabel(d.location.timezone)}`}</Eyebrow>
            <Text style={styles.clockTime}>{formatHours(d.nowHours)}</Text>
            {nowPeriod ? (
                <>
                    <View style={styles.centerPeriod}>
                        <View style={[styles.dot, { backgroundColor: nowPeriod.color }]} />
                        <Text style={[styles.centerPeriodText, { color: nowPeriod.good ? colors.goodTagFg : colors.accentText }]} numberOfLines={1}>
                            {nowPeriod.name}
                        </Text>
                    </View>
                    <Text style={styles.centerNote}>until {formatHours(nowPeriod.end)}</Text>
                </>
            ) : (
                <>
                    <Text style={styles.centerPeriodText}>{isDaytime ? 'Daytime' : 'Night'}</Text>
                    <Text style={styles.centerNote}>
                        {isDaytime ? `sunset ${formatHours(d.sunset)}` : `sunrise ${formatHours(d.sunrise)}`}
                    </Text>
                </>
            )}
        </>
    ) : (
        <>
            <Eyebrow>Day length</Eyebrow>
            <Text style={[styles.clockTime, { fontSize: 30 }]}>{duration((d.sunset - d.sunrise) * 60).replace(' min', 'm').replace(' h', 'h')}</Text>
            <Text style={styles.centerNote}>{formatHours(d.sunrise)} – {formatHours(d.sunset)}</Text>
        </>
    );

    const clockCard = (
        <Card style={styles.clockCard}>
            <DayClock
                size={dialSize}
                sunrise={d.sunrise}
                sunset={d.sunset}
                periods={d.periods}
                selected={selectedId}
                onSelect={setPicked}
                nowHours={d.nowHours}
                accessibilityLabel={`24-hour day clock for ${shortDate(d.day)}. Day runs ${formatHours(d.sunrise)} to ${formatHours(d.sunset)}.`}
            >
                {center}
            </DayClock>
            <View style={styles.legend}>
                {[
                    [colors.day, `Day ${formatHours(d.sunrise)}–${formatHours(d.sunset)}`],
                    [colors.night, 'Night'],
                    ['#1D4ED8', 'Auspicious (outer)'],
                    ['#D9531E', 'Best avoided (inner)'],
                ].map(([color, label]) => (
                    <View key={label} style={styles.legendItem}>
                        <View style={[styles.swatch, { backgroundColor: color }]} />
                        <Text style={styles.legendText}>{label}</Text>
                    </View>
                ))}
            </View>
        </Card>
    );

    const status = statusOf(selected, d.nowHours);
    const periodsSection = (
        <View style={{ gap: 10 }}>
            <SectionTitle>Times of the day</SectionTitle>
            <View style={styles.chips}>
                {d.periods.map(p => {
                    const on = p.id === selectedId;
                    return (
                        <Pressable key={p.id} onPress={() => setPicked(p.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                            style={[styles.chip, { width: chipWidth, borderColor: on ? colors.text : colors.border }]}>
                            <View style={[styles.dot, { width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }]} />
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.chipName} numberOfLines={1}>{p.name}</Text>
                                <Text style={styles.chipTime}>{formatHours(p.start)}–{formatHours(p.end)}</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
            <Card style={{ padding: 16, gap: 8 }}>
                <View style={styles.detailHead}>
                    <Text style={styles.detailName}>{selected.name}</Text>
                    <View style={[styles.tag, { backgroundColor: selected.good ? colors.goodTagBg : colors.avoidTagBg }]}>
                        <Text style={[styles.tagText, { color: selected.good ? colors.goodTagFg : colors.avoidTagFg }]}>
                            {selected.good ? 'Auspicious' : 'Best avoided'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.detailTime}>
                    {formatHours(selected.start)} – {formatHours(selected.end)}
                    {status && <Text style={styles.detailStatus}> · {status}</Text>}
                </Text>
                <Text style={styles.body}>{selected.meaning}</Text>
            </Card>
        </View>
    );

    const limbsSection = (
        <View style={{ gap: 10 }}>
            <SectionTitle>{d.isToday ? "Today's panchang" : `Panchang at sunrise, ${shortDate(d.day)}`}</SectionTitle>
            <Card>
                {d.limbs.map((l, i) => (
                    <View key={l.label} style={[styles.limbRow, i > 0 && styles.divider]}>
                        <View style={{ flexShrink: 1, gap: 2 }}>
                            <Eyebrow>{l.label}</Eyebrow>
                            <Text style={styles.limbValue}>{l.value}</Text>
                        </View>
                        <Text style={styles.limbNote}>{l.note}</Text>
                    </View>
                ))}
            </Card>
        </View>
    );

    const festivalsSection = (
        <View style={{ gap: 10 }}>
            <View style={styles.sectionHead}>
                <SectionTitle>Coming up</SectionTitle>
                <Pressable onPress={() => router.navigate('/festivals')} accessibilityRole="link" hitSlop={12}>
                    <Text style={styles.link}>All festivals</Text>
                </Pressable>
            </View>
            {d.festivals.map((f: any) => {
                const away = daysBetween(d.today, f.ymd);
                const when = away === 0 ? 'Today' : away === 1 ? 'Tomorrow' : away > 0 ? `in ${away} days` : `${-away} days ago`;
                return (
                    <Card key={f.name} style={styles.festRow}>
                        <DateTile month={monthName(f.ymd.month).slice(0, 3)} day={f.ymd.day} highlight={away === 0} />
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.festName} numberOfLines={1}>{f.name}</Text>
                            <Text style={styles.subtle} numberOfLines={1}>{String(f.significance).split('. ')[0]}</Text>
                        </View>
                        <Text style={[styles.festWhen, away === 0 && { color: colors.accent }]}>{when}</Text>
                    </Card>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]}>
                {header}
                {titleBlock}
                {wide ? (
                    <View style={styles.columns}>
                        <View style={{ width: columnWidth, gap: 20 }}>{clockCard}{periodsSection}</View>
                        <View style={{ width: columnWidth, gap: 20 }}>{limbsSection}{festivalsSection}</View>
                    </View>
                ) : (
                    <>
                        {clockCard}
                        {periodsSection}
                        {limbsSection}
                        {festivalsSection}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },
    contentWide: { maxWidth: 1000, paddingHorizontal: 24 },
    columns: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    locationButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingLeft: 10, paddingRight: 14,
        borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexShrink: 1,
    },
    locationText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, flexShrink: 1 },
    dateNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    dateText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, minWidth: 92, textAlign: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 20 },
    todayPill: { paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: 16, backgroundColor: colors.avoidTagBg },
    todayPillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accentText },
    title: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, color: colors.text },
    subtle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
    body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.body },
    clockCard: { borderRadius: 24, paddingTop: 16, paddingBottom: 14, paddingHorizontal: 12, alignItems: 'center', gap: 12 },
    clockTime: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46, letterSpacing: -0.8, color: colors.text },
    centerPeriod: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    centerPeriodText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
    centerNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    swatch: { width: 14, height: 6, borderRadius: 3 },
    legendText: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 14, borderWidth: 2, backgroundColor: colors.surface,
    },
    chipName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
    chipTime: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
    detailHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    detailName: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, flexShrink: 1 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    tagText: { fontFamily: fonts.semibold, fontSize: 12 },
    detailTime: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
    detailStatus: { fontFamily: fonts.medium, color: colors.muted },
    limbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
    divider: { borderTopWidth: 1, borderTopColor: colors.divider },
    limbValue: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
    limbNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'right', flexShrink: 1 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
    festRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
    festName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
    festWhen: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
});
