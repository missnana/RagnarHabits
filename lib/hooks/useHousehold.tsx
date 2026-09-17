import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { DogRow, HouseholdRow } from '../database.types';
import { useAuth } from './useAuth';

/**
 * Lädt den (ersten) Haushalt des eingeloggten Nutzers plus die zugehörigen Hunde.
 * Ein Nutzer landet beim Sign-up automatisch in einem eigenen Haushalt (siehe
 * supabase/schema.sql, Trigger handle_new_user) und kann per Invite-Code weiteren
 * Haushalten beitreten — für den Start reicht "einer pro Nutzer, geteilt per Invite".
 */
export function useHousehold() {
  const { session } = useAuth();
  const [household, setHousehold] = useState<HouseholdRow | null>(null);
  const [dogs, setDogs] = useState<DogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session?.user) {
      setHousehold(null);
      setDogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Ein Nutzer kann Mitglied mehrerer Haushalte sein (sein eigener + ggf.
    // beigetretene). Als aktiver Haushalt gilt der zuletzt beigetretene —
    // wer per Invite-Code dem Haushalt eines Freundes beitritt, sieht danach
    // dessen geteilte Daten. Mehrere Haushalte parallel verwalten ist bewusst
    // (noch) nicht Teil des MVP.
    const { data: memberRows, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false })
      .limit(1);

    if (memberError || !memberRows?.length) {
      setHousehold(null);
      setDogs([]);
      setLoading(false);
      return;
    }

    const { data: householdRow } = await supabase
      .from('households')
      .select('*')
      .eq('id', memberRows[0].household_id)
      .single();

    const { data: dogRows } = await supabase
      .from('dogs')
      .select('*')
      .eq('household_id', memberRows[0].household_id)
      .order('created_at', { ascending: true });

    setHousehold((householdRow as HouseholdRow) ?? null);
    setDogs((dogRows as DogRow[]) ?? []);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { household, dogs, loading, reload };
}
