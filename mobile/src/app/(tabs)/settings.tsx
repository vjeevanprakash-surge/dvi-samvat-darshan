import * as ExpoLocation from 'expo-location';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SectionList, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Card, Segmented } from '@/components/ui';
import { LOCATIONS, REGIONS, deviceLocation, timeZoneLabel, type Location } from '@/engine';
import { remindersSupported, useReminders, type ReminderLead } from '@/reminders';
import { useApp } from '@/state';
import { fonts, makeStyles, useTheme, type ThemePreference } from '@/theme';
import { civilOf, momentLabel } from '@/time';

const ALL: Location[] = Object.values(LOCATIONS);

const APPEARANCE: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const LEADS: { value: ReminderLead; label: string; accessibilityLabel: string }[] = [
    { value: 0, label: 'At start', accessibilityLabel: 'When it starts' },
    { value: 10, label: '10 min', accessibilityLabel: '10 minutes before' },
    { value: 15, label: '15 min', accessibilityLabel: '15 minutes before' },
    { value: 30, label: '30 min', accessibilityLabel: '30 minutes before' },
];

function RahuReminder() {
    const styles = useStyles();
    const { colors } = useTheme();
    const { location, now } = useApp();
    const { settings, update, permission, next, failed } = useReminders();
    const [refused, setRefused] = useState(false);

    if (!remindersSupported) {
        return (
            <Card style={styles.reminder}>
                <Text style={styles.subtle}>Rahu Kaal reminders are available in the Android app.</Text>
            </Card>
        );
    }

    const toggle = async (on: boolean) => {
        setRefused(false);
        if (!(await update({ rahu: on }))) setRefused(true);
    };
    // Tied to the real permission, so it clears as soon as notifications are allowed in the phone's settings.
    const blocked = (refused || settings.rahu) && permission !== 'granted';
    const nextLabel = next === null ? null
        : momentLabel(new Date(next), civilOf(now, location.timezone), location.timezone);

    return (
        <Card style={styles.reminder}>
            <View style={styles.reminderRow}>
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.rowName}>Rahu Kaal</Text>
                    <Text style={styles.subtle}>{`A notification before each day's Rahu Kaal in ${location.name}.`}</Text>
                </View>
                <Switch value={settings.rahu} onValueChange={toggle} accessibilityLabel="Rahu Kaal reminders"
                    trackColor={{ false: colors.tick, true: colors.accent }} thumbColor="#FFFFFF" />
            </View>
            {settings.rahu && (
                <View style={{ gap: 8 }}>
                    <Text style={styles.label}>Remind me</Text>
                    <Segmented options={LEADS} value={settings.lead} onChange={lead => update({ lead })} />
                    {failed
                        ? <Text style={[styles.subtle, { color: colors.accentText }]}>{"Couldn't set the reminders. Switch this off and on to try again."}</Text>
                        : nextLabel && !blocked && <Text style={styles.subtle}>{`Next reminder: ${nextLabel}`}</Text>}
                </View>
            )}
            {blocked && (
                <View style={{ gap: 6 }}>
                    <Text style={[styles.subtle, { color: colors.accentText }]}>
                        {"Notifications are turned off for Samvat. Allow them in your phone's settings."}
                    </Text>
                    <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.buttonText}>Open settings</Text>
                    </Pressable>
                </View>
            )}
        </Card>
    );
}

export default function SettingsScreen() {
    const styles = useStyles();
    const { colors, preference, setPreference } = useTheme();
    const { location, setLocation } = useApp();
    const [query, setQuery] = useState('');
    const [locating, setLocating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const sections = useMemo(() => {
        const q = query.trim().toLowerCase();
        return REGIONS.map((r: { id: string; label: string }) => ({
            title: r.label,
            data: ALL.filter(l => l.region === r.id && (!q || `${l.name} ${l.state}`.toLowerCase().includes(q)))
                .sort((a, b) => a.name.localeCompare(b.name)),
        })).filter((s: { data: Location[] }) => s.data.length);
    }, [query]);

    const useDevice = async () => {
        setMessage(null);
        setLocating(true);
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setMessage('Location access was denied. Pick a city instead.');
                return;
            }
            const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
            setLocation(deviceLocation(pos.coords.latitude, pos.coords.longitude));
        } catch {
            setMessage("Couldn't get your location. Pick a city instead.");
        } finally {
            setLocating(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                stickySectionHeadersEnabled={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <View style={{ gap: 12, marginBottom: 8 }}>
                        <Text style={styles.title} accessibilityRole="header">Appearance</Text>
                        <Segmented options={APPEARANCE} value={preference} onChange={setPreference} />
                        <Text style={[styles.title, { marginTop: 16 }]} accessibilityRole="header">Reminders</Text>
                        <RahuReminder />
                        <Text style={[styles.title, { marginTop: 16 }]} accessibilityRole="header">Location</Text>
                        <Text style={styles.subtle}>
                            {"Sunrise, sunset, the day's timings and festival dates are worked out for this place, on its own clock."}
                        </Text>
                        <Card style={styles.current}>
                            <Icon name="pin" size={20} color={colors.accent} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowName}>{location.name}</Text>
                                <Text style={styles.subtle}>{location.state} · {timeZoneLabel(location.timezone)}</Text>
                            </View>
                        </Card>
                        <Pressable onPress={useDevice} style={styles.button} accessibilityRole="button" disabled={locating}>
                            {locating ? <ActivityIndicator color={colors.accent} /> : <Icon name="locate" size={20} color={colors.accent} />}
                            <Text style={styles.buttonText}>Use my current location</Text>
                        </Pressable>
                        {message && <Text style={[styles.subtle, { color: colors.accentText }]}>{message}</Text>}
                        <View style={styles.search}>
                            <Icon name="search" size={18} color={colors.muted} />
                            <TextInput value={query} onChangeText={setQuery} placeholder="Search 117 cities"
                                placeholderTextColor={colors.muted} style={styles.searchInput}
                                accessibilityLabel="Search cities" autoCorrect={false} />
                        </View>
                    </View>
                }
                renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
                renderItem={({ item, index, section }) => {
                    const on = item.id === location.id;
                    return (
                        <Pressable onPress={() => setLocation(item)} accessibilityRole="button" accessibilityState={{ selected: on }}
                            style={[styles.row, index === 0 && styles.rowFirst, index === section.data.length - 1 && styles.rowLast,
                                index > 0 && styles.divider]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowName}>{item.name}</Text>
                                <Text style={styles.rowMeta}>{item.state}</Text>
                            </View>
                            {on && <Icon name="check" size={20} color={colors.accent} />}
                        </Pressable>
                    );
                }}
                ListEmptyComponent={<Text style={styles.subtle}>{`No city matches “${query}”.`}</Text>}
            />
        </SafeAreaView>
    );
}

const useStyles = makeStyles(colors => ({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 32, width: '100%', maxWidth: 640, alignSelf: 'center' },
    title: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: -0.5, color: colors.text },
    subtle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
    reminder: { padding: 14, gap: 14 },
    reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    label: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
    current: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    button: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    buttonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accentText },
    search: {
        flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14,
        borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 10 },
    sectionHeader: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted, marginTop: 20, marginBottom: 8 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: colors.surface, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border,
    },
    rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    divider: { borderTopWidth: 1, borderTopColor: colors.divider },
    rowName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
    rowMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
}));
