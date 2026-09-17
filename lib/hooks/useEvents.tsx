import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { BehaviorEventRow } from '../database.types';

/**
 * Lädt die Verhaltens-Einträge eines Haushalts und hält sie per Realtime
 * synchron — trägt dein Freund einen Eintrag ein, taucht er hier automatisch
 * auf, ganz ohne manuellen Sync-Knopf.
 */
export function useEvents(householdId: string | undefined) {
  const [events, setEvents] = useState<BehaviorEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!householdId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('behavior_events')
      .select('*')
      .eq('household_id', householdId)
      .order('occurred_at', { ascending: false })
      .limit(200);
    setEvents((data as BehaviorEventRow[]) ?? []);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    reload();
    if (!householdId) return;

    const channel = supabase
      .channel(`behavior_events:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'behavior_events', filter: `household_id=eq.${householdId}` },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, reload]);

  return { events, loading, reload };
}
