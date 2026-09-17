import { useColorScheme as useRNColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../theme';

export function useTheme(): Theme {
  const scheme = useRNColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
