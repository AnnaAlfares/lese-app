// Modul „Rutschen“ (Stufe 3: Laute verbinden)
//
// Oben steht ein dehnbarer Konsonant, unten ein Vokal, dazwischen eine Rutsche.
// Das Kind zieht die Kugel mit dem Finger hinunter: Solange der Finger auf der Rutsche ist,
// klingt der Laut gedehnt weiter (/mmm/), beim Vokal geht er nahtlos in den Vokal über (/aaa/),
// unten wird daraus die Silbe („ma“). Danach liest das Kind die Silbe selbst und tippt weiter.
//
// Didaktik: Beim Zusammenziehen (Synthese) ist die Lücke zwischen den Lauten die größte Hürde
// („m … a“ statt „ma“). Dehnbare Laute lassen sich ohne Pause in den Vokal hineinziehen –
// deshalb hier nur Dauerlaute (m, l, s, f, n, r, w, h, sch …), keine Plosive (t, k, p).
//
// Teil 1 „Silben“: eine Rutsche, offene Silben Konsonant + Vokal.
// Teil 2 „Wörter“: zwei (oder drei) Rutschen hintereinander (Lo-la, Ma-ma, Sa-la-mi).
//
// Schnittstelle (für app.js): starte(wurzel, { einstellungen, zurueck })

import { graphem } from '../config.js';
import { lesbareSilben, lesbareWoerter, zerlege, waehle } from '../woerter.js';
import { sprichSilbe, sprichWort, sprichAnsage, stoppe } from '../audio.js';
import { ladeLaut, halteLaut, weckeAudio } from '../haltelaut.js';

// ---------------------------------------------------------------------------
// Auswahl des Lesestoffs (Wörter und Silben kommen aus woerter.js)
// ---------------------------------------------------------------------------
const RUNDE = { silben: 8, woerter: 5 };   // Aufgaben pro Runde
const ZWIELAUTE = new Set(['ei', 'au', 'eu']); // gleiten, lassen sich nicht gleichmäßig dehnen
const OHNE_SCHWA = true;                      // keine Wörter mit unbetontem -e am Ende (Na-se, Ro-se)

const dehnbarerAnfang = id => { const g = graphem(id); return g?.typ === 'dauerlaut' && g.anfang; };
const dehnbarerVokal = id => graphem(id)?.typ === 'vokal' && !ZWIELAUTE.has(id);
const istRutschsilbe = gr => gr.length === 2 && dehnbarerAnfang(gr[0].id) && dehnbarerVokal(gr[1].id);

/** Offene Silben Dauerlaut + Vokal, die beim Buchstabenstand lesbar sind (ma, lo, fe …). */
export function rutschSilben(stand) {
  return lesbareSilben(stand)
    .filter(s => s.art === 'offen' && istRutschsilbe(s.grapheme))
    .map(s => ({ text: s.text, neu: s.neu, silben: [{ text: s.text, grapheme: s.grapheme }] }));
}

/** Wörter aus 2–3 solchen Silben (Mama, Lola, Sofa, Salami …). */
export function rutschWoerter(stand) {
  return lesbareWoerter(stand)
    .filter(w => w.silben.length >= 2 && w.silben.length <= 3)
    .map(w => ({ text: w.wort, neu: w.neu, silben: w.silben.map(s => ({ text: s, grapheme: zerlege(s) })) }))
    .filter(w => w.silben.every(s => istRutschsilbe(s.grapheme)))
    .filter(w => !OHNE_SCHWA || w.silben.at(-1).grapheme[1].id !== 'e');
}

/** n Aufgaben ziehen (neuester Buchstabe häufiger), notfalls mit Wiederholung, nie zweimal direkt hintereinander. */
function zieheRunde(liste, n) {
  const runde = [];
  while (runde.length < n) {
    const zug = waehle(liste, Math.min(liste.length, n - runde.length));
    if (zug.length > 1 && zug[0] === runde.at(-1)) zug.push(zug.shift());
    runde.push(...zug);
  }
  return runde;
}

// ---------------------------------------------------------------------------
// Rutsche zeichnen (SVG, eigene Gestaltung)
// ---------------------------------------------------------------------------
const BREITE = 360, HOEHE = 470;
const BAHN = 'M 80 150 C 80 300, 280 230, 280 340'; // von unter dem Konsonanten bis über den Vokal
const VOKAL_AB = 0.55;   // ab hier (Anteil der Bahn) klingt der Vokal
const PROBEN = 120;      // Punkte entlang der Bahn für die Fingerverfolgung
const FANGRADIUS = 90;   // so weit (in SVG-Einheiten) darf der Finger neben der Bahn sein
const SPRUNG = 0.25;     // so weit darf der Finger auf einmal vorrücken (gegen „Abkürzungen“)

const svgRutsche = (silbe, farbe) => {
  const [k, v] = silbe.grapheme;
  return `
  <svg viewBox="0 0 ${BREITE} ${HOEHE}" class="rutsche-bild" style="--farbe:${farbe}">
    <circle class="leuchte leuchte-k" cx="80" cy="78" r="66"/>
    <circle class="leuchte leuchte-v" cx="280" cy="408" r="66"/>
    <path class="bahn-grund" d="${BAHN}"/>
    <path class="bahn-weg" d="${BAHN}"/>
    <text class="laut laut-k" x="80" y="112">${k.text}</text>
    <text class="laut laut-v" x="280" y="442">${v.text}</text>
    <circle class="kugel" cx="80" cy="150" r="34"/>
  </svg>`;
};

const PFEIL_ZURUECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 L7 12 L15 20"/></svg>`;
const PFEIL_WEITER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 H19 M13 5 L20 12 L13 19"/></svg>`;
const NOCHMAL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
  stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>`;
const LAUTSPRECHER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>
  <path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
const STERN = `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z"/></svg>`;

/** Kleines Symbol: eine bzw. zwei Rutschen (für die Auswahl Silben/Wörter). */
const symbol = (anzahl, text) => `
  <svg viewBox="0 0 ${anzahl * 120} 130" class="symbol">
    ${Array.from({ length: anzahl }, (_, i) => `
      <path d="M ${i * 120 + 25} 30 C ${i * 120 + 25} 80, ${i * 120 + 95} 60, ${i * 120 + 95} 105"
        fill="none" stroke="${i % 2 ? 'var(--silbe-rot)' : 'var(--silbe-blau)'}" stroke-width="16" stroke-linecap="round"/>`).join('')}
  </svg><span class="symbol-text">${text}</span>`;

// ---------------------------------------------------------------------------
// Modul
// ---------------------------------------------------------------------------
let cssGeladen = false;
function ladeCss() {
  if (cssGeladen) return;
  cssGeladen = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../../css/rutschen.css', import.meta.url).href;
  document.head.append(link);
}

export function starte(wurzel, { einstellungen, zurueck }) {
  ladeCss();
  const stand = einstellungen.stand;
  const hilfen = einstellungen.hilfen;
  const vorrat = { silben: rutschSilben(stand), woerter: rutschWoerter(stand) };
  const farbe = i => (hilfen.farben ? (i % 2 ? 'var(--silbe-rot)' : 'var(--silbe-blau)') : 'var(--text)');

  let anleitungGehoert = false;
  let aufraeumen = () => {};

  const kopf = (inhalt = '') => `
    <div class="kopf">
      <button class="modul-zurueck" aria-label="Zurück" data-sprich-ansage="zurueck">${PFEIL_ZURUECK}</button>
      <div class="kopf-mitte">${inhalt}</div>
    </div>`;

  // --- Auswahl: Silben oder Wörter -----------------------------------------
  function zeigeAuswahl() {
    aufraeumen();
    wurzel.innerHTML = `
      <div class="rutschen">
        ${kopf('<h1>Rutschen</h1>')}
        <div class="kacheln">
          <button class="kachel rutschen-teil" data-teil="silben"
            ${vorrat.silben.length ? '' : 'disabled'}>${symbol(1, 'ma')}</button>
          <button class="kachel rutschen-teil" data-teil="woerter"
            ${vorrat.woerter.length ? '' : 'disabled'}>${symbol(2, 'Ma-ma')}</button>
        </div>
        ${vorrat.silben.length ? '' : `<p class="rutschen-hinweis">Für dieses Spiel braucht es mindestens einen
          dehnbaren Konsonanten (z. B. M) und einen Vokal. Buchstabenstand im Lehrkraft-Bereich erhöhen.</p>`}
      </div>`;
    wurzel.querySelector('.modul-zurueck').onclick = () => { aufraeumen(); zurueck(); };
    for (const k of wurzel.querySelectorAll('[data-teil]')) {
      k.onclick = () => { weckeAudio(); starteRunde(k.dataset.teil); };
    }
  }

  // --- Eine Runde -----------------------------------------------------------
  function starteRunde(teil) {
    const aufgaben = zieheRunde(vorrat[teil], Math.min(RUNDE[teil], vorrat[teil].length * 3));
    // Laute der ganzen Runde vorab laden, damit der Ton sofort beim Rutschen kommt
    for (const a of aufgaben) for (const s of a.silben) for (const g of s.grapheme) ladeLaut(g.id);
    let nr = 0;
    if (!anleitungGehoert) { anleitungGehoert = true; sprichAnsage('rutschen-anleitung'); }
    zeigeAufgabe();

    function zeigeAufgabe() {
      aufraeumen();
      const aufgabe = aufgaben[nr];
      const n = aufgabe.silben.length;
      const sterne = aufgaben.map((_, i) =>
        `<span class="stern${i < nr ? ' voll' : ''}">${STERN}</span>`).join('');
      wurzel.innerHTML = `
        <div class="rutschen" style="--anzahl:${n}">
          ${kopf(`<div class="sterne">${sterne}</div>`)}
          <div class="bahnen">
            ${aufgabe.silben.map((s, i) => `<div class="rutsche${i === 0 ? ' dran' : ''}">${svgRutsche(s, farbe(i))}</div>`).join('')}
          </div>
          <div class="ergebnis">
            <button class="nochmal" aria-label="Noch einmal rutschen">${NOCHMAL}</button>
            <div class="lesewort${hilfen.boegen ? ' mit-boegen' : ''}">
              ${aufgabe.silben.map((s, i) => `<span class="silbe" style="color:${farbe(i)}">${s.text}</span>`).join('')}
            </div>
            <button class="lautsprecher vorlesen" aria-label="Vorlesen"
              ${n === 1 ? `data-sprich-silbe="${aufgabe.text}"` : `data-sprich-wort="${aufgabe.text}"`}>${LAUTSPRECHER}</button>
            <button class="weiter" aria-label="Weiter">${PFEIL_WEITER}</button>
          </div>
        </div>`;
      const el = wurzel.querySelector('.rutschen');
      el.querySelector('.modul-zurueck').onclick = () => { aufraeumen(); zeigeAuswahl(); };
      el.querySelector('.nochmal').onclick = () => zeigeAufgabe();
      el.querySelector('.weiter').onclick = () => {
        nr += 1;
        if (nr < aufgaben.length) zeigeAufgabe(); else zeigeEnde();
      };

      const rutschen = [...el.querySelectorAll('.rutsche')];
      const steuerungen = rutschen.map((r, i) => macheRutschbar(r, aufgabe.silben[i], () => fertig(i)));
      aufraeumen = () => steuerungen.forEach(s => s.abbrechen());

      async function fertig(i) {
        rutschen[i].classList.replace('dran', 'fertig');
        await sprichSilbe(aufgabe.silben[i].text);
        if (i + 1 < n) { rutschen[i + 1].classList.add('dran'); return; }
        if (n > 1) await sprichWort(aufgabe.text);
        // Jetzt liest das Kind selbst: Silbe/Wort groß zeigen, dann „weiter“
        el.classList.add('geschafft');
        if (nr === 0) sprichAnsage('rutschen-jetzt-du');
      }
    }

    function zeigeEnde() {
      aufraeumen();
      wurzel.innerHTML = `
        <div class="rutschen">
          ${kopf()}
          <div class="ende">
            <div class="sterne gross">${aufgaben.map(() => `<span class="stern voll">${STERN}</span>`).join('')}</div>
            <div class="zeile-knoepfe">
              <button class="nochmal-runde" aria-label="Noch eine Runde">${NOCHMAL}</button>
            </div>
          </div>
        </div>`;
      sprichAnsage('rutschen-geschafft');
      wurzel.querySelector('.modul-zurueck').onclick = zeigeAuswahl;
      wurzel.querySelector('.nochmal-runde').onclick = () => starteRunde(teil);
    }
  }

  zeigeAuswahl();
}

// ---------------------------------------------------------------------------
// Fingerverfolgung entlang der Bahn und gehaltener Laut
// ---------------------------------------------------------------------------
function macheRutschbar(rutsche, silbe, beiFertig) {
  const svg = rutsche.querySelector('svg');
  const weg = svg.querySelector('.bahn-weg');
  const kugel = svg.querySelector('.kugel');
  const laenge = weg.getTotalLength();
  const punkte = Array.from({ length: PROBEN + 1 }, (_, i) => weg.getPointAtLength(laenge * i / PROBEN));
  const [konsonant, vokal] = silbe.grapheme.map(g => g.id);

  let anteil = 0;          // wie weit die Kugel ist (0 … 1)
  let finger = null;       // pointerId des rutschenden Fingers
  let klang = null;        // { id, halt } – der gerade gehaltene Laut
  let fertig = false;

  weg.style.strokeDasharray = `${laenge}`;
  const zeichne = () => {
    const p = punkte[Math.round(anteil * PROBEN)];
    kugel.setAttribute('cx', p.x);
    kugel.setAttribute('cy', p.y);
    weg.style.strokeDashoffset = `${laenge * (1 - anteil)}`;
  };
  zeichne();

  const lautHier = () => (anteil < VOKAL_AB ? konsonant : vokal);
  function klinge(id) {
    if (klang?.id === id) return;
    klang?.halt.stop();
    klang = id ? { id, halt: halteLaut(id) } : null;
    svg.classList.toggle('klingt-k', id === konsonant && id !== null);
    svg.classList.toggle('klingt-v', id === vokal && id !== null);
  }

  const imSvg = e => {
    const m = svg.getScreenCTM().inverse();
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
  };
  // nächster Punkt auf der Bahn – nur ab der aktuellen Stelle ein Stück nach vorn
  function rutsche_zu(e) {
    const q = imSvg(e);
    const von = Math.round(anteil * PROBEN), bis = Math.min(PROBEN, Math.round((anteil + SPRUNG) * PROBEN));
    let best = -1, abstand = Infinity;
    for (let i = Math.max(0, von - 4); i <= bis; i++) {
      const d = Math.hypot(punkte[i].x - q.x, punkte[i].y - q.y);
      if (d < abstand) { abstand = d; best = i; }
    }
    if (abstand > FANGRADIUS) return false;
    anteil = Math.max(anteil, best / PROBEN);
    return true;
  }

  function los(e) {
    if (fertig || finger !== null || !rutsche.classList.contains('dran')) return;
    weckeAudio();
    if (!rutsche_zu(e)) return;
    finger = e.pointerId;
    svg.setPointerCapture(e.pointerId);
    svg.classList.add('aktiv');
    zeichne();
    klinge(lautHier());
  }
  function bewege(e) {
    if (e.pointerId !== finger) return;
    rutsche_zu(e);
    zeichne();
    if (anteil >= 0.97) { anteil = 1; zeichne(); ende(); fertig = true; svg.classList.add('fertig'); beiFertig(); return; }
    klinge(lautHier());
  }
  function ende(e) {
    if (e && e.pointerId !== finger) return;
    finger = null;
    svg.classList.remove('aktiv');
    klinge(null);
  }

  svg.addEventListener('pointerdown', los);
  svg.addEventListener('pointermove', bewege);
  svg.addEventListener('pointerup', ende);
  svg.addEventListener('pointercancel', ende);
  svg.addEventListener('lostpointercapture', ende);

  return {
    abbrechen() { klinge(null); stoppe(); },
  };
}
