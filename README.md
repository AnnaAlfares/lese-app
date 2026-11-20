# Lese-App

Eine Web-App für Erstklässler: vom Hören der Laute bis zum verstehenden Lesen kurzer Sätze.
Gedacht für das Digiboard (ganze Klasse) und geteilte iPads (selbstständiges Üben), in kurzen
Einheiten von 5–15 Minuten.

## Grundsätze

- Buchstabenreihenfolge nach dem Zwergenheft; es erscheinen nur Wörter aus bereits eingeführten Buchstaben.
- Laute werden immer lautiert (/m/), nie als Buchstabenname.
- Alles wird vorgesprochen; Hilfen (Silbenbögen, Silbenfarben, Leseschieber, Bilder) sind zuschaltbar.
- **Datenschutz:** keine Namen, keine Cookies, kein localStorage, keine Server, keine externen Dienste.
  Der Spielstand lebt nur im Arbeitsspeicher und wird als Bildercode (5 Bilder) mitgenommen.

## Lokal starten

```bash
python3 -m http.server 8000
```

Dann im Browser <http://localhost:8000> öffnen. Es gibt keinen Build-Schritt und keine Abhängigkeiten.

Einstellungen der Lehrkraft stehen nur in der Adresse, z. B. `index.html?b=12&h=bfi&z=0&t=80&p=0`
(b = Buchstabenstand 1–41, h = Hilfen, z = Zeitmodus (Standard aus), t = Sprechtempo in %,
p = Plosive im Leseapparat (Feld `plosive`, Standard aus)). Den Link erzeugt `lehrkraft.html`;
Lesen und Schreiben der Parameter steht in `js/config.js`.

## Ordner

| Pfad | Inhalt |
|------|--------|
| `index.html` | Start: Bildercode-Eingabe, dann Stufen-Kacheln |
| `lehrkraft.html` | Lehrkraft-Bereich (Einstellungen) |
| `impressum.html` | Impressum und Datenschutz |
| `css/app.css` | Gestaltung |
| `js/app.js` | Navigation, Zustand im Arbeitsspeicher |
| `js/lehrkraft.js` | Lehrkraft-Bereich: Einstellungen als Link |
| `js/config.js` | Buchstabenreihenfolge, Einstellungen |
| `js/woerter.js` | Wortliste, Modellwörter, Wörternetze |
| `js/bildercode.js` | Bildercode kodieren/dekodieren |
| `js/audio.js` | Vorlesen: spielt Aufnahmen ab (Laute, Silben, Wörter, Ansagen) |
| `js/aufnahmen.js` | Dateinamen und Liste aller benötigten Aufnahmen, Ansagetexte |
| `js/module/` | ein Modul pro Übung |
| `assets/codebilder/` | die 16 Bilder für den Bildercode |
| `assets/audio/` | eigene Aufnahmen (Anleitung: `docs/AUFNAHMEN.md`) |
| `assets/fonts/` | lokale Schriften |
| `test/aufnahmen.html` | Aufnahmeliste: welche Aufnahmen vorhanden sind, welche fehlen |
| `test/woerter.html` | Testseite: lesbare Wörter und Silben je Buchstabenstand, Laute anhören |

## Veröffentlichung

Die App wird über GitHub Pages direkt aus dem Branch `main` veröffentlicht.

## Urheberrecht

Ideen aus bekannten Lehrwerken dienen als Anregung; Bilder, Figuren und Gestaltung sind eigene Arbeit.
