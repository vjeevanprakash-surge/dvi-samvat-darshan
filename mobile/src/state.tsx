import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { DEFAULT_LOCATION, LOCATIONS, type CivilDate, type Location } from './engine';

const LOCATION_KEY = 'samvat.location';
const TICK_MS = 30 * 1000;

type AppContextValue = {
    location: Location;
    setLocation: (location: Location) => void;
    /** The day being viewed; null follows today. */
    viewDate: CivilDate | null;
    setViewDate: (date: CivilDate | null) => void;
    /** The current moment, refreshed every 30 seconds and when the app returns to the foreground. */
    now: Date;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);
    const [viewDate, setViewDate] = useState<CivilDate | null>(null);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        AsyncStorage.getItem(LOCATION_KEY).then(saved => {
            if (!saved) return;
            if (saved.startsWith('{')) setLocationState(JSON.parse(saved));
            else if (LOCATIONS[saved]) setLocationState(LOCATIONS[saved]);
        }).catch(() => {});
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
        viewDate,
        setViewDate,
        now,
    }), [location, viewDate, now]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
}
