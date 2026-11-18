// Lese-App – Navigation und Zustand im Arbeitsspeicher.
// Kein localStorage, keine Cookies: Der Spielstand lebt nur, solange die Seite offen ist.

import { STUFEN, leseEinstellungen } from './config.js';
import { aktiviereSprechknoepfe, sprichAnsage } from './audio.js';
import { modulAnsage } from './aufnahmen.js';

// Einstellungen der Lehrkraft (aus der Adresse) und Spielstand (nur im Arbeitsspeicher)
export const einstellungen = leseEinstellungen();
export const zustand = {
  sterne: [0, 0, 0, 0, 0], // je Stufe 0–7, kommt später aus dem Bildercode
};

// Eigene, einfache Symbole je Stufe (inline SVG, keine externen Dateien)
const SYMBOLE = {
  1: `<svg viewBox="0 0 100 100" fill="none" stroke="#7a4b12" stroke-width="7" stroke-linecap="round">
        <path d="M30 42c0-16 11-27 25-27s25 11 25 26c0 12-7 17-12 22s-5 12-11 15-13-1-13-8"/>
        <path d="M45 44c0-6 4-10 10-10s10 4 10 10c0 5-4 8-8 9"/></svg>`,
  2: `<svg viewBox="0 0 100 100"><text x="50" y="70" text-anchor="middle" font-size="62"
        font-family="system-ui, sans-serif" fill="#2f6b2f">Mm</text></svg>`,
  3: `<svg viewBox="0 0 100 100"><text x="22" y="48" text-anchor="middle" font-size="40"
        font-family="system-ui, sans-serif" fill="#1f4f86">m</text>
        <text x="78" y="48" text-anchor="middle" font-size="40" font-family="system-ui, sans-serif"
        fill="#c62828">a</text>
        <path d="M22 62 Q50 92 78 62" fill="none" stroke="#1f4f86" stroke-width="6" stroke-linecap="round"/></svg>`,
  4: `<svg viewBox="0 0 100 100"><path d="M58 8 L26 56 H48 L40 92 L76 40 H54 Z" fill="#7b4ea0"/></svg>`,
  5: `<svg viewBox="0 0 100 100" fill="none" stroke="#a33" stroke-width="6" stroke-linejoin="round">
        <path d="M50 28 C38 20 22 20 10 24 V80 C22 76 38 76 50 84 C62 76 78 76 90 80 V24 C78 20 62 20 50 28 Z"/>
        <path d="M50 28 V84"/></svg>`,
};

const PFEIL_ZURUECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 L7 12 L15 20"/></svg>`;

const app = document.getElementById('app');

// Fertige Module: Name (wie in config.js, STUFEN) → Datei in js/module/.
// Jedes Modul exportiert starte(wurzel, { einstellungen, zurueck, stern }) und liefert stopp().
const MODULE = {
  'Leseapparat': './module/leseapparat.js',
};
let modulStopp = null; // gesetzt, solange ein Modul läuft

function zeigeStart() {
  app.innerHTML = `
    <div class="kopf"><h1>Lese-App</h1></div>
    <div class="kacheln">
      ${STUFEN.map(s => `
        <button class="kachel" data-stufe="${s.nr}" style="background:${s.farbe}">
          ${SYMBOLE[s.nr]}
          <span class="nr">${s.nr}</span>
          <span class="titel">${s.titel}</span>
        </button>`).join('')}
    </div>`;
}

function zeigeStufe(nr) {
  const stufe = STUFEN[nr - 1];
  app.innerHTML = `
    <div class="kopf">
      <button class="zurueck" aria-label="Zurück">${PFEIL_ZURUECK}</button>
      <h1>${stufe.nr} · ${stufe.titel}</h1>
    </div>
    <div class="kacheln">
      ${stufe.module.map(m => MODULE[m] ? `
        <button class="kachel" style="background:${stufe.farbe}" data-sprich-ansage="${modulAnsage(m)}"
          data-modul="${m}" data-stufen-nr="${stufe.nr}">
          <span class="titel">${m}</span>
        </button>` : `
        <button class="kachel aus" style="background:${stufe.farbe}" data-sprich-ansage="${modulAnsage(m)}">
          <span class="titel">${m}</span>
          <span class="bald">kommt bald</span>
        </button>`).join('')}
    </div>`;
}

async function starteModul(name, stufenNr) {
  const { starte } = await import(MODULE[name]);
  modulStopp = starte(app, {
    einstellungen,
    zurueck: () => { modulStopp = null; sprichAnsage('zurueck'); zeigeStufe(stufenNr); },
    stern: () => { zustand.sterne[stufenNr - 1] = Math.min(7, zustand.sterne[stufenNr - 1] + 1); },
  });
}

app.addEventListener('click', e => {
  // Klicks im Modul behandelt das Modul selbst (auch den Zurück-Knopf, der beim Klick schon entfernt ist)
  if (modulStopp || !app.contains(e.target)) return;
  const modul = e.target.closest('[data-modul]');
  if (modul) { starteModul(modul.dataset.modul, Number(modul.dataset.stufenNr)); return; }
  const kachel = e.target.closest('[data-stufe]');
  if (kachel) {
    const stufe = STUFEN[kachel.dataset.stufe - 1];
    sprichAnsage(`stufe-${stufe.nr}`); // Kinder können die Titel noch nicht lesen
    zeigeStufe(stufe.nr);
    return;
  }
  if (e.target.closest('.zurueck')) {
    sprichAnsage('zurueck');
    zeigeStart();
  }
});

aktiviereSprechknoepfe(app);
zeigeStart();
