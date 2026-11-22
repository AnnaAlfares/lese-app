// Gemeinsamer Belohnungs-Moment für alle Module: kurzes Lob, Sterne-Zusammenfassung am Rundenende
// und „Neuer Stern!“. Entscheidung Anna: Während der Übung werden Sterne still gezählt;
// erst am Rundenende sagt fasseSterneZusammen(), wie viele neu dazukamen.
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
 * NICHT während der Übung verwenden (Entscheidung Anna: Sterne still zählen, am Rundenende
 * fasseSterneZusammen). Bleibt für Sonderfälle erhalten.
 * Neuer Stern: ein Stern erscheint ruhig im Modul-Bereich und schwebt nach oben weg, dazu „Neuer Stern!“.
 * @param {HTMLElement} behaelter  Modul-Bereich (null = nur sprechen)
 * @param {{ansage?: string|false}} [optionen]
 * @returns {Promise} erfüllt, wenn die Ansage zu Ende ist
 */
export function feiereStern(behaelter, { ansage } = {}) {
  zeige(behaelter, 'neuer-stern', `${STERN}<span class="unsichtbar">Neuer Stern!</span>`, DAUER_STERN);
  if (ansage === false) return Promise.resolve(false);
  return sprichAnsage(ansage ?? 'neuer-stern');
}

// ---------------------------------------------------------------------------
// Zusammenfassung am Rundenende
// ---------------------------------------------------------------------------
const laeufe = new WeakMap(); // Behälter → Nummer des aktuellen Durchgangs (neuer Aufruf bricht alten ab)

/**
 * Ruhige Zusammenfassung der in dieser Runde neu gewonnenen Sterne.
 * Zeigt die neuen Sterne als ruhige Reihe im Behälter (bleibt stehen, bis das Modul neu zeichnet) und spricht:
 *   1 Stern:    „Du hast in dieser Übung einen neuen Stern bekommen.“
 *   2–7 Sterne: „Du hast in dieser Übung“ – „drei“ – „neue Sterne bekommen.“
 *   0 Sterne:   keine Reihe, stattdessen lobe(behaelter) (abwechselndes Lob).
 * @param {HTMLElement} behaelter  Ergebnis-Bereich des Moduls (null = nur sprechen)
 * @param {number} anzahlNeu  neue Sterne dieser Runde, z. B. runde.neu aus starteRunde() (sterne.js)
 * @param {{vorweg?: string[], danach?: Function}} [optionen]
 *   vorweg: Ansage-ids, die vorher gesprochen werden (z. B. ['neuer-rekord'])
 *   danach: wird aufgerufen, wenn alles gesprochen ist (nicht, wenn abgebrochen)
 * @returns {Promise<boolean>} true = zu Ende gesprochen, false = abgebrochen
 *   (Behälter nicht mehr auf der Seite oder neue Zusammenfassung im selben Behälter)
 */
export async function fasseSterneZusammen(behaelter, anzahlNeu, { vorweg = [], danach } = {}) {
  const n = Math.max(0, Math.trunc(Number(anzahlNeu) || 0));
  const schluessel = behaelter ?? fasseSterneZusammen;
  const meinLauf = (laeufe.get(schluessel) ?? 0) + 1;
  laeufe.set(schluessel, meinLauf);
  const aktuell = () => laeufe.get(schluessel) === meinLauf && (!behaelter || behaelter.isConnected);

  behaelter?.querySelector(':scope > .belohnung-sterne')?.remove();
  if (behaelter && n > 0) {
    const reihe = document.createElement('div');
    reihe.className = 'belohnung-sterne';
    reihe.setAttribute('role', 'img');
    reihe.setAttribute('aria-label', n === 1 ? 'ein neuer Stern' : `${n} neue Sterne`);
    reihe.innerHTML = Array.from({ length: n }, (_, i) =>
      `<span class="belohnung-sterne-stern" style="animation-delay:${i * 250}ms">${STERN}</span>`).join('');
    behaelter.append(reihe);
  }

  for (const id of vorweg) {
    if (!aktuell()) return false;
    await sprichAnsage(id);
  }
  if (!aktuell()) return false;
  if (n === 0) {
    await lobe(behaelter);
  } else {
    const satz = n === 1 ? ['sterne-einen-neuen'] : ['sterne-du-hast', `zahl-${n}`, 'sterne-neue-bekommen'];
    for (const id of satz) {
      if (!aktuell()) return false;
      await sprichAnsage(id);
    }
  }
  if (!aktuell()) return false;
  danach?.();
  return true;
}
