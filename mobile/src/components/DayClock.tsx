import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { Period, PeriodId } from '../useDay';
import { colors, fonts } from '../theme';

const VIEW = 340;
const C = VIEW / 2;
const R_DAY = 138;
const R_GOOD = 118;
const R_AVOID = 101;

/** Midnight at the bottom, noon at the top: the sun crosses the top of the dial as it does the sky. */
function point(r: number, hours: number): [number, number] {
    const a = (hours / 24) * Math.PI * 2 + Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function arc(r: number, from: number, to: number): string {
    const [x1, y1] = point(r, from);
    const [x2, y2] = point(r, to);
    const large = to - from > 12 ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const TICKS =Array.from({ length: 24 }, (_, h) => {
    const [x1, y1] = point(146, h);
    const [x2, y2] = point(h % 6 === 0 ? 153 : 150, h);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}).join(' ');

type Props = {
    size: number;
    sunrise: number;
    sunset: number;
    periods: Period[];
    selected: PeriodId;
    onSelect: (id: PeriodId) => void;
    nowHours: number | null;
    accessibilityLabel: string;
    children: ReactNode;
};

export function DayClock({ size, sunrise, sunset, periods, selected, onSelect, nowHours, accessibilityLabel, children }: Props) {
    const hand = nowHours === null ? null : [point(126, nowHours), point(146, nowHours)];
    // The centre text sits inside the inner track.
    const inner = (size * (R_AVOID - 12) * 2) / VIEW;

    return (
        <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
            <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
                <Circle cx={C} cy={C} r={R_DAY} fill="none" stroke={colors.night} strokeWidth={12} />
                <Path d={arc(R_DAY, sunrise, sunset)} fill="none" stroke={colors.day} strokeWidth={12} />
                <Path d={TICKS} fill="none" stroke={colors.tick} strokeWidth={1.5} strokeLinecap="round" />
                {[['12', C, 12], ['18', 330, C], ['0', C, 329], ['6', 10, C]].map(([label, x, y]) => (
                    <SvgText key={label as string} x={x as number} y={(y as number) + 4} textAnchor="middle"
                        fontSize={12} fontFamily={fonts.semibold} fill={colors.muted}>{label}</SvgText>
                ))}
                <Circle cx={C} cy={C} r={R_GOOD} fill="none" stroke={colors.goodTrack} strokeWidth={10} />
                <Circle cx={C} cy={C} r={R_AVOID} fill="none" stroke={colors.avoidTrack} strokeWidth={10} />
                {periods.map(p => (
                    <Path key={p.id} d={arc(p.good ? R_GOOD : R_AVOID, p.start, p.end)} fill="none"
                        stroke={p.color} strokeWidth={p.id === selected ? 16 : 10} strokeLinecap="round"
                        onPress={() => onSelect(p.id)} />
                ))}
                {hand && (
                    <>
                        <Line x1={hand[0][0]} y1={hand[0][1]} x2={hand[1][0]} y2={hand[1][1]}
                            stroke={colors.text} strokeWidth={3} strokeLinecap="round" />
                        <Circle cx={hand[1][0]} cy={hand[1][1]} r={6} fill={colors.text} stroke="#FFFFFF" strokeWidth={2} />
                    </>
                )}
            </Svg>
            <View pointerEvents="none" style={[styles.center, { width: inner, height: inner, left: (size - inner) / 2, top: (size - inner) / 2 }]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
