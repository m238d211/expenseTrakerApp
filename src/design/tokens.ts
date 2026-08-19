import { Appearance } from 'react-native';

const lightColors = {
  ink: '#102A43',
  inkMuted: '#52677D',
  emerald: '#0F9D75',
  emeraldDark: '#087A5A',
  mint: '#DDF6EC',
  gold: '#D6A84F',
  canvas: '#F6F8F7',
  surface: '#FFFFFF',
  border: '#DCE7E2',
  danger: '#C94C4C',
  dangerSoft: '#FCE9E9',
  white: '#FFFFFF',
  expenseSoft: '#FDECEC',
  incomeSoft: '#EAF7F1',
  primaryText: '#FFFFFF',
  balanceSurface: '#102A43',
  balanceText: '#FFFFFF',
  balanceMuted: '#B6C9C2',
  quickAddSurface: '#102A43',
  quickAddText: '#FFFFFF',
};
const darkColors = {
  ...lightColors,
  ink: '#F3F7F5',
  inkMuted: '#B7C9C2',
  canvas: '#0D1B2A',
  surface: '#172B3D',
  border: '#2B4355',
  white: '#F3F7F5',
  mint: '#183B37',
  dangerSoft: '#4A292B',
  expenseSoft: '#4A292B',
  incomeSoft: '#183B37',
  primaryText: '#07151F',
  balanceSurface: '#172B3D',
  balanceText: '#F3F7F5',
  balanceMuted: '#B7C9C2',
  quickAddSurface: '#172B3D',
  quickAddText: '#F3F7F5',
  emerald: '#36C596',
  emeraldDark: '#63D5B0',
  gold: '#E8BE67',
  danger: '#F27A7A',
};
export const colors =
  Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const typography = {
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800' as const },
  heading: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
};

export const designSystem = {
  colors,
  spacing,
  radius,
  typography,
  direction: 'rtl',
} as const;
