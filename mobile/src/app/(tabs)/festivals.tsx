import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Card, DateTile } from '@/components/ui';
import { getUpcomingFestivals } from '@/engine';
import { useApp } from '@/state';
import { colors, fonts } from '@/theme';
import { civilOf, longDate, monthName } from '@/time';

const OBSERVANCE: Record<string, string> = {
    madhyahna: 'Observed at midday',
    aparahna: 'Observed in the afternoon',
    pradosh: 'Observed at dusk',
    nishita: 'Observed at midnight',
};

export default function FestivalsScreen() {
    const { location, now } = useApp();
    const today = civilOf(now, location.timezone);
    const todayKey = `${today.year}-${today.month}-${today.day}`;
    const festivals = useMemo(
        () => getUpcomingFestivals(now, 40, location, { includeToday: true }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [location, todayKey],
    );
    const [open, setOpen] = useState<string | null>(null);

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <FlatList
                data={festivals}
                keyExtractor={(f: any) => f.name}
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <View style={{ gap: 4, marginBottom: 8 }}>
                        <Text style={styles.title} accessibilityRole="header">Festivals</Text>
                        <Text style={styles.subtle}>The next four months in {location.name}, dated by the local sunrise and observance time.</Text>
                    </View>
                }
                renderItem={({ item: f }: { item: any }) => {
                    const expanded = open === f.name;
                    const when = f.daysAway === 0 ? 'Today' : f.daysAway === 1 ? 'Tomorrow' : `in ${f.daysAway} days`;
                    return (
                        <Card style={{ overflow: 'hidden' }}>
                            <Pressable onPress={() => setOpen(expanded ? null : f.name)} style={styles.row}
                                accessibilityRole="button" accessibilityState={{ expanded }}>
                                <DateTile month={monthName(f.ymd.month).slice(0, 3)} day={f.ymd.day} highlight={f.daysAway === 0} />
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={styles.name}>{f.name}</Text>
                                    <Text style={styles.subtle}>{longDate(f.ymd)} · {when}</Text>
                                </View>
                                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                                    <Icon name="chevronDown" size={20} color={colors.muted} />
                                </View>
                            </Pressable>
                            {expanded && (
                                <View style={styles.details}>
                                    <Text style={styles.meta}>
                                        {[`${f.lunarMonth === '*' ? 'Every month' : f.lunarMonth} ${f.paksha ?? ''} ${f.tithi ?? ''}`.trim(),
                                            OBSERVANCE[f.observance]].filter(Boolean).join(' · ')}
                                    </Text>
                                    <Text style={styles.body}>{f.significance}</Text>
                                    {Array.isArray(f.rituals) && f.rituals.length > 0 && (
                                        <View style={{ gap: 6 }}>
                                            {f.rituals.map((r: string) => (
                                                <View key={r} style={styles.ritual}>
                                                    <View style={styles.bullet} />
                                                    <Text style={[styles.body, { flex: 1 }]}>{r}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </Card>
                    );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32, width: '100%', maxWidth: 640, alignSelf: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: -0.5, color: colors.text },
    subtle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, minHeight: 64 },
    name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
    details: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
    meta: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accentText },
    body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.body },
    ritual: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 8 },
});
