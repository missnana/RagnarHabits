import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Card, CategoryPill, FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { useAuth } from '../../lib/hooks/useAuth';
import { useHousehold } from '../../lib/hooks/useHousehold';
import { guessCategory } from '../../lib/parseTranscript';
import { supabase } from '../../lib/supabase';
import { behaviorCategories, spacing, typography } from '../../lib/theme';
import type { BehaviorCategoryKey } from '../../lib/database.types';

type Phase = 'idle' | 'listening' | 'review';

export default function LogScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { household, dogs } = useHousehold();
  const activeDog = dogs[0];

  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [category, setCategory] = useState<BehaviorCategoryKey>('other');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    setCategory(guessCategory(text));
  });

  useSpeechRecognitionEvent('end', () => {
    setPhase((current) => (current === 'listening' ? 'review' : current));
  });

  useSpeechRecognitionEvent('error', (event) => {
    setPhase('idle');
    Alert.alert('Spracherkennung', event.message ?? 'Unbekannter Fehler');
  });

  const startListening = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Berechtigung fehlt', 'Bitte Mikrofon-/Spracherkennungszugriff erlauben.');
      return;
    }
    setTranscript('');
    setNote('');
    setCategory('other');
    setPhase('listening');
    ExpoSpeechRecognitionModule.start({ lang: 'de-DE', interimResults: true, continuous: false });
  };

  const stopListening = () => ExpoSpeechRecognitionModule.stop();

  const discardAndRestart = () => {
    setTranscript('');
    setNote('');
    setCategory('other');
    setPhase('idle');
  };

  const confirmAndSave = async () => {
    if (!household || !activeDog || !session?.user) {
      Alert.alert('Noch kein Hund angelegt', 'Leg zuerst unter "Hund" ein Profil an.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('behavior_events').insert({
      household_id: household.id,
      dog_id: activeDog.id,
      category,
      note: note || null,
      raw_transcript: transcript || null,
      occurred_at: new Date().toISOString(),
      created_by: session.user.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Fehler beim Speichern', error.message);
      return;
    }
    discardAndRestart();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}>
        <ScreenTitle>Eintragen</ScreenTitle>

        {phase !== 'review' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl }}>
            <Pressable
              onPress={phase === 'listening' ? stopListening : startListening}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: phase === 'listening' ? theme.danger : theme.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 64 }}>{phase === 'listening' ? '⏹️' : '🎙️'}</Text>
            </Pressable>
            <Text style={[typography.subtitle, { color: theme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
              {phase === 'listening' ? 'Ich höre zu...' : 'Zum Starten tippen'}
            </Text>
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg }}>
              {phase === 'listening'
                ? transcript || 'Sag z. B. "Ragnar hat gerade gebellt, als der Postbote kam"'
                : 'Erzähl kurz, was gerade passiert ist — der Rest läuft automatisch.'}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.md }}>
            <Card style={{ gap: spacing.sm }}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Erkannt</Text>
              <FormInput value={transcript} onChangeText={setTranscript} multiline numberOfLines={2} />
            </Card>

            <Text style={[typography.subtitle, { color: theme.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
              Kategorie
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {behaviorCategories.map((c) => (
                <CategoryPill
                  key={c.key}
                  label={c.label}
                  icon={c.icon}
                  color={c.color}
                  selected={category === c.key}
                  onPress={() => setCategory(c.key)}
                />
              ))}
            </View>

            <Text style={[typography.subtitle, { color: theme.text, marginTop: spacing.md, marginBottom: spacing.sm }]}>
              Ergänzen (optional)
            </Text>
            <FormInput value={note} onChangeText={setNote} placeholder="Details hinzufügen..." multiline numberOfLines={3} />

            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <PrimaryButton label="Bestätigen & speichern" onPress={confirmAndSave} loading={saving} />
              <PrimaryButton label="Neue Aufnahme" onPress={discardAndRestart} variant="secondary" />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
