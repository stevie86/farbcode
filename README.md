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
| ✗ | Diese Farbe kommt nicht vor (bzw. es gibt keine zweite Perle davon) |

Die Legende steht **immer** sichtbar über dem Brett, und die Rückmeldung wird
zusätzlich in Klartext beschrieben („2 richtige Farben an anderer Stelle, 1 Farbe
kommt nicht vor"). Kein Zählen von Punkten im Kopf, keine Interpretationsarbeit.

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
```

Drei Dateien, kein Build-Schritt. Das komplette Regelwerk steckt in `app.js`; für
Tests und Neugierige ist es zusätzlich unter `window.farbcode` erreichbar
(`score`, `candidateCodes`, `analyze`, …).

## Datenschutz

Das Spiel kontaktiert keinen Server. Es speichert ausschließlich Spielstand,
Einstellungen und Sprache im `localStorage` des eigenen Browsers. Es werden keine
Cookies gesetzt, keine Daten übertragen, keine externen Dienste eingebunden —
außer der Webfont „Outfit"/„JetBrains Mono" von Google Fonts, die in den
Systemschriften durch lokale ersetzt werden können.

## Lizenz

MIT — siehe [LICENSE](LICENSE).

Idee und Umsetzung: Stefan (stevie86).
