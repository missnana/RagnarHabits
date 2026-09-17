import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../lib/hooks/useColorScheme';

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 20 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: () => <TabIcon symbol="🏠" /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Eintragen', tabBarIcon: () => <TabIcon symbol="🎙️" /> }}
      />
      <Tabs.Screen
        name="dog"
        options={{ title: 'Hund', tabBarIcon: () => <TabIcon symbol="🐾" /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Einstellungen', tabBarIcon: () => <TabIcon symbol="⚙️" /> }}
      />
    </Tabs>
  );
}
