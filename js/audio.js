// Vorlesen von Lauten (gedehnt, z. B. /mmm/), Silben und Wörtern über die Web Speech API.
// Ohne deutsche Stimme wird der Lautsprecher-Knopf ausgeblendet.
//
// Lautsprecher-Knöpfe bekommen die Klasse „lautsprecher“. Sie sind per CSS versteckt, bis
// audio.js eine deutsche Stimme gefunden hat (Klasse „stimme-da“ am <html>-Element).
//
// Knöpfe ohne eigenes JavaScript: data-sprich-wort="Rose", data-sprich-silbe="ma",
// data-sprich-laut="m" – ein Tipp darauf spricht vor (siehe aktiviereSprechknoepfe).

import { graphem, leseEinstellungen } from './config.js';

const sprache = globalThis.speechSynthesis;
let stimme = null;
let tempo = leseEinstellungen().tempo / 100;

// Grundgeschwindigkeit je Art; wird mit dem eingestellten Tempo multipliziert.
const GESCHWINDIGKEIT = { laut: 0.6, silbe: 0.8, wort: 0.9 };

function deutscheStimme(stimmen) {
  const de = stimmen.filter(s => s.lang.replace('_', '-').toLowerCase().startsWith('de'));
  // bevorzugt: Deutschland, dann lokal installierte Stimme (geht auch ohne Internet)
  const punkte = s => (s.lang.replace('_', '-').toLowerCase() === 'de-de' ? 2 : 0) + (s.localService ? 1 : 0);
  return de.sort((a, b) => punkte(b) - punkte(a))[0] ?? null;
}

/** Wird erfüllt mit true (deutsche Stimme da) oder false. Chrome lädt Stimmen verzögert. */
export const stimmeBereit = new Promise(resolve => {
  if (!sprache) { resolve(false); return; }
  const versuche = () => {
    stimme = deutscheStimme(sprache.getVoices());
    return stimme !== null;
  };
  if (versuche()) { resolve(true); return; }
  const fertig = () => resolve(versuche());
  sprache.addEventListener?.('voiceschanged', fertig, { once: true });
  setTimeout(fertig, 2500); // manche Browser melden nie „voiceschanged“
}).then(da => {
  document.documentElement.classList.toggle('stimme-da', da);
  document.documentElement.classList.toggle('ohne-stimme', !da);
  return da;
});

/** Sprechtempo in Prozent (50–150) setzen. */
export function setzeTempo(prozent) {
  tempo = prozent / 100;
}

/** Spricht einen Text. Liefert ein Promise, das nach dem Sprechen erfüllt ist. */
function sprich(text, grundtempo) {
  if (!sprache || !stimme) return Promise.resolve(false);
  sprache.cancel(); // laufende Ausgabe abbrechen, damit nichts nachläuft
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = stimme;
    u.lang = stimme.lang;
    u.rate = Math.min(2, Math.max(0.3, grundtempo * tempo));
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    sprache.speak(u);
  });
}

/** Kann der Laut dieses Graphems vorgesprochen werden? (Plosive wie /t/ vorerst nicht.) */
export function kannLaut(id) {
  return Boolean(stimme && graphem(id)?.sprechtext);
}

/** Laut gedehnt sprechen, z. B. sprichLaut('m') → /mmmm/. Nie den Buchstabennamen. */
export function sprichLaut(id) {
  const text = graphem(id)?.sprechtext;
  return text ? sprich(text, GESCHWINDIGKEIT.laut) : Promise.resolve(false);
}

/** Silbe sprechen, z. B. sprichSilbe('ma'). */
export function sprichSilbe(silbe) {
  return sprich(silbe.toLowerCase(), GESCHWINDIGKEIT.silbe);
}

/** Wort sprechen, z. B. sprichWort('Rose'). */
export function sprichWort(wort) {
  return sprich(wort, GESCHWINDIGKEIT.wort);
}

/** Beliebigen Satz oder Hinweis sprechen (z. B. Kacheltitel). */
export function sprichText(text) {
  return sprich(text, GESCHWINDIGKEIT.wort);
}

/** Ein Klick-Handler für alle Elemente mit data-sprich-wort / -silbe / -laut / -text. */
export function aktiviereSprechknoepfe(wurzel = document) {
  wurzel.addEventListener('click', ereignis => {
    const el = ereignis.target.closest('[data-sprich-wort],[data-sprich-silbe],[data-sprich-laut],[data-sprich-text]');
    if (!el) return;
    const d = el.dataset;
    if (d.sprichLaut) sprichLaut(d.sprichLaut);
    else if (d.sprichSilbe) sprichSilbe(d.sprichSilbe);
    else if (d.sprichWort) sprichWort(d.sprichWort);
    else sprichText(d.sprichText);
  });
}
