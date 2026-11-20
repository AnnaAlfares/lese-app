# Module

Ein Modul pro Übung. Module werden **automatisch eingetragen**: Es gibt keine Liste in `app.js`.

## Datei

`js/module/<dateiStamm(name)>.js`. Der Name ist der Kachelname aus `STUFEN` in `../config.js`,
umgeschrieben mit `dateiStamm` aus `../aufnahmen.js` (klein, ä→ae, ö→oe, ü→ue, ß→sz, Sonstiges → `-`):
„Blitzlesen“ → `blitzlesen.js`, „Wort-Fang“ → `wort-fang.js`, „Wörternetz“ → `woerternetz.js`,
„Wo hörst du es?“ → `wo-hoerst-du-es.js`. Gibt es die Datei, wird die Kachel automatisch aktiv.

## Schnittstelle

```js
export function starte(behaelter, { einstellungen, zustand, zurueck }) {
  // … zeichnen, Ereignisse anmelden …
  return () => { /* aufräumen: Zeitgeber, Töne (stoppe() aus audio.js), Event-Listener */ };
}
```

- `behaelter`: DOM-Element, in das das Modul zeichnet. Die Kopfzeile mit Zurück-Pfeil und
  Modulname baut `app.js` selbst.
- `einstellungen`: Lehrkraft-Einstellungen aus der Adresse (`stand`, `hilfen`, `zeitmodus`, `tempo`),
  siehe `leseEinstellungen()` in `config.js`. Nur lesen.
- `zustand`: Spielstand im Arbeitsspeicher (kein localStorage). Eigene Werte unter einem eigenen
  Schlüssel ablegen, z. B. `zustand.blitzlesen ??= { … }`.
  **`zustand.sterne` vorerst nicht verändern** – die Sterne-Regel für die Stufen ist noch nicht entschieden.
- `zurueck()`: Das Modul darf sie aufrufen, um selbst zur Stufe zurückzukehren (z. B. nach „Fertig“).
  `app.js` ruft dabei die Aufräum-Funktion auf.
- Rückgabe (optional): Aufräum-Funktion. `app.js` ruft sie beim Verlassen auf (Zurück-Pfeil oder `zurueck()`).

## Regeln

- Wörter, Silben und Buchstaben nur aus `../config.js` und `../woerter.js`, Bilder aus `../bilder.js` –
  keine eigenen Listen.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit
  `sprichAnsage(id)` aus `../audio.js`.
- Eigene Gestaltung in `css/<modulname>.css`, vom Modul selbst eingebunden (hält `app.css` frei
  von Modul-Regeln und erleichtert das Mergen). Beispiel: `ladeCss()` in `blitzlesen.js`.
