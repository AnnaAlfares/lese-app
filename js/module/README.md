# Module

Ein Modul pro Übung, z. B. `rutschen.js`, `leseapparat.js`, `silbenteppich.js`, `blitzlesen.js`.
Jedes Modul nutzt `../config.js` und `../woerter.js` und bringt keine eigenen Wortlisten mit.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit `sprichAnsage(id)` aus `../audio.js`.
- Schnittstelle (Vorschlag aus Thread 5): Jedes Modul exportiert `starte(wurzel, { einstellungen, zurueck })`.
  `app.js` trägt das Modul in `MODULE` ein (Name wie in `STUFEN` → Datei), lädt es beim Antippen der Kachel
  und gibt ihm ein leeres `<div class="modul">`; Klicks darin behandelt das Modul selbst.
- Modul-eigene Gestaltung liegt in `css/module/<modul>.css` und wird vom Modul geladen (app.css bleibt schlank).

| Modul | Datei | Stand |
|-------|-------|-------|
| Silbenteppich | `silbenteppich.js`, `css/module/silbenteppich.css` | ohne Zeit, 1 Minute, Zeit stoppen mit Rekord |
