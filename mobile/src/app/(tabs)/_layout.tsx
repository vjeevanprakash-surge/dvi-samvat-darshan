import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/Icon';
import { fonts, useTheme } from '@/theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
    { name: 'index', title: 'Today', icon: 'clock' },
    { name: 'calendar', title: 'Calendar', icon: 'calendar' },
    { name: 'festivals', title: 'Festivals', icon: 'flame' },
    { name: 'settings', title: 'Settings', icon: 'sliders' },
];

export default function TabLayout() {
    const { colors } = useTheme();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.muted,
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
                tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
            }}
        >
            {TABS.map(t => (
                <Tabs.Screen key={t.name} name={t.name} options={{
                    title: t.title,
                    tabBarIcon: ({ color }) => <Icon name={t.icon} color={String(color)} />,
                }} />
            ))}
        </Tabs>
    );
}
