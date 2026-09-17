// Zentrales Design-System für RagnarHabits.
// Palette von der UX-Designerin vorgegeben: dunkles Grün + Ocker dominieren,
// Rose/Mauve, Mint und Indigo sind sparsame Akzente, Creme/Braun sind Neutrale.

export const palette = {
  forestDeep: '#1E3226',
  forest: '#2C4A34',
  forestLight: '#4F7A5C',
  ochreDeep: '#B98A2E',
  ochre: '#EFC873',
  ochreLight: '#F6DFA6',
  cream: '#F6F1E7',
  offWhite: '#FBFAF7',
  taupe: '#C7A489',
  charcoal: '#2E2621',
  charcoalDeep: '#1A1512',
  rose: '#B15C77',
  mint: '#A9D3CB',
  indigo: '#585A8C',
  danger: '#C1483F',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export interface Theme {
  mode: 'light' | 'dark';
  background: string;
  backgroundGradient: [string, string];
  surface: string;
  surfaceAlt: string;
  surfaceBorder: string;
  glassTint: 'light' | 'dark';
  glassIntensity: number;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
  overlay: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  background: palette.cream,
  backgroundGradient: [palette.ochreLight, palette.cream],
  surface: 'rgba(255, 255, 255, 0.55)',
  surfaceAlt: 'rgba(255, 255, 255, 0.35)',
  surfaceBorder: 'rgba(255, 255, 255, 0.6)',
  glassTint: 'light',
  glassIntensity: 45,
  border: 'rgba(46, 38, 33, 0.12)',
  text: palette.charcoal,
  textMuted: 'rgba(46, 38, 33, 0.6)',
  primary: palette.forest,
  primaryText: palette.offWhite,
  accent: palette.ochreDeep,
  accentText: palette.charcoalDeep,
  secondary: palette.rose,
  danger: palette.danger,
  warning: palette.ochreDeep,
  success: palette.forestLight,
  overlay: 'rgba(30, 26, 20, 0.45)',
};

export const darkTheme: Theme = {
  mode: 'dark',
  background: palette.charcoalDeep,
  backgroundGradient: [palette.forestDeep, palette.charcoalDeep],
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceAlt: 'rgba(255, 255, 255, 0.05)',
  surfaceBorder: 'rgba(255, 255, 255, 0.14)',
  glassTint: 'dark',
  glassIntensity: 55,
  border: 'rgba(255, 255, 255, 0.12)',
  text: palette.cream,
  textMuted: 'rgba(246, 241, 231, 0.62)',
  primary: palette.forestLight,
  primaryText: palette.charcoalDeep,
  accent: palette.ochre,
  accentText: palette.charcoalDeep,
  secondary: palette.mint,
  danger: '#E17870',
  warning: palette.ochre,
  success: palette.forestLight,
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
  { key: 'bark', label: 'Bellen', color: palette.rose, icon: '📢' },
  { key: 'walk', label: 'Spaziergang', color: palette.forest, icon: '🚶' },
  { key: 'eat', label: 'Fressen', color: palette.ochreDeep, icon: '🍖' },
  { key: 'sleep', label: 'Schlafen', color: palette.indigo, icon: '💤' },
  { key: 'play', label: 'Spielen', color: palette.rose, icon: '🎾' },
  { key: 'toilet', label: 'Lösen', color: palette.taupe, icon: '💩' },
  { key: 'training', label: 'Training', color: palette.forestLight, icon: '🎯' },
  { key: 'vet', label: 'Tierarzt', color: palette.danger, icon: '🏥' },
  { key: 'anxiety', label: 'Unruhe/Angst', color: palette.indigo, icon: '😟' },
  { key: 'other', label: 'Sonstiges', color: palette.mint, icon: '📝' },
] as const;

export type BehaviorCategoryKey = (typeof behaviorCategories)[number]['key'];
