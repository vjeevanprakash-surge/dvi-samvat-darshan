import type { ReactNode } from 'react';
import { Pressable, Text, View, type TextProps, type ViewStyle, type StyleProp } from 'react-native';
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

/** A row of options where exactly one is picked. */
export function Segmented<T extends string | number>({ options, value, onChange }: {
    options: { value: T; label: string; accessibilityLabel?: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    const styles = useStyles();
    return (
        <View style={styles.segments} accessibilityRole="radiogroup">
            {options.map(o => {
                const on = o.value === value;
                return (
                    <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, on && styles.segmentOn]}
                        accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={o.accessibilityLabel}>
                        <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const useStyles = makeStyles(colors => ({
    segments: {
        flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14,
        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    segment: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segmentOn: { backgroundColor: colors.text },
    segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
    segmentTextOn: { color: colors.inverse },
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
