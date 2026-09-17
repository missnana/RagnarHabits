import { Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { useTheme } from '../lib/hooks/useColorScheme';
import { radius, spacing } from '../lib/theme';

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Woche beginnt Montag
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function currentWeekDays() {
  const monday = startOfWeek(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Wochenfokus-Leiste: Standardansicht ist die ganze Woche. Ein Tag antippen
 * zoomt auf diesen Tag; erneutes Antippen zoomt wieder auf die Woche raus.
 */
export function WeekStrip({ selected, onSelect }: { selected: Date | null; onSelect: (day: Date | null) => void }) {
  const theme = useTheme();
  const days = currentWeekDays();
  const today = new Date();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {days.map((d, i) => {
        const isSelected = !!selected && isSameDay(d, selected);
        const isToday = isSameDay(d, today);
        return (
          <AnimatedPressable key={i} onPress={() => onSelect(isSelected ? null : d)} style={{ flex: 1 }}>
            <View
              style={{
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: isSelected ? theme.primary : isToday ? theme.surfaceAlt : 'transparent',
                borderWidth: 1,
                borderColor: isToday && !isSelected ? theme.primary : 'transparent',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? theme.primaryText : theme.textMuted }}>
                {WEEKDAY_LABELS[i]}
              </Text>
              <Text style={{ fontSize: 15, marginTop: 2, fontWeight: '700', color: isSelected ? theme.primaryText : theme.text }}>
                {d.getDate()}
              </Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}
