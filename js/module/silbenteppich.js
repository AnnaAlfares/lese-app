// Silbenteppich (Stufe 4 · Automatisieren)
// Idee nach der Methodenkarte „Silbenteppich“ aus LESE-FOKUS (Leibniz Universität Hannover):
// Silben zeilenweise von links nach rechts lesen. Drei Einsatzmöglichkeiten:
//   1. ohne Zeit  2. Zeitrahmen eine Minute (so viele Silben wie möglich)  3. Zeit stoppen (eigene Zeit verbessern)
// Differenzierung laut Karte: groß oder klein geschrieben, mit oder ohne Farbmarkierung.
// Aufbau „geordnet“ wie das Arbeitsblatt der Karte: oben die Vokale, darunter je Konsonant eine Zeile
// (L · LA LE LI LO LU). Aufbau „gemischt“: Silben durcheinander, der neueste Buchstabe kommt häufiger vor.
//
// Silben kommen nur aus woerter.js (lesbareSilben), Buchstaben nur aus config.js.
// Rekorde leben nur im Arbeitsspeicher (Map in diesem Modul) – kein localStorage.

import { BUCHSTABEN, GEWICHT_NEUER_BUCHSTABE } from '../config.js';
import { lesbareSilben, neuestesGraphem } from '../woerter.js';
import { sprich, sprichAnsage, kannSprechen, stoppe } from '../audio.js';

// ---------------------------------------------------------------------------
// Einstellungen des Moduls
// ---------------------------------------------------------------------------
const MAX_ZEILEN = 5;            // Konsonant-Zeilen im geordneten Teppich
const MAX_SPALTEN = 5;           // Vokal-Spalten im geordneten Teppich / Silben je Zeile gemischt
const MAX_FELDER_GEMISCHT = 30;  // höchstens 6 Zeilen × 5 Silben
const MINUTE_MS = 60_000;
// Reihenfolge der Vokal-Spalten wie auf dem Arbeitsblatt (A E I O U), weitere Vokale danach
const VOKAL_FOLGE = ['a', 'e', 'i', 'o', 'u', 'ei', 'au', 'eu', 'ie', 'ä', 'ö', 'ü'];

// Eigene Rekorde: nur im Arbeitsspeicher, solange die Seite offen ist.
// Schlüssel: Buchstabenstand | Aufbau | Teppich-Nummer | Modus
const REKORDE = new Map();

// Auswahl bleibt erhalten, solange die Seite offen ist (z. B. nach „Zurück“)
const wahl = { schreibung: 'gross', farben: null, aufbau: 'geordnet', nummer: 1 };

// ---------------------------------------------------------------------------
// Zufall mit Startwert: Derselbe Teppich (gleiche Nummer) sieht immer gleich aus,
// damit „Zeit stoppen“ beim nächsten Versuch vergleichbar ist.
// ---------------------------------------------------------------------------
function zufall(startwert) {
  let a = startwert >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mische(liste, rnd) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

/** Höchstens max Einträge; der neueste Buchstabe ist immer dabei, die anderen zufällig. */
function auswahl(liste, max, neuesteId, rnd) {
  if (liste.length <= max) return liste;
  const neu = liste.filter(b => b.id === neuesteId);
  const rest = mische(liste.filter(b => b.id !== neuesteId), rnd);
  return [...neu, ...rest.slice(0, max - neu.length)];
}

// ---------------------------------------------------------------------------
// Teppich bauen: Zeilen aus Feldern
// Feld: { art: 'laut' | 'silbe' | 'leer', wert, grapheme: [{id, text}], farbe: 0 | 1 | null }
// ---------------------------------------------------------------------------
const lautFeld = b => ({ art: 'laut', wert: b.id, grapheme: [{ id: b.id, text: b.id }], farbe: null });
const silbenFeld = (s, farbe) => ({ art: 'silbe', wert: s.text, grapheme: s.grapheme, farbe });

export function baueTeppich(stand, aufbau, nummer) {
  const rnd = zufall(stand * 1000 + nummer * 7 + (aufbau === 'gemischt' ? 500 : 0));
  const offen = lesbareSilben(stand).filter(s => s.art === 'offen');
  const nachText = new Map(offen.map(s => [s.text, s]));
  const neuesteId = neuestesGraphem(stand).id;

  if (aufbau === 'gemischt') {
    const anzahl = Math.min(MAX_FELDER_GEMISCHT, offen.length * 4);
    const felder = [];
    let vorher = null;
    for (let i = 0; i < anzahl; i++) {
      // gewichtet ziehen: Silben mit dem neuesten Buchstaben öfter; nicht zweimal dieselbe hintereinander
      const kandidaten = offen.length > 1 ? offen.filter(s => s !== vorher) : offen;
      const summe = kandidaten.reduce((n, s) => n + (s.neu ? GEWICHT_NEUER_BUCHSTABE : 1), 0);
      let r = rnd() * summe;
      const s = kandidaten.find(k => (r -= k.neu ? GEWICHT_NEUER_BUCHSTABE : 1) < 0) ?? kandidaten.at(-1);
      felder.push(s);
      vorher = s;
    }
    const zeilen = [];
    for (let i = 0; i < felder.length; i += MAX_SPALTEN) {
      zeilen.push(felder.slice(i, i + MAX_SPALTEN).map((s, j) => silbenFeld(s, j % 2)));
    }
    return zeilen;
  }

  // geordnet: Vokalzeile oben, dann je Konsonant: Laut, danach die Silben mit allen Vokalen
  const eingefuehrt = BUCHSTABEN.slice(0, stand);
  const vokale = auswahl(eingefuehrt.filter(b => b.typ === 'vokal'), MAX_SPALTEN, neuesteId, rnd)
    .sort((a, b) => VOKAL_FOLGE.indexOf(a.id) - VOKAL_FOLGE.indexOf(b.id));
  const konsonanten = auswahl(eingefuehrt.filter(b => b.typ !== 'vokal' && b.anfang), MAX_ZEILEN, neuesteId, rnd)
    .sort((a, b) => eingefuehrt.indexOf(a) - eingefuehrt.indexOf(b));
  if (!konsonanten.length) return [];

  const zeilen = [[{ art: 'leer' }, ...vokale.map(lautFeld)]];
  for (const k of konsonanten) {
    const silben = vokale.map(v => nachText.get(k.id + v.id)).filter(Boolean);
    zeilen.push([lautFeld(k), ...silben.map((s, j) => silbenFeld(s, j % 2))]);
  }
  return zeilen;
}

// ---------------------------------------------------------------------------
// Darstellung
// ---------------------------------------------------------------------------
const gross = text => [...text].map(z => (z === 'ß' ? z : z.toUpperCase())).join('');

/** Graphem-Texte in der gewählten Schreibung: 'gross' (MA), 'anfang' (Ma), 'klein' (ma). */
function geschrieben(grapheme, schreibung) {
  return grapheme.map((g, i) => {
    if (schreibung === 'gross') return gross(g.text);
    if (schreibung === 'anfang' && i === 0) return gross(g.text[0]) + g.text.slice(1);
    return g.text;
  });
}

function feldHTML(feld, i, schreibung, hilfen) {
  if (feld.art === 'leer') return '<span class="st-feld leer"></span>';
  const texte = geschrieben(feld.grapheme, schreibung);
  const vokal = id => BUCHSTABEN.find(b => b.id === id)?.typ === 'vokal';
  const inhalt = feld.grapheme.map((g, j) =>
    `<span class="${hilfen.koenig && vokal(g.id) ? 'koenig' : ''}">${texte[j]}</span>`).join('');
  const farbe = hilfen.farben && feld.farbe !== null ? (feld.farbe ? ' rot' : ' blau') : '';
  return `<span class="st-feld ${feld.art}${farbe}" data-i="${i}">${inhalt}</span>`;
}

const zeitText = ms => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Eigene, einfache Symbole (inline SVG)
const SYMBOL = {
  auswahl: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/>
    <rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/>
    <rect x="13" y="13" width="8" height="8" rx="2"/></svg>`,
  lautsprecher: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4v14l-5-4H3z"/>
    <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round"/></svg>`,
  schrittZurueck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
    stroke-linejoin="round"><path d="M9 7 L4 12 L9 17"/><path d="M4 12 H14 a6 6 0 0 1 0 12"/></svg>`,
  teppich: `<svg viewBox="0 0 100 100"><rect x="12" y="18" width="76" height="64" rx="6" fill="#efe2f7"
    stroke="#7b4ea0" stroke-width="5"/>${[0, 1, 2].map(z => [0, 1, 2].map(s =>
    `<rect x="${22 + s * 21}" y="${28 + z * 17}" width="14" height="9" rx="3" fill="${(z + s) % 2 ? '#c62828' : '#1f5fbf'}"/>`
  ).join('')).join('')}</svg>`,
  sanduhr: `<svg viewBox="0 0 100 100" fill="none" stroke="#7b4ea0" stroke-width="6" stroke-linejoin="round">
    <path d="M28 12 H72 M28 88 H72"/><path d="M32 12 C32 40 68 40 68 50 C68 60 32 60 32 88 M68 12 C68 40 32 40 32 50
    C32 60 68 60 68 88"/><path d="M40 82 L50 66 L60 82 Z" fill="#e0b84a" stroke="none"/></svg>`,
  stoppuhr: `<svg viewBox="0 0 100 100" fill="none" stroke="#7b4ea0" stroke-width="6" stroke-linecap="round">
    <circle cx="50" cy="56" r="32"/><path d="M42 12 H58 M50 12 V24 M50 56 L64 42 M76 26 L82 20"/></svg>`,
  stern: `<svg viewBox="0 0 100 100"><path d="M50 6 L62 38 L96 39 L69 60 L79 94 L50 74 L21 94 L31 60 L4 39 L38 38 Z"
    fill="#f2c230" stroke="#b88a10" stroke-width="4" stroke-linejoin="round"/></svg>`,
  pokal: `<svg viewBox="0 0 100 100" fill="#f2c230" stroke="#b88a10" stroke-width="4" stroke-linejoin="round">
    <path d="M30 12 H70 V40 C70 54 60 62 50 62 C40 62 30 54 30 40 Z"/><path d="M30 20 H16 C16 36 24 42 32 44
    M70 20 H84 C84 36 76 42 68 44" fill="none"/><path d="M44 62 H56 V76 H44 Z M32 76 H68 V88 H32 Z"/></svg>`,
  start: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4 L20 12 L7 20 Z"/></svg>`,
};

// Modul-CSS einmal laden (eigene Datei, damit app.css unverändert bleibt)
function ladeCSS() {
  const href = new URL('../../css/silbenteppich.css', import.meta.url).href;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

// ---------------------------------------------------------------------------
// Einstieg
// ---------------------------------------------------------------------------
/**
 * Startet den Silbenteppich (gemeinsame Modul-Schnittstelle, siehe js/module/README.md).
 * Kopfzeile mit Zurück-Pfeil und Modulname baut app.js; zurück zur Stufe geht es dort.
 * @param {HTMLElement} wurzel Behälter, in den das Modul zeichnet
 * @param {{einstellungen: object, zustand?: object, zurueck?: () => void}} optionen
 *   zustand (Sterne) wird hier bewusst nicht verändert – die Sterne-Regel ist noch offen.
 * @returns {() => void} Aufräum-Funktion: Zeitgeber und Ton stoppen
 */
export function starte(wurzel, { einstellungen }) {
  ladeCSS();
  const { stand, hilfen } = einstellungen;
  if (wahl.farben === null) wahl.farben = hilfen.farben; // Vorgabe der Lehrkraft
  let aufraeumen = () => {};

  // ----- Auswahl: Modus und Darstellung -----
  function zeigeAuswahl() {
    aufraeumen();
    const zeitmodus = einstellungen.zeitmodus;
    const knopf = (gruppe, wert, inhalt, label) =>
      `<button data-${gruppe}="${wert}" aria-pressed="${wahl[gruppe] === wert}" aria-label="${label}">${inhalt}</button>`;
    const beispiel = (a, b) => wahl.farben
      ? `<span class="blau">${a}</span><span class="rot">${b}</span>` : `${a}${b}`;
    wurzel.innerHTML = `
      <div class="st-optionen">
        <div class="st-gruppe">
          ${knopf('schreibung', 'gross', 'MA', 'groß')}
          ${knopf('schreibung', 'anfang', 'Ma', 'groß und klein')}
          ${knopf('schreibung', 'klein', 'ma', 'klein')}
        </div>
        <div class="st-gruppe">
          <button data-farben aria-pressed="${wahl.farben}" aria-label="Silbenfarben">${beispiel('ma', 'me')}</button>
        </div>
        <div class="st-gruppe">
          ${knopf('aufbau', 'geordnet', 'ma me mi', 'geordnet')}
          ${knopf('aufbau', 'gemischt', 'mi lo sa', 'gemischt')}
        </div>
      </div>
      <div class="kacheln st-modi">
        <button class="kachel" data-modus="frei" data-ansage="ohne-zeit">
          ${SYMBOL.teppich}<span class="titel">ohne Zeit</span></button>
        ${zeitmodus ? `
        <button class="kachel" data-modus="minute" data-ansage="eine-minute">
          ${SYMBOL.sanduhr}<span class="titel">1 Minute</span></button>
        <button class="kachel" data-modus="stoppen" data-ansage="zeit-stoppen">
          ${SYMBOL.stoppuhr}<span class="titel">Zeit stoppen</span></button>` : ''}
      </div>`;

    wurzel.onclick = e => {
      const z = e.target.closest('button');
      if (!z) return;
      if (z.dataset.schreibung) wahl.schreibung = z.dataset.schreibung;
      else if (z.matches('[data-farben]')) wahl.farben = !wahl.farben;
      else if (z.dataset.aufbau) wahl.aufbau = z.dataset.aufbau;
      else if (z.dataset.modus) {
        sprichAnsage(z.dataset.ansage);
        return zeigeTeppich(z.dataset.modus);
      }
      zeigeAuswahl();
    };
  }

  // ----- Lesen -----
  function zeigeTeppich(modus) {
    aufraeumen();
    const zeilen = baueTeppich(stand, wahl.aufbau, wahl.nummer);
    const felder = zeilen.flat().filter(f => f.art !== 'leer');
    const rekordSchluessel = `${stand}|${wahl.aufbau}|${wahl.nummer}|${modus}`;
    const zeit = modus !== 'frei';
    const h = { farben: wahl.farben, koenig: hilfen.koenig };

    if (!felder.length) {
      wurzel.innerHTML = '<p class="st-hinweis">Mit den bisherigen Buchstaben gibt es noch keine Silben.</p>';
      wurzel.onclick = null;
      return;
    }

    let i = 0;            // Feld, das gerade gelesen wird
    let gelesen = 0;      // Zähler für das 1-Minuten-Limit (läuft über Durchgänge weiter)
    let laeuft = !zeit;   // bei Zeitmodi erst nach „Start“
    let fertig = false;
    let startZeit = 0;
    let takt = null;

    let n = 0;
    const spalten = Math.max(...zeilen.map(z => z.length));
    wurzel.innerHTML = `
      <div class="st-leiste">
        <button class="st-auswahl" aria-label="Andere Übungsart wählen">${SYMBOL.auswahl}</button>
        <div class="st-anzeige">${zeit ? `
          <span class="st-uhr">${modus === 'minute' ? '1:00' : '0:00'}</span>
          ${modus === 'minute' ? '<span class="st-balken"><span></span></span><span class="st-zaehler">0</span>' : ''}`
          : ''}
          <span class="st-rekord"></span>
        </div>
        <button class="st-schritt" aria-label="Eine Silbe zurück">${SYMBOL.schrittZurueck}</button>
        <button class="lautsprecher st-vorlesen" aria-label="Vorlesen">${SYMBOL.lautsprecher}</button>
      </div>
      <div class="st-flaeche">
        <div class="st-teppich${zeit ? ' verdeckt' : ''}" style="--zeilen:${zeilen.length};--spalten:${spalten}">
          ${zeilen.map(z => `<div class="st-zeile">${z.map(f => feldHTML(f, f.art === 'leer' ? -1 : n++, wahl.schreibung, h))
            .join('')}</div>`).join('')}
        </div>
        ${zeit ? `<button class="st-start" aria-label="Start">${SYMBOL.start}</button>` : ''}
        <div class="st-ende" hidden></div>
      </div>`;

    const $ = s => wurzel.querySelector(s);
    const feldEl = [...wurzel.querySelectorAll('.st-feld[data-i]')];
    zeigeRekord();
    markiere();

    function markiere() {
      feldEl.forEach((el, k) => {
        el.classList.toggle('aktuell', k === i && !fertig);
        el.classList.toggle('gelesen', k < i || fertig);
      });
      const f = felder[i];
      zeigeLautsprecher($('.st-vorlesen'), f.art, f.wert);
    }

    function zeigeRekord() {
      const r = REKORDE.get(rekordSchluessel);
      $('.st-rekord').innerHTML = zeit && r !== undefined
        ? `${SYMBOL.pokal}<span>${modus === 'minute' ? r : zeitText(r)}</span>` : '';
    }

    function start() {
      laeuft = true;
      startZeit = performance.now();
      $('.st-teppich').classList.remove('verdeckt');
      $('.st-start').remove();
      takt = setInterval(tick, 200);
    }

    function tick() {
      const vergangen = performance.now() - startZeit;
      if (modus === 'minute') {
        const rest = Math.max(0, MINUTE_MS - vergangen);
        $('.st-uhr').textContent = zeitText(rest + 999);
        $('.st-balken span').style.width = `${(rest / MINUTE_MS) * 100}%`;
        if (rest === 0) beende();
      } else {
        $('.st-uhr').textContent = zeitText(vergangen);
      }
    }

    function weiter() {
      if (!laeuft || fertig) return;
      gelesen++;
      if (modus === 'minute') $('.st-zaehler').textContent = gelesen;
      if (i < felder.length - 1) { i++; markiere(); return; }
      if (modus === 'minute') { i = 0; markiere(); return; } // Teppich zu Ende: oben weiterlesen
      beende();
    }

    function schrittZurueck() {
      if (!laeuft || fertig || i === 0) return;
      i--;
      gelesen = Math.max(0, gelesen - 1);
      if (modus === 'minute') $('.st-zaehler').textContent = gelesen;
      markiere();
    }

    function beende() {
      clearInterval(takt);
      fertig = true;
      const dauer = performance.now() - startZeit;
      markiere();

      let wert = null;
      let neuerRekord = false;
      if (modus === 'minute') wert = gelesen;
      if (modus === 'stoppen') { wert = dauer; $('.st-uhr').textContent = zeitText(dauer); }
      if (wert !== null) {
        const alt = REKORDE.get(rekordSchluessel);
        const besser = alt === undefined || (modus === 'minute' ? wert > alt : wert < alt);
        if (besser) REKORDE.set(rekordSchluessel, wert);
        neuerRekord = besser && alt !== undefined; // gefeiert wird erst, wenn ein alter Rekord geschlagen ist
        zeigeRekord();
      }

      const ergebnis = modus === 'minute' ? `<span class="st-gross">${gelesen}</span>`
        : modus === 'stoppen' ? `<span class="st-gross">${zeitText(dauer)}</span>` : '';
      const ende = $('.st-ende');
      ende.innerHTML = `
        <div class="st-ergebnis">
          ${neuerRekord ? SYMBOL.pokal : SYMBOL.stern}
          ${ergebnis}
        </div>
        <div class="st-knoepfe">
          <button data-aktion="nochmal" aria-label="Noch einmal">↻</button>
          <button data-aktion="neu" aria-label="Neuer Teppich">${SYMBOL.teppich}</button>
          <button data-aktion="auswahl" aria-label="Andere Übungsart wählen">${SYMBOL.auswahl}</button>
        </div>`;
      ende.hidden = false;
      ende.classList.toggle('rekord', neuerRekord);
      sprichAnsage(neuerRekord ? 'neuer-rekord' : modus === 'minute' ? 'zeit-um' : 'geschafft');
    }

    wurzel.onclick = e => {
      if (e.target.closest('.st-auswahl')) return zeigeAuswahl();
      if (e.target.closest('.st-start')) return start();
      if (e.target.closest('.st-schritt')) return schrittZurueck();
      if (e.target.closest('.st-vorlesen')) return sprich(felder[i].art, felder[i].wert);
      const aktion = e.target.closest('[data-aktion]')?.dataset.aktion;
      if (aktion === 'nochmal') { sprichAnsage('noch-einmal'); return zeigeTeppich(modus); }
      if (aktion === 'auswahl') return zeigeAuswahl();
      if (aktion === 'neu') { sprichAnsage('neuer-teppich'); wahl.nummer++; return zeigeTeppich(modus); }
      if (e.target.closest('.st-teppich')) weiter(); // Antippen irgendwo auf dem Teppich: nächste Silbe
    };

    aufraeumen = () => { clearInterval(takt); aufraeumen = () => {}; };
  }

  zeigeAuswahl();

  // Aufräumen beim Verlassen (ruft app.js auf): Zeitgeber, laufender Ton, Klick-Handler
  return () => {
    aufraeumen();
    stoppe();
    wurzel.onclick = null;
  };
}

/** Lautsprecher nur zeigen, wenn es für art/wert einen Ton gibt (Aufnahme oder Ersatzstimme). */
function zeigeLautsprecher(knopf, art, wert) {
  if (!knopf) return;
  knopf.dataset.fuer = `${art}:${wert}`;
  kannSprechen(art, wert).then(ok => {
    if (knopf.dataset.fuer === `${art}:${wert}`) knopf.classList.toggle('ton-da', ok);
  });
}
