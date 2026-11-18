# Module

Ein Modul pro Übung, z. B. `rutschen.js`, `leseapparat.js`, `silbenteppich.js`, `blitzlesen.js`.
Jedes Modul nutzt `../config.js` und `../woerter.js` und bringt keine eigenen Wortlisten mit.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit `sprichAnsage(id)` aus `../audio.js`.
