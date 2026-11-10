import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RemindersProvider } from '@/reminders';
import { AppProvider } from '@/state';
import { ThemeProvider, useTheme } from '@/theme';

// On web, react-native-svg passes touch-responder props to <path> elements; the click still works.
LogBox.ignoreLogs(['Unknown event handler property']);

// Keep the splash screen up until the fonts are ready, so the first frame is the real screen.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

export default function RootLayout() {
    const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
    const ready = loaded || !!error;

    // Render with system fonts rather than a blank screen if the fonts fail to load.
    if (!ready) return null;

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AppProvider>
                    <RemindersProvider>
                        <Navigator />
                    </RemindersProvider>
                </AppProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

function Navigator() {
    const { scheme, colors } = useTheme();

    // This mounts once the fonts and the saved theme are ready, so the first frame is the real screen.
    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});
    }, []);

    // The native root view shows behind the system bars.
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
    }, [colors.bg]);

    return (
        <>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
        </>
    );
}
