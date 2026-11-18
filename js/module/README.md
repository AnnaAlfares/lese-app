# Module

Ein Modul pro Übung, z. B. `rutschen.js`, `leseapparat.js`, `silbenteppich.js`, `blitzlesen.js`.
Jedes Modul nutzt `../config.js` und `../woerter.js` und bringt keine eigenen Wortlisten mit.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit `sprichAnsage(id)` aus `../audio.js`.

## Schnittstelle

Jedes Modul exportiert `starte(wurzel, { einstellungen, zurueck, stern })` und gibt eine Funktion `stopp()` zurück.

- `wurzel`: das Element, in das das Modul sich zeichnet (inklusive Kopfzeile mit Zurück-Knopf).
- `einstellungen`: aus `leseEinstellungen()` (Buchstabenstand, Hilfen, Zeitmodus, Tempo).
- `zurueck()`: ruft das Modul beim Zurück-Knopf auf (nach eigenem Aufräumen).
- `stern()`: ruft das Modul für jeden neu verdienten Stern auf.

Eingetragen wird ein fertiges Modul in `js/app.js`, Objekt `MODULE` (Name wie in `config.js` → Datei).
Eigene Gestaltung kann ein Modul als `css/<modul>.css` mitbringen und selbst nachladen (siehe `leseapparat.js`).
Zum direkten Ausprobieren gibt es je Modul eine Testseite `test/<modul>.html`.
