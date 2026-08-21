import { Appearance } from 'react-native';

const lightColors = {
  ink: '#14213D',
  inkMuted: '#667085',
  emerald: '#14B8A6',
  emeraldDark: '#0F8F82',
  mint: '#E8EDFF',
  gold: '#D59B32',
  canvas: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  navSurface: '#FFFFFF',
  navActiveSurface: '#E8EDFF',
  border: '#E6EAF2',
  borderAccent: '#C9D5FF',
  danger: '#D95C5C',
  dangerSoft: '#FFF0F0',
  white: '#FFFFFF',
  expenseSoft: '#FFF1F2',
  incomeSoft: '#EAFBF7',
  primaryText: '#FFFFFF',
  balanceSurface: '#14213D',
  balanceText: '#FFFFFF',
  balanceMuted: '#B8C5E6',
  quickAddSurface: '#3B5CCC',
  quickAddText: '#FFFFFF',
};
const darkColors = {
  ...lightColors,
  ink: '#F7F9FC',
  inkMuted: '#A9B4C7',
  canvas: '#0B1220',
  surface: '#121C2F',
  surfaceElevated: '#17243A',
  navSurface: '#121C2F',
  navActiveSurface: '#24345E',
  border: '#263653',
  borderAccent: '#40589A',
  white: '#F7F9FC',
  mint: '#24345E',
  dangerSoft: '#3B202A',
  expenseSoft: '#3B202A',
  incomeSoft: '#123B3A',
  primaryText: '#0B1220',
  balanceSurface: '#17243A',
  balanceText: '#F7F9FC',
  balanceMuted: '#B8C5E6',
  quickAddSurface: '#536DDE',
  quickAddText: '#FFFFFF',
  emerald: '#37D5BE',
  emeraldDark: '#65E4D1',
  gold: '#F0BE57',
  danger: '#FF8B8B',
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
