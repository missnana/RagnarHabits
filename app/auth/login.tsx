import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { supabase } from '../../lib/supabase';
import { spacing } from '../../lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Bitte ausfüllen', 'E-Mail und Passwort werden benötigt.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Anmeldung fehlgeschlagen', error.message);
  };

  return (
    <Screen>
      <ScreenTitle>Willkommen zurück 🐾</ScreenTitle>
      <View style={{ marginHorizontal: spacing.md, gap: spacing.md }}>
        <FormInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormInput value={password} onChangeText={setPassword} placeholder="Passwort" secureTextEntry />
        <PrimaryButton label="Anmelden" onPress={login} loading={loading} />
        <Link href="/auth/signup" style={{ textAlign: 'center', color: theme.primary, marginTop: spacing.sm }}>
          <Text>Noch keinen Account? Jetzt registrieren</Text>
        </Link>
      </View>
    </Screen>
  );
}
