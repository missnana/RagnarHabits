import { behaviorCategories } from './theme';
import type { BehaviorEventRow } from './database.types';

export interface Prediction {
  category: (typeof behaviorCategories)[number];
  predictedAt: number;
}

/**
 * Sehr einfache Heuristik: nimmt die Kategorie mit den meisten bisherigen
 * Einträgen (mind. 3, um einen Durchschnitt zu rechtfertigen), berechnet den
 * durchschnittlichen Abstand zwischen den Vorkommen und projiziert ihn ab
 * dem letzten Vorkommen. Kein Ersatz für echte Vorhersage-Modelle, aber ein
 * nützlicher erster Anhaltspunkt ("wann kommt vermutlich der nächste...").
 */
export function predictNext(events: BehaviorEventRow[]): Prediction | null {
  const byCategory = new Map<string, BehaviorEventRow[]>();
  for (const e of events) {
    const list = byCategory.get(e.category) ?? [];
    list.push(e);
    byCategory.set(e.category, list);
  }

  let bestKey: string | null = null;
  let bestList: BehaviorEventRow[] = [];
  for (const [key, list] of byCategory) {
    if (list.length >= 3 && list.length > bestList.length) {
      bestKey = key;
      bestList = list;
    }
  }
  if (!bestKey) return null;

  const sorted = [...bestList].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(new Date(sorted[i].occurred_at).getTime() - new Date(sorted[i - 1].occurred_at).getTime());
  }
  const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const lastAt = new Date(sorted[sorted.length - 1].occurred_at).getTime();
  const category = behaviorCategories.find((c) => c.key === bestKey);
  if (!category) return null;

  return { category, predictedAt: lastAt + avgMs };
}

export function formatRelative(targetMs: number): string {
  const diffMs = targetMs - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const hours = abs / (1000 * 60 * 60);
  const value = hours < 1 ? `${Math.round(hours * 60)} Min.` : hours < 24 ? `${Math.round(hours)} Std.` : `${Math.round(hours / 24)} Tg.`;
  return overdue ? `überfällig seit ${value}` : `in ca. ${value}`;
}
