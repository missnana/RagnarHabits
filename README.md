# RagnarHabits

Eine App zum Tracken des Verhaltens deines Hundes per Sprach-Eingabe, mit
automatischer Auswertung im Dashboard und geteilten Daten für dich und
weitere Personen (z. B. deinen Partner/Freund).

## Tech-Stack

- **React Native + Expo (SDK 57)** — eine Codebasis für iOS und Android.
- **expo-router** — dateibasiertes Routing (`app/`-Verzeichnis).
- **Supabase** (Postgres + Auth + Realtime + Storage) — Backend, Login und
  automatischer Sync zwischen Geräten/Nutzern. Kein manueller "Sync-Knopf"
  nötig, Änderungen erscheinen per Realtime bei allen Haushaltsmitgliedern.
- **expo-speech-recognition** — native Sprache-zu-Text-Erkennung (Deutsch).

## Projektstruktur

```
app/                    Screens (expo-router: Ordner/Dateien = Routen)
  auth/                 Login & Registrierung
  (tabs)/               Hauptbereich nach Login: Dashboard, Eintragen, Hund, Einstellungen
  _layout.tsx           Root-Layout, regelt Auth-Redirects
components/ui.tsx       Gemeinsame UI-Bausteine (Button, Card, Pill, ...)
lib/
  theme.ts              Farben, Typografie, Kategorien-Definitionen
  supabase.ts           Supabase-Client
  database.types.ts     Typen passend zum SQL-Schema
  parseTranscript.ts    Heuristik: Sprachtext → Kategorie (siehe Hinweis unten)
  hooks/                useAuth, useHousehold, useEvents
supabase/schema.sql      Datenbank-Schema inkl. Row-Level-Security
```

## Datenmodell & Sharing

- `households` — eine Gruppe, die sich Daten teilt (du + Freund).
- `household_members` — wer gehört zu welchem Haushalt.
- `dogs` — gehören einem Haushalt, nicht einer einzelnen Person.
- `behavior_events` — die eigentlichen Tracking-Einträge.

Bei der Registrierung wird automatisch ein eigener Haushalt angelegt. Über
**Einstellungen → Code teilen** gibst du deinem Freund einen Einladungscode;
er/sie trägt ihn unter **Einstellungen → Einem Haushalt beitreten** ein und
seht danach dieselben Hunde/Einträge — automatisch synchronisiert, ohne
manuellen Export/Import.

## Setup

1. Ein Supabase-Projekt anlegen: https://supabase.com/dashboard (kostenloser
   Tier reicht zum Start; Region idealerweise in der EU wählen, siehe
   Datenschutz-Hinweise unten).
2. Im Supabase SQL-Editor den Inhalt von `supabase/schema.sql` ausführen.
3. In den Project Settings → API die `Project URL` und den `anon public key`
   kopieren.
4. `.env.example` nach `.env.local` kopieren und beide Werte eintragen.
5. Abhängigkeiten installieren: `npm install`
6. App starten: `npm start` (dann `w` für Web, oder mit Expo Go / Dev Client
   auf dem Handy scannen).

**Hinweis zur Sprach-Eingabe:** `expo-speech-recognition` ist ein natives
Modul und läuft nicht in der klassischen Expo-Go-App. Für Tests auf dem
echten Gerät braucht es einen Expo **Dev Client** (`npx expo run:android` /
`npx expo run:ios`) oder einen EAS-Build. Im Web-Preview funktioniert die
restliche App (Dashboard, Hundeprofil, Sharing) unabhängig davon.

## Auf Handys testen / für den Store vorbereiten

- Entwicklung: `npx expo run:android` bzw. `npx expo run:ios` (baut einen
  Dev Client, der native Module wie Speech-Recognition enthält).
- Für den Store: **EAS Build** (`npx eas build`) erzeugt signierte
  Android/iOS-Pakete; **EAS Submit** lädt sie zu Play Store / App Store Connect
  hoch. Dafür werden ein Apple Developer- und ein Google Play Console-Account
  benötigt (jeweils kostenpflichtig).

## Datenschutz & Sicherheit

- **Row-Level-Security**: Jede Datenbank-Regel stellt sicher, dass nur
  Mitglieder desselben Haushalts dessen Daten sehen/ändern können — es gibt
  keinen Weg, an fremde Daten zu kommen, selbst mit dem (öffentlichen)
  Anon-Key.
- **Keine Secrets im App-Bundle**: Nur der Supabase-`anon key` steckt im
  Client, keine LLM-API-Keys. Für die geplante LLM-gestützte Auswertung der
  Sprache (statt der aktuellen Keyword-Heuristik in `parseTranscript.ts`)
  sollte ein Server-Endpoint (z. B. Supabase Edge Function) den eigentlichen
  API-Key halten.
- **Datenresidenz**: Supabase erlaubt die Wahl der Server-Region (z. B.
  Frankfurt) — relevant für DSGVO-Konformität, falls die App später für
  andere Nutzer im Store angeboten wird.
- **Vor Store-Veröffentlichung** zusätzlich nötig: Datenschutzerklärung,
  Löschfunktion für den eigenen Account/Daten (DSGVO-Auskunfts-/
  Löschrecht), ggf. Verschlüsselung sensibler Felder.

## Aktuelle Vereinfachungen (bewusst, für den MVP)

- Ein Nutzer sieht immer nur den **zuletzt beigetretenen** Haushalt aktiv
  (kein Umschalten zwischen mehreren Haushalten in der UI).
- Sprache → Kategorie ist eine einfache Keyword-Heuristik, kein echtes LLM.
- Es gibt genau ein Hundeprofil pro Haushalt (Mehrere-Hunde-Support ist im
  Datenmodell aber bereits angelegt, `dogs` ist eine Liste).
