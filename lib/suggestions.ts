/** Kleine Ideen-Sammlung für den Fall, dass "Spielen" als Nächstes vermutet wird. */
export const playSuggestions = [
  'Zerrspiel mit dem Seil',
  'Verstecken mit Leckerlis im Garten',
  'Apportieren mit dem Ball',
  'Schnüffelmatte oder Schnüffelrolle',
  'Kurzes Kommando-Training, spielerisch',
  'Zoomies im Garten zulassen',
];

export function pickSuggestion(list: string[], seed: number): string {
  return list[seed % list.length];
}
