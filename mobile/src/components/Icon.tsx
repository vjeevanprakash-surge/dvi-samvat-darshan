import Svg, { Circle, Path, Rect } from 'react-native-svg';

const SHAPES = {
    pin: <><Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><Circle cx="12" cy="9.5" r="2.5" /></>,
    chevronDown: <Path d="M6 9l6 6 6-6" />,
    chevronLeft: <Path d="M15 18l-6-6 6-6" />,
    chevronRight: <Path d="M9 18l6-6-6-6" />,
    clock: <><Circle cx="12" cy="12" r="9" /><Path d="M12 7v5l3 2" /></>,
    calendar: <><Rect x="3.5" y="5" width="17" height="15" rx="2.5" /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>,
    flame: <><Path d="M12 3c2 3 4 4.5 4 7.5a4 4 0 0 1-8 0C8 8 10 6.5 12 3z" /><Path d="M5 16h14l-2 4H7z" /></>,
    sliders: <><Path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><Circle cx="16" cy="7" r="2" /><Circle cx="10" cy="17" r="2" /></>,
    search: <><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></>,
    check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
    locate: <><Circle cx="12" cy="12" r="7" /><Circle cx="12" cy="12" r="2.5" /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
} as const;

export type IconName = keyof typeof SHAPES;

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
            {SHAPES[name]}
        </Svg>
    );
}
