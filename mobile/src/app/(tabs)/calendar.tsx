import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Card, Eyebrow, SectionTitle } from '@/components/ui';
import { getUpcomingFestivals, panchangForDate, zonedDateTime, type CivilDate } from '@/engine';
import { useApp } from '@/state';
import { fonts, makeStyles, useTheme } from '@/theme';
import { civilOf, formatHours, longDate, monthName, sameCivil } from '@/time';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const key = (c: CivilDate) => `${c.year}-${c.month}-${c.day}`;

export default function CalendarScreen() {
    const styles = useStyles();
    const { colors } = useTheme();
    const { location, now, setViewDate } = useApp();
    const today = civilOf(now, location.timezone);
    const [month, setMonth] = useState({ year: today.year, month: today.month });
    const [picked, setPicked] = useState<CivilDate>(today);
    const { width } = useWindowDimensions();
    const gridWidth = Math.min(width, 560) - 32;
    // The card's padding (8 each side) and border (1 each side) come out of the grid's width.
    const cell = Math.floor((gridWidth - 18) / 7);

    const days = useMemo(() => {
        const count = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
        return Array.from({ length: count }, (_, i) => {
            const civil = { year: month.year, month: month.month, day: i + 1 };
            return { civil, panchang: panchangForDate(civil.year, civil.month, civil.day, location) };
        });
    }, [month, location]);

    const festivalsByDay = useMemo(() => {
        const start = zonedDateTime(month.year, month.month, 1, 0, location.timezone);
        const map = new Map<string, any[]>();
        for (const f of getUpcomingFestivals(start, 25, location) as any[]) {
            if (f.ymd.month !== month.month || f.ymd.year !== month.year) continue;
            map.set(key(f.ymd), [...(map.get(key(f.ymd)) ?? []), f]);
        }
        return map;
    }, [month, location]);

    const lead = new Date(Date.UTC(month.year, month.month - 1, 1)).getUTCDay();
    const shift = (n: number) => {
        const d = new Date(Date.UTC(month.year, month.month - 1 + n, 1));
        setMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
    };

    const pickedDay = days.find(d => sameCivil(d.civil, picked));
    const pickedFestivals = festivalsByDay.get(key(picked)) ?? [];

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.monthRow}>
                    <Pressable onPress={() => shift(-1)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Previous month">
                        <Icon name="chevronLeft" color={colors.text} />
                    </Pressable>
                    <Text style={styles.monthTitle} accessibilityRole="header">{monthName(month.month)} {month.year}</Text>
                    <Pressable onPress={() => shift(1)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Next month">
                        <Icon name="chevronRight" color={colors.text} />
                    </Pressable>
                </View>

                <Card style={{ padding: 8 }}>
                    <View style={styles.grid}>
                        {WEEK.map((w, i) => <Text key={i} style={[styles.weekday, { width: cell }]}>{w}</Text>)}
                        {Array.from({ length: lead }, (_, i) => <View key={`pad${i}`} style={{ width: cell, height: cell + 8 }} />)}
                        {days.map(({ civil, panchang: p }) => {
                            const isPicked = sameCivil(civil, picked);
                            const isToday = sameCivil(civil, today);
                            const fullMoon = p.tithi.index === 14;
                            const newMoon = p.tithi.index === 29;
                            const hasFestival = festivalsByDay.has(key(civil));
                            return (
                                <Pressable key={civil.day} onPress={() => setPicked(civil)} accessibilityRole="button"
                                    accessibilityLabel={`${longDate(civil)}, ${p.tithi.paksha} ${p.tithi.name}`}
                                    accessibilityState={{ selected: isPicked }}
                                    style={[styles.cell, { width: cell, height: cell + 8 }, isPicked && styles.cellPicked]}>
                                    <Text style={[styles.cellDay, isToday && { color: colors.accent }, isPicked && { color: colors.inverse }]}>{civil.day}</Text>
                                    <View style={styles.markers}>
                                        {fullMoon && <View style={[styles.moon, { backgroundColor: colors.day }]} />}
                                        {newMoon && <View style={[styles.moon, { backgroundColor: colors.night }]} />}
                                        {hasFestival && <View style={[styles.festDot, isPicked && { backgroundColor: colors.inverse }]} />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}><View style={[styles.moon, { backgroundColor: colors.day }]} /><Text style={styles.legendText}>Purnima</Text></View>
                        <View style={styles.legendItem}><View style={[styles.moon, { backgroundColor: colors.night }]} /><Text style={styles.legendText}>Amavasya</Text></View>
                        <View style={styles.legendItem}><View style={styles.festDot} /><Text style={styles.legendText}>Festival</Text></View>
                    </View>
                </Card>

                {pickedDay && (
                    <View style={{ gap: 10 }}>
                        <SectionTitle>{longDate(picked)}</SectionTitle>
                        <Card style={{ padding: 16, gap: 12 }}>
                            <View style={{ gap: 2 }}>
                                <Eyebrow style={{ color: colors.accent }}>{pickedDay.panchang.tithi.paksha} paksha</Eyebrow>
                                <Text style={styles.dayTitle}>{pickedDay.panchang.tithi.name}</Text>
                                <Text style={styles.subtle}>{pickedDay.panchang.lunarMonth} month · at sunrise</Text>
                            </View>
                            <View style={styles.facts}>
                                {[
                                    ['Nakshatra', pickedDay.panchang.nakshatra.name],
                                    ['Yoga', pickedDay.panchang.yoga.name],
                                    ['Sunrise', formatHours(pickedDay.panchang.sun.sunriseDecimal)],
                                    ['Sunset', formatHours(pickedDay.panchang.sun.sunsetDecimal)],
                                ].map(([label, value]) => (
                                    <View key={label} style={styles.fact}>
                                        <Eyebrow>{label}</Eyebrow>
                                        <Text style={styles.factValue}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                            {pickedFestivals.map(f => (
                                <View key={f.name} style={styles.festLine}>
                                    <View style={styles.festDot} />
                                    <Text style={styles.factValue}>{f.name}</Text>
                                </View>
                            ))}
                            <Pressable style={styles.button} accessibilityRole="button"
                                onPress={() => { setViewDate(sameCivil(picked, today) ? null : picked); router.navigate('/'); }}>
                                <Text style={styles.buttonText}>Open day clock</Text>
                            </Pressable>
                        </Card>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const useStyles = makeStyles(colors => ({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
    iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    weekday: { textAlign: 'center', fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, paddingVertical: 8 },
    cell: { alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 },
    cellPicked: { backgroundColor: colors.text },
    cellDay: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
    markers: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center' },
    moon: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
    festDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 8, paddingBottom: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendText: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
    dayTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
    subtle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
    facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
    fact: { width: '50%', gap: 2 },
    factValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
    festLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    button: { minHeight: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.onAccent },
}));
