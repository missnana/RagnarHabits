import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { Card, FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useHousehold } from '../../lib/hooks/useHousehold';
import { supabase } from '../../lib/supabase';
import { spacing, typography } from '../../lib/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { household, reload } = useHousehold();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const shareInvite = async () => {
    if (!household) return;
    await Share.share({
      message: `Tritt meinem RagnarHabits-Haushalt bei! Öffne die App → Einstellungen → Code eingeben: ${household.invite_code}`,
    });
  };

  const joinHousehold = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    const { error } = await supabase.rpc('join_household_by_invite_code', { code: joinCode.trim() });
    setJoining(false);
    if (error) {
      Alert.alert('Beitritt fehlgeschlagen', error.message);
      return;
    }
    setJoinCode('');
    await reload();
    Alert.alert('Beigetreten', 'Du siehst jetzt die geteilten Daten dieses Haushalts.');
  };

  return (
    <Screen edges={['bottom']}>
      <ScreenTitle>Einstellungen</ScreenTitle>

      <Card style={{ marginHorizontal: spacing.md, marginBottom: spacing.md }}>
        <Text style={[typography.subtitle, { color: theme.text }]}>Angemeldet als</Text>
        <Text style={{ color: theme.textMuted }}>{session?.user.email}</Text>
      </Card>

      <Card style={{ marginHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm }}>
        <Text style={[typography.subtitle, { color: theme.text }]}>Haushalt teilen</Text>
        <Text style={{ color: theme.textMuted }}>
          Teile diesen Code mit deinem Freund/deiner Freundin, damit ihr denselben Hund und dieselben
          Einträge seht.
        </Text>
        <Text style={[typography.display, { color: theme.primary, letterSpacing: 4 }]}>
          {household?.invite_code ?? '...'}
        </Text>
        <PrimaryButton label="Code teilen" onPress={shareInvite} variant="secondary" />
      </Card>

      <Card style={{ marginHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm }}>
        <Text style={[typography.subtitle, { color: theme.text }]}>Einem Haushalt beitreten</Text>
        <Text style={{ color: theme.textMuted }}>
          Hast du einen Code von jemandem erhalten? Hier eintragen, um dieselben Daten zu sehen.
        </Text>
        <FormInput
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="z. B. a1b2c3d4"
          autoCapitalize="none"
        />
        <PrimaryButton label="Beitreten" onPress={joinHousehold} loading={joining} />
      </Card>

      <View style={{ marginHorizontal: spacing.md }}>
        <PrimaryButton label="Abmelden" onPress={signOut} variant="danger" />
      </View>
    </Screen>
  );
}
