import type { ReactNode } from 'react';
import { Text, View, type TextProps, type ViewStyle, type StyleProp } from 'react-native';
import { fonts, makeStyles, useTheme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
    const styles = useStyles();
    return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
    const styles = useStyles();
    return <Text style={styles.sectionTitle} accessibilityRole="header">{children}</Text>;
}

export function Eyebrow({ style, ...props }: TextProps) {
    const styles = useStyles();
    return <Text {...props} style={[styles.eyebrow, style]} />;
}

export function DateTile({ month, day, highlight }: { month: string; day: number; highlight?: boolean }) {
    const styles = useStyles();
    const { colors } = useTheme();
    return (
        <View style={[styles.tile, highlight && { backgroundColor: colors.accent }]}>
            <Text style={[styles.tileMonth, highlight && { color: colors.onAccent }]}>{month}</Text>
            <Text style={[styles.tileDay, highlight && { color: colors.onAccent }]}>{day}</Text>
        </View>
    );
}

const useStyles = makeStyles(colors => ({
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 18,
    },
    sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
    eyebrow: {
        fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.5,
        textTransform: 'uppercase', color: colors.muted,
    },
    tile: {
        width: 48, height: 52, borderRadius: 12, backgroundColor: colors.bg,
        alignItems: 'center', justifyContent: 'center',
    },
    tileMonth: { fontFamily: fonts.semibold, fontSize: 11, textTransform: 'uppercase', color: colors.text },
    tileDay: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 22, color: colors.text },
}));
