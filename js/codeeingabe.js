// Bildercode-Oberfläche: Eingabe beim Start und Abschluss-Bildschirm mit dem neuen Code.
// Logik (kodieren, dekodieren, Prüfbild) steht in bildercode.js. Siehe CLAUDE.md, Regel 10.
// Nichts wird gespeichert: Die Sterne gibt die Eingabe nur an app.js zurück (Arbeitsspeicher).

import { BILDER, CODE_LAENGE, MAX_STERNE, kodiere, dekodiere } from './bildercode.js';
import { STUFEN, graphem } from './config.js';
import { sprichAnsage, sprichWort, stoppe } from './audio.js';

const bild = nr => BILDER[nr - 1];
// Anlaut groß und klein, wie in config.js (z. B. „Sch sch“)
const anlautText = b => graphem(b.anlaut).anzeige;

const LAUTSPRECHER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/>
  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
const LOESCHEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>`;
const NEU = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
  stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/>
  <path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/></svg>`;
const PFEIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 L7 12 L15 20"/></svg>`;
const HAKEN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
  stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
const STERN = `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2
  1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;

/** Sterne einer Stufe: 7 Plätze, davon n gefüllt (auch für die Stufen-Kacheln in app.js). */
export function sterneHtml(n) {
  return `<span class="sterne" role="img" aria-label="${n} von ${MAX_STERNE} Sternen">${
    Array.from({ length: MAX_STERNE }, (_, i) => `<span class="stern${i < n ? ' voll' : ''}">${STERN}</span>`).join('')
  }</span>`;
}

/** Ein Code-Bild mit Zahl und Anlaut (für Kacheln, Plätze und Abschluss). */
function bildHtml(nr) {
  const b = bild(nr);
  return `<img src="${b.bild}" alt="${b.wort}" draggable="false">
    <span class="code-zahl">${b.nr}</span>
    <span class="code-anlaut">${anlautText(b)}</span>`;
}

// ---------------------------------------------------------------------------
// Eingabe beim Start
// ---------------------------------------------------------------------------
/**
 * Zeigt die Code-Eingabe in `ziel`. Ruft weiter(sterne) auf, sobald ein gültiger Code
 * eingegeben ist oder das Kind „Ich bin neu“ tippt (dann alle Sterne 0).
 */
export function zeigeCodeEingabe(ziel, { weiter }) {
  stoppe();
  const plaetze = Array(CODE_LAENGE).fill(null); // Bildnummern oder null
  let fertig = false;

  ziel.innerHTML = `
    <div class="code-eingabe">
      <div class="kopf">
        <button class="lautsprecher" data-sprich-ansage="code-eingeben" aria-label="Anhören">${LAUTSPRECHER}</button>
        <div class="code-plaetze" aria-label="Dein Code">
          ${plaetze.map((_, i) => `<button class="code-platz" data-platz="${i}" aria-label="Platz ${i + 1}"></button>`).join('')}
        </div>
        <button class="code-loeschen" aria-label="Löschen">${LOESCHEN}</button>
        <button class="code-neu" data-sprich-ansage="ich-bin-neu">${NEU}<span>Ich bin neu</span></button>
      </div>
      <p class="code-hinweis" aria-live="polite"></p>
      <div class="code-bilder">
        ${BILDER.map(b => `<button class="code-bild" data-nr="${b.nr}" aria-label="${b.nr} ${b.wort}">${bildHtml(b.nr)}</button>`).join('')}
      </div>
    </div>`;

  const wurzel = ziel.querySelector('.code-eingabe');
  const hinweis = wurzel.querySelector('.code-hinweis');
  const platzKnoepfe = [...wurzel.querySelectorAll('.code-platz')];

  function zeichne() {
    platzKnoepfe.forEach((k, i) => {
      k.innerHTML = plaetze[i] ? bildHtml(plaetze[i]) : '';
      k.classList.toggle('leer', !plaetze[i]);
    });
    const naechster = plaetze.indexOf(null);
    platzKnoepfe.forEach((k, i) => k.classList.toggle('naechster', i === naechster));
  }

  function setzeFehler(an) {
    wurzel.classList.toggle('fehler', an);
    hinweis.textContent = an ? 'Schau noch einmal auf deine Karte.' : '';
  }

  function pruefe() {
    if (plaetze.includes(null)) return;
    const ergebnis = dekodiere(plaetze);
    if (ergebnis.ok) {
      fertig = true;
      wurzel.classList.add('richtig');
      setTimeout(() => weiter(ergebnis.sterne), 700); // kurz zeigen, dass es geklappt hat
    } else {
      setzeFehler(true);
      sprichAnsage('schau-noch-einmal');
    }
  }

  wurzel.addEventListener('click', e => {
    if (fertig) return;
    const kachel = e.target.closest('.code-bild');
    const platz = e.target.closest('.code-platz');
    if (kachel) {
      const frei = plaetze.indexOf(null);
      if (frei < 0) return; // alle Plätze voll: erst löschen
      const nr = Number(kachel.dataset.nr);
      plaetze[frei] = nr;
      sprichWort(bild(nr).wort); // Bildwort vorsprechen (Mehrsprachigkeit, Regel 6)
      zeichne();
      pruefe();
    } else if (platz) {
      // Antippen eines Platzes nimmt genau dieses Bild heraus
      const i = Number(platz.dataset.platz);
      if (!plaetze[i]) return;
      plaetze[i] = null;
      setzeFehler(false);
      zeichne();
    } else if (e.target.closest('.code-loeschen')) {
      const letzter = plaetze.findLastIndex(nr => nr !== null);
      if (letzter >= 0) plaetze[letzter] = null;
      setzeFehler(false);
      zeichne();
    } else if (e.target.closest('.code-neu')) {
      fertig = true;
      weiter(Array(STUFEN.length).fill(0));
    }
  });

  zeichne();
  sprichAnsage('code-eingeben'); // klappt erst nach dem ersten Antippen der Seite (Browser-Regel)
}

// ---------------------------------------------------------------------------
// Abschluss: neuer Code groß, Zahlen werden vorgelesen
// ---------------------------------------------------------------------------
/**
 * Zeigt Sterne und den neuen Code. zurueck(): weiter üben; ende(): nächstes Kind (Spielstand weg).
 * „Ende“ wird erst nach dem ersten Vorlesen aktiv, damit der Code nicht aus Versehen verschwindet.
 */
export function zeigeAbschluss(ziel, sterne, { zurueck, ende }) {
  stoppe();
  const code = kodiere(sterne);
  let lauf = 0; // erhöht sich bei jedem neuen Vorlesen; alte Durchgänge brechen dann ab

  ziel.innerHTML = `
    <div class="abschluss">
      <div class="kopf">
        <button class="zurueck" aria-label="Weiter üben">${PFEIL}</button>
        <div class="abschluss-sterne">
          ${STUFEN.map((s, i) => `<span class="stufen-sterne" style="background:${s.farbe}">
            <span class="nr">${s.nr}</span>${sterneHtml(sterne[i] ?? 0)}</span>`).join('')}
        </div>
      </div>
      <div class="abschluss-code">
        ${code.map((nr, i) => `<button class="code-bild gross" data-stelle="${i}" aria-label="${nr} ${bild(nr).wort}">
          ${bildHtml(nr)}</button>`).join('')}
      </div>
      <div class="abschluss-knoepfe">
        <button class="vorlesen" aria-label="Noch einmal vorlesen">${LAUTSPRECHER}</button>
        <button class="ende" disabled>${HAKEN}<span>Ende</span></button>
      </div>
    </div>`;

  const wurzel = ziel.querySelector('.abschluss');
  const kacheln = [...wurzel.querySelectorAll('.abschluss-code .code-bild')];
  const endeKnopf = wurzel.querySelector('.ende');
  const markiere = i => kacheln.forEach((k, j) => k.classList.toggle('spricht', i === j));

  async function liesVor() {
    const meinLauf = ++lauf;
    const weiterMachen = () => meinLauf === lauf && wurzel.isConnected;
    markiere(-1);
    await sprichAnsage('dein-code');
    for (let i = 0; i < code.length && weiterMachen(); i++) {
      markiere(i);
      await sprichAnsage(`zahl-${code[i]}`);
      await new Promise(r => setTimeout(r, 450)); // Pause zum Mitzeigen auf der Karte
    }
    if (!weiterMachen()) return;
    markiere(-1);
    endeKnopf.disabled = false;
  }

  wurzel.addEventListener('click', e => {
    const kachel = e.target.closest('.code-bild');
    if (kachel) {
      lauf++; // laufendes Vorlesen abbrechen
      const i = Number(kachel.dataset.stelle);
      markiere(i);
      sprichAnsage(`zahl-${code[i]}`);
    } else if (e.target.closest('.vorlesen')) {
      liesVor();
    } else if (e.target.closest('.zurueck')) {
      lauf++; stoppe(); zurueck();
    } else if (e.target.closest('.ende') && !endeKnopf.disabled) {
      lauf++; stoppe(); ende();
    }
  });

  liesVor();
}
