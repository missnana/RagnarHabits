import { useMemo } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Card, Screen, ScreenTitle, StatTile } from '../../components/ui';
import { useHousehold } from '../../lib/hooks/useHousehold';
import { useEvents } from '../../lib/hooks/useEvents';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { behaviorCategories, spacing, typography } from '../../lib/theme';
import type { BehaviorEventRow } from '../../lib/database.types';

function categoryMeta(key: string) {
  return behaviorCategories.find((c) => c.key === key) ?? behaviorCategories[behaviorCategories.length - 1];
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { household, dogs } = useHousehold();
  const { events, loading, reload } = useEvents(household?.id);

  const stats = useMemo(() => {
    const last24h = events.filter((e) => Date.now() - new Date(e.occurred_at).getTime() < 24 * 60 * 60 * 1000);
    const byCategory = new Map<string, number>();
    for (const e of last24h) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
    const topEntry = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalToday: last24h.length,
      total: events.length,
      topCategory: topEntry ? categoryMeta(topEntry[0]) : null,
      topCount: topEntry?.[1] ?? 0,
    };
  }, [events]);

  const renderItem = ({ item }: { item: BehaviorEventRow }) => {
    const meta = categoryMeta(item.category);
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 22, marginRight: spacing.md }}>{meta.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[typography.subtitle, { color: theme.text }]}>{meta.label}</Text>
          {item.note ? <Text style={{ color: theme.textMuted, marginTop: 2 }}>{item.note}</Text> : null}
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>{formatTime(item.occurred_at)}</Text>
      </Card>
    );
  };

  return (
    <Screen edges={['bottom']} background={false}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View>
            <ScreenTitle>
              {dogs[0]?.name ? `${dogs[0].name}s Tag` : 'Dashboard'}
            </ScreenTitle>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.md }}>
              <StatTile label="Einträge (24h)" value={String(stats.totalToday)} />
              <StatTile
                label={stats.topCategory ? `Häufigst: ${stats.topCategory.label}` : 'Noch keine Daten'}
                value={stats.topCategory ? String(stats.topCount) : '–'}
                color={stats.topCategory?.color}
              />
            </View>
            <Text style={[typography.subtitle, { color: theme.text, marginHorizontal: spacing.md, marginBottom: spacing.sm }]}>
              Letzte Einträge
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: spacing.lg }}>
              Noch keine Einträge. Leg unter "Eintragen" den ersten Eintrag an.
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </Screen>
  );
}
