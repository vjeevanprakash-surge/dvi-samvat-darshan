import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_LOCATION, LOCATIONS, type CivilDate, type Location } from './engine';

const LOCATION_KEY = 'samvat.location';
const TICK_MS = 30 * 1000;

type AppContextValue = {
    location: Location;
    setLocation: (location: Location) => void;
    /** False until the saved location has been read; until then `location` is the default. */
    locationLoaded: boolean;
    /** The day being viewed; null follows today. */
    viewDate: CivilDate | null;
    setViewDate: (date: CivilDate | null) => void;
    /** The current moment, refreshed every 30 seconds and when the app returns to the foreground. */
    now: Date;
};

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Reads a saved location: a catalogue id, a whole device location, or the
 * old web app's `{"id": "..."}` record, which shares this storage key on the web.
 * Anything else is ignored so a bad value can't break every calculation.
 */
function parseSavedLocation(saved: string): Location | null {
    if (LOCATIONS[saved]) return LOCATIONS[saved];
    try {
        const value = JSON.parse(saved);
        if (typeof value?.id === 'string' && LOCATIONS[value.id]) return LOCATIONS[value.id];
        const valid = Number.isFinite(value?.lat) && Number.isFinite(value?.lng)
            && typeof value?.timezone === 'string' && typeof value?.name === 'string';
        if (!valid) return null;
        new Intl.DateTimeFormat('en', { timeZone: value.timezone });
        return value as Location;
    } catch {
        return null;
    }
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);
    const [locationLoaded, setLocationLoaded] = useState(false);
    const [viewDate, setViewDate] = useState<CivilDate | null>(null);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        AsyncStorage.getItem(LOCATION_KEY).then(saved => {
            const restored = saved ? parseSavedLocation(saved) : null;
            if (restored) setLocationState(restored);
        }).catch(() => {}).finally(() => setLocationLoaded(true));
    }, []);

    useEffect(() => {
        const tick = () => setNow(new Date());
        const timer = setInterval(tick, TICK_MS);
        const sub = AppState.addEventListener('change', s => { if (s === 'active') tick(); });
        return () => { clearInterval(timer); sub.remove(); };
    }, []);

    const value = useMemo<AppContextValue>(() => ({
        location,
        setLocation: next => {
            setLocationState(next);
            // A device location has no catalogue id, so it is stored whole.
            const saved = next.id === 'current' ? JSON.stringify(next) : next.id;
            AsyncStorage.setItem(LOCATION_KEY, saved).catch(() => {});
        },
        locationLoaded,
        viewDate,
        setViewDate,
        now,
    }), [location, locationLoaded, viewDate, now]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
}
