// Zentrales Design-System für RagnarHabits.
// Warme, freundliche Palette passend zu einem Hunde-Tracker.

export const palette = {
  clay: '#C96F4A', // primäre Akzentfarbe (warmes Terrakotta)
  clayDark: '#A6552F',
  clayLight: '#F1C6A9',
  moss: '#5B7B5A', // sekundär (gedämpftes Grün)
  sand: '#F6EFE6',
  sandDark: '#EDE1D1',
  ink: '#2B241E',
  inkMuted: '#6B6058',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#C0433B',
  warning: '#D79A3B',
  success: '#4C8B5A',
  overlay: 'rgba(43, 36, 30, 0.5)',
} as const;

export interface Theme {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
  overlay: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  background: palette.sand,
  surface: palette.white,
  surfaceAlt: palette.sandDark,
  border: '#E3D6C4',
  text: palette.ink,
  textMuted: palette.inkMuted,
  primary: palette.clay,
  primaryText: palette.white,
  secondary: palette.moss,
  danger: palette.danger,
  warning: palette.warning,
  success: palette.success,
  overlay: palette.overlay,
};

export const darkTheme: Theme = {
  mode: 'dark',
  background: '#1C1712',
  surface: '#241E17',
  surfaceAlt: '#2E2620',
  border: '#3A3128',
  text: '#F3EAE0',
  textMuted: '#B8AA9B',
  primary: palette.clayLight,
  primaryText: palette.ink,
  secondary: '#8DAE8B',
  danger: '#E17870',
  warning: '#E7B463',
  success: '#7BB786',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
};

export const behaviorCategories = [
  { key: 'bark', label: 'Bellen', color: '#C96F4A', icon: '📢' },
  { key: 'walk', label: 'Spaziergang', color: '#5B7B5A', icon: '🚶' },
  { key: 'eat', label: 'Fressen', color: '#D79A3B', icon: '🍖' },
  { key: 'sleep', label: 'Schlafen', color: '#6E7FA6', icon: '💤' },
  { key: 'play', label: 'Spielen', color: '#B75FA0', icon: '🎾' },
  { key: 'toilet', label: 'Lösen', color: '#8A8F6B', icon: '💩' },
  { key: 'training', label: 'Training', color: '#4C8B5A', icon: '🎯' },
  { key: 'vet', label: 'Tierarzt', color: '#C0433B', icon: '🏥' },
  { key: 'anxiety', label: 'Unruhe/Angst', color: '#9A5B8C', icon: '😟' },
  { key: 'other', label: 'Sonstiges', color: '#6B6058', icon: '📝' },
] as const;

export type BehaviorCategoryKey = (typeof behaviorCategories)[number]['key'];
