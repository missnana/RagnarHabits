import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
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

export default function LogScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { household, dogs } = useHousehold();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [category, setCategory] = useState<BehaviorCategoryKey>('other');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    setCategory(guessCategory(text));
  });

  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    Alert.alert('Spracherkennung', event.message ?? 'Unbekannter Fehler');
  });

  const startListening = async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Berechtigung fehlt', 'Bitte Mikrofon-/Spracherkennungszugriff erlauben.');
      return;
    }
    setTranscript('');
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'de-DE', interimResults: true, continuous: false });
  };

  const stopListening = () => {
    ExpoSpeechRecognitionModule.stop();
    setIsListening(false);
  };

  const activeDog = dogs[0];

  const saveEvent = async () => {
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
    setTranscript('');
    setNote('');
    setCategory('other');
    Alert.alert('Gespeichert', 'Der Eintrag wurde gespeichert und ist für alle im Haushalt sichtbar.');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenTitle>Eintragen</ScreenTitle>

        <Card style={{ marginHorizontal: spacing.md, alignItems: 'center', gap: spacing.sm }}>
          <PrimaryButton
            label={isListening ? '⏹️ Aufnahme stoppen' : '🎙️ Sprachaufnahme starten'}
            onPress={isListening ? stopListening : startListening}
            variant={isListening ? 'danger' : 'primary'}
          />
          <Text style={{ color: theme.textMuted, textAlign: 'center' }}>
            Sag z. B. "Ragnar hat gerade gebellt, als der Postbote kam"
          </Text>
        </Card>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }}>
          <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>
            Erkannter Text
          </Text>
          <FormInput
            value={transcript}
            onChangeText={setTranscript}
            placeholder="wird automatisch befüllt, oder tippe selbst"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }}>
          <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>Kategorie</Text>
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
        </View>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>Notiz (optional)</Text>
          <FormInput value={note} onChangeText={setNote} placeholder="Zusätzliche Details..." multiline numberOfLines={3} />
        </View>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }}>
          <PrimaryButton label="Eintrag speichern" onPress={saveEvent} loading={saving} />
        </View>
      </ScrollView>
    </Screen>
  );
}
