export const colors = {
    bg: '#F5F5F7',
    surface: '#FFFFFF',
    text: '#17171C',
    body: '#3A3A44',
    muted: '#5B5B66',
    border: '#E4E4EA',
    divider: '#EEEEF2',
    accent: '#B4410C',
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
} as const;

/** Arc colours for the periods drawn on the day clock. */
export const periodColors = {
    brahma: '#7DB3F5',
    abhijit: '#1D4ED8',
    gulika: '#F2A93B',
    rahu: '#D9531E',
    yama: '#8A2E0C',
} as const;

export const fonts = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
} as const;
