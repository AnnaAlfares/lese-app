// Bildercode: Sternestand der 5 Stufen in 5 Bilder kodieren und wieder dekodieren.
// Siehe CLAUDE.md, Regel 10. Reine Logik ohne Oberfläche (Oberfläche: js/codeeingabe.js).
//
// Aufbau des Codes
//   16 Bilder mit festen Zahlen 1–16. Ein Bild trägt 4 Bit (Zahl − 1 = Wert 0–15).
//   Bild 1–4: 16 Bit Daten. Bit 15 (höchstes) = Version, immer 0; dann je 3 Bit Sterne
//             für Stufe 1, 2, 3, 4, 5 (je 0–7). Bild 1 trägt die höchsten 4 Bit.
//   Bild 5:   Prüfbild.
//
// Prüfbild
//   Gewichtete Summe im Zahlkörper GF(16) (Polynom x⁴ + x + 1). Gewichte: Bild 1–4 → 2, 3, 4, 5,
//   Prüfbild → 1. Ein Code ist gültig, wenn die gewichtete Summe aller 5 Bilder 0 ergibt.
//   Weil alle Gewichte verschieden und ungleich 0 sind, fällt sicher auf:
//     – ein einzelnes falsches Bild (egal an welcher Stelle, auch das Prüfbild),
//     – zwei vertauschte Bilder (auch nicht nebeneinander, auch mit dem Prüfbild).
//   Bei zwei oder mehr falschen Bildern rutscht etwa jeder 16. Code durch.

import { CODEBILDER, dateiStamm } from './aufnahmen.js';

export const CODE_LAENGE = 5;
export const ANZAHL_STUFEN = 5;
export const MAX_STERNE = 7;

// Anlaut jedes Bildes als Graphem-id aus config.js (Mehrbuchstaben als ein Graphem).
const ANLAUTE = ['l', 'm', 's', 'j', 'w', 'b', 'g', 'd', 'au', 'ei', 't', 'k', 'p', 'sch', 'n', 'r'];

/** Die 16 Code-Bilder: { nr: 1–16, wort: 'Lampe', anlaut: 'l', bild: 'assets/codebilder/01_lampe.png' } */
export const BILDER = Object.freeze(CODEBILDER.map((wort, i) => Object.freeze({
  nr: i + 1,
  wort,
  anlaut: ANLAUTE[i],
  bild: `assets/codebilder/${String(i + 1).padStart(2, '0')}_${dateiStamm(wort)}.png`,
})));

// ---------------------------------------------------------------------------
// Rechnen in GF(16)
// ---------------------------------------------------------------------------
/** Multiplikation in GF(16) mit dem Polynom x⁴ + x + 1. Addition ist XOR. */
export function gfMal(a, b) {
  let ergebnis = 0;
  for (let i = 0; i < 4; i++) {
    if (b & 1) ergebnis ^= a;
    b >>= 1;
    a <<= 1;
    if (a & 0x10) a ^= 0x13; // x⁴ = x + 1
  }
  return ergebnis;
}

const GEWICHTE = [2, 3, 4, 5];

/** Prüfwert (0–15) zu den 4 Datenwerten (je 0–15). */
function pruefwert(werte) {
  return werte.reduce((summe, w, i) => summe ^ gfMal(GEWICHTE[i], w), 0);
}

// ---------------------------------------------------------------------------
// Öffentliche Schnittstelle
// ---------------------------------------------------------------------------

/**
 * Sterne der 5 Stufen → 5 Bildnummern (1–16).
 * Ungültige Sternzahlen werden auf 0–7 begrenzt, fehlende zählen als 0.
 */
export function kodiere(sterne) {
  let zahl = 0;
  for (let i = 0; i < ANZAHL_STUFEN; i++) {
    const s = Math.min(MAX_STERNE, Math.max(0, Math.trunc(Number(sterne?.[i]) || 0)));
    zahl = (zahl << 3) | s;
  }
  // zahl hat 15 Bit, Bit 15 (Version) bleibt 0
  const werte = [12, 8, 4, 0].map(verschiebung => (zahl >> verschiebung) & 0xf);
  return [...werte, pruefwert(werte)].map(w => w + 1);
}

/** Prüfbild (1–16), das zu den ersten 4 Bildnummern gehört. */
export function pruefbild(vierBilder) {
  return pruefwert(vierBilder.map(nr => nr - 1)) + 1;
}

/**
 * 5 Bildnummern → Ergebnis.
 *   { ok: true, sterne: [s1, …, s5] }
 *   { ok: false, grund: 'laenge' | 'bild' | 'pruefbild' | 'version' }
 * 'pruefbild' heißt: Bilder passen nicht zusammen (Tippfehler oder Vertauschung).
 */
export function dekodiere(bilder) {
  if (!Array.isArray(bilder) || bilder.length !== CODE_LAENGE) return { ok: false, grund: 'laenge' };
  if (!bilder.every(nr => Number.isInteger(nr) && nr >= 1 && nr <= 16)) return { ok: false, grund: 'bild' };
  const werte = bilder.map(nr => nr - 1);
  if (pruefwert(werte.slice(0, 4)) !== werte[4]) return { ok: false, grund: 'pruefbild' };
  const zahl = (werte[0] << 12) | (werte[1] << 8) | (werte[2] << 4) | werte[3];
  if (zahl & 0x8000) return { ok: false, grund: 'version' }; // unbekannte (spätere) Version
  const sterne = [];
  for (let i = ANZAHL_STUFEN - 1; i >= 0; i--) sterne.push((zahl >> (3 * i)) & 7);
  return { ok: true, sterne };
}
