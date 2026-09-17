#!/usr/bin/env node
// Einmaliges Skript, um das historische Excel-Log (16.-17.09.2026) in Supabase
// zu importieren. Siehe README "Historische Daten importieren".
//
// Voraussetzungen: .env.local mit EXPO_PUBLIC_SUPABASE_URL/ANON_KEY, ein
// bestehender Account und ein angelegtes Hundeprofil.
//
// Nutzung: node scripts/import-log.mjs <email> <passwort>

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { historicalEvents } from './import-log-data.mjs';

function loadEnvLocal() {
  try {
    const content = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
      if (match) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // .env.local optional, falls Variablen bereits exportiert sind
  }
}
loadEnvLocal();

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('Nutzung: node scripts/import-log.mjs <email> <passwort>');
  process.exit(1);
}

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  const { data: member, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', auth.user.id)
    .limit(1)
    .single();
  if (memberError) throw memberError;

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select('id')
    .eq('household_id', member.household_id)
    .limit(1)
    .single();
  if (dogError) throw new Error('Kein Hundeprofil gefunden — erst unter "Hund" anlegen, dann importieren.');

  const payload = historicalEvents.map((e) => ({
    household_id: member.household_id,
    dog_id: dog.id,
    category: e.category,
    outcome: e.outcome,
    note: e.note,
    raw_transcript: null,
    occurred_at: e.occurred_at,
    created_by: auth.user.id,
  }));

  const { error: insertError } = await supabase.from('behavior_events').insert(payload);
  if (insertError) throw insertError;

  console.log(`${payload.length} historische Einträge importiert.`);
}

main().catch((err) => {
  console.error('Import fehlgeschlagen:', err.message ?? err);
  process.exit(1);
});
