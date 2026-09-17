import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { CategoryPill, FormInput, PrimaryButton } from './ui';
import { useTheme } from '../lib/hooks/useColorScheme';
import { supabase } from '../lib/supabase';
import { behaviorCategories, radius, spacing, toiletOutcomes, typography } from '../lib/theme';
import type { BehaviorCategoryKey, BehaviorEventRow, ToiletOutcome } from '../lib/database.types';

export function EntryEditModal({
  event,
  onClose,
  onSaved,
}: {
  event: BehaviorEventRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const [category, setCategory] = useState<BehaviorCategoryKey>('other');
  const [outcome, setOutcome] = useState<ToiletOutcome | null>(null);
  const [note, setNote] = useState('');
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    setCategory(event.category);
    setOutcome(event.outcome);
    setNote(event.note ?? '');
    setTranscript(event.raw_transcript ?? '');
  }, [event]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const { error } = await supabase
      .from('behavior_events')
      .update({
        category,
        outcome: category === 'toilet' ? outcome : null,
        note: note || null,
        raw_transcript: transcript || null,
      })
      .eq('id', event.id);
    setSaving(false);
    if (error) {
      Alert.alert('Fehler beim Speichern', error.message);
      return;
    }
    onSaved();
    onClose();
  };

  const remove = () => {
    if (!event) return;
    Alert.alert('Eintrag löschen?', 'Das kann nicht rückgängig gemacht werden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          const { error } = await supabase.from('behavior_events').delete().eq('id', event.id);
          setSaving(false);
          if (error) {
            Alert.alert('Fehler beim Löschen', error.message);
            return;
          }
          onSaved();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal transparent visible={!!event} animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable>
          <BlurView
            intensity={theme.glassIntensity + 15}
            tint={theme.glassTint}
            style={{
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.md,
              borderWidth: 1,
              borderColor: theme.surfaceBorder,
            }}
          >
            <Text style={[typography.title, { color: theme.text }]}>Eintrag bearbeiten</Text>

            <View style={{ gap: spacing.sm }}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Erkannter Text</Text>
              <FormInput value={transcript} onChangeText={setTranscript} multiline numberOfLines={2} />
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Kategorie</Text>
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

            {category === 'toilet' && (
              <View style={{ gap: spacing.sm }}>
                <Text style={[typography.caption, { color: theme.textMuted }]}>Erfolgreich?</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {toiletOutcomes.map((o) => (
                    <CategoryPill
                      key={o.key}
                      label={o.label}
                      icon={o.icon}
                      color={o.color}
                      selected={outcome === o.key}
                      onPress={() => setOutcome(o.key)}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={{ gap: spacing.sm }}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Notiz</Text>
              <FormInput value={note} onChangeText={setNote} multiline numberOfLines={2} placeholder="Details..." />
            </View>

            <View style={{ gap: spacing.sm }}>
              <PrimaryButton label="Speichern" onPress={save} loading={saving} />
              <PrimaryButton label="Eintrag löschen" onPress={remove} variant="danger" disabled={saving} />
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
