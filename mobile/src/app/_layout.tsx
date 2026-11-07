import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/state';

// On web, react-native-svg passes touch-responder props to <path> elements; the click still works.
LogBox.ignoreLogs(['Unknown event handler property']);

export default function RootLayout() {
    const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
    // Render with system fonts rather than a blank screen if the fonts fail to load.
    if (!loaded && !error) return null;

    return (
        <SafeAreaProvider>
            <AppProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </AppProvider>
        </SafeAreaProvider>
    );
}
