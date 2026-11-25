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
- `einstellungen`: Lehrkraft-Einstellungen aus der Adresse (`stand`, `hilfen`, `zeitmodus`, `tempo`,
  `plosive`, `ieErlaubt`, `teppichNeuMischen`, `vorlesen`, `schrift`), siehe `leseEinstellungen()` in `config.js`. Nur lesen.
  - `vorlesen` (`'vor'` | `'nach'`, Standard `'vor'`, URL `v=`): gilt für **Rutschen und Leseapparat**.
    `'vor'` = die App spricht Silbe/Wort vor dem eigenen Lesen vor (Vormachen, bisheriges Verhalten).
    `'nach'` = das Kind liest zuerst selbst, die App spricht erst danach zur Kontrolle.
    Die Lehrkraft stellt das je Kind ein (eigener Link). Wie „danach“ im Modul genau aussieht, entscheidet der Modul-Thread.
  - `schrift` regelt `app.css` selbst (`<html data-schrift>`); Module schreiben `font-family: var(--schrift)`,
    nie eine feste Schrift.
- `zustand`: Spielstand im Arbeitsspeicher (kein localStorage). Eigene Werte unter einem eigenen
  Schlüssel ablegen, z. B. `zustand.blitzlesen ??= { … }`.
  `zustand.sterne` und `zustand.zaehler` **nur über `zaehle()` aus `../sterne.js` verändern** (siehe unten).
- `zurueck()`: Das Modul darf sie aufrufen, um selbst zur Stufe zurückzukehren (z. B. nach „Fertig“).
  `app.js` ruft dabei die Aufräum-Funktion auf.
- Rückgabe (optional), eine von beiden Formen:
  - **Aufräum-Funktion** (wie bisher). `app.js` ruft sie beim Verlassen auf (Zurück-Pfeil oder `zurueck()`).
  - **Objekt** `{ aufraeumen, tasten }` für die Digiboard-Tastatur (siehe unten). Beide Teile freiwillig.

## Digiboard-Tastatur (`../tastatur.js`)

Am Digiboard bedient die Lehrkraft mit Tastatur oder Presenter. `app.js` fängt die Tasten zentral ab und gibt
sie an das angezeigte Modul weiter:

| Taste | Funktion im Modul | Bedeutung |
|---|---|---|
| Leertaste | `tasten.weiter()` | weiter / nächste Silbe / neu |
| Enter | `tasten.aufdecken()` | aufdecken / bestätigen / vorsprechen |
| 1, 2, 3 (bis 9) | `tasten.wahl(n)` | Auswahl n bzw. Silbe n festhalten |
| Escape | – (regelt `app.js`) | zurück, wie der Zurück-Pfeil |

```js
export function starte(behaelter, { einstellungen, zustand, zurueck }) {
  // …
  return {
    aufraeumen() { /* wie bisher */ },
    tasten: {
      weiter() { naechsteSilbe(); },
      aufdecken() { deckeAuf(); },
      wahl(n) { if (n > 3) return false; waehle(n); },  // false = Taste nicht benutzt
    },
  };
}
```

- Alle Tasten-Funktionen sind freiwillig. Fehlt eine, passiert bei dieser Taste nichts Besonderes.
- Gibt eine Funktion `false` zurück, gilt die Taste als nicht behandelt; der Browser macht sein Übliches
  (z. B. Enter oder Leertaste drückt den fokussierten Knopf). Sonst wird die Taste abgefangen.
- Gedrückt halten löst nur einmal aus. Strg/Alt/Cmd-Kombinationen werden durchgelassen.
- In Eingabefeldern (`input`, `textarea`, `select`, `contenteditable`) wirken die Tasten nie.
- Die Funktionen werden bei jedem Tastendruck neu nachgeschlagen: Das Modul kann intern je nach Zustand entscheiden.
- Keine eigenen `keydown`-Listener am `document` für diese Tasten anmelden, sonst doppelt.
- **Testseiten**, die ein Modul direkt starten, nutzen `modulRueckgabe(starte(…))` aus `../js/tastatur.js`
  (liefert `{ aufraeumen, tasten }` für beide Rückgabe-Formen) und bei Bedarf `starteTastatur(() => tasten)`.

## Regeln

- Wörter, Silben und Buchstaben nur aus `../config.js` und `../woerter.js`, Bilder aus `../bilder.js` –
  keine eigenen Listen.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit
  `sprichAnsage(id)` aus `../audio.js`.
- Eigene Gestaltung in `css/<modulname>.css`, vom Modul selbst eingebunden (hält `app.css` frei
  von Modul-Regeln und erleichtert das Mergen). Beispiel: `ladeCss()` in `blitzlesen.js`.

## Sterne vergeben (`../sterne.js`)

Regel für alle Module: **10 gelesene Einheiten = 1 Stern der Stufe**, je Stufe höchstens 7.
Einheit = eine Silbe oder ein Wort (Stufen 3–5) bzw. eine richtig gelöste Aufgabe (Stufen 1–2).
Es zählen nur richtig bzw. wirklich gelesene Einheiten – das prüft das Modul, bevor es zählt
(Blitzlesen: nur richtige Antworten; Leseapparat: selbst über den Bogen gezogen; Rutschen: selbst
gerutscht und gelesen; Silbenteppich: nur wenn nicht schneller als ca. 0,5 s weitergetippt).

**Sterne werden während der Übung still gezählt** (Entscheidung Anna): kein Einblenden, keine Ansage
mittendrin. Erst am Rundenende kommt eine ruhige Zusammenfassung (siehe `fasseSterneZusammen` unten).

```js
import { starteRunde } from '../sterne.js';

const runde = starteRunde(zustand, 3);   // zu Beginn jeder Runde
runde.zaehle();                          // eine gelesene Einheit, still
runde.zaehle(5);                         // fünf auf einmal
runde.neu                                // neue Sterne dieser Runde (für die Zusammenfassung)
```

`starteRunde(zustand, stufe) → { neu, zaehle(anzahl = 1) }`: ruft intern `zaehle()` auf und zählt die neuen
Sterne der Runde mit. Direkt geht es auch mit `zaehle(zustand, 3)`.

`zaehle(zustand, stufe, anzahl = 1) → number`: erhöht den Zähler der Stufe (1–5), schreibt bei jedem
vollen Zehner einen Stern in `zustand.sterne[stufe - 1]` und gibt die Zahl der **gerade neu dazugekommenen
Sterne** zurück (meist 0 oder 1, als Wahrheitswert nutzbar). Ein Zähler je Stufe in `zustand.zaehler`,
nur im Arbeitsspeicher, zählt über Runden und Module weiter. `nochBisStern(zustand, stufe)` liefert, wie
viele Einheiten bis zum nächsten Stern fehlen.

## Loben und neuen Stern zeigen (`../belohnung.js`)

Ein gemeinsamer, ruhiger Belohnungs-Moment (CLAUDE.md, Regel 7): kein Pop-up. Ein kleines Zeichen erscheint
oben rechts im Modul-Bereich, verschwindet von selbst und lässt Fingertipps durch. Gestaltung: `css/belohnung.css`.

```js
import { lobe, fasseSterneZusammen } from '../belohnung.js';
import { starteRunde } from '../sterne.js';

const runde = starteRunde(zustand, 3);
// … während der Übung nur runde.zaehle(), evtl. ein Lob zur Halbzeit: lobe(bereich)
// Rundenende:
fasseSterneZusammen(ergebnisBereich, runde.neu, { vorweg: neuerRekord ? ['neuer-rekord'] : [] });
```

`fasseSterneZusammen(behaelter, anzahlNeu, { vorweg = [], danach } = {}) → Promise<boolean>`
- zeigt die neuen Sterne als **ruhige Reihe** im Behälter (`.belohnung-sterne`, blendet Stern für Stern ein,
  bleibt stehen, bis das Modul neu zeichnet) und spricht:
  - 1 Stern: `sterne-einen-neuen` („Du hast in dieser Übung einen neuen Stern bekommen.“)
  - 2–7 Sterne: `sterne-du-hast` + `zahl-n` + `sterne-neue-bekommen` („Du hast in dieser Übung … neue Sterne bekommen.“)
  - 0 Sterne: keine Reihe, stattdessen `lobe(behaelter)`.
- `vorweg`: Ansage-ids, die vorher gesprochen werden (z. B. `['zeit-um']`, `['neuer-rekord']`).
- `danach`: Funktion, die aufgerufen wird, wenn alles gesprochen ist.
- Bricht still ab (Rückgabe `false`), wenn der Behälter von der Seite verschwindet (z. B. Zurück, „Noch einmal“)
  oder im selben Behälter eine neue Zusammenfassung startet. Sonst `true`.
- `behaelter = null`: nur sprechen.

- `lobe(behaelter, { ansage } = {}) → Promise`: grüner Haken (ca. 1,2 s) und eine Lob-Ansage. Die Lob-Ansagen
  wechseln sich ab (jede einmal, nie zweimal direkt hintereinander).
- `feiereStern(behaelter, { ansage } = {}) → Promise`: goldener Stern (ca. 2,2 s), Ansage „Neuer Stern!“.
  **Nicht während der Übung verwenden** (Sterne werden still gezählt); bleibt nur für Sonderfälle.
- `behaelter`: das Element des Moduls, in dem das Zeichen erscheinen soll (bekommt bei Bedarf
  `position: relative`). `null` = nur sprechen.
- `ansage`: eigene Ansage-id statt der Standard-Ansage, oder `false` = stumm.
- Das Promise ist erfüllt, wenn die Ansage zu Ende ist. Abwarten ist freiwillig; das Kind kann sofort weitertippen.
- `naechstesLob()` liefert nur die nächste Lob-Ansage-id (zum Sprechen ohne Zeichen).

Wie oft gelobt wird, entscheidet das Modul (z. B. nicht nach jeder Silbe im Silbenteppich).

Allgemeine Ansagen für alle Module (in `../aufnahmen.js`, mit `sprichAnsage(id)` aus `../audio.js`):

| id | Text |
|----|------|
| `lob-toll`, `lob-gut`, `lob-super`, `lob-prima`, `lob-klasse`, `lob-weiter-so`, `lob-uebung`, `lob-besser` | Toll gemacht! · Das hast du gut gemacht! · Super! · Prima! · Klasse! · Weiter so! · Übung macht den Meister! · Du wirst immer besser! |
| `neuer-stern` | Neuer Stern! |
| `sterne-du-hast`, `sterne-neue-bekommen`, `sterne-einen-neuen` | Du hast in dieser Übung · neue Sterne bekommen. · Du hast in dieser Übung einen neuen Stern bekommen. |
| `geschafft` | Geschafft! |
| `neuer-rekord` | Neuer Rekord! |
| `noch-einmal` | Versuch es noch einmal. |

Ausprobieren: `test/belohnung.html`.

## CSS-Klassen: eigenes Präfix

Jedes Modul und jeder gemeinsame Baustein benennt seine CSS-Klassen mit einem **eigenen Präfix**
(kurz auch in CLAUDE.md, „Arbeitsweise“). Sonst wirken Regeln eines Moduls auf andere – Beispiel:
eine Regel `.fertig svg { width: 36px }` hat in einem anderen Modul jedes Bild im „Fertig“-Bereich geschrumpft.

| Baustein / Modul | Präfix | Beispiele |
|---|---|---|
| Bildercode (`codeeingabe.js`, `css/bildercode.css`) | `code-` | `.code-bild`, `.code-fertig`, `.code-abschluss` |
| Belohnung (`belohnung.js`, `css/belohnung.css`) | `belohnung` | `.belohnung`, `.belohnung-sterne` |
| Lehrkraft-Bereich (Passwort-Sperre, Schriftprobe in `app.css`) | `lk-` | `.lk-sperre`, `.lk-schriftprobe` |
| Hilfsseite Passwort-Hash (`test/passwort-hash.html`) | `ph-` | `.ph-feld`, `.ph-hash` |
| Blitzlesen | `blitz-` | `.blitz-punkt`, `.blitz-ende` |
| Leseapparat | `la-` | `.la-apparat`, `.la-bogen` |
| Rutschen | `rutsch-` | `.rutsch-punkt`, `.rutsch-voll` |
| Silbenteppich | `st-` | `.st-ende` |
| neues Modul | kurzes, eindeutiges Präfix | z. B. `wf-` (Wort-Fang) |

Regeln:
- Keine allgemeinen Klassennamen wie `.fertig`, `.stern`, `.sterne`, `.ende`, `.abschluss`, `.vorlesen`,
  `.unsichtbar` in Modul-CSS – auch nicht mit Präfix nur am Elternelement, wenn der Name auch in JS gesucht wird
  (`closest('.fertig')` in `app.js` reagierte früher auf jedes `.fertig` eines Moduls).
- Gemeinsame Klassen aus `app.css` (`.kopf`, `.kachel`, `.zurueck`, `.lautsprecher`, …) darf ein Modul benutzen,
  aber nur innerhalb des eigenen Bereichs umgestalten: `.blitz-start .lautsprecher svg`, nicht `.lautsprecher svg`.
- Selektoren in Modul-CSS beginnen mit einer Klasse des Moduls.
