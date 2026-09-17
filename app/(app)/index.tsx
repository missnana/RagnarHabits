import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, Text, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Card, CategoryPill, Content, FadeIn, FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { DogRunner } from '../../components/DogRunner';
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
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'listening') {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);

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
    <Screen edges={['bottom']} background={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}>
        <ScreenTitle center>Verhalten festhalten</ScreenTitle>

        {phase !== 'review' ? (
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.xxl + spacing.lg }}>
            <DogRunner breed={activeDog?.breed} running={phase === 'idle'} />
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center' }}>
                {phase === 'listening' && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                      backgroundColor: theme.danger,
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
                    }}
                  />
                )}
                <AnimatedPressable onPress={phase === 'listening' ? stopListening : startListening}>
                  <View
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                      backgroundColor: phase === 'listening' ? theme.danger : theme.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 64 }}>{phase === 'listening' ? '⏹️' : '🎙️'}</Text>
                  </View>
                </AnimatedPressable>
              </View>
              <Text style={[typography.subtitle, { color: theme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
                {phase === 'listening' ? 'Ich höre zu...' : 'Zum Starten tippen'}
              </Text>
              <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg }}>
                {phase === 'listening'
                  ? transcript || 'Sag z. B. "Ragnar hat gerade gebellt, als der Postbote kam"'
                  : 'Erzähl kurz, was gerade passiert ist — der Rest läuft automatisch.'}
              </Text>
            </View>
          </View>
        ) : (
          <FadeIn>
            <Content>
              <Card style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: theme.textMuted }]}>Erkannt</Text>
                <FormInput value={transcript} onChangeText={setTranscript} multiline numberOfLines={2} />
              </Card>

              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.subtitle, { color: theme.text }]}>Kategorie</Text>
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

              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.subtitle, { color: theme.text }]}>Ergänzen (optional)</Text>
                <FormInput value={note} onChangeText={setNote} placeholder="Details hinzufügen..." multiline numberOfLines={3} />
              </View>

              <View style={{ gap: spacing.sm }}>
                <PrimaryButton label="Bestätigen & speichern" onPress={confirmAndSave} loading={saving} />
                <PrimaryButton label="Neue Aufnahme" onPress={discardAndRestart} variant="secondary" />
              </View>
            </Content>
          </FadeIn>
        )}
      </ScrollView>
    </Screen>
  );
}
