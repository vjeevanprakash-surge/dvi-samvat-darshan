import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { panchangForDate, zonedDateTime, type Location } from './engine';
import { useApp } from './state';
import { addDays, civilOf, formatHours } from './time';

export type ReminderLead = 0 | 10 | 15 | 30;
export type ReminderSettings = { rahu: boolean; lead: ReminderLead };

const KEY = 'samvat.reminders';
const CHANNEL = 'rahu-kaal';
// Reminders are scheduled this many days ahead and topped up whenever the app opens.
// iOS keeps at most 64 pending notifications, so this stays well under that.
const DAYS = 30;
const DEFAULTS: ReminderSettings = { rahu: false, lead: 15 };

/** Scheduled notifications don't exist on the web. */
export const remindersSupported = Platform.OS !== 'web';

if (remindersSupported) {
    // Show the reminder even when the app is open.
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
        }),
    });
}

type Permission = 'granted' | 'denied' | 'undetermined';

type RemindersValue = {
    settings: ReminderSettings;
    /** Turning reminders on asks for notification permission first; returns false if it was refused. */
    update: (next: Partial<ReminderSettings>) => Promise<boolean>;
    permission: Permission;
};

const RemindersContext = createContext<RemindersValue | null>(null);

function parse(saved: string | null): ReminderSettings {
    try {
        const v = saved ? JSON.parse(saved) : null;
        return {
            rahu: v?.rahu === true,
            lead: [0, 10, 15, 30].includes(v?.lead) ? v.lead : DEFAULTS.lead,
        };
    } catch {
        return DEFAULTS;
    }
}

async function readPermission(): Promise<Permission> {
    const p = await Notifications.getPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

async function ensureChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Rahu Kaal reminders',
        description: 'A heads-up before each day’s Rahu Kaal',
        // eslint-disable-next-line import/namespace -- re-exported through `export *`, which the lint rule misses
        importance: Notifications.AndroidImportance.HIGH,
    });
}

async function askPermission(): Promise<Permission> {
    // Android 13+ only shows the permission prompt once a channel exists.
    await ensureChannel();
    const current = await readPermission();
    if (current !== 'undetermined') return current;
    const p = await Notifications.requestPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

/** Replaces every pending reminder with the next {@link DAYS} days of Rahu Kaal at `location`. */
async function schedule(location: Location, settings: ReminderSettings, now: Date): Promise<number> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.rahu) return 0;
    await ensureChannel();

    const tz = location.timezone;
    const today = civilOf(now, tz);
    let count = 0;
    for (let i = 0; i < DAYS; i++) {
        const day = addDays(today, i);
        const { rahu } = panchangForDate(day.year, day.month, day.day, location).kaals;
        const fireAt = zonedDateTime(day.year, day.month, day.day, rahu.start, tz).getTime() - settings.lead * 60_000;
        if (fireAt <= now.getTime() + 30_000) continue;

        const range = `${formatHours(rahu.start)}–${formatHours(rahu.end)}`;
        await Notifications.scheduleNotificationAsync({
            content: {
                title: settings.lead ? `Rahu Kaal in ${settings.lead} minutes` : 'Rahu Kaal has begun',
                body: `${range} in ${location.name}. Best not to start new work, journeys or big purchases.`,
                ...(Platform.OS === 'android' ? {} : { sound: true }),
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: CHANNEL },
        });
        count++;
    }
    return count;
}

export function RemindersProvider({ children }: { children: ReactNode }) {
    const { location, now } = useApp();
    const [settings, setSettings] = useState<ReminderSettings>(DEFAULTS);
    const [loaded, setLoaded] = useState(!remindersSupported);
    const [permission, setPermission] = useState<Permission>('undetermined');

    useEffect(() => {
        if (!remindersSupported) return;
        Promise.all([AsyncStorage.getItem(KEY), readPermission()])
            .then(([saved, perm]) => { setSettings(parse(saved)); setPermission(perm); })
            .catch(() => {})
            .finally(() => setLoaded(true));
        // Pick up a permission changed in the phone's settings while the app was away.
        const sub = AppState.addEventListener('change', s => {
            if (s === 'active') readPermission().then(setPermission).catch(() => {});
        });
        return () => sub.remove();
    }, []);

    // Re-plan when the settings or place change, and each new day so the window keeps rolling forward.
    const today = civilOf(now, location.timezone);
    const dayKey = `${today.year}-${today.month}-${today.day}`;
    useEffect(() => {
        if (!loaded || !remindersSupported) return;
        if (settings.rahu && permission !== 'granted') return;
        schedule(location, settings, new Date()).catch(() => {});
    }, [loaded, settings, permission, location, dayKey]);

    // The latest settings for `update`, which merges a change into them without re-creating itself.
    const settingsRef = useRef(settings);
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    const update = useCallback(async (next: Partial<ReminderSettings>) => {
        if (!remindersSupported) return false;
        if (next.rahu) {
            const perm = await askPermission().catch((): Permission => 'denied');
            setPermission(perm);
            if (perm !== 'granted') return false;
        }
        const merged = { ...settingsRef.current, ...next };
        settingsRef.current = merged;
        setSettings(merged);
        AsyncStorage.setItem(KEY, JSON.stringify(merged)).catch(() => {});
        return true;
    }, []);

    const value = useMemo(() => ({ settings, update, permission }), [settings, update, permission]);
    return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
    const ctx = useContext(RemindersContext);
    if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
    return ctx;
}
