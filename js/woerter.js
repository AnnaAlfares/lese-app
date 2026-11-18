// Wortmaterial: Wortliste, Modellwörter, Wörternetze, Sichtwörter –
// und die Funktionen, die zu einem Buchstabenstand alles Lesbare liefern.
// Module holen ihre Wörter nur von hier, nie aus eigenen Listen.

import { BUCHSTABEN, GEWICHT_NEUER_BUCHSTABE, position } from './config.js';

// ---------------------------------------------------------------------------
// Wortliste
// ---------------------------------------------------------------------------
// Jeder Eintrag: [Silben mit Bindestrich, Wortart, gut als Bild darstellbar]
// Wortart: 'nomen' | 'verb' | 'adjektiv' | 'wort' (kleine Funktionswörter) | 'name' | 'zahl'
//
// Auswahlregeln (CLAUDE.md, Regel 3):
// - lauttreu und aus Basisgraphemen: keine Doppelkonsonanten (Sonne), kein Dehnungs-h (Huhn),
//   kein ck/tz, kein langes i als einfaches „i“ in betonter Silbe (Igel → Insel), kein v, kein
//   vokalisiertes r nach Vokal (Tor, Oma-Opa-Wörter auf -er vermeiden).
// - Reduktionssilben -e, -en, -el (Rose, Rasen, Esel) sind zugelassen.
// - Reihenfolge innerhalb der Liste: vom Häufigen/Wichtigen zum Selteneren.
//   Der Buchstabenstand, ab dem ein Wort lesbar ist, wird automatisch berechnet.

const WORTLISTE = [
  // lesbar ab A (O M E A)
  ['Ma-ma', 'nomen', true],
  ['O-ma', 'nomen', true],
  ['am', 'wort', false],
  // ab L
  ['La-ma', 'nomen', true],
  ['Lo-la', 'name', false],
  ['O-le', 'name', false],
  ['mal', 'wort', false],
  // ab S
  ['E-sel', 'nomen', true],
  ['so', 'wort', false],
  ['es', 'wort', false],
  ['als', 'wort', false],
  ['Am-sel', 'nomen', true],
  ['O-a-se', 'nomen', true],
  // ab F
  ['So-fa', 'nomen', true],
  ['Mo-fa', 'nomen', true],
  ['elf', 'zahl', true],
  // ab N
  ['Na-se', 'nomen', true],
  ['O-fen', 'nomen', true],
  ['Na-me', 'nomen', false],
  ['ma-len', 'verb', true],
  ['le-sen', 'verb', true],
  ['an', 'wort', false],
  ['man', 'wort', false],
  ['Me-lo-ne', 'nomen', true],
  ['A-na-nas', 'nomen', true],
  ['Fa-san', 'nomen', true],
  ['Sa-men', 'nomen', true],
  // ab T
  ['To-ma-te', 'nomen', true],
  ['Ta-fel', 'nomen', true],
  ['En-te', 'nomen', true],
  ['Fo-to', 'nomen', true],
  ['Ast', 'nomen', true],
  ['Nest', 'nomen', true],
  ['Sa-lat', 'nomen', true],
  ['No-te', 'nomen', true],
  ['Tan-te', 'nomen', true],
  ['Man-tel', 'nomen', true],
  ['E-le-fant', 'nomen', true],
  ['Tal', 'nomen', true],
  ['Mast', 'nomen', true],
  ['Fest', 'nomen', true],
  ['Test', 'nomen', false],
  ['Last', 'nomen', false],
  ['fast', 'wort', false],
  ['Ost', 'nomen', false],
  ['A-tem', 'nomen', false],
  // ab R
  ['Ro-se', 'nomen', true],
  ['Ra-sen', 'nomen', true],
  ['rot', 'adjektiv', true],
  ['Rest', 'nomen', false],
  ['Rost', 'nomen', true],
  ['Rast', 'nomen', false],
  ['Rat', 'nomen', false],
  ['ra-ten', 'verb', false],
  // ab I
  ['In-sel', 'nomen', true],
  ['Tin-te', 'nomen', true],
  ['im', 'wort', false],
  ['in', 'wort', false],
  ['Lin-se', 'nomen', true],
  ['Film', 'nomen', true],
  ['Lift', 'nomen', true],
  ['Mist', 'nomen', true],
  ['Sa-la-mi', 'nomen', true],
  ['Lis-te', 'nomen', false],
  ['Tim', 'name', false],
  // ab U
  ['Mut', 'nomen', false],
  ['um', 'wort', false],
  ['nun', 'wort', false],
  ['tun', 'verb', false],
  ['U-fo', 'nomen', true],
  ['ru-fen', 'verb', true],
  ['Mus', 'nomen', true],
  ['Ul-me', 'nomen', true],
  ['Ru-te', 'nomen', true],
  ['Lust', 'nomen', false],

  // Spätere Buchstaben: Wörter der Wörternetze und Bilder des Bildercodes
  ['Ho-se', 'nomen', true],
  ['Ha-se', 'nomen', true],
  ['Hut', 'nomen', true],
  ['Wut', 'nomen', false],
  ['Post', 'nomen', true],
  ['Lam-pe', 'nomen', true],
  ['Wol-ke', 'nomen', true],
  ['Pin-sel', 'nomen', true],
  ['mein', 'wort', false],
  ['sein', 'wort', false],
  ['nein', 'wort', false],
  ['fein', 'adjektiv', false],
  ['Wein', 'nomen', true],
  ['Eis', 'nomen', true],
  ['Do-se', 'nomen', true],
  ['Hand', 'nomen', true],
  ['Land', 'nomen', true],
  ['Sand', 'nomen', true],
  ['Rand', 'nomen', false],
  ['Wand', 'nomen', true],
  ['dein', 'wort', false],
  ['Do-mi-no', 'nomen', true],
  ['Maus', 'nomen', true],
  ['Haus', 'nomen', true],
  ['Laus', 'nomen', true],
  ['raus', 'wort', false],
  ['Au-to', 'nomen', true],
  ['Rau-pe', 'nomen', true],
  ['gut', 'adjektiv', false],
  ['Ga-bel', 'nomen', true],
  ['Bein', 'nomen', true],
  ['Band', 'nomen', true],
  ['Ba-na-ne', 'nomen', true],
  ['Stein', 'nomen', true],
  ['Jo-jo', 'nomen', true],
];

// Sichtwörter (CLAUDE.md, Regel 3): werden als Ganzes gelernt.
export const SICHTWOERTER = Object.freeze(['ich', 'du', 'und', 'ist', 'das', 'mit', 'auf', 'ein']);

// Wörternetze (Analogielesen): gleiches Wortende, anderer Anfang.
// Das Modellwort ist das erste Wort; es wird zuerst sicher gelesen, die anderen per Analogie.
// Hinweis: In Hand/Land/Sand spricht man das d am Ende als /t/ (Auslautverhärtung).
const NETZE = [
  { endung: 'ama', woerter: ['Mama', 'Lama'] },
  { endung: 'ase', woerter: ['Nase', 'Hase', 'Oase'] },
  { endung: 'ose', woerter: ['Rose', 'Hose', 'Dose'] },
  { endung: 'ast', woerter: ['Ast', 'Mast', 'Last', 'Rast', 'fast'] },
  { endung: 'est', woerter: ['Nest', 'Rest', 'Fest', 'Test'] },
  { endung: 'ost', woerter: ['Rost', 'Ost', 'Post'] },
  { endung: 'ut',  woerter: ['Mut', 'Hut', 'Wut', 'gut'] },
  { endung: 'ein', woerter: ['ein', 'mein', 'sein', 'nein', 'fein', 'Wein', 'dein', 'Bein', 'Stein'] },
  { endung: 'and', woerter: ['Hand', 'Land', 'Sand', 'Rand', 'Wand', 'Band'] },
  { endung: 'aus', woerter: ['Maus', 'Haus', 'Laus', 'raus'] },
];

// ---------------------------------------------------------------------------
// Graphem-Zerlegung
// ---------------------------------------------------------------------------
const MEHRBUCHSTABEN = BUCHSTABEN.map(b => b.id).filter(id => id.length > 1)
  .sort((a, b) => b.length - a.length);           // längste zuerst: sch, chs vor ch
const VOKAL_DIGRAPHE = new Set(['ei', 'au', 'eu', 'ie']);
const NUR_AM_SILBENANFANG = new Set(['st', 'sp']); // Stein = St-ei-n, aber Nest = N-e-s-t

/**
 * Zerlegt ein Wort in Grapheme.
 * @param {string} silbenText Wort mit Silbentrennung, z. B. 'Ro-se' (ohne Bindestrich = eine Silbe)
 * @returns {{id: string, text: string}[]} id = kleingeschriebenes Graphem, text = Originalschreibung
 */
export function zerlege(silbenText) {
  const silben = silbenText.split('-');
  const wort = silben.join('');
  const klein = wort.toLowerCase();
  const silbenanfaenge = new Set();
  let pos = 0;
  for (const s of silben) { silbenanfaenge.add(pos); pos += s.length; }

  const ergebnis = [];
  let i = 0;
  while (i < klein.length) {
    let treffer = null;
    for (const m of MEHRBUCHSTABEN) {
      if (!klein.startsWith(m, i)) continue;
      let kreuztGrenze = false;
      for (let k = i + 1; k < i + m.length; k++) if (silbenanfaenge.has(k)) kreuztGrenze = true;
      // Vokal-Digraphe und sch nicht über die Silbengrenze (Fe-ri-en, Häs-chen);
      // ng und chs dürfen (sin-gen, wach-sen).
      if (kreuztGrenze && (VOKAL_DIGRAPHE.has(m) || m === 'sch')) continue;
      if (NUR_AM_SILBENANFANG.has(m) && !silbenanfaenge.has(i)) continue;
      treffer = m;
      break;
    }
    const id = treffer ?? klein[i];
    ergebnis.push({ id, text: wort.slice(i, i + id.length) });
    i += id.length;
  }
  return ergebnis;
}

/** Buchstabenstand, ab dem eine Graphemfolge lesbar ist (Infinity = nie, unbekanntes Zeichen). */
function lesbarAb(grapheme) {
  return Math.max(...grapheme.map(gr => position(gr.id)));
}

// Wortliste einmal aufbereiten
const WOERTER = WORTLISTE.map(([silbenText, art, bild], rang) => {
  const grapheme = zerlege(silbenText);
  return Object.freeze({
    wort: silbenText.replaceAll('-', ''),
    silben: silbenText.split('-'),
    art, bild, rang, grapheme,
    ab: lesbarAb(grapheme),
  });
});
const NACH_WORT = new Map(WOERTER.map(w => [w.wort, w]));

/** Wort-Objekt zu einem Wort (z. B. 'Rose') oder undefined. */
export function wortInfo(wort) {
  return NACH_WORT.get(wort);
}

// ---------------------------------------------------------------------------
// Was ist bei einem Buchstabenstand lesbar?
// ---------------------------------------------------------------------------

/** Zuletzt eingeführtes Graphem bei Stand n (1 … 41). */
export function neuestesGraphem(stand) {
  return BUCHSTABEN[stand - 1];
}

/**
 * Alle lesbaren Wörter bei einem Buchstabenstand.
 * Wörter mit dem zuletzt eingeführten Buchstaben stehen vorne und haben neu = true.
 */
export function lesbareWoerter(stand) {
  return WOERTER.filter(w => w.ab <= stand)
    .map(w => ({ ...w, neu: w.ab === stand }))
    .sort((a, b) => (b.neu - a.neu) || (a.rang - b.rang));
}

/**
 * Alle lesbaren Silben bei einem Buchstabenstand:
 * - offene Silben Konsonant + Vokal (ma, lo, fe …) aus allen eingeführten Graphemen
 * - dazu jede Silbe aus den lesbaren Wörtern (sen, fant, Ast …)
 * Silben mit dem neuesten Buchstaben stehen vorne (neu = true).
 */
export function lesbareSilben(stand) {
  const eingefuehrt = BUCHSTABEN.slice(0, stand);
  const konsonanten = eingefuehrt.filter(b => b.typ !== 'vokal' && b.anfang);
  const vokale = eingefuehrt.filter(b => b.typ === 'vokal');
  const silben = new Map();

  for (const k of konsonanten) {
    for (const v of vokale) {
      const text = k.id + v.id;
      silben.set(text, { text, grapheme: [{ id: k.id, text: k.id }, { id: v.id, text: v.id }],
        art: 'offen', ab: Math.max(position(k.id), position(v.id)) });
    }
  }
  for (const w of WOERTER) {
    if (w.ab > stand) continue;
    for (const s of w.silben) {
      const text = s.toLowerCase();
      if (silben.has(text)) continue;
      const grapheme = zerlege(text);
      silben.set(text, { text, grapheme, art: 'wort', ab: lesbarAb(grapheme) });
    }
  }
  return [...silben.values()]
    .map(s => ({ ...s, neu: s.ab === stand }))
    .sort((a, b) => (b.neu - a.neu) || (a.art === b.art ? 0 : a.art === 'offen' ? -1 : 1));
}

/** Sichtwörter mit der Angabe, ob sie mit den eingeführten Buchstaben schon erlesbar wären. */
export function sichtwoerter(stand) {
  return SICHTWOERTER.map(wort => {
    const grapheme = zerlege(wort);
    return { wort, grapheme, ab: lesbarAb(grapheme), lesbar: lesbarAb(grapheme) <= stand };
  });
}

/** Wörternetze, von denen bei diesem Stand mindestens zwei Wörter lesbar sind. */
export function lesbareNetze(stand) {
  return NETZE.map(n => ({
    endung: n.endung,
    modellwort: n.woerter[0],
    woerter: n.woerter.filter(w => (wortInfo(w)?.ab ?? sichtAb(w)) <= stand),
  })).filter(n => n.woerter.length >= 2);
}
const sichtAb = wort => lesbarAb(zerlege(wort));

/** Alle Modellwörter (Kopf je Wörternetz). */
export const MODELLWOERTER = Object.freeze(NETZE.map(n => n.woerter[0]));

/**
 * Zufällige Auswahl ohne Wiederholung; Einträge mit neu = true werden
 * GEWICHT_NEUER_BUCHSTABE-mal so oft gezogen.
 * (Gewichtetes Ziehen nach Efraimidis/Spirakis.)
 */
export function waehle(liste, anzahl, gewicht = GEWICHT_NEUER_BUCHSTABE) {
  return liste
    .map(x => ({ x, schluessel: Math.random() ** (1 / (x.neu ? gewicht : 1)) }))
    .sort((a, b) => b.schluessel - a.schluessel)
    .slice(0, anzahl)
    .map(e => e.x);
}

/** Alles auf einmal für einen Buchstabenstand – Einstieg für die Module. */
export function lesestoff(stand) {
  return {
    stand,
    neu: neuestesGraphem(stand),
    buchstaben: BUCHSTABEN.slice(0, stand),
    woerter: lesbareWoerter(stand),
    silben: lesbareSilben(stand),
    sichtwoerter: sichtwoerter(stand),
    netze: lesbareNetze(stand),
  };
}

// ---------------------------------------------------------------------------
// Prüfung der Wortliste (für die Testseite)
// ---------------------------------------------------------------------------
const VERDAECHTIG = [
  [/([bdfgklmnprstz])\1/i, 'Doppelkonsonant'],
  [/ck|tz/i, 'ck/tz'],
  [/[aeiouäöü]h/i, 'Dehnungs-h?'],
  [/aa|ee|oo/i, 'Doppelvokal'],
  [/[aeiouäöü]r($|[^aeiouäöü])/i, 'r nach Vokal (vokalisiert?)'],
  [/[bdg]$/i, 'Auslautverhärtung'],
  [/v|y|c(?!h)/i, 'kein Basisgraphem'],
];

/** Hinweise zur Wortliste: unbekannte Zeichen, Auffälligkeiten, fehlende Netzwörter, Doppelte. */
export function pruefeWortliste() {
  const hinweise = [];
  const gesehen = new Set();
  for (const w of WOERTER) {
    if (gesehen.has(w.wort)) hinweise.push({ wort: w.wort, text: 'doppelt in der Liste' });
    gesehen.add(w.wort);
    if (w.ab === Infinity) hinweise.push({ wort: w.wort, text: 'enthält ein unbekanntes Zeichen' });
    for (const [muster, text] of VERDAECHTIG) {
      if (muster.test(w.wort)) hinweise.push({ wort: w.wort, text });
    }
  }
  for (const n of NETZE) {
    for (const wort of n.woerter) {
      if (!NACH_WORT.has(wort) && !SICHTWOERTER.includes(wort)) {
        hinweise.push({ wort, text: `aus Wörternetz -${n.endung} fehlt in der Wortliste` });
      }
      if (!wort.toLowerCase().endsWith(n.endung)) {
        hinweise.push({ wort, text: `endet nicht auf -${n.endung}` });
      }
    }
  }
  return hinweise;
}

/** Alle Wörter (für die Testseite). */
export function alleWoerter() {
  return WOERTER;
}
