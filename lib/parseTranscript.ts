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
  bark: ['bell', 'gebellt', 'laut', 'geknurrt'],
  walk: ['spazier', 'gassi', 'gelaufen', 'draußen'],
  eat: ['gefressen', 'essen', 'futter', 'gefüttert'],
  sleep: ['geschlafen', 'schlaf', 'müde', 'geruht'],
  play: ['gespielt', 'spielen', 'ball', 'toben'],
  toilet: ['gepinkelt', 'geloest', 'gelöst', 'kacke', 'pipi', 'geschissen'],
  training: ['training', 'geübt', 'kommando', 'sitz', 'platz'],
  vet: ['tierarzt', 'impfung', 'untersuchung', 'medikament'],
  anxiety: ['angst', 'unruhig', 'gezittert', 'gestresst', 'versteckt'],
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
