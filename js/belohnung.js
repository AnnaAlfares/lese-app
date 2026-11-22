// Gemeinsamer Belohnungs-Moment für alle Module: kurzes Lob und „Neuer Stern!“.
// Ruhig (CLAUDE.md, Regel 7): kein Pop-up, nichts blockiert. Ein kleines Zeichen erscheint
// im Modul-Bereich, verschwindet von selbst und lässt Fingertipps durch (pointer-events: none).
// Die Ansagen stehen in aufnahmen.js (eigene Aufnahmen, sonst Gerätestimme) und laufen über sprichAnsage.
// Gestaltung: css/belohnung.css.

import { LOB_ANSAGEN } from './aufnahmen.js';
import { sprichAnsage } from './audio.js';

const DAUER_LOB = 1200;   // ms, so lange ist das Lob-Zeichen zu sehen
const DAUER_STERN = 2200; // ms, so lange ist der Stern zu sehen

const STERN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3
  l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
const HAKEN = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;

// Lob-Ansagen abwechseln: alle einmal in zufälliger Reihenfolge, nie zweimal direkt hintereinander.
let stapel = [];
let letzte = null;
/** Nächste Lob-Ansage-id (für Module, die nur sprechen, aber nichts zeigen wollen). */
export function naechstesLob() {
  if (stapel.length === 0) {
    stapel = [...LOB_ANSAGEN].sort(() => Math.random() - 0.5);
    if (stapel.length > 1 && stapel[stapel.length - 1] === letzte) stapel.reverse();
  }
  letzte = stapel.pop();
  return letzte;
}

/** Zeigt ein Zeichen in `behaelter` und entfernt es nach `dauer` ms. Ein neues Zeichen ersetzt ein altes. */
function zeige(behaelter, klasse, inhalt, dauer) {
  if (!behaelter) return;
  if (getComputedStyle(behaelter).position === 'static') behaelter.style.position = 'relative';
  behaelter.querySelector(':scope > .belohnung')?.remove();
  const el = document.createElement('div');
  el.className = `belohnung ${klasse}`;
  el.setAttribute('role', 'status');
  el.innerHTML = inhalt;
  el.style.setProperty('--dauer', `${dauer}ms`);
  behaelter.append(el);
  setTimeout(() => el.remove(), dauer);
}

/**
 * Kurzes Lob: kleiner Haken im Modul-Bereich und eine abwechselnde Lob-Ansage
 * („Toll gemacht!“, „Das hast du gut gemacht!“, …).
 * @param {HTMLElement} behaelter  Modul-Bereich, in dem das Zeichen erscheint (null = nur sprechen)
 * @param {{ansage?: string|false}} [optionen]  eigene Ansage-id, oder false = stumm
 * @returns {Promise} erfüllt, wenn die Ansage zu Ende ist (Abwarten ist freiwillig)
 */
export function lobe(behaelter, { ansage } = {}) {
  zeige(behaelter, 'lob', HAKEN, DAUER_LOB);
  if (ansage === false) return Promise.resolve(false);
  return sprichAnsage(ansage ?? naechstesLob());
}

/**
 * Neuer Stern: ein Stern erscheint ruhig im Modul-Bereich und schwebt nach oben weg, dazu „Neuer Stern!“.
 * Passt zu zaehle(): if (zaehle(zustand, 3)) feiereStern(bereich);
 * @param {HTMLElement} behaelter  Modul-Bereich (null = nur sprechen)
 * @param {{ansage?: string|false}} [optionen]
 * @returns {Promise} erfüllt, wenn die Ansage zu Ende ist
 */
export function feiereStern(behaelter, { ansage } = {}) {
  zeige(behaelter, 'neuer-stern', `${STERN}<span class="unsichtbar">Neuer Stern!</span>`, DAUER_STERN);
  if (ansage === false) return Promise.resolve(false);
  return sprichAnsage(ansage ?? 'neuer-stern');
}
