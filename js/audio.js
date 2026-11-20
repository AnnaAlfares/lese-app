// Vorlesen von Lauten (gedehnt), Silben, Wörtern und Ansagen.
// Zuerst werden eigene Aufnahmen aus assets/audio/ abgespielt (Dateinamen: js/aufnahmen.js).
//
// Fehlt eine Aufnahme:
//   - Einzellaute (Konsonanten und Vokale): IMMER still, Lautsprecher-Knopf ausgeblendet.
//     Die Gerätestimme sagt sonst den Buchstabennamen („es“ statt /sss/), siehe Regel 2.
//   - Silben, Wörter, Ansagen: je nach AUDIO.beiFehlender in config.js
//       'stimme'     → Gerätestimme (Web Speech API), falls eine deutsche Stimme da ist
//       'ausblenden' → kein Ton, Lautsprecher-Knopf ausgeblendet
//
// Alle sprich…-Funktionen liefern ein Promise, das nach dem Ende des Tons erfüllt ist – oder
// sofort mit false, wenn es keinen Ton gibt. Module dürfen also darauf warten, ohne hängen zu bleiben.
//
// Lautsprecher-Knöpfe: Klasse „lautsprecher“ plus data-sprich-laut="m", data-sprich-silbe="ma",
// data-sprich-wort="Rose" oder data-sprich-ansage="zurueck". Sie bleiben unsichtbar, bis feststeht,
// dass es für sie einen Ton gibt (Klasse „ton-da“, siehe aktiviereSprechknoepfe).
// Auch Elemente ohne Klasse „lautsprecher“ (z. B. Kacheln) sprechen beim Antippen, werden aber nie versteckt.

import { AUDIO, leseEinstellungen } from './config.js';
import { ANSAGEN, datei } from './aufnahmen.js';

const ORDNER = new URL('../assets/audio/', import.meta.url);
const url = (art, wert) => new URL(datei(art, wert), ORDNER).href;

// ---------------------------------------------------------------------------
// Aufnahmen: Vorhandensein prüfen (nur im Arbeitsspeicher gemerkt) und abspielen
// ---------------------------------------------------------------------------
const vorhanden = new Map(); // URL → true | false | Promise<boolean>

/** Gibt es die Aufnahme? Fragt einmal beim Server nach (HEAD) und merkt sich die Antwort. */
export function hatAufnahme(art, wert) {
  const u = url(art, wert);
  if (!vorhanden.has(u)) {
    const anfrage = fetch(u, { method: 'HEAD', cache: 'no-cache' })
      .then(r => r.ok, () => false)
      .then(ok => { vorhanden.set(u, ok); return ok; });
    vorhanden.set(u, anfrage);
  }
  return Promise.resolve(vorhanden.get(u));
}

// Ein einziges Audio-Element für alles: iPad-Safari erlaubt Abspielen ohne Verzögerungsprobleme,
// wenn dasselbe Element einmal durch einen Fingertipp „freigeschaltet“ wurde.
const player = typeof Audio === 'function' ? new Audio() : null;
let freigeschaltet = false;
function freischalten() {
  if (freigeschaltet || !player) return;
  freigeschaltet = true;
  player.src = STILLE;
  player.play().catch(() => {});
}
globalThis.addEventListener?.('pointerdown', freischalten, { once: true, capture: true });

function spieleAufnahme(u) {
  return new Promise(resolve => {
    stoppe();
    player.onended = () => resolve(true);
    player.onerror = () => { vorhanden.set(u, false); resolve(false); };
    player.src = u;
    player.play().catch(() => resolve(false));
  });
}

/** Laufende Ausgabe (Aufnahme oder Stimme) abbrechen. */
export function stoppe() {
  if (player) { player.onended = player.onerror = null; player.pause(); }
  sprache?.cancel();
}

// ---------------------------------------------------------------------------
// Ersatzstimme (Web Speech API) – nur für Silben, Wörter, Ansagen und nur wenn AUDIO.beiFehlender === 'stimme'
// ---------------------------------------------------------------------------
const sprache = globalThis.speechSynthesis;
let stimme = null;
let tempo = leseEinstellungen().tempo / 100;
const GESCHWINDIGKEIT = { silbe: 0.8, wort: 0.9, ansage: 0.9 };

function deutscheStimme(stimmen) {
  const de = stimmen.filter(s => s.lang.replace('_', '-').toLowerCase().startsWith('de'));
  const punkte = s => (s.lang.replace('_', '-').toLowerCase() === 'de-de' ? 2 : 0) + (s.localService ? 1 : 0);
  return de.sort((a, b) => punkte(b) - punkte(a))[0] ?? null;
}

/** Wird erfüllt mit true (deutsche Gerätestimme da) oder false. Chrome lädt Stimmen verzögert. */
export const stimmeBereit = new Promise(resolve => {
  if (!sprache) { resolve(false); return; }
  const versuche = () => (stimme = deutscheStimme(sprache.getVoices())) !== null;
  if (versuche()) { resolve(true); return; }
  const fertig = () => resolve(versuche());
  sprache.addEventListener?.('voiceschanged', fertig, { once: true });
  setTimeout(fertig, 2500); // manche Browser melden nie „voiceschanged“
}).then(da => {
  document.documentElement.classList.toggle('stimme-da', da);
  return da;
});

/** Sprechtempo der Ersatzstimme in Prozent (50–150). Aufnahmen laufen immer in Originaltempo. */
export function setzeTempo(prozent) {
  tempo = prozent / 100;
}

/** Text mit der Gerätestimme sprechen (auch für die Tempo-Probe im Lehrkraft-Bereich). */
export function sprichMitStimme(text, grundtempo = GESCHWINDIGKEIT.wort) {
  if (!sprache || !stimme) return Promise.resolve(false);
  stoppe();
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

/** Was die Ersatzstimme für art/wert sprechen würde, oder null = nie Ersatzstimme. */
function ersatzText(art, wert) {
  if (AUDIO.beiFehlender !== 'stimme') return null;
  if (art === 'laut') return null; // Einzellaute nur aus Aufnahmen – nie Buchstabennamen
  if (art === 'silbe') return wert.toLowerCase();
  if (art === 'ansage') return ANSAGEN[wert] ?? null;
  return wert;
}

// ---------------------------------------------------------------------------
// Öffentliche Schnittstelle
// ---------------------------------------------------------------------------

/** Gibt es für art/wert einen Ton? Laute: nur mit Aufnahme. Sonst Aufnahme oder – je nach Einstellung – Ersatzstimme. */
export async function kannSprechen(art, wert) {
  if (await hatAufnahme(art, wert)) return true;
  return ersatzText(art, wert) !== null && await stimmeBereit;
}

/**
 * Spricht art ('laut' | 'silbe' | 'wort' | 'ansage') mit wert. Liefert ein Promise:
 * 'aufnahme' | 'stimme' | false (kein Ton).
 */
export async function sprich(art, wert) {
  const u = url(art, wert);
  let da = vorhanden.get(u);
  if (typeof da !== 'boolean') da = await hatAufnahme(art, wert);
  if (da && player && await spieleAufnahme(u)) return 'aufnahme';
  const text = ersatzText(art, wert);
  if (text === null || !(await stimmeBereit)) return false;
  return (await sprichMitStimme(text, GESCHWINDIGKEIT[art])) ? 'stimme' : false;
}

/** Laut gedehnt abspielen – nur aus Aufnahme; ohne Aufnahme still (Promise → false). */
export const sprichLaut = id => sprich('laut', id);
export const sprichSilbe = silbe => sprich('silbe', silbe.toLowerCase());
export const sprichWort = wort => sprich('wort', wort);
export const sprichAnsage = id => sprich('ansage', id);

const AUSWAHL = '[data-sprich-laut],[data-sprich-silbe],[data-sprich-wort],[data-sprich-ansage]';
function artUndWert(el) {
  const d = el.dataset;
  if (d.sprichLaut) return ['laut', d.sprichLaut];
  if (d.sprichSilbe) return ['silbe', d.sprichSilbe.toLowerCase()];
  if (d.sprichWort) return ['wort', d.sprichWort];
  return ['ansage', d.sprichAnsage];
}

/** Lautsprecher-Knöpfe sichtbar machen, für die es einen Ton gibt. */
function pruefeKnoepfe(wurzel) {
  const knoepfe = wurzel.matches?.(`.lautsprecher:is(${AUSWAHL})`)
    ? [wurzel] : wurzel.querySelectorAll?.(`.lautsprecher:is(${AUSWAHL})`) ?? [];
  for (const k of knoepfe) {
    kannSprechen(...artUndWert(k)).then(ok => k.classList.toggle('ton-da', ok));
  }
}

/**
 * Ein Klick-Handler für alle Elemente mit data-sprich-*; prüft außerdem alle (auch später
 * eingefügten) Lautsprecher-Knöpfe und blendet sie nur ein, wenn es einen Ton gibt.
 */
export function aktiviereSprechknoepfe(wurzel = document.body) {
  wurzel.addEventListener('click', ereignis => {
    const el = ereignis.target.closest(AUSWAHL);
    if (el) sprich(...artUndWert(el));
  });
  pruefeKnoepfe(wurzel);
  new MutationObserver(aenderungen => {
    for (const a of aenderungen) for (const n of a.addedNodes) if (n.nodeType === 1) pruefeKnoepfe(n);
  }).observe(wurzel, { childList: true, subtree: true });
}

// Sehr kurze stille WAV-Datei (im Code erzeugt, keine externe Datei) zum Freischalten auf dem iPad.
const STILLE = (() => {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const t = (o, s) => [...s].forEach((c, i) => { b[o + i] = c.charCodeAt(0); });
  t(0, 'RIFF'); v.setUint32(4, 36 + n, true); t(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  t(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...b))}`;
})();
