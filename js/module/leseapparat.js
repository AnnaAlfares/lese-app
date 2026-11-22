// Modul „Leseapparat“ (Stufe 3: Laute verbinden).
// Zwei Fenster nebeneinander: links ein Konsonant, rechts ein Vokal, darunter ein Bogen.
// Das Kind wischt einen Streifen weiter (hoch/runter). Ein Punkt gleitet den Bogen entlang,
// die App spricht gedehnt vor (/mmm/ → /aaa/ → „ma“). Danach fährt das Kind selbst mit dem
// Finger den Bogen entlang und liest laut.
//
// Zwei Abläufe (Hilfe abbaubar, CLAUDE.md Regel 5):
//   'hoeren'  – erst vormachen, dann selbst lesen (Standard)
//   'lesen'   – erst selbst lesen, dann zur Kontrolle anhören
//
// Links stehen nur Dehnlaute; nicht dehnbare Laute erst, wenn die Lehrkraft sie zuschaltet
// (einstellungen.plosive, URL-Parameter p=1).
//
// Buchstaben nur aus dem Buchstabenstand (config.js), der neueste Buchstabe kommt häufiger vor.
// Eigene Gestaltung; Idee „Leseapparat“ nach Ina Lehr, keine Übernahme der Vorlage.
//
// Schnittstelle (gemeinsam für alle Module, Lader in app.js):
//   starte(behaelter, { einstellungen, zustand, zurueck }) → stopp()
//   Kopfzeile mit Zurück-Pfeil und Modulname baut app.js; stopp() räumt beim Verlassen auf.

import { BUCHSTABEN, GEWICHT_NEUER_BUCHSTABE } from '../config.js';
import { sprichLaut, sprichSilbe, stoppe } from '../audio.js';
import { zaehle, nochBisStern, EINHEITEN_JE_STERN } from '../sterne.js';
import { lobe, feiereStern } from '../belohnung.js';

const STUFE = 3; // Leseapparat gehört zu Stufe 3 „Laute verbinden“

// Lob (Entscheidung Anna): zur Hälfte der Runde und am Rundenende.
// Eine Runde = so viele selbst gelesene Silben. Zum Ändern nur hier und in lobZeitpunkt() anpassen.
const SILBEN_JE_RUNDE = 10;
const LOB_NACH = [Math.ceil(SILBEN_JE_RUNDE / 2), SILBEN_JE_RUNDE]; // nach 5 und nach 10 Silben

// Geometrie des Bogens (SVG-Koordinaten, viewBox 0 0 1000 200).
// Die Fenstermitten liegen bei 17 % und 83 % der Breite (siehe css/leseapparat.css).
const X0 = 170, X1 = 830, Y_RAND = 24, Y_STEUER = 300;
const bogenPunkt = t => ({
  x: X0 + t * (X1 - X0),
  y: (1 - t) ** 2 * Y_RAND + 2 * t * (1 - t) * Y_STEUER + t ** 2 * Y_RAND,
});

// Dauer der Punktbewegung je Laut in ms (bei Tempo 100 %)
const DAUER = { dehnbar: 1300, kurz: 350, vokal: 1300 };

const PFEIL_HOCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"
  stroke-linecap="round" stroke-linejoin="round"><path d="M5 15 L12 8 L19 15"/></svg>`;
const PFEIL_RUNTER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"
  stroke-linecap="round" stroke-linejoin="round"><path d="M5 9 L12 16 L19 9"/></svg>`;
const OHR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round"><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/>
  <path d="M10 9.5a2 2 0 0 1 4 0"/></svg>`;
const AUGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>
  <circle cx="12" cy="12" r="3"/></svg>`;
const LAUTSPRECHER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/>
  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
const KRONE = `<svg viewBox="0 0 40 24"><path d="M3 21 L6 5 L14 13 L20 2 L26 13 L34 5 L37 21 Z"
  fill="#f2b705" stroke="#a87b00" stroke-width="2" stroke-linejoin="round"/></svg>`;
const STERN = `<svg viewBox="0 0 24 24"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z"
  fill="#f2b705" stroke="#a87b00" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

// ---------------------------------------------------------------------------
// Streifen: welche Grapheme in welcher Reihenfolge
// ---------------------------------------------------------------------------
function mische(liste) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Gemischter Streifen; das neueste Graphem steht vorne und kommt bis zu
 * GEWICHT_NEUER_BUCHSTABE-mal vor, gleichmäßig verteilt (nie zweimal hintereinander).
 */
function baueStreifenEinmal(grapheme, neuId) {
  const rest = mische(grapheme.filter(b => b.id !== neuId));
  const neu = grapheme.find(b => b.id === neuId);
  if (!neu) return rest;
  const anzahl = Math.max(1, Math.min(GEWICHT_NEUER_BUCHSTABE, rest.length));
  const n = rest.length + anzahl;
  const plaetze = new Set(Array.from({ length: anzahl }, (_, i) => Math.round(i * n / anzahl)));
  const ergebnis = [];
  for (let i = 0, r = 0; i < n; i++) ergebnis.push(plaetze.has(i) ? neu : rest[r++]);
  return ergebnis.filter(Boolean);
}

// Ähnlich klingende Laute sollen im Streifen nicht direkt nebeneinanderstehen
// (NRW „Lesekompetenz gezielt fördern“, S. 71: z. B. /m/–/n/, stimmlos/stimmhaft wie /f/–/w/, /p/–/b/).
// Vorschlag: später nach config.js verschieben, falls andere Module die Liste auch brauchen.
const AEHNLICH = [['m', 'n'], ['f', 'w'], ['p', 'b'], ['t', 'd'], ['k', 'g']];
const aehnlich = (a, b) => AEHNLICH.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

/** Stehen irgendwo zwei ähnliche Laute direkt nebeneinander (auch über das Streifenende hinweg)? */
function hatAehnlicheNachbarn(streifen) {
  return streifen.length > 2 &&
    streifen.some((b, i) => aehnlich(b.id, streifen[(i + 1) % streifen.length].id));
}

/**
 * Gemischter Streifen wie oben; ähnliche Laute möglichst nicht nebeneinander.
 * Mischt dafür bis zu 50-mal neu; gelingt es nicht (sehr wenige Laute), bleibt der letzte Versuch.
 */
export function baueStreifen(grapheme, neuId) {
  let streifen = baueStreifenEinmal(grapheme, neuId);
  for (let versuch = 0; versuch < 50 && hatAehnlicheNachbarn(streifen); versuch++) {
    streifen = baueStreifenEinmal(grapheme, neuId);
  }
  return streifen;
}

/**
 * Konsonanten (dürfen eine Silbe beginnen) und Vokale bis zum Buchstabenstand.
 * Ohne plosive nur Dehnlaute (m, l, s, f, n, r, w, h, sch, j …): Laute verbinden gelingt zuerst
 * mit dehnbaren Lauten (Entscheidung Anna; NRW S. 66/71, LFplus S. 64/66).
 * Mit plosive = true kommen die nicht dehnbaren dazu (t, k, p, d, g, b, z, st, pf, sp, qu).
 */
export function graphemeFuerStand(stand, plosive = false) {
  const eingefuehrt = BUCHSTABEN.slice(0, stand);
  return {
    konsonanten: eingefuehrt.filter(b => b.typ !== 'vokal' && b.anfang && (plosive || b.typ === 'dauerlaut')),
    vokale: eingefuehrt.filter(b => b.typ === 'vokal'),
    neu: eingefuehrt[eingefuehrt.length - 1],
  };
}

const grossAnfang = text => text[0].toUpperCase() + text.slice(1);

// ---------------------------------------------------------------------------
// Modul
// ---------------------------------------------------------------------------
export function starte(behaelter, { einstellungen, zustand } = {}) {
  ladeCss();
  // einstellungen.plosive: Schalter der Lehrkraft (URL-Parameter p=1); fehlt er, nur Dehnlaute
  const { konsonanten, vokale, neu } = graphemeFuerStand(einstellungen.stand, einstellungen.plosive === true);
  const tempo = einstellungen.tempo / 100;

  if (!konsonanten.length || !vokale.length) {
    behaelter.innerHTML = `<div class="la-hinweis">Für den Leseapparat braucht es mindestens einen
      Konsonanten (Dehnlaut) und einen Vokal. Bitte im Lehrkraft-Bereich den Buchstabenstand erhöhen.</div>`;
    return () => {};
  }

  const apparat = document.createElement('div');
  apparat.className = 'la-apparat';
  apparat.innerHTML = `
    <div class="la-seite la-seite-links">
      <button class="la-pfeil" data-seite="k" data-richtung="1" aria-label="nächster Buchstabe">${PFEIL_HOCH}</button>
      <button class="la-pfeil" data-seite="k" data-richtung="-1" aria-label="voriger Buchstabe">${PFEIL_RUNTER}</button>
    </div>
    <div class="la-fenster la-konsonant" data-seite="k"><div class="la-band"></div></div>
    <div class="la-mitte"></div>
    <div class="la-fenster la-vokal" data-seite="v">
      ${einstellungen.hilfen.koenig ? `<div class="la-krone">${KRONE}</div>` : ''}
      <div class="la-band"></div>
    </div>
    <div class="la-seite la-seite-rechts">
      <button class="la-pfeil" data-seite="v" data-richtung="1" aria-label="nächster Vokal">${PFEIL_HOCH}</button>
      <button class="la-pfeil" data-seite="v" data-richtung="-1" aria-label="voriger Vokal">${PFEIL_RUNTER}</button>
    </div>
    <svg class="la-bogen" viewBox="0 0 1000 200" aria-hidden="true">
      <path class="la-bogen-k" d="M${X0} ${Y_RAND} Q335 162 500 162"/>
      <path class="la-bogen-v" d="M500 162 Q665 162 ${X1} ${Y_RAND}"/>
      <path class="la-spur" pathLength="1" stroke-dasharray="0 1"
        d="M${X0} ${Y_RAND} Q500 ${Y_STEUER} ${X1} ${Y_RAND}"/>
      <path class="la-spitze" d="M${X1 - 34} ${Y_RAND + 10} L${X1} ${Y_RAND - 4} L${X1 - 6} ${Y_RAND + 34}"/>
      <text class="la-silbe" x="500" y="118" text-anchor="middle" opacity="0"></text>
      <g class="la-punkt">
        <circle class="la-punkt-griff" r="70"/>
        <circle class="la-punkt-kreis" r="30"/>
      </g>
    </svg>
    <div class="la-knoepfe">
      <button class="lautsprecher la-anleitung" data-sprich-ansage="leseapparat-anleitung"
        aria-label="Anleitung anhören">?</button>
      <button class="la-hoeren" aria-label="Vorlesen">${LAUTSPRECHER}</button>
      <button class="la-modus" aria-label="Ablauf wechseln"></button>
      <button class="la-gross" aria-pressed="false" aria-label="Großbuchstabe am Anfang">Aa</button>
      <div class="la-fortschritt" aria-label="Fortschritt"></div>
    </div>`;
  behaelter.replaceChildren(apparat);

  const fensterK = apparat.querySelector('.la-konsonant');
  const fensterV = apparat.querySelector('.la-vokal');
  const svg = apparat.querySelector('.la-bogen');
  const punkt = apparat.querySelector('.la-punkt');
  const spur = apparat.querySelector('.la-spur');
  const silbeText = apparat.querySelector('.la-silbe');
  const modusKnopf = apparat.querySelector('.la-modus');
  const grossKnopf = apparat.querySelector('.la-gross');
  const fortschritt = apparat.querySelector('.la-fortschritt');

  // Zustand nur im Arbeitsspeicher
  const s = {
    streifen: {
      k: { liste: baueStreifen(konsonanten, neu.id), i: 0, fenster: fensterK },
      v: { liste: baueStreifen(vokale, neu.id), i: 0, fenster: fensterV },
    },
    modus: 'hoeren',
    gross: false,
    t: 0,               // Position des Punkts auf dem Bogen (0 … 1)
    vorgemacht: false,  // wurde die aktuelle Silbe schon vorgesprochen/gezeigt?
    gezaehlt: false,    // hat das Kind die aktuelle Silbe schon selbst gelesen?
    runde: 0,           // selbst gelesene Silben in der laufenden Runde (für das Lob)
    token: 0,           // zum Abbrechen laufender Abläufe
    rahmen: 0,          // requestAnimationFrame-Nummer
    zeitgeber: 0,
  };

  const aktuell = seite => {
    const st = s.streifen[seite];
    return st.liste[st.i];
  };
  const silbe = () => aktuell('k').id + aktuell('v').id;
  const zeigeK = b => (s.gross ? grossAnfang(b.id) : b.id);

  // ---------- Darstellung ----------
  function zeichneBand(seite) {
    const st = s.streifen[seite];
    const n = st.liste.length;
    const band = st.fenster.querySelector('.la-band');
    band.style.transition = 'none';
    band.style.transform = 'translateY(0)';
    band.innerHTML = [-2, -1, 0, 1, 2].map(d => {
      const b = st.liste[((st.i + d) % n + n) % n];
      const text = seite === 'k' ? zeigeK(b) : b.id;
      return `<div class="la-zeichen${d === 0 ? ' la-jetzt' : ''}">${text}</div>`;
    }).join('');
  }

  function zeichneSilbe(sichtbar) {
    const k = aktuell('k'), v = aktuell('v');
    silbeText.innerHTML = `<tspan class="la-k">${zeigeK(k)}</tspan><tspan class="la-v">${v.id}</tspan>`;
    silbeText.classList.toggle('la-sichtbar', sichtbar);
  }

  function setzePunkt(t) {
    s.t = t;
    const p = bogenPunkt(t);
    punkt.setAttribute('transform', `translate(${p.x} ${p.y})`);
    spur.setAttribute('stroke-dasharray', `${t} 1`);
    markiere(t <= 0 ? null : t < 0.5 ? 'k' : 'v');
  }

  function markiere(seite) {
    fensterK.classList.toggle('la-aktiv', seite === 'k');
    fensterV.classList.toggle('la-aktiv', seite === 'v');
  }

  function zeichneModus() {
    const hoeren = s.modus === 'hoeren';
    modusKnopf.innerHTML = hoeren ? `${OHR}<span>zuerst hören</span>` : `${AUGE}<span>zuerst lesen</span>`;
    modusKnopf.setAttribute('aria-label', hoeren ? 'Ablauf: zuerst hören' : 'Ablauf: zuerst selbst lesen');
  }

  /** Punkte = Fortschritt bis zum nächsten Stern (zentraler Zähler, zählt über Module weiter). */
  function zeichneFortschritt(neuerStern = false) {
    const voll = EINHEITEN_JE_STERN - nochBisStern(zustand, STUFE);
    const sterne = zustand.sterne?.[STUFE - 1] ?? 0;
    const punkte = Array.from({ length: EINHEITEN_JE_STERN },
      (_, i) => `<span class="la-pip${i < voll ? ' la-voll' : ''}"></span>`).join('');
    fortschritt.innerHTML = `<span class="la-pips">${punkte}</span>
      <span class="la-sterne${neuerStern ? ' la-neu' : ''}">${STERN}<span>${sterne}</span></span>`;
  }

  // ---------- Abläufe ----------
  function abbrechen() {
    s.token++;
    cancelAnimationFrame(s.rahmen);
    clearTimeout(s.zeitgeber);
    stoppe();
    punkt.classList.remove('la-wink');
  }

  const warte = ms => new Promise(r => { s.zeitgeber = setTimeout(r, ms); });

  /** Punkt von t=von nach t=bis bewegen (gleichmäßig). Bricht bei neuem Token ab. */
  function bewege(von, bis, dauer, token) {
    return new Promise(resolve => {
      const start = performance.now();
      const schritt = () => {
        if (token !== s.token) { resolve(); return; }
        // performance.now() statt Zeitstempel von requestAnimationFrame: der kann vor „start“ liegen
        const anteil = Math.max(0, Math.min(1, (performance.now() - start) / dauer));
        setzePunkt(von + (bis - von) * anteil);
        if (anteil < 1) s.rahmen = requestAnimationFrame(schritt);
        else resolve();
      };
      s.rahmen = requestAnimationFrame(schritt);
    });
  }

  /** Vormachen: Punkt gleitet, Konsonant gedehnt, Vokal gedehnt, dann die Silbe. */
  async function vormachen() {
    abbrechen();
    const token = s.token;
    const k = aktuell('k'), v = aktuell('v');
    apparat.classList.add('la-spricht');
    setzePunkt(0);
    zeichneSilbe(false);
    await warte(150);
    if (token !== s.token) return;

    const dauerK = (k.typ === 'dauerlaut' ? DAUER.dehnbar : DAUER.kurz) / tempo;
    await Promise.all([sprichLaut(k.id), bewege(0, 0.5, dauerK, token)]);
    if (token !== s.token) return;
    await Promise.all([sprichLaut(v.id), bewege(0.5, 1, DAUER.vokal / tempo, token)]);
    if (token !== s.token) return;

    markiere(null);
    zeichneSilbe(true);
    await warte(200);
    if (token !== s.token) return;
    await sprichSilbe(k.id + v.id);
    if (token !== s.token) return;
    s.vorgemacht = true;
    apparat.classList.remove('la-spricht');

    // Jetzt liest das Kind selbst: Punkt zurück an den Anfang und winken
    await warte(500);
    if (token !== s.token) return;
    await bewege(1, 0, 400, token);
    if (token !== s.token) return;
    punkt.classList.add('la-wink');
  }

  /** Neue Kombination: alles zurücksetzen, im Ablauf „zuerst hören“ automatisch vormachen. */
  function neueSilbe(sofortVormachen) {
    abbrechen();
    apparat.classList.remove('la-spricht');
    s.vorgemacht = false;
    s.gezaehlt = false;
    setzePunkt(0);
    zeichneSilbe(false);
    if (s.modus === 'hoeren' && sofortVormachen) {
      const token = s.token;
      warte(350).then(() => { if (token === s.token) vormachen(); });
    } else {
      punkt.classList.add('la-wink');
    }
  }

  /** Das Kind hat den Punkt selbst bis zum Ende gezogen. */
  async function selbstGelesen() {
    abbrechen();
    const token = s.token;
    setzePunkt(1);
    markiere(null);
    zeichneSilbe(true);
    let neuerStern = false, lob = false;
    if (!s.gezaehlt) {
      // zählt nur, wenn das Kind den Punkt selbst über den Bogen gezogen hat, je Silbe einmal
      s.gezaehlt = true;
      neuerStern = zaehle(zustand, STUFE) > 0;
      s.runde++;
      lob = lobZeitpunkt(s.runde);
      if (s.runde >= SILBEN_JE_RUNDE) s.runde = 0;
      zeichneFortschritt(neuerStern);
    }
    // Kontrolle bzw. Bestätigung: die Silbe einmal hören, danach Stern bzw. Lob
    await sprichSilbe(silbe());
    // Hat das Kind schon weitergewischt, nur zeigen und nicht sprechen (sonst wird das Vormachen unterbrochen)
    const still = token !== s.token ? { ansage: false } : {};
    if (neuerStern) feiereStern(behaelter, still);
    else if (lob) lobe(behaelter, still); // fällt Lob mit neuem Stern zusammen, nur den Stern feiern
    if (token !== s.token) return;
    s.vorgemacht = true;
  }

  /** Wird nach dieser Silbe der Runde gelobt? (Hälfte und Ende der Runde) */
  function lobZeitpunkt(silbeDerRunde) {
    return LOB_NACH.includes(silbeDerRunde);
  }

  // ---------- Streifen wischen ----------
  function weiter(seite, richtung) {
    const st = s.streifen[seite];
    const n = st.liste.length;
    if (n < 2 || st.gleitet) return;
    st.gleitet = true;
    const band = st.fenster.querySelector('.la-band');
    const hoehe = band.firstElementChild.getBoundingClientRect().height;
    band.style.transition = 'transform 220ms ease-out';
    band.style.transform = `translateY(${-richtung * hoehe}px)`;
    abbrechen();
    const fertig = () => {
      st.gleitet = false;
      if (s.beendet) return;
      st.i = ((st.i + richtung) % n + n) % n;
      zeichneBand(seite);
      neueSilbe(true);
    };
    setTimeout(fertig, 240); // nach der Gleitbewegung (220 ms)
  }

  function wischbar(fenster) {
    const seite = fenster.dataset.seite;
    const band = fenster.querySelector('.la-band');
    let startY = null, dy = 0, startZeit = 0;
    fenster.addEventListener('pointerdown', e => {
      startY = e.clientY; dy = 0; startZeit = performance.now();
      fenster.setPointerCapture(e.pointerId);
      band.style.transition = 'none';
    });
    fenster.addEventListener('pointermove', e => {
      if (startY === null) return;
      const hoehe = band.firstElementChild.getBoundingClientRect().height;
      dy = Math.max(-hoehe, Math.min(hoehe, e.clientY - startY));
      if (s.streifen[seite].liste.length > 1) band.style.transform = `translateY(${dy}px)`;
    });
    const ende = () => {
      if (startY === null) return;
      startY = null;
      const hoehe = band.firstElementChild.getBoundingClientRect().height;
      const schnell = Math.abs(dy) > 20 && performance.now() - startZeit < 250;
      if (dy < -hoehe * 0.25 || (schnell && dy < 0)) weiter(seite, 1);
      else if (dy > hoehe * 0.25 || (schnell && dy > 0)) weiter(seite, -1);
      else {
        band.style.transition = 'transform 150ms ease-out';
        band.style.transform = 'translateY(0)';
        // Antippen ohne Wischen: den Laut hören
        if (Math.abs(dy) < 8) { abbrechen(); sprichLaut(aktuell(seite).id); }
      }
    };
    fenster.addEventListener('pointerup', ende);
    fenster.addEventListener('pointercancel', ende);
  }
  wischbar(fensterK);
  wischbar(fensterV);

  // ---------- Punkt selbst ziehen ----------
  let ziehen = null;
  punkt.addEventListener('pointerdown', e => {
    e.preventDefault();
    abbrechen();
    apparat.classList.remove('la-spricht');
    punkt.setPointerCapture(e.pointerId);
    ziehen = { startX: e.clientX, bewegt: false, startT: s.t >= 1 ? 0 : s.t };
    if (s.t >= 1) setzePunkt(0);
  });
  punkt.addEventListener('pointermove', e => {
    if (!ziehen) return;
    if (Math.abs(e.clientX - ziehen.startX) > 10) ziehen.bewegt = true;
    if (!ziehen.bewegt) return;
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) * 1000 / r.width;
    const t = Math.max(0, Math.min(1, (x - X0) / (X1 - X0)));
    setzePunkt(t);
    if (t >= 0.97) { ziehen = null; selbstGelesen(); }
  });
  const ziehEnde = () => {
    if (!ziehen) return;
    const war = ziehen;
    ziehen = null;
    if (!war.bewegt) { vormachen(); return; } // Antippen: vorlesen lassen
    // nicht bis zum Ende gezogen: Punkt gleitet zurück
    const token = s.token;
    bewege(s.t, 0, 300, token).then(() => { if (token === s.token) punkt.classList.add('la-wink'); });
  };
  punkt.addEventListener('pointerup', ziehEnde);
  punkt.addEventListener('pointercancel', ziehEnde);

  // ---------- Knöpfe ----------
  apparat.addEventListener('click', e => {
    const pfeil = e.target.closest('.la-pfeil');
    if (pfeil) { weiter(pfeil.dataset.seite, Number(pfeil.dataset.richtung)); return; }
    if (e.target.closest('.la-hoeren')) { vormachen(); return; }
    if (e.target.closest('.la-silbe')) { abbrechen(); sprichSilbe(silbe()); return; }
    if (e.target.closest('.la-modus')) {
      s.modus = s.modus === 'hoeren' ? 'lesen' : 'hoeren';
      zeichneModus();
      neueSilbe(false);
      return;
    }
    if (e.target.closest('.la-gross')) {
      s.gross = !s.gross;
      grossKnopf.setAttribute('aria-pressed', String(s.gross));
      zeichneBand('k');
      zeichneSilbe(silbeText.classList.contains('la-sichtbar'));
    }
  });

  // ---------- Start ----------
  for (const seite of ['k', 'v']) {
    const st = s.streifen[seite];
    st.fenster.classList.toggle('la-einzeln', st.liste.length < 2);
    apparat.querySelectorAll(`.la-pfeil[data-seite="${seite}"]`)
      .forEach(p => { p.hidden = st.liste.length < 2; });
    zeichneBand(seite);
  }
  zeichneModus();
  zeichneFortschritt();
  // Kein automatisches Vorlesen beim Start: der Modulname wird gerade angesagt.
  neueSilbe(false);

  /** Aufräumen beim Verlassen (ruft app.js auf): Ton, Animation und Zeitgeber stoppen. */
  function stopp() {
    s.beendet = true;
    abbrechen();
  }
  return stopp;
}

function ladeCss() {
  const href = new URL('../../css/leseapparat.css', import.meta.url).href;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
