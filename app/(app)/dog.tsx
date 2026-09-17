import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card, FormInput, PrimaryButton, Screen, ScreenTitle } from '../../components/ui';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { useHousehold } from '../../lib/hooks/useHousehold';
import { supabase } from '../../lib/supabase';
import { spacing, typography } from '../../lib/theme';

export default function DogScreen() {
  const theme = useTheme();
  const { household, dogs, reload } = useHousehold();
  const activeDog = dogs[0];

  const [name, setName] = useState(activeDog?.name ?? '');
  const [breed, setBreed] = useState(activeDog?.breed ?? '');
  const [bio, setBio] = useState(activeDog?.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState(activeDog?.photo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Berechtigung fehlt', 'Bitte Fotozugriff erlauben, um ein Bild hochzuladen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !household) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileExt = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${household.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(path, arrayBuffer, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('dog-photos').getPublicUrl(path);
      setPhotoUrl(publicUrl.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload fehlgeschlagen', err.message ?? String(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!household) return;
    setSaving(true);
    const payload = {
      household_id: household.id,
      name: name || 'Mein Hund',
      breed: breed || null,
      bio: bio || null,
      photo_url: photoUrl,
    };
    const { error } = activeDog
      ? await supabase.from('dogs').update(payload).eq('id', activeDog.id)
      : await supabase.from('dogs').insert(payload);
    setSaving(false);
    if (error) {
      Alert.alert('Fehler beim Speichern', error.message);
      return;
    }
    await reload();
    Alert.alert('Gespeichert', 'Das Hundeprofil wurde aktualisiert.');
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <ScreenTitle>Steckbrief</ScreenTitle>

        <Card style={{ marginHorizontal: spacing.md, alignItems: 'center', gap: spacing.md }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 140, height: 140, borderRadius: 70 }} />
          ) : (
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: theme.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 40 }}>🐶</Text>
            </View>
          )}
          <PrimaryButton
            label={uploading ? 'Lädt hoch...' : 'Foto wählen'}
            onPress={pickPhoto}
            loading={uploading}
            variant="secondary"
          />
        </Card>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.md }}>
          <View>
            <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>Name</Text>
            <FormInput value={name} onChangeText={setName} placeholder="z. B. Ragnar" />
          </View>
          <View>
            <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>Rasse</Text>
            <FormInput value={breed} onChangeText={setBreed} placeholder="z. B. Mischling" />
          </View>
          <View>
            <Text style={[typography.subtitle, { color: theme.text, marginBottom: spacing.sm }]}>
              Steckbrief / Besonderheiten
            </Text>
            <FormInput
              value={bio}
              onChangeText={setBio}
              placeholder="Charakter, Vorlieben, Auffälligkeiten..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }}>
          <PrimaryButton label="Speichern" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </Screen>
  );
}
