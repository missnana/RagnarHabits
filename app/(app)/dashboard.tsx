import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Card, Content, Screen, ScreenTitle, StatTile } from '../../components/ui';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { WeekStrip, currentWeekDays, isSameDay } from '../../components/WeekStrip';
import { EntryEditModal } from '../../components/EntryEditModal';
import { useHousehold } from '../../lib/hooks/useHousehold';
import { useEvents } from '../../lib/hooks/useEvents';
import { useTheme } from '../../lib/hooks/useColorScheme';
import { predictNext, formatRelative, computeTriggerCorrelations, toiletSummary } from '../../lib/predict';
import { behaviorCategories, spacing, typography } from '../../lib/theme';
import type { BehaviorEventRow } from '../../lib/database.types';

function categoryMeta(key: string) {
  return behaviorCategories.find((c) => c.key === key) ?? behaviorCategories[behaviorCategories.length - 1];
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDay(d: Date) {
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { household, dogs } = useHousehold();
  const { events, loading, reload } = useEvents(household?.id);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editing, setEditing] = useState<BehaviorEventRow | null>(null);

  const weekDays = currentWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const visibleEvents = useMemo(() => {
    if (selectedDay) {
      return events.filter((e) => isSameDay(new Date(e.occurred_at), selectedDay));
    }
    return events.filter((e) => {
      const d = new Date(e.occurred_at);
      return d >= weekStart && d <= new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
    });
  }, [events, selectedDay, weekStart, weekEnd]);

  const stats = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of visibleEvents) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
    const topEntry = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: visibleEvents.length,
      topCategory: topEntry ? categoryMeta(topEntry[0]) : null,
      topCount: topEntry?.[1] ?? 0,
    };
  }, [visibleEvents]);

  const prediction = useMemo(() => predictNext(events), [events]);
  const correlations = useMemo(() => computeTriggerCorrelations(events), [events]);
  const toilet = useMemo(() => toiletSummary(events), [events]);

  const renderItem = ({ item }: { item: BehaviorEventRow }) => {
    const meta = categoryMeta(item.category);
    return (
      <AnimatedPressable onPress={() => setEditing(item)} style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, marginRight: spacing.md }}>{meta.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[typography.subtitle, { color: theme.text }]}>{meta.label}</Text>
            {item.note ? <Text style={{ color: theme.textMuted, marginTop: 2 }}>{item.note}</Text> : null}
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{formatTime(item.occurred_at)}</Text>
        </Card>
      </AnimatedPressable>
    );
  };

  return (
    <Screen edges={['bottom']} background={false}>
      <FlatList
        data={visibleEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View>
            <ScreenTitle>{dogs[0]?.name ? `${dogs[0].name}s Woche` : 'Dashboard'}</ScreenTitle>

            <Content style={{ marginBottom: spacing.md }}>
              <WeekStrip selected={selectedDay} onSelect={setSelectedDay} />

              {prediction && (
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontSize: 22 }}>{prediction.category.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>Vermutlich als Nächstes</Text>
                    <Text style={[typography.subtitle, { color: theme.text }]}>
                      {prediction.category.label} · {formatRelative(prediction.predictedAt)}
                    </Text>
                  </View>
                </Card>
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <StatTile label={selectedDay ? formatDay(selectedDay) : 'Diese Woche'} value={String(stats.total)} />
                <StatTile
                  label={stats.topCategory ? `Häufigst: ${stats.topCategory.label}` : 'Noch keine Daten'}
                  value={stats.topCategory ? String(stats.topCount) : '–'}
                  color={stats.topCategory?.color}
                />
              </View>

              {toilet.total > 0 && (
                <Card style={{ gap: spacing.xs }}>
                  <Text style={[typography.subtitle, { color: theme.text }]}>Lösen – Erfolgsquote</Text>
                  <Text style={[typography.display, { color: theme.primary }]}>{toilet.rate}%</Text>
                  <Text style={{ color: theme.textMuted }}>
                    {toilet.success}× erfolgreich draußen · {toilet.wrongPlace}× falscher Ort · {toilet.fail}× erfolglos
                  </Text>
                </Card>
              )}

              {correlations.length > 0 && (
                <Card style={{ gap: spacing.sm }}>
                  <Text style={[typography.subtitle, { color: theme.text }]}>Was hilft beim Lösen?</Text>
                  {correlations.map((c) => (
                    <View key={c.trigger.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{c.trigger.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '600' }}>
                          Nach {c.trigger.label}
                          {c.avgMinutes != null ? ` · Ø ${Math.round(c.avgMinutes)} Min. bis Erfolg` : ''}
                        </Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                          {c.successCount}× erfolgreich, {c.failedAttemptsAfter}× erfolglose Versuche davor
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>
              )}
            </Content>

            <Text style={[typography.subtitle, { color: theme.text, marginHorizontal: spacing.md, marginBottom: spacing.sm }]}>
              {selectedDay ? formatDay(selectedDay) : 'Einträge dieser Woche'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: spacing.lg }}>
              {selectedDay ? 'Keine Einträge an diesem Tag.' : 'Noch keine Einträge. Leg unter "Eintragen" den ersten Eintrag an.'}
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />

      <EntryEditModal event={editing} onClose={() => setEditing(null)} onSaved={reload} />
    </Screen>
  );
}
