# Farbcode

**Ein modernes Farb-Rate-Spiel.** Form und Farbe statt nur Farbe — tägliches Rätsel,
teilbare Ergebnisse, kein Konto, kein Tracking, kein Server.

Farbcode ist eine Neuinterpretation des klassischen Farb-Raten-Spiels: statt „welche
Farbe steckt hier?" lautet die Frage „welche **Form** steckt hier?". Das Spiel
funktioniert dadurch auch bei Farbfehlsichtigkeit — und die Rückmeldung ist immer
lesbar, auch wenn sie niemand sieht.

---

## Was drin ist

| | |
|---|---|
| **Tagesrätsel** | Alle raten am selben Tag dieselbe Kombi. Deterministisch aus dem Datum erzeugt — kein Server nötig, jeder bekommt dasselbe Rätsel. |
| **Freies Spiel** | Eigene Länge (4–6 Felder), Farbzahl (5–6) und Zuglimit (8–15). |
| **Zu zweit** | Der erste Spieler legt den Code fest und gibt das Gerät weiter; der Code bleibt verdeckt, bis das Spiel endet. |
| **Fortschritt** | Ein Panel zeigt, wie viele der möglichen Kombinationen noch passen, welcher Zug am besten teilt und wie viele im schlimmsten Fall bleiben. Die Kandidaten lassen sich einzeln durchblättern. |
| **Trainer** | Eine geführte erste Runde erklärt die Symbole an einem festen Beispiel — und ein Logik-Hinweis schließt aus deinen Zügen, was sicher stimmt. |
| **Teilen** | Ergebnis als spoilerfreier Text, Rätsel als Link in der Adresse (`#g=…`). |
| **Sprachen** | Deutsch und Englisch, umschaltbar. |
| **Barrierefreiheit** | Form trägt die Information, nicht Farbe. Tastaturbedienung, `aria-live`-Ansagen, Klartext-Statuszeile, dauerhafte Legende. |

Keine Cookies, kein Tracking, kein Konto, kein Backend. Der Spielstand liegt im
`localStorage` des Browsers — ein Neuladen oder ein Umweg verliert keinen Zug.

## Die Symbole

| Symbol | Bedeutung |
|---|---|
| ● | Richtige Farbe an richtiger Stelle |
| ◐ | Richtige Farbe an anderer Stelle |
| ✗ | Diese Farbe kommt nicht vor |

Die Legende steht **immer** sichtbar über dem Brett, und die Rückmeldung wird
zusätzlich in Klartext beschrieben („2 richtige Farben an anderer Stelle, 1 Farbe
kommt nicht vor"). Kein Zählen von Punkten im Kopf, keine Interpretationsarbeit.

## Die Hausregel: jede Farbe höchstens einmal

**Im Code und in jedem Tipp kommt jede Farbe höchstens einmal vor.** Die Oberfläche
lässt keine Doppelungen zu: eine bereits vergebene Farbe ist in der Palette
ausgegraut, ein Klick darauf wird abgelehnt und erklärt, und die Pfeiltasten
überspringen belegte Farben.

Das ist keine Geschmacksfrage, sondern die Bedingung dafür, dass die Sprache der
Rückmeldung stimmt. Im klassischen Mastermind ist es eine Hausregel („players decide
in advance whether duplicates are allowed"), und solange eine Farbe doppelt vorkommen
kann, heißt ein Kreuz nicht „kommt nicht vor", sondern nur „kein zweiter Stein
dieser Farbe" — der Code könnte sie trotzdem an anderer Stelle enthalten. Mit
eindeutigen Farben ist das Kreuz endlich schlicht und richtig: **die Farbe ist nicht
im Code**.

Nebeneffekt: der Hinweis rechnet nur noch Permutationen (360 statt 1296 Kandidaten
bei vier Feldern und sechs Farben) und schließt damit schneller und genauer.

> **Hinweis für Bestandsspiele:** Partien, die vor dieser Regel gespeichert wurden,
> behalten ihre alte Wertung (`rules: 'repeat'`). Ihr Code kann eine Doppelung
> enthalten, ihre Hinweise bleiben deshalb konsistent. Neue Partien nutzen
> `rules: 'distinct'`.

## Die Fortschrittsanzeige

Das Panel „Fortschritt" beantwortet drei Fragen, die ein Farb-Rate-Spiel sonst
offen lässt:

1. **Wie viele Kombinationen passen noch?** Aus den 360 Permutationen (vier
   Felder, sechs Farben) wird nach jedem Zug die Menge derer, die dein
   Feedback erklären. Der Balken zeigt, wie viel davon schon weg ist.
2. **Welcher Zug teilt am besten?** Das ist der Minimax-Zug: für jeden möglichen
   Tipp wird gezählt, wie viele Kandidaten das schlechteste Feedback überleben
   lassen — der Tipp mit der kleinsten schlimmsten Fallzahl gewinnt. Das ist
   dasselbe Prinzip, nach dem ein Mastermind-Löser spielt, und es braucht
   keine externe Tabelle.
3. **Was ist noch möglich?** Die Kandidaten lassen sich mit „Weiter" und
   „Zurück" **einzeln** durchgehen — nicht alle auf einmal, das wäre unlesbar.
   Der beste Zug ist dabei markiert.

Der Trainer-Hinweis nennt denselben Zug in Textform, und der Trainer-Log zeigt,
welche Kombinationen noch offen sind.

Der Fortschritt ist bewusst **informationell**, nicht punktbasiert: es gibt
keine Serie, keine Elo, keine Bestzeit. Das Panel sagt nicht „du bist gut
dran", sondern „von 360 bleiben noch 84, und der Zug X teilt am besten".

## Die Versionszeile

Ganz unten im Footer steht, welches Spiel man gerade spielt:

```
Version 1.2.0 · Tagescode-Version v2 · Hausregel: jede Farbe höchstens einmal
```

Das ist keine Dekoration, sondern eine Prüfzeile: wenn zwei Leute ein
geteiltes Ergebnis vergleichen, müssen sie wissen, ob sie **dieselbe
Version** und **dieselben Regeln** gespielt haben. Eine alte Partie aus der
Zeit vor der Hausregel zeigt stattdessen „Altbestand: Farben dürfen sich
wiederholen" — dann ist die abweichende Wertung erwartbar und kein Fehler.

Die `Tagescode-Version` ist die Seed-Version des Tagesrätsel-Generators: sie
ändert sich nur, wenn sich der Generator ändert, damit bereits
veröffentlichte Rätsel nicht still verschoben werden.

## Spielen

**Tastatur:** `1`–`6` setzt eine Farbe, `←`/`→` wechselt das Feld, `↑`/`↓` wechselt
die Farbe im Feld, `Enter` bestätigt, `Backspace` leert.

**Zwei Personen:** Modus „Zu zweit" → erster Spieler gibt den Code ein und reicht
das Gerät weiter → zweiter Spieler rät, ohne die Farben zu sehen.

## Lokal laufen lassen

Das Spiel ist bewusst statisch — kein Build, keine Abhängigkeiten, kein Paketmanager.

```bash
git clone https://github.com/stevie86/farbcode.git
cd farbcode
python -m http.server 8123
# → http://127.0.0.1:8123
```

`index.html` läuft auch direkt per Doppelklick aus dem Dateisystem (`file://`).

## Aufbau

```
index.html   Struktur
style.css    Gestaltung (helles und dunkles Farbschema)
app.js       Regelwerk, Oberfläche, Trainer — ohne Framework
tests/       Playwright-Suite (Regeln, Tastatur, Trainer, Fortschritt, Eigenschaften)
```

Drei Dateien fürs Spiel, kein Build-Schritt. Das komplette Regelwerk steckt in
`app.js`; für Tests und Neugierige ist es zusätzlich unter `window.farbcode`
erreichbar (`score`, `candidateCodes`, `analyze`, `bestGuess`, `diagnosis`, …).

## Tests

Die Suite prüft die Regeln gegen das, was der Code tatsächlich tut — Hausregel,
Pfeiltasten, Trainer, Altbestände. Sie startet einen eigenen kleinen Server und
braucht deshalb keine offenen Ports:

```bash
npm install                 # nur Playwright als Entwicklungsabhängigkeit
npx playwright install chromium
npm test
```

Neben den Einzelfällen laufen **Eigenschaftstests** (Property-Tests): über
hunderte simulierte Spiele wird geprüft, dass die wahre Lösung immer unter den
Kandidaten bleibt, dass die Kandidatenzahl monoton fällt und dass jede
Feststellung des Trainers für *alle* verbliebenen Kandidaten gilt. Genau diese
Tests haben den Fehler gefunden, bei dem die Kandidatenliste nach dem Umbau
immer 360 Einträge zeigte.

### Version

`package.json` und `app.js` führen dieselbe Versionsnummer (`APP_VERSION`).
Die Suite schlägt fehl, wenn die beiden auseinanderlaufen. Nach einer sichtbaren
Änderung wird die Nummer in **beiden** Dateien hochgezählt.

## Datenschutz

Das Spiel kontaktiert keinen Server. Es speichert ausschließlich Spielstand,
Einstellungen und Sprache im `localStorage` des eigenen Browsers. Es werden keine
Cookies gesetzt, keine Daten übertragen, keine externen Dienste eingebunden —
außer der Webfont „Outfit"/„JetBrains Mono" von Google Fonts, die in den
Systemschriften durch lokale ersetzt werden können.

## Lizenz

MIT — siehe [LICENSE](LICENSE).

Idee und Umsetzung: Stefan (stevie86).
