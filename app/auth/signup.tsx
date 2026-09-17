import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { supabase } from '../../lib/supabase';
import { spacing } from '../../lib/theme';

export default function SignupScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!email || password.length < 6) {
      Alert.alert('Bitte prüfen', 'E-Mail angeben und Passwort mit mind. 6 Zeichen wählen.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Registrierung fehlgeschlagen', error.message);
      return;
    }
    Alert.alert(
      'Fast fertig',
      'Falls Bestätigungs-E-Mails aktiviert sind, bitte den Link in deiner Mailbox öffnen. Danach kannst du dich anmelden.'
    );
  };

  return (
    <Screen>
      <ScreenTitle>Konto erstellen</ScreenTitle>
      <View style={{ marginHorizontal: spacing.md, gap: spacing.md }}>
        <FormInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormInput
          value={password}
          onChangeText={setPassword}
          placeholder="Passwort (mind. 6 Zeichen)"
          secureTextEntry
        />
        <PrimaryButton label="Registrieren" onPress={signup} loading={loading} />
        <Link href="/auth/login" style={{ textAlign: 'center', color: theme.primary, marginTop: spacing.sm }}>
          <Text>Schon einen Account? Anmelden</Text>
        </Link>
      </View>
    </Screen>
  );
}
