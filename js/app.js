// Lese-App – Navigation und Zustand im Arbeitsspeicher.
// Kein localStorage, keine Cookies: Der Spielstand lebt nur, solange die Seite offen ist.

import { STUFEN, leseEinstellungen } from './config.js';
import { aktiviereSprechknoepfe, sprichAnsage } from './audio.js';
import { modulAnsage } from './aufnahmen.js';
import { zeigeCodeEingabe, zeigeAbschluss, sterneHtml } from './codeeingabe.js';

// Einstellungen der Lehrkraft (aus der Adresse) und Spielstand (nur im Arbeitsspeicher)
export const einstellungen = leseEinstellungen();
export const zustand = {
  sterne: [0, 0, 0, 0, 0], // je Stufe 0–7, kommt aus dem Bildercode (codeeingabe.js)
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

const HAKEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;

const app = document.getElementById('app');

// Bildercode: beim Start eingeben, bei „Fertig“ den neuen Code zeigen, bei „Ende“ alles vergessen
function zeigeAnmeldung() {
  zustand.sterne = [0, 0, 0, 0, 0];
  zeigeCodeEingabe(app, { weiter: sterne => { zustand.sterne = sterne; zeigeStart(); } });
}
function zeigeEnde() {
  zeigeAbschluss(app, zustand.sterne, { zurueck: zeigeStart, ende: zeigeAnmeldung });
}

function zeigeStart() {
  app.innerHTML = `
    <div class="kopf"><h1>Lese-App</h1>
      <button class="fertig" aria-label="Fertig">${HAKEN}<span>Fertig</span></button></div>
    <div class="kacheln">
      ${STUFEN.map(s => `
        <button class="kachel" data-stufe="${s.nr}" style="background:${s.farbe}">
          ${SYMBOLE[s.nr]}
          <span class="nr">${s.nr}</span>
          <span class="titel">${s.titel}</span>
          ${sterneHtml(zustand.sterne[s.nr - 1])}
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
      ${stufe.module.map(m => `
        <button class="kachel aus" style="background:${stufe.farbe}" data-sprich-ansage="${modulAnsage(m)}">
          <span class="titel">${m}</span>
          <span class="bald">kommt bald</span>
        </button>`).join('')}
    </div>`;
}

app.addEventListener('click', e => {
  const kachel = e.target.closest('[data-stufe]');
  if (kachel) {
    const stufe = STUFEN[kachel.dataset.stufe - 1];
    sprichAnsage(`stufe-${stufe.nr}`); // Kinder können die Titel noch nicht lesen
    zeigeStufe(stufe.nr);
    return;
  }
  if (e.target.closest('.fertig')) {
    zeigeEnde();
    return;
  }
  if (e.target.closest('.zurueck') && !e.target.closest('.abschluss')) {
    sprichAnsage('zurueck');
    zeigeStart();
  }
});

aktiviereSprechknoepfe(app);
zeigeAnmeldung();
