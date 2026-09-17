import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader } from '../../components/AppHeader';
import { useTheme } from '../../lib/hooks/useColorScheme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.backgroundGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <AppHeader />
      <Slot />
    </View>
  );
}
