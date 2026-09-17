import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/hooks/useAuth';
import { useTheme } from '../lib/hooks/useColorScheme';

function RootNavigation() {
  const { session, loading } = useAuth();
  const theme = useTheme();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const isAuthRoute = pathname.startsWith('/auth');

  if (!session && !isAuthRoute) {
    return <Redirect href="/auth/login" />;
  }
  if (session && isAuthRoute) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigation />
    </AuthProvider>
  );
}
