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
// Reminders carry this prefix so re-planning only ever touches its own notifications.
const ID_PREFIX = 'rahu-';
// Reminders are scheduled this many days ahead and topped up whenever the app opens; the last one
// asks the user to open the app. iOS keeps at most 64 pending notifications, so this stays under that.
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
    /** When the next reminder is due, or null if none is scheduled (yet). */
    next: number | null;
    /** True if the last attempt to schedule the reminders failed. */
    failed: boolean;
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

const toPermission = (p: Notifications.NotificationPermissionsStatus): Permission =>
    p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';

async function readPermission(): Promise<Permission> {
    return toPermission(await Notifications.getPermissionsAsync());
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
    return toPermission(await Notifications.requestPermissionsAsync());
}

async function cancelReminders() {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    // The first build with reminders gave them random ids; those are recognised by their title.
    const own = pending.filter(n => n.identifier.startsWith(ID_PREFIX) || n.content.title?.startsWith('Rahu Kaal'));
    await Promise.all(own.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

/**
 * Replaces the pending reminders with the next {@link DAYS} days of Rahu Kaal at `location`.
 * Stops early once `isStale` reports that a newer plan has been asked for.
 * Returns when the first reminder is due, or null if there is none.
 */
async function plan(location: Location, settings: ReminderSettings, now: Date, isStale: () => boolean): Promise<number | null> {
    await cancelReminders();
    if (!settings.rahu || isStale()) return null;
    await ensureChannel();

    const tz = location.timezone;
    const today = civilOf(now, tz);
    let first: number | null = null;
    for (let i = 0; i < DAYS; i++) {
        if (isStale()) break;
        const day = addDays(today, i);
        const { rahu } = panchangForDate(day.year, day.month, day.day, location).kaals;
        const fireAt = zonedDateTime(day.year, day.month, day.day, rahu.start, tz).getTime() - settings.lead * 60_000;
        if (fireAt <= now.getTime() + 30_000) continue;

        const renew = i === DAYS - 1 ? ' Open Samvat to keep these reminders coming.' : '';
        await Notifications.scheduleNotificationAsync({
            identifier: `${ID_PREFIX}${day.year}-${day.month}-${day.day}`,
            content: {
                // A clock time stays true even if the phone delivers the reminder late.
                title: settings.lead ? `Rahu Kaal starts at ${formatHours(rahu.start)}` : 'Rahu Kaal has begun',
                body: `Until ${formatHours(rahu.end)} in ${location.name}. Best not to start new work, journeys or big purchases.${renew}`,
                ...(Platform.OS === 'android' ? {} : { sound: true }),
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: CHANNEL },
        });
        first ??= fireAt;
    }
    return first;
}

export function RemindersProvider({ children }: { children: ReactNode }) {
    const { location, locationLoaded, now } = useApp();
    const [settings, setSettings] = useState<ReminderSettings>(DEFAULTS);
    const [loaded, setLoaded] = useState(!remindersSupported);
    const [permission, setPermission] = useState<Permission>('undetermined');
    const [next, setNext] = useState<number | null>(null);
    const [failed, setFailed] = useState(false);

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
    // Plans run one at a time, and a newer one makes any older one stop, so a quick off-and-on
    // or a change of city can't leave reminders from an earlier plan behind.
    const latestPlan = useRef(0);
    const queue = useRef<Promise<void>>(Promise.resolve());
    const active = settings.rahu && permission === 'granted';
    useEffect(() => {
        if (!loaded || !locationLoaded || !remindersSupported) return;
        // Without permission nothing can be shown; leave what is scheduled for when it returns.
        if (settings.rahu && permission !== 'granted') return;
        const id = ++latestPlan.current;
        const isStale = () => id !== latestPlan.current;
        queue.current = queue.current.then(async () => {
            if (isStale()) return;
            try {
                const first = await plan(location, settings, new Date(), isStale);
                if (!isStale()) { setNext(first); setFailed(false); }
            } catch {
                if (!isStale()) { setNext(null); setFailed(settings.rahu); }
            }
        });
    }, [loaded, locationLoaded, settings, permission, location, dayKey]);

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

    const value = useMemo(
        () => ({ settings, update, permission, next: active ? next : null, failed: active && failed }),
        [settings, update, permission, active, next, failed],
    );
    return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersValue {
    const ctx = useContext(RemindersContext);
    if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
    return ctx;
}
