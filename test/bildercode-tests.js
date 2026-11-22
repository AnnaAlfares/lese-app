// Tests für js/bildercode.js. Laufen auf test/bildercode.html (Browser)
// und zur Kontrolle auch mit: node test/bildercode-tests.js

import { BILDER, kodiere, dekodiere, pruefbild, gfMal } from '../js/bildercode.js';
import { CODEBILDER } from '../js/aufnahmen.js';
import { graphem } from '../js/config.js';
import { zaehle, setzeSpielstand, nochBisStern, starteRunde } from '../js/sterne.js';

/** Liefert [{ name, ok, info }] */
export function testeBildercode() {
  const ergebnisse = [];
  const pruefe = (name, ok, info = '') => ergebnisse.push({ name, ok: !!ok, info });
  const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // --- Bilder ---
  pruefe('16 Bilder mit Zahlen 1–16', BILDER.length === 16 && BILDER.every((b, i) => b.nr === i + 1));
  const erwartet = ['Lampe', 'Maus', 'Sonne', 'Jojo', 'Wolke', 'Banane', 'Gabel', 'Domino', 'Auto',
    'Eis', 'Tafel', 'Kerze', 'Pinsel', 'Schere', 'Nase', 'Raupe'];
  pruefe('Reihenfolge wie CLAUDE.md, Regel 10', gleich(BILDER.map(b => b.wort), erwartet));
  pruefe('gleiche Namen wie aufnahmen.js', gleich(BILDER.map(b => b.wort), [...CODEBILDER]));
  pruefe('Anlaut ist ein Graphem aus config.js', BILDER.every(b => graphem(b.anlaut)));
  pruefe('Wort beginnt mit seinem Anlaut', BILDER.every(b => b.wort.toLowerCase().startsWith(b.anlaut)));
  pruefe('Dateinamen 01_lampe.png … 16_raupe.png',
    BILDER[0].bild === 'assets/codebilder/01_lampe.png' && BILDER[15].bild === 'assets/codebilder/16_raupe.png');

  // --- GF(16) ---
  let feldOk = true;
  for (let a = 1; a < 16; a++) {
    const produkte = new Set();
    for (let b = 0; b < 16; b++) produkte.add(gfMal(a, b));
    if (produkte.size !== 16) feldOk = false; // Multiplikation mit a ≠ 0 muss umkehrbar sein
  }
  pruefe('GF(16): Multiplikation umkehrbar', feldOk);

  // --- Kodieren und Dekodieren ---
  pruefe('neu (alles 0) → 5 Bilder', gleich(kodiere([0, 0, 0, 0, 0]), [1, 1, 1, 1, 1]), kodiere([0, 0, 0, 0, 0]).join(' '));
  pruefe('alles 7 → hin und zurück', gleich(dekodiere(kodiere([7, 7, 7, 7, 7])).sterne, [7, 7, 7, 7, 7]),
    kodiere([7, 7, 7, 7, 7]).join(' '));

  let alleOk = true, anzahl = 0;
  const gesehen = new Set();
  for (let z = 0; z < 8 ** 5; z++) {
    const sterne = [4, 3, 2, 1, 0].map(i => Math.floor(z / 8 ** i) % 8);
    const code = kodiere(sterne);
    const zurueck = dekodiere(code);
    if (!zurueck.ok || !gleich(zurueck.sterne, sterne)) alleOk = false;
    if (code.some(nr => nr < 1 || nr > 16)) alleOk = false;
    gesehen.add(code.join(','));
    anzahl++;
  }
  pruefe(`alle ${anzahl} Sternestände: hin und zurück`, alleOk);
  pruefe('jeder Sternestand hat einen eigenen Code', gesehen.size === anzahl);
  pruefe('Prüfbild passt zu kodiere()', gleich(pruefbild(kodiere([3, 5, 0, 7, 1]).slice(0, 4)),
    kodiere([3, 5, 0, 7, 1])[4]));

  // --- Grenzfälle ---
  pruefe('zu viele Sterne werden auf 7 begrenzt', gleich(dekodiere(kodiere([9, -2, 3.7, '2', null])).sterne, [7, 0, 3, 2, 0]));
  pruefe('fehlende Stufen zählen als 0', gleich(dekodiere(kodiere([2])).sterne, [2, 0, 0, 0, 0]));
  pruefe('4 Bilder → ungültig', dekodiere([1, 1, 1, 1]).grund === 'laenge');
  pruefe('Bild 0 oder 17 → ungültig', dekodiere([0, 1, 1, 1, 1]).grund === 'bild' && dekodiere([17, 1, 1, 1, 1]).grund === 'bild');
  pruefe('Versionsbit gesetzt → ungültig', (() => {
    const vier = [9, 1, 1, 1]; // Wert 8 im ersten Bild = höchstes Bit
    return dekodiere([...vier, pruefbild(vier)]).grund === 'version';
  })());

  // --- Fehler erkennen: jeder einzelne Tippfehler, jede Vertauschung ---
  let einzelfehler = 0, einzelErkannt = 0, tausch = 0, tauschErkannt = 0;
  for (let z = 0; z < 8 ** 5; z += 7) { // jeder 7. Sternestand reicht (ca. 4700 Codes)
    const sterne = [4, 3, 2, 1, 0].map(i => Math.floor(z / 8 ** i) % 8);
    const code = kodiere(sterne);
    for (let stelle = 0; stelle < 5; stelle++) {
      for (let nr = 1; nr <= 16; nr++) {
        if (nr === code[stelle]) continue;
        const falsch = code.slice(); falsch[stelle] = nr;
        einzelfehler++;
        if (!dekodiere(falsch).ok) einzelErkannt++;
      }
    }
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
      if (code[i] === code[j]) continue;
      const falsch = code.slice(); [falsch[i], falsch[j]] = [falsch[j], falsch[i]];
      tausch++;
      if (!dekodiere(falsch).ok) tauschErkannt++;
    }
  }
  pruefe('jedes einzelne falsche Bild fällt auf', einzelErkannt === einzelfehler, `${einzelErkannt} von ${einzelfehler}`);
  pruefe('jede Vertauschung zweier Bilder fällt auf', tauschErkannt === tausch, `${tauschErkannt} von ${tausch}`);

  // Zufällige Codes: etwa 1 von 16 ist gültig (sonst wäre das Prüfbild zu schwach oder zu streng)
  let gueltig = 0;
  for (let n = 0; n < 16 ** 5; n += 37) {
    const code = [4, 3, 2, 1, 0].map(i => Math.floor(n / 16 ** i) % 16 + 1);
    if (dekodiere(code).ok) gueltig++;
  }
  const anteil = gueltig / Math.ceil(16 ** 5 / 37);
  pruefe('zufällige Bilder: ca. 1 von 32 gültig (Prüfbild + Versionsbit)', anteil > 0.025 && anteil < 0.038,
    `${(anteil * 100).toFixed(1)} %`);

  // --- Sterne-Regel (js/sterne.js): 10 Einheiten = 1 Stern, max. 7 ---
  const z = {};
  setzeSpielstand(z, [2, 0, 0, 0, 0]);
  pruefe('Sterne: Spielstand aus Code, Zähler 0', gleich(z.sterne, [2, 0, 0, 0, 0]) && gleich(z.zaehler, [0, 0, 0, 0, 0]));
  let neu = 0;
  for (let n = 0; n < 9; n++) neu += zaehle(z, 1);
  pruefe('Sterne: 9 Einheiten → noch kein Stern', neu === 0 && z.sterne[0] === 2 && nochBisStern(z, 1) === 1);
  pruefe('Sterne: 10. Einheit → neuer Stern, Rückgabe 1', zaehle(z, 1) === 1 && z.sterne[0] === 3 && z.zaehler[0] === 0);
  zaehle(z, 3, 7); zaehle(z, 3, 2);
  pruefe('Sterne: Rest zählt weiter (7 + 2 = 9)', z.zaehler[2] === 9 && z.sterne[2] === 0);
  pruefe('Sterne: 9 + 4 → 1 Stern, Rest 3', zaehle(z, 3, 4) === 1 && z.sterne[2] === 1 && z.zaehler[2] === 3);
  pruefe('Sterne: 25 auf einmal → 2 Sterne', zaehle(z, 4, 25) === 2 && z.sterne[3] === 2 && z.zaehler[3] === 5);
  pruefe('Sterne: Stufen getrennt', gleich(z.sterne, [3, 0, 1, 2, 0]));
  setzeSpielstand(z, [6, 0, 0, 0, 0]);
  pruefe('Sterne: höchstens 7', zaehle(z, 1, 30) === 1 && z.sterne[0] === 7 && zaehle(z, 1, 10) === 0 && z.sterne[0] === 7);
  const vorher = JSON.stringify(z);
  const warn = console.warn; console.warn = () => {};
  const ungueltig = [zaehle(z, 0), zaehle(z, 6), zaehle(z, 2, 0), zaehle(z, 2, -3), zaehle(z, 2, 1.5)];
  console.warn = warn;
  pruefe('Sterne: ungültige Stufe/Anzahl ändern nichts', ungueltig.every(x => x === 0) && JSON.stringify(z) === vorher);
  const leer = {};
  pruefe('Sterne: zustand ohne Zähler wird angelegt', zaehle(leer, 5, 10) === 1 && gleich(leer.sterne, [0, 0, 0, 0, 1]));
  setzeSpielstand(z);
  pruefe('Sterne: neues Kind → alles 0', gleich(z.sterne, [0, 0, 0, 0, 0]) && gleich(z.zaehler, [0, 0, 0, 0, 0]));
  pruefe('Sterne: Stand passt in den Bildercode', (() => {
    const s = { }; setzeSpielstand(s); zaehle(s, 2, 70); zaehle(s, 5, 33);
    return gleich(dekodiere(kodiere(s.sterne)).sterne, [0, 7, 0, 0, 3]);
  })());

  // --- Runde (starteRunde): neue Sterne dieser Runde still mitzählen ---
  const zr = {}; setzeSpielstand(zr, [0, 0, 5, 0, 0]); zr.zaehler[2] = 8;
  const r = starteRunde(zr, 3);
  pruefe('Runde: beginnt mit 0 neuen Sternen', r.neu === 0);
  r.zaehle(); r.zaehle();
  pruefe('Runde: angefangener Rest aus früherer Runde zählt mit', r.neu === 1 && zr.sterne[2] === 6);
  r.zaehle(25);
  pruefe('Runde: höchstens bis 7 Sterne, neu = 2', r.neu === 2 && zr.sterne[2] === 7);
  const r2 = starteRunde(zr, 1);
  pruefe('Runde: neue Runde beginnt wieder bei 0, Rückgabe wie zaehle()', r2.neu === 0 && r2.zaehle(10) === 1 && r2.neu === 1);

  return ergebnisse;
}

// Aufruf in Node: Ergebnisse ausgeben, Exit-Code 1 bei Fehlern
if (typeof window === 'undefined') {
  const ergebnisse = testeBildercode();
  for (const e of ergebnisse) console.log(`${e.ok ? 'ok  ' : 'FEHL'} ${e.name}${e.info ? ` (${e.info})` : ''}`);
  const fehler = ergebnisse.filter(e => !e.ok).length;
  console.log(fehler ? `${fehler} Fehler` : 'alle Tests bestanden');
  if (fehler) process.exitCode = 1;
}
