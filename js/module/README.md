# Module

Ein Modul pro Übung, z. B. `rutschen.js`, `leseapparat.js`, `silbenteppich.js`, `blitzlesen.js`.
Jedes Modul nutzt `../config.js` und `../woerter.js` und bringt keine eigenen Wortlisten mit.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit `sprichAnsage(id)` aus `../audio.js`.
- Schnittstelle (Vorschlag aus Thread „Rutschen“): Jedes Modul exportiert `starte(wurzel, { einstellungen, zurueck })`.
  `wurzel` ist `<main id="app">`, `zurueck()` führt zur Stufenseite. In `js/app.js` steht das Modul in `MODULE`
  (Name wie in `config.js` → Datei). Eigenes CSS lädt das Modul selbst nach (z. B. `css/rutschen.css`).
