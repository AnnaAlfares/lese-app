# Aufnahmen für die Lese-App

Alles, was die App sagt, kommt aus eigenen Aufnahmen in `assets/audio/`.
Die **vollständige, immer aktuelle Liste** mit Dateinamen, Sprechtext und Status (vorhanden/fehlt) zeigt die Seite
**`test/aufnahmen.html`** (lokal: <http://localhost:8000/test/aufnahmen.html>). Dort lässt sich der Buchstabenstand
wählen, damit nur das aufgenommen wird, was gerade gebraucht wird. „fehlende als Text kopieren“ liefert eine
Tabelle zum Abhaken.

Die Dateinamen legt `js/aufnahmen.js` fest. Neue Ansagen von Modulen werden dort eingetragen.

## Ordner und Dateinamen

| Ordner | Inhalt | Beispiel |
|--------|--------|----------|
| `assets/audio/laute/` | ein Laut je Graphem | `m.mp3`, `sch.mp3`, `ei.mp3` |
| `assets/audio/silben/` | Silben | `ma.mp3`, `lo.mp3`, `sen.mp3` |
| `assets/audio/woerter/` | Wörter, Sichtwörter, Bildercode-Bilder | `rose.mp3`, `lama.mp3`, `ist.mp3` |
| `assets/audio/ansagen/` | Stufennamen, Modulnamen, Zahlen, Hinweise | `stufe-1.mp3`, `zurueck.mp3`, `zahl-7.mp3` |

Regeln für Dateinamen: alles klein; ä → `ae`, ö → `oe`, ü → `ue`, ß → `sz`; Leerzeichen und Satzzeichen → `-`.
Beispiele: Wörternetz → `woerternetz`, „Wo hörst du es?“ → `modul-wo-hoerst-du-es`, ß-Laut → `laute/sz.mp3`.

## Format

- **MP3**, mono, 44,1 kHz, 96 kbit/s reicht. (Das Format steht in `js/config.js` → `AUDIO.format`.)
- Stille am Anfang und Ende wegschneiden (höchstens 0,1 s stehen lassen), damit der Ton sofort beim Antippen kommt.
- Alle Dateien etwa gleich laut (in Audacity: „Normalisieren“ auf −1 dB).
- Längen: Laute ca. 1–2 s, Silben unter 1 s, Wörter unter 1,5 s, Ansagen so kurz wie möglich.
- Ruhiger Raum, gleicher Abstand zum Mikrofon, immer dieselbe Stimme.

Ein bequemer Weg: Aufnehmen in Audacity (kostenlos), eine Datei pro Wort exportieren. Mit „Mehrere exportieren“
und Textmarken kann man eine ganze Reihe in einem Durchgang aufnehmen und getrennt speichern.

## So sprechen

**Laute: immer lautieren, nie den Buchstabennamen** (/m/, nicht „Em“; /t/, nicht „Te“).

- **Vokale und dehnbare Laute** (o, e, a, i, u, ei, au, eu, ie, ö, ü, ä, m, n, l, s, f, r, w, h, sch, ch, ng, j, ß):
  gleichmäßig **gedehnt, ca. 1,5 s**: /mmmm/, /ooooo/, /ssss/ (s summend wie in „Sofa“). Vokale lang wie im
  Beispielwort. Kein Vokal davor oder danach („mmm“, nicht „emmm“ oder „mö“).
- **Nicht dehnbare Laute** (t, k, p, d, g, b, z, st, sp, pf, qu, x, chs, c): **kurz und knapp, ohne „e“ danach**:
  /t/ und nicht „te“, /k/ und nicht „ke“. Lieber leise und kurz als mit Vokal.
- Das Beispielwort zu jedem Laut steht auf `test/aufnahmen.html` und in `js/config.js` (Feld `beispiel`).

**Silben:** natürlich und deutlich, offene Silben mit langem Vokal (/ma:/, /lo:/), wie man sie beim
Silbenlesen spricht. Nicht gedehnt.

**Wörter:** natürlich, deutlich, eher etwas langsam, ohne Betonung wie in einem Satz (wie ein Wort auf einer Bildkarte).

**Ansagen:** freundlich und ruhig, in normalem Tempo.

## Reihenfolge beim Aufnehmen

1. Ansagen (Stufen, Modulnamen, Zahlen 1–16) und die Bildercode-Bilder – die braucht die Startseite.
2. Laute und Silben bis zum aktuellen Buchstabenstand.
3. Wörter bis zum aktuellen Buchstabenstand.
4. Mit jedem neuen Buchstaben: auf `test/aufnahmen.html` den Stand höher stellen und „nur fehlende“ wählen.

## Prüfen

Datei ablegen, `test/aufnahmen.html` neu laden: Die Zeile wird grün, mit ▶ lässt sich die Aufnahme anhören.
Auf `test/woerter.html` werden die Laut-Knöpfe aktiv, sobald es einen Ton gibt.
