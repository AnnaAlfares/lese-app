// Sterne-Regel für alle Module (Entscheidung Anna, siehe js/module/README.md):
//   10 gelesene Einheiten = 1 Stern der Stufe, je Stufe höchstens 7 Sterne.
//   Einheit = eine Silbe oder ein Wort (Stufen 3–5) bzw. eine richtig gelöste Aufgabe (Stufen 1–2).
//   Ein Zähler je Stufe, nur im Arbeitsspeicher (zustand.zaehler), zählt über Runden und Module
//   hinweg weiter: Angefangene Reste gehen nicht verloren. Der Zähler steht NICHT im Bildercode;
//   ein Kind, das mit seinem Code wiederkommt, beginnt beim nächsten Stern wieder bei 0.
//
// Was als „wirklich gelesen“ zählt, entscheidet das Modul, bevor es zaehle() aufruft
// (z. B. Blitzlesen nur richtige Antworten, Silbenteppich nur nach der Mindestzeit).

import { STUFEN } from './config.js';
import { MAX_STERNE } from './bildercode.js';

export const EINHEITEN_JE_STERN = 10;

/** Setzt den Spielstand (neues Kind oder Code eingegeben): Sterne übernehmen, Zähler auf 0. */
export function setzeSpielstand(zustand, sterne = []) {
  zustand.sterne = STUFEN.map((_, i) => sterne[i] ?? 0);
  zustand.zaehler = STUFEN.map(() => 0);
}

/**
 * Zählt `anzahl` gelesene Einheiten für `stufe` (1–5).
 * Schreibt bei jedem vollen Zehner einen Stern in zustand.sterne[stufe - 1] (höchstens 7).
 * @returns {number} Anzahl der Sterne, die gerade dazukamen (meist 0 oder 1).
 *   Als Wahrheitswert nutzbar: if (zaehle(zustand, 3)) feiereStern();
 */
export function zaehle(zustand, stufe, anzahl = 1) {
  const i = stufe - 1;
  if (!Number.isInteger(stufe) || i < 0 || i >= STUFEN.length || !Number.isInteger(anzahl) || anzahl <= 0) {
    console.warn('zaehle(): ungültige Stufe oder Anzahl', stufe, anzahl);
    return 0;
  }
  zustand.sterne ??= STUFEN.map(() => 0);
  zustand.zaehler ??= STUFEN.map(() => 0);

  zustand.zaehler[i] += anzahl;
  let neu = 0;
  while (zustand.zaehler[i] >= EINHEITEN_JE_STERN) {
    zustand.zaehler[i] -= EINHEITEN_JE_STERN;
    if (zustand.sterne[i] < MAX_STERNE) {
      zustand.sterne[i]++;
      neu++;
    }
  }
  return neu;
}

/** Wie viele Einheiten fehlen in dieser Stufe noch bis zum nächsten Stern (für eine Fortschrittsanzeige). */
export function nochBisStern(zustand, stufe) {
  return EINHEITEN_JE_STERN - (zustand.zaehler?.[stufe - 1] ?? 0);
}
