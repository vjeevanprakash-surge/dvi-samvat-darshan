import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

const light = {
    bg: '#F5F5F7',
    surface: '#FFFFFF',
    text: '#17171C',
    /** Text on a `text`-coloured fill, such as the picked calendar day. */
    inverse: '#FFFFFF',
    body: '#3A3A44',
    muted: '#5B5B66',
    border: '#E4E4EA',
    divider: '#EEEEF2',
    accent: '#B4410C',
    /** Text on an `accent`-coloured fill. */
    onAccent: '#FFFFFF',
    accentText: '#A33A0F',
    day: '#F6C26B',
    night: '#2E2A6B',
    goodTrack: '#EEF1F8',
    avoidTrack: '#F7EFEA',
    tick: '#9A9AA6',
    goodTagBg: '#E6EDFB',
    goodTagFg: '#1D3F9E',
    avoidTagBg: '#FBEAE2',
    avoidTagFg: '#8A2E0C',
};

export type Palette = typeof light;

const dark: Palette = {
    bg: '#0E0E14',
    surface: '#1A1A23',
    text: '#F2F2F6',
    inverse: '#0E0E14',
    body: '#CACAD4',
    muted: '#9C9CAA',
    border: '#2D2D3A',
    divider: '#24242F',
    accent: '#F08A4B',
    onAccent: '#1C0D04',
    accentText: '#F5A274',
    day: '#F6C26B',
    night: '#4A4596',
    goodTrack: '#202638',
    avoidTrack: '#2E2320',
    tick: '#5F5F6E',
    goodTagBg: '#1E2B4D',
    goodTagFg: '#A8C0FF',
    avoidTagBg: '#3B241B',
    avoidTagFg: '#FFB48F',
};

/** Arc colours for the periods drawn on the day clock. */
const lightPeriods = {
    brahma: '#7DB3F5',
    abhijit: '#1D4ED8',
    gulika: '#F2A93B',
    rahu: '#D9531E',
    yama: '#8A2E0C',
};

export type PeriodColors = typeof lightPeriods;

// Lighter where the light-theme arc would sink into a dark card.
const darkPeriods: PeriodColors = {
    brahma: '#8CBDF7',
    abhijit: '#5B8CFF',
    gulika: '#F2A93B',
    rahu: '#E8632C',
    yama: '#B24E2A',
};

export const fonts = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
} as const;

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeValue = {
    scheme: 'light' | 'dark';
    colors: Palette;
    periodColors: PeriodColors;
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
};

const THEME_KEY = 'samvat.theme';
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>('system');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then(saved => {
            if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
        }).catch(() => {}).finally(() => setLoaded(true));
    }, []);

    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

    // On the web the page behind the app shows when scrolling past the ends, and scrollbars follow `color-scheme`.
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;
        const root = document.documentElement;
        root.style.backgroundColor = (scheme === 'dark' ? dark : light).bg;
        root.style.colorScheme = scheme;
    }, [scheme]);

    const value = useMemo<ThemeValue>(() => ({
        scheme,
        colors: scheme === 'dark' ? dark : light,
        periodColors: scheme === 'dark' ? darkPeriods : lightPeriods,
        preference,
        setPreference: next => {
            setPreferenceState(next);
            AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
        },
    }), [scheme, preference]);

    // Wait for the saved choice so a forced theme doesn't open with a flash of the other one.
    if (!loaded) return null;
    return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** Builds a hook that returns a stylesheet for the current palette, created once per palette. */
export function makeStyles<T extends NamedStyles<T>>(factory: (c: Palette) => T & NamedStyles<T>): () => T {
    const cache = new Map<Palette, T>();
    return function useStyles() {
        const { colors } = useTheme();
        let styles = cache.get(colors);
        if (!styles) {
            styles = StyleSheet.create(factory(colors));
            cache.set(colors, styles);
        }
        return styles;
    };
}
