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
- **expo-blur / expo-linear-gradient** — Glass/Blur-Optik, Farbverläufe.

## Projektstruktur

```
app/
  auth/                 Login & Registrierung
  (app)/                Hauptbereich nach Login:
    index.tsx             Eintragen (Startseite) — Sprachaufnahme
    dashboard.tsx          Wochenübersicht, Vorhersage, Erfolgsquote
    dog.tsx                Hundeprofil (Steckbrief, Foto)
    settings.tsx            Account, Haushalt teilen/beitreten
    _layout.tsx            Farbverlauf-Hintergrund + AppHeader
  _layout.tsx           Root-Layout, regelt Auth-Redirects
components/
  ui.tsx                Gemeinsame UI-Bausteine (Button, Card, Content, ...)
  AppHeader.tsx         Menü-Icon oben rechts, Dropdown-Navigation
  DogRunner.tsx          Animierte Hunde-Silhouette im Hintergrund
  IridescentHalo.tsx     Schimmernder Glow hinter dem Mikro-Button
  EntryEditModal.tsx     Eintrag bearbeiten (Bottom-Sheet)
  WeekStrip.tsx          Wochenfokus-Kalenderleiste
lib/
  theme.ts              Farben, Typografie, Kategorien-/Outcome-Definitionen
  supabase.ts           Supabase-Client
  database.types.ts     Typen passend zum SQL-Schema
  parseTranscript.ts    Heuristik: Sprachtext → Kategorie
  predict.ts            Vorhersage-Heuristik + Trigger-Korrelationsanalyse
  hooks/                useAuth, useHousehold, useEvents
supabase/schema.sql      Datenbank-Schema inkl. Row-Level-Security
scripts/import-log.mjs   Einmaliger Import historischer Excel-Daten
```

## Datenmodell & Sharing

- `households` — eine Gruppe, die sich Daten teilt (du + Freund).
- `household_members` — wer gehört zu welchem Haushalt.
- `dogs` — gehören einem Haushalt, nicht einer einzelnen Person.
- `behavior_events` — die eigentlichen Tracking-Einträge: Kategorie, optional
  ein `outcome` (nur bei `category = 'toilet'`: `success` / `wrong_place` /
  `fail`, fürs Haustraining-Tracking), Notiz, erkannter Text, Zeitpunkt.

Bei der Registrierung wird automatisch ein eigener Haushalt angelegt. Über
**Menü → Einstellungen → Code teilen** gibst du deinem Freund einen
Einladungscode; er/sie trägt ihn unter **Einstellungen → Einem Haushalt
beitreten** ein und seht danach dieselben Hunde/Einträge — automatisch
synchronisiert, ohne manuellen Export/Import.

## Automatische Auswertung

- **Dashboard-Wochenleiste**: Standardansicht ist die aktuelle Woche, ein Tag
  antippen zoomt auf diesen Tag (erneutes Antippen zoomt zurück).
- **"Vermutlich als Nächstes"**: einfache Heuristik, die aus dem
  durchschnittlichen Abstand zwischen bisherigen Einträgen einer Kategorie
  den nächsten voraussichtlichen Zeitpunkt schätzt.
- **Lösen-Erfolgsquote & Trigger-Korrelationen** ("Was hilft beim Lösen?"):
  rechnet nach, wie oft und wie schnell nach Füttern/Aufwachen/Spielen
  erfolgreich gelöst wurde, inkl. erfolgloser Versuche dazwischen — der
  gleiche Gedanke wie die manuelle Analyse in der ursprünglichen
  Excel-Tabelle, jetzt automatisch aus den echten Einträgen berechnet.

Beides sind bewusst einfache, nachvollziehbare Heuristiken (kein
ML-Modell) — ein guter erster Schritt, der mit mehr Daten zuverlässiger wird.

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
7. Registrieren, unter "Hund" ein Profil anlegen.

**Hinweis zur Sprach-Eingabe:** `expo-speech-recognition` ist ein natives
Modul und läuft nicht in der klassischen Expo-Go-App. Für Tests auf dem
echten Gerät braucht es einen Expo **Dev Client** (`npx expo run:android` /
`npx expo run:ios`) oder einen EAS-Build. Im Web-Preview funktioniert die
restliche App (Dashboard, Hundeprofil, Sharing) unabhängig davon.

## Historische Daten importieren

Die ursprüngliche Excel-Tabelle (16.–17.09.) lässt sich einmalig übernehmen,
sobald Account + Hundeprofil angelegt sind:

```
node scripts/import-log.mjs deine@email.de deinPasswort
```

Das Skript meldet sich mit deinem Account an, findet deinen Haushalt/Hund
und importiert die 99 historischen Einträge (inkl. Erfolg/Fehlschlag beim
Lösen) via Supabase. `scripts/import-log-data.mjs` enthält die dafür aus der
Excel-Datei übersetzten Rohdaten.

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
- Sprache → Kategorie ist eine einfache Keyword-Heuristik, kein echtes LLM;
  das Outcome (Erfolg/Fehlschlag beim Lösen) wird manuell im
  Bestätigungs-Screen gewählt.
- Vorhersage & Trigger-Korrelationen sind einfache statistische Heuristiken,
  kein ML-Modell.
- Es gibt genau ein Hundeprofil pro Haushalt (Mehrere-Hunde-Support ist im
  Datenmodell aber bereits angelegt, `dogs` ist eine Liste).
- "Dashboard passt sich an das am häufigsten Gefragte an" ist noch nicht
  umgesetzt — dafür fehlt aktuell eine Basis an Nutzungsdaten.
