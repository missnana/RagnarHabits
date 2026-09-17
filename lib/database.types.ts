// Handgeschriebene Typen passend zu supabase/schema.sql.
// Bei Schema-Änderungen: idealerweise mit `supabase gen types typescript` neu generieren.

export type BehaviorCategoryKey =
  | 'bark'
  | 'walk'
  | 'eat'
  | 'sleep'
  | 'play'
  | 'toilet'
  | 'training'
  | 'vet'
  | 'anxiety'
  | 'other';

export interface HouseholdRow {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMemberRow {
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface DogRow {
  id: string;
  household_id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface BehaviorEventRow {
  id: string;
  household_id: string;
  dog_id: string;
  category: BehaviorCategoryKey;
  note: string | null;
  raw_transcript: string | null;
  occurred_at: string;
  created_by: string;
  created_at: string;
}

// Bewusst kein generisches `Database`-Typing für den Supabase-Client (siehe
// supabase.ts): Supabase-js' generische Typen sind sehr streng (erwarten u.a.
// explizite `Relationships`, passend zu `supabase gen types`-Output) und
// lohnen sich erst, wenn die Typen automatisch aus dem echten Schema generiert
// werden. Bis dahin werden Query-Ergebnisse an den Aufrufstellen manuell auf
// die Row-Interfaces oben gecastet.
