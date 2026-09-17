import { behaviorCategories } from './theme';
import type { BehaviorCategoryKey, BehaviorEventRow } from './database.types';

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

export interface TriggerCorrelation {
  trigger: (typeof behaviorCategories)[number];
  avgMinutes: number | null;
  successCount: number;
  failedAttemptsAfter: number;
}

const TRIGGER_CATEGORIES: BehaviorCategoryKey[] = ['eat', 'wake', 'play'];
// Bewusst eng: Lösen-Versuche Stunden später hängen kaum noch mit dem Auslöser
// zusammen. Gegen die echten Log-Daten getestet — 1h liefert plausible,
// belastbare Ø-Werte statt durch spätere, unabhängige Lösen-Versuche verzerrt
// zu werden.
const CORRELATION_WINDOW_MINUTES = 60;

/**
 * Nachbau der manuellen Excel-Analyse: "Nach Füttern/Aufwachen/Spielen — wie
 * lange bis zum erfolgreichen Lösen, und wie viele erfolglose Versuche kamen
 * dazwischen?" Betrachtet je Trigger-Ereignis die Lösen-Einträge innerhalb
 * eines engen Zeitfensters danach.
 */
export function computeTriggerCorrelations(events: BehaviorEventRow[]): TriggerCorrelation[] {
  const toiletEvents = [...events.filter((e) => e.category === 'toilet')].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );

  return TRIGGER_CATEGORIES.map((key) => {
    const triggerEvents = events.filter((e) => e.category === key);
    let successCount = 0;
    let failedAttemptsAfter = 0;
    const minutesToSuccess: number[] = [];

    for (const trig of triggerEvents) {
      const trigTime = new Date(trig.occurred_at).getTime();
      const windowEnd = trigTime + CORRELATION_WINDOW_MINUTES * 60 * 1000;
      const following = toiletEvents.filter((t) => {
        const t_ms = new Date(t.occurred_at).getTime();
        return t_ms > trigTime && t_ms <= windowEnd;
      });

      for (const t of following) {
        if (t.outcome === 'success') {
          successCount++;
          minutesToSuccess.push((new Date(t.occurred_at).getTime() - trigTime) / 60000);
          break;
        }
        if (t.outcome === 'fail' || t.outcome === 'wrong_place') {
          failedAttemptsAfter++;
        }
      }
    }

    const category = behaviorCategories.find((c) => c.key === key)!;
    const avgMinutes = minutesToSuccess.length
      ? minutesToSuccess.reduce((a, b) => a + b, 0) / minutesToSuccess.length
      : null;
    return { trigger: category, avgMinutes, successCount, failedAttemptsAfter };
  }).filter((r) => r.successCount > 0 || r.failedAttemptsAfter > 0);
}

export interface ToiletSummary {
  success: number;
  wrongPlace: number;
  fail: number;
  total: number;
  rate: number | null;
}

export function toiletSummary(events: BehaviorEventRow[]): ToiletSummary {
  const toiletEvents = events.filter((e) => e.category === 'toilet');
  const success = toiletEvents.filter((e) => e.outcome === 'success').length;
  const wrongPlace = toiletEvents.filter((e) => e.outcome === 'wrong_place').length;
  const fail = toiletEvents.filter((e) => e.outcome === 'fail').length;
  const total = toiletEvents.length;
  return { success, wrongPlace, fail, total, rate: total > 0 ? Math.round((success / total) * 100) : null };
}

export function formatRelative(targetMs: number): string {
  const diffMs = targetMs - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const hours = abs / (1000 * 60 * 60);
  const value = hours < 1 ? `${Math.round(hours * 60)} Min.` : hours < 24 ? `${Math.round(hours)} Std.` : `${Math.round(hours / 24)} Tg.`;
  return overdue ? `überfällig seit ${value}` : `in ca. ${value}`;
}
