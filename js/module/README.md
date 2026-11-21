# Module

Ein Modul pro Übung, z. B. `rutschen.js`, `leseapparat.js`, `silbenteppich.js`, `blitzlesen.js`.
Jedes Modul nutzt `../config.js` und `../woerter.js` und bringt keine eigenen Wortlisten mit.
- Ansagen (Sprechtexte für Aufnahmen) trägt jedes Modul in `../aufnahmen.js` ein und spricht sie mit `sprichAnsage(id)` aus `../audio.js`.

## Sterne vergeben (`../sterne.js`)

Regel für alle Module: **10 gelesene Einheiten = 1 Stern der Stufe**, je Stufe höchstens 7.
Einheit = eine Silbe oder ein Wort (Stufen 3–5) bzw. eine richtig gelöste Aufgabe (Stufen 1–2).
Es zählen nur richtig bzw. wirklich gelesene Einheiten – das prüft das Modul, bevor es zählt
(Blitzlesen: nur richtige Antworten; Leseapparat: selbst über den Bogen gezogen; Rutschen: selbst
gerutscht und gelesen; Silbenteppich: nur wenn nicht schneller als ca. 0,5 s weitergetippt).

```js
import { zaehle } from '../sterne.js';
// zustand = das Spielstand-Objekt aus app.js (übergeben oder importiert)

if (zaehle(zustand, 3)) zeigeNeuenStern();   // eine Einheit in Stufe 3
zaehle(zustand, 4, 5);                         // fünf Einheiten auf einmal
```

`zaehle(zustand, stufe, anzahl = 1) → number`: erhöht den Zähler der Stufe (1–5), schreibt bei jedem
vollen Zehner einen Stern in `zustand.sterne[stufe - 1]` und gibt die Zahl der **gerade neu dazugekommenen
Sterne** zurück (meist 0 oder 1, als Wahrheitswert nutzbar). Ein Zähler je Stufe in `zustand.zaehler`,
nur im Arbeitsspeicher, zählt über Runden und Module weiter. `nochBisStern(zustand, stufe)` liefert, wie
viele Einheiten bis zum nächsten Stern fehlen.

## Loben und neuen Stern zeigen (`../belohnung.js`)

Ein gemeinsamer, ruhiger Belohnungs-Moment (CLAUDE.md, Regel 7): kein Pop-up. Ein kleines Zeichen erscheint
oben rechts im Modul-Bereich, verschwindet von selbst und lässt Fingertipps durch. Gestaltung: `css/belohnung.css`.

```js
import { lobe, feiereStern } from '../belohnung.js';
import { zaehle } from '../sterne.js';

if (zaehle(zustand, 3)) feiereStern(bereich);   // neuer Stern: Stern schwebt, „Neuer Stern!“
else lobe(bereich);                             // kurzes Lob: Haken, „Toll gemacht!“ / „Prima!“ / …
```

- `lobe(behaelter, { ansage } = {}) → Promise`: grüner Haken (ca. 1,2 s) und eine Lob-Ansage. Die Lob-Ansagen
  wechseln sich ab (jede einmal, nie zweimal direkt hintereinander).
- `feiereStern(behaelter, { ansage } = {}) → Promise`: goldener Stern (ca. 2,2 s), Ansage „Neuer Stern!“.
- `behaelter`: das Element des Moduls, in dem das Zeichen erscheinen soll (bekommt bei Bedarf
  `position: relative`). `null` = nur sprechen.
- `ansage`: eigene Ansage-id statt der Standard-Ansage, oder `false` = stumm.
- Das Promise ist erfüllt, wenn die Ansage zu Ende ist. Abwarten ist freiwillig; das Kind kann sofort weitertippen.
- `naechstesLob()` liefert nur die nächste Lob-Ansage-id (zum Sprechen ohne Zeichen).

Wie oft gelobt wird, entscheidet das Modul (z. B. nicht nach jeder Silbe im Silbenteppich).

Allgemeine Ansagen für alle Module (in `../aufnahmen.js`, mit `sprichAnsage(id)` aus `../audio.js`):

| id | Text |
|----|------|
| `lob-toll`, `lob-gut`, `lob-super`, `lob-prima`, `lob-klasse` | Toll gemacht! · Das hast du gut gemacht! · Super! · Prima! · Klasse! |
| `neuer-stern` | Neuer Stern! |
| `geschafft` | Geschafft! |
| `neuer-rekord` | Neuer Rekord! |
| `noch-einmal` | Versuch es noch einmal. |

Ausprobieren: `test/belohnung.html`.
