// Blitzlesen (Stufe 4 · Automatisieren)
// Ein Wort blitzt kurz auf (Zeit einstellbar, Start 2 Sekunden), dann wählt das Kind aus drei Bildern
// das passende. Ziel: Wörter auf einen Blick erkennen statt Laut für Laut zu erlesen
// (LESE-FOKUS, Methodenkarte „Blitzlesen“: „Zu Beginn bieten sich hochfrequente Ein- und Zweisilber an“,
// Unterstützung durch Wort und Bild, Steigerung mit 1-Minuten-Limit).
//
// - Wörter: nur lesbare Ein- und Zweisilber aus woerter.js (häufige zuerst in der Liste, der neueste
//   Buchstabe wird über waehle() bevorzugt) und die Sichtwörter, deren Buchstaben schon eingeführt sind.
// - Wörter ohne Bild (Sichtwörter wie „ist“, kleine Wörter wie „am“) und alle Wörter bei abgeschalteter
//   Hilfe „Bilder“: Auswahl aus drei geschriebenen Wörtern („Welches Wort war das?“).
// - Ablenker sind möglichst ähnlich (gleicher Anfang oder gleiches Ende), damit das Kind das ganze Wort
//   ansehen muss und nicht nur den ersten Buchstaben.
// - Ohne Zeit: Runde mit 10 Wörtern, ein Stern pro richtigem Wort.
//   Zeitmodus (nur wenn im Lehrkraft-Bereich an): 1 Minute, gezählt werden richtige Wörter pro Minute,
//   eigener Rekord nur im Arbeitsspeicher.
// - Schnittstelle: siehe js/module/README.md. Sterne der Stufe 4 über zaehle() aus sterne.js:
//   jede RICHTIGE Antwort ist eine Einheit (10 Einheiten = 1 Stern). Die Sterne-Reihe in der Runde
//   zeigt nur die richtigen Antworten dieser Runde.

import { lesbareWoerter, sichtwoerter, waehle } from '../woerter.js';
import { hatBild, bildHtml, woerterMitBild } from '../bilder.js';
import { sprichWort, sprichAnsage, stoppe } from '../audio.js';
import { zaehle } from '../sterne.js';
import { lobe, feiereStern } from '../belohnung.js';

const STUFE = 4; // Automatisieren

const RUNDE = 10;                 // Wörter pro Runde ohne Zeit
const MINUTE = 60_000;
const BLITZ_START = 2000;         // ms
const BLITZ_MIN = 500, BLITZ_MAX = 5000, BLITZ_SCHRITT = 500;
const FIXPUNKT = 700;             // ms Pause mit Punkt, damit das Kind weiß, wohin es schauen soll
const MAX_SILBEN = 2;

// ---------------------------------------------------------------------------
// Symbole (eigene, einfache SVGs)
// ---------------------------------------------------------------------------
const SVG = {
  blitz: `<svg viewBox="0 0 24 24"><path d="M14 2 L5 14 H11 L9 22 L19 9 H13 Z" fill="#f2b600" stroke="#8a6500" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  los: `<svg viewBox="0 0 24 24"><path d="M7 4 L20 12 L7 20 Z" fill="#2f7d32"/></svg>`,
  uhr: `<svg viewBox="0 0 24 24" fill="none" stroke="#3a6ea5" stroke-width="2.2" stroke-linecap="round">
        <circle cx="12" cy="13.5" r="8"/><path d="M12 13.5 V9 M10 2.5 H14 M12 2.5 V5.5 M18.5 6 L20 4.5"/></svg>`,
  nochmal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 12 A8 8 0 1 1 17.7 6.3"/><path d="M18 2.5 V6.8 H13.7"/></svg>`,
  lautsprecher: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/><path d="M16.5 8.5 A5 5 0 0 1 16.5 15.5 M19 6 A8.5 8.5 0 0 1 19 18"/></svg>`,
  stern: `<svg viewBox="0 0 24 24"><path d="M12 2.5 L14.9 8.6 L21.5 9.3 L16.5 13.8 L17.9 20.3 L12 17 L6.1 20.3 L7.5 13.8 L2.5 9.3 L9.1 8.6 Z"/></svg>`,
};
const sterne = (n, voll) => Array.from({ length: n }, (_, i) =>
  `<span class="blitz-stern${i < voll ? ' voll' : ''}">${SVG.stern}</span>`).join('');
const sekunden = ms => `${(ms / 1000).toLocaleString('de-DE')} s`;

// Eigene CSS-Datei des Moduls (einmal einbinden; hält app.css frei von Modul-Regeln)
function ladeCss() {
  const href = new URL('../../css/blitzlesen.css', import.meta.url).href;
  if (![...document.styleSheets].some(s => s.href === href) && !document.querySelector(`link[href="${href}"]`)) {
    document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${href}">`);
  }
}

// ---------------------------------------------------------------------------
// Wortmaterial (alles aus woerter.js und bilder.js)
// ---------------------------------------------------------------------------
function baueVorrat(e) {
  const mitBildern = e.hilfen.bilder;
  const lesbar = lesbareWoerter(e.stand).filter(w => w.art !== 'name');
  const vorrat = [];
  for (const w of lesbar) {
    if (w.silben.length > MAX_SILBEN) continue;
    const art = mitBildern && w.bild && hatBild(w.wort) ? 'bild'
      : (!mitBildern || w.art === 'wort') ? 'wort' : null;  // Nomen ohne Bild: (noch) nicht
    if (art) vorrat.push({ wort: w.wort, silben: w.silben, art, neu: w.neu });
  }
  for (const s of sichtwoerter(e.stand)) {
    if (s.lesbar && !vorrat.some(v => v.wort === s.wort)) {
      vorrat.push({ wort: s.wort, silben: [s.wort], art: 'wort', neu: s.ab === e.stand, sicht: true });
    }
  }
  // Geschriebene Ablenker: lesbare Ein- und Zweisilber und Sichtwörter (ohne Namen)
  const schreibAblenker = [...new Set([...lesbar.filter(w => w.silben.length <= MAX_SILBEN).map(w => w.wort),
    ...sichtwoerter(e.stand).filter(s => s.lesbar).map(s => s.wort)])];
  // Bild-Ablenker: zuerst lesbare Wörter mit Bild, notfalls weitere Bilder
  const lesbareBilder = lesbar.filter(w => hatBild(w.wort)).map(w => w.wort);
  const alleBilder = woerterMitBild();
  return {
    // Wort-Aufgaben nur, wenn es genug geschriebene Ablenker gibt
    vorrat: vorrat.filter(v => v.art === 'bild' || schreibAblenker.length >= 3),
    schreibAblenker, lesbareBilder, alleBilder,
  };
}

/** Wie ähnlich sehen zwei Wörter aus? (gleicher Anfang, gleiches Ende, ähnliche Länge) – mit etwas Zufall */
function aehnlichkeit(a, b) {
  const x = a.toLowerCase(), y = b.toLowerCase();
  let p = 0;
  if (x[0] === y[0]) p += 2;
  if (x.slice(-2) === y.slice(-2)) p += 2;
  const d = Math.abs(x.length - y.length);
  p += d === 0 ? 2 : d === 1 ? 1 : d >= 3 ? -2 : 0;
  return p + Math.random() * 1.5;
}

function ablenker(ziel, kandidaten, anzahl = 2) {
  return kandidaten.filter(k => k !== ziel)
    .map(k => ({ k, p: aehnlichkeit(ziel, k) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, anzahl).map(x => x.k);
}

const mische = liste => liste.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

/** Antwortmöglichkeiten (3 Wörter, gemischt) für eine Aufgabe */
function auswahl(aufgabe, m) {
  let andere;
  if (aufgabe.art === 'bild') {
    andere = ablenker(aufgabe.wort, m.lesbareBilder);
    if (andere.length < 2) {
      andere.push(...ablenker(aufgabe.wort, m.alleBilder.filter(w => !andere.includes(w)), 2 - andere.length));
    }
  } else {
    andere = ablenker(aufgabe.wort, m.schreibAblenker);
  }
  return mische([aufgabe.wort, ...andere]);
}

/** Nächste Aufgabe, nicht dieselbe wie zuletzt (neuester Buchstabe bevorzugt, siehe waehle) */
function ziehe(vorrat, letzte) {
  return waehle(vorrat, 2).find(v => v.wort !== letzte?.wort) ?? vorrat[0];
}

function rundenListe(vorrat) {
  const liste = waehle(vorrat, Math.min(RUNDE, vorrat.length));
  while (liste.length < RUNDE) liste.push(ziehe(vorrat, liste.at(-1)));
  return liste;
}

// ---------------------------------------------------------------------------
// Modul
// ---------------------------------------------------------------------------
export function starte(behaelter, { einstellungen: e, zustand, zurueck }) {
  ladeCss();
  const merk = (zustand.blitzlesen ??= { blitzzeit: BLITZ_START, rekord: 0 });
  const material = baueVorrat(e);

  // Alles Zeitgesteuerte läuft über warte(); beim Verlassen oder Neustart werden alte Abläufe ungültig.
  let lauf = 0;
  const zeitgeber = new Set();
  const warte = ms => new Promise(ok => {
    const id = setTimeout(() => { zeitgeber.delete(id); ok(); }, ms);
    zeitgeber.add(id);
  });
  const stopAlles = () => { lauf++; zeitgeber.forEach(clearTimeout); zeitgeber.clear(); stoppe(); };
  // Sprechen, aber nie länger als max ms auf das Ende warten
  const sprichUndWarte = (versprechen, max) => Promise.race([versprechen, warte(max)]);

  // ---------- Startbildschirm ----------
  function zeigeStart() {
    stopAlles();
    if (material.vorrat.length < 3) {
      behaelter.innerHTML = `<p class="blitz-hinweis">Für diesen Buchstabenstand gibt es noch zu wenige Wörter
        (mindestens 3). Bitte im Lehrkraft-Bereich einen späteren Buchstaben wählen.</p>`;
      return;
    }
    behaelter.innerHTML = `
      <div class="blitz-start">
        <div class="blitz-zeit" aria-label="Blitz-Zeit">
          <span class="blitz-symbol">${SVG.blitz}</span>
          <button class="blitz-minus" aria-label="kürzer">−</button>
          <span class="blitz-zeit-wert">${sekunden(merk.blitzzeit)}</span>
          <button class="blitz-plus" aria-label="länger">+</button>
        </div>
        <div class="blitz-modi">
          <button class="blitz-modus" data-modus="runde" aria-label="${RUNDE} Wörter">
            <span class="gross">${SVG.los}</span>
            <span class="blitz-sterne klein">${sterne(RUNDE, 0)}</span>
          </button>
          ${e.zeitmodus ? `
          <button class="blitz-modus" data-modus="minute" aria-label="1 Minute">
            <span class="gross">${SVG.uhr}</span>
            <span class="blitz-modus-text">1 Minute</span>
            ${merk.rekord ? `<span class="blitz-rekord">Rekord: ${merk.rekord}</span>` : ''}
          </button>` : ''}
        </div>
      </div>`;
  }

  // ---------- Runde ----------
  let r = null; // Zustand der laufenden Runde

  function starteRunde(modus) {
    stopAlles();
    const meinLauf = lauf;
    r = {
      modus, richtig: 0, gezeigt: 0, phase: 'bereit', aufgabe: null, angesagt: new Set(),
      liste: modus === 'runde' ? rundenListe(material.vorrat) : null, zeitUm: false,
      beginn: performance.now(), halbGelobt: false,
    };
    behaelter.innerHTML = `
      <div class="blitz-runde">
        <div class="blitz-leiste">
          ${modus === 'runde'
            ? `<span class="blitz-sterne">${sterne(RUNDE, 0)}</span>`
            : `<span class="blitz-zaehler">${SVG.stern}<b>0</b></span>
               <span class="blitz-zeitbalken"><span></span></span>`}
        </div>
        <div class="blitz-feld" aria-live="off"></div>
        <div class="blitz-karten"></div>
      </div>`;
    if (modus === 'minute') {
      // Balken läuft in 1 Minute ab (CSS-Übergang), danach ist die Runde vorbei
      const balken = behaelter.querySelector('.blitz-zeitbalken span');
      requestAnimationFrame(() => requestAnimationFrame(() => balken.classList.add('laeuft')));
      warte(MINUTE).then(() => { if (meinLauf === lauf) { r.zeitUm = true; zeigeEnde(); } });
    }
    sprichAnsage('blitz-schau');
    warte(900).then(() => { if (meinLauf === lauf) naechsteAufgabe(); });
  }

  function wortHtml(aufgabe) {
    return aufgabe.silben.map((s, i) => {
      const k = ['silbe'];
      if (e.hilfen.farben) k.push(i % 2 ? 'rot' : 'blau');
      if (e.hilfen.boegen) k.push('bogen');
      return `<span class="${k.join(' ')}">${s}</span>`;
    }).join('');
  }

  async function naechsteAufgabe() {
    const meinLauf = lauf;
    if (r.modus === 'runde' && r.gezeigt >= RUNDE) { zeigeEnde(); return; }
    const aufgabe = r.modus === 'runde' ? r.liste[r.gezeigt] : ziehe(material.vorrat, r.aufgabe);
    r.aufgabe = aufgabe;
    r.gezeigt++;
    const feld = behaelter.querySelector('.blitz-feld');
    const karten = behaelter.querySelector('.blitz-karten');
    karten.innerHTML = '';

    // 1. Fixpunkt
    r.phase = 'bereit';
    feld.className = 'blitz-feld bereit';
    feld.innerHTML = '<span class="fixpunkt"></span>';
    await warte(FIXPUNKT);
    if (meinLauf !== lauf) return;

    // 2. Blitz: Wort kurz zeigen
    r.phase = 'blitz';
    feld.className = 'blitz-feld blitz';
    feld.innerHTML = `<span class="blitz-wort">${wortHtml(aufgabe)}</span>`;
    await warte(merk.blitzzeit);
    if (meinLauf !== lauf) return;

    // 3. Wort weg, drei Antworten
    r.phase = 'wahl';
    feld.className = 'blitz-feld leer';
    feld.innerHTML = '<span class="fragezeichen">?</span>';
    karten.className = `blitz-karten ${aufgabe.art}`;
    karten.innerHTML = auswahl(aufgabe, material).map(w => aufgabe.art === 'bild'
      ? `<div class="blitz-karte" data-wort="${w}" role="button" tabindex="0">
           ${bildHtml(w, 'blitz-bild')}
           <button class="lautsprecher" data-sprich-wort="${w}" aria-label="${w} anhören">${SVG.lautsprecher}</button>
         </div>`
      : `<div class="blitz-karte" data-wort="${w}" role="button" tabindex="0"><span class="blitz-wahlwort">${w}</span></div>`
    ).join('');
    // Frage nur beim ersten Mal ansagen (sonst wird es lästig)
    if (!r.angesagt.has(aufgabe.art)) {
      r.angesagt.add(aufgabe.art);
      sprichAnsage(aufgabe.art === 'bild' ? 'blitz-bild' : 'blitz-wort');
    }
  }

  async function waehleAntwort(karte) {
    if (!r || r.phase !== 'wahl') return;
    const meinLauf = lauf;
    r.phase = 'rueckmeldung';
    const aufgabe = r.aufgabe;
    const richtig = karte.dataset.wort === aufgabe.wort;
    const feld = behaelter.querySelector('.blitz-feld');
    for (const k of behaelter.querySelectorAll('.blitz-karte')) {
      k.classList.add(k.dataset.wort === aufgabe.wort ? 'richtig' : 'gedimmt');
    }
    if (!richtig) karte.classList.replace('gedimmt', 'falsch');

    // Wort noch einmal zeigen und vorsprechen – so verbinden sich Schriftbild, Klang und Bild
    feld.className = 'blitz-feld aufloesung';
    feld.innerHTML = `<span class="blitz-wort">${wortHtml(aufgabe)}</span>`;

    let neuerStern = false;
    if (richtig) {
      r.richtig++;
      neuerStern = zaehle(zustand, STUFE) > 0; // nur richtige Antworten zählen für die Sterne der Stufe
      zeigeStern();
    }
    const kurz = r.modus === 'minute';
    await sprichUndWarte(sprichWort(aufgabe.wort), 2500);
    if (meinLauf !== lauf) return;
    // Belohnung erst nach dem vorgesprochenen Wort, damit sie das Vorsprechen nicht unterbricht:
    // - neuer Stern der Stufe (alle 10 richtigen Antworten) → Stern feiern
    // - Hälfte der Runde geschafft (5 von 10 Wörtern bzw. 30 Sekunden) → kurz loben (Entscheidung Anna);
    //   fällt beides zusammen, wird nur der Stern gefeiert
    const haelfte = !r.halbGelobt && (r.modus === 'runde'
      ? r.gezeigt >= RUNDE / 2
      : performance.now() - r.beginn >= MINUTE / 2);
    if (haelfte) r.halbGelobt = true;
    if (neuerStern) {
      await sprichUndWarte(feiereStern(behaelter), 2500);
      if (meinLauf !== lauf) return;
    } else if (haelfte) {
      await sprichUndWarte(lobe(behaelter), 2500);
      if (meinLauf !== lauf) return;
    }
    await warte(richtig ? (kurz ? 200 : 500) : (kurz ? 800 : 1500));
    if (meinLauf !== lauf) return;
    naechsteAufgabe();
  }

  function zeigeStern() {
    if (r.modus === 'runde') {
      const stern = behaelter.querySelectorAll('.blitz-leiste .blitz-stern')[r.richtig - 1];
      stern?.classList.add('voll', 'neu');
    } else {
      const zahl = behaelter.querySelector('.blitz-zaehler b');
      zahl.textContent = r.richtig;
      zahl.parentElement.classList.remove('neu');
      void zahl.offsetWidth; // Animation neu starten
      zahl.parentElement.classList.add('neu');
    }
  }

  // ---------- Ende ----------
  function zeigeEnde() {
    const ergebnis = r;
    stopAlles();
    let inhalt;
    let rekord = false;
    if (ergebnis.modus === 'runde') {
      inhalt = `
        <div class="blitz-sterne gross">${sterne(RUNDE, ergebnis.richtig)}</div>
        <p class="blitz-ergebnis"><b>${ergebnis.richtig}</b> von ${RUNDE}</p>`;
    } else {
      const vorher = merk.rekord;
      rekord = ergebnis.richtig > vorher;
      if (rekord) merk.rekord = ergebnis.richtig;
      inhalt = `
        <p class="blitz-ergebnis"><span class="blitz-zaehler gross">${SVG.stern}<b>${ergebnis.richtig}</b></span></p>
        <p class="blitz-ergebnis-text">Wörter in 1 Minute</p>
        ${rekord
          ? `<p class="blitz-rekord neu">Neuer Rekord!</p>`
          : `<p class="blitz-rekord">Dein Rekord: ${vorher}</p>`}`;
    }
    behaelter.innerHTML = `
      <div class="blitz-ende">
        ${inhalt}
        <div class="blitz-ende-knoepfe">
          <button class="blitz-nochmal" data-modus="${ergebnis.modus}" aria-label="Nochmal">${SVG.nochmal}</button>
          <button class="blitz-zum-start" aria-label="Blitz-Zeit und Modus wählen">${SVG.blitz}</button>
        </div>
      </div>`;
    r = null;
    // Lob (Haken) mit „Geschafft!“ bzw. „Neuer Rekord!“, dann die Zahl (Aufnahmen gibt es für 1–16).
    // Gelobt wird zur Rundenhälfte (siehe waehleAntwort) und hier am Rundenende.
    const meinLauf = lauf;
    (async () => {
      await sprichUndWarte(lobe(behaelter, { ansage: rekord ? 'neuer-rekord' : 'geschafft' }), 2500);
      if (meinLauf === lauf && ergebnis.richtig >= 1 && ergebnis.richtig <= 16) sprichAnsage(`zahl-${ergebnis.richtig}`);
    })();
  }

  // ---------- Bedienung ----------
  function klick(ev) {
    const t = ev.target;
    if (t.closest('.lautsprecher')) return; // spricht nur (audio.js), wählt nicht aus
    const karte = t.closest('.blitz-karte');
    if (karte) { waehleAntwort(karte); return; }
    const modus = t.closest('[data-modus]');
    if (modus) { starteRunde(modus.dataset.modus); return; }
    if (t.closest('.blitz-zum-start')) { zeigeStart(); return; }
    const minus = t.closest('.blitz-minus'), plus = t.closest('.blitz-plus');
    if (minus || plus) {
      merk.blitzzeit = Math.min(BLITZ_MAX, Math.max(BLITZ_MIN, merk.blitzzeit + (plus ? 1 : -1) * BLITZ_SCHRITT));
      behaelter.querySelector('.blitz-zeit-wert').textContent = sekunden(merk.blitzzeit);
    }
  }
  function taste(ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.closest('.blitz-karte')) {
      ev.preventDefault();
      waehleAntwort(ev.target.closest('.blitz-karte'));
    }
  }
  behaelter.addEventListener('click', klick);
  behaelter.addEventListener('keydown', taste);

  zeigeStart();

  // Aufräumen beim Verlassen des Moduls
  return () => {
    stopAlles();
    behaelter.removeEventListener('click', klick);
    behaelter.removeEventListener('keydown', taste);
  };
}

// Für die Testseite
export const _intern = { baueVorrat, auswahl, rundenListe };
