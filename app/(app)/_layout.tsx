import { Slot } from 'expo-router';
import { View } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { useTheme } from '../../lib/hooks/useColorScheme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader />
      <Slot />
    </View>
  );
}
