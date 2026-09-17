import type { BehaviorCategoryKey } from './database.types';

/**
 * Ordnet eine deutsche Spracheingabe einer Verhaltens-Kategorie zu.
 *
 * Das ist bewusst eine einfache Keyword-Heuristik als funktionierender Start.
 * Für "richtiges" Sprachverständnis (z. B. "er hat heute Nacht dreimal
 * gebellt, als der Nachbar heimkam") ist der nächste Schritt, den
 * raw_transcript stattdessen an eine serverseitige Funktion zu schicken, die
 * ein LLM (z. B. Claude) strukturiert antworten lässt. Diese Funktion sollte
 * NICHT im Client mit einem API-Key aufgerufen werden (Store-Sicherheit!),
 * sondern über eine Supabase Edge Function / einen eigenen Server-Endpoint,
 * der den Key serverseitig hält.
 */
const keywordMap: Record<BehaviorCategoryKey, string[]> = {
  toilet: ['gepinkelt', 'geloest', 'gelöst', 'kacke', 'pipi', 'geschissen', 'haufen', 'garten', 'crate-unfall'],
  eat: ['gefressen', 'essen', 'futter', 'gefüttert', 'frühstück', 'mittag', 'abendessen'],
  sleep: ['geschlafen', 'schläft', 'eingeschlafen', 'nachtschlaf'],
  rest: ['ruhe', 'crate', 'käfig', 'körbchen', 'beruhigt'],
  play: ['gespielt', 'spielen', 'ball', 'toben', 'zoomies', 'zerrspiel'],
  cuddle: ['kuscheln', 'schoß', 'gekuschelt'],
  enrichment: ['schnüffelmatte', 'kaustange', 'beschäftigung', 'kong', 'futterball', 'schnüffelrolle', 'kauen'],
  reaction: ['bellt', 'geknurrt', 'klingel', 'erschrocken', 'unruhig', 'angst', 'ausgerastet'],
  social: ['nachbarshund', 'anderer hund', 'sozialkontakt', 'hundekontakt'],
  car: ['auto', 'autofahrt', 'autotraining'],
  training: ['training', 'geübt', 'kommando', 'sitz', 'platz'],
  wake: ['aufgewacht', 'aufwachen', 'wecker', 'wach'],
  vet: ['tierarzt', 'impfung', 'untersuchung', 'medikament'],
  observation: ['beobachtung', 'aufgefallen', 'bemerkt'],
  other: [],
};

export function guessCategory(transcript: string): BehaviorCategoryKey {
  const lower = transcript.toLowerCase();
  for (const [category, keywords] of Object.entries(keywordMap) as [BehaviorCategoryKey, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      return category;
    }
  }
  return 'other';
}
