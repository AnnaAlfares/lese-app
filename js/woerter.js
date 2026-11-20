// Wortmaterial: Wortliste, Modellwörter, Wörternetze, Sichtwörter –
// und die Funktionen, die zu einem Buchstabenstand alles Lesbare liefern.
// Module holen ihre Wörter nur von hier, nie aus eigenen Listen.

import { BUCHSTABEN, GEWICHT_NEUER_BUCHSTABE, NICHT_BASISGRAPHEME, VOKALE_NACH_QU, graphem, position } from './config.js';

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
  ['am', 'wort', false],      // Sichtwort
  // Sichtwörter: hier stehen sie, sobald sie erlesbar sind (ist, mit ab I; sind ab D).
  // Vorher erscheinen sie nur als Ganzwort über sichtwoerter() (siehe FRUEHE_SICHTWOERTER).
  ['ist', 'wort', false],
  ['mit', 'wort', false],
  ['sind', 'wort', false],
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

// Sichtwörter (CLAUDE.md, Regel 3, ergänzt um „am“ und „sind“): werden als Ganzes gelernt.
export const SICHTWOERTER = Object.freeze(['ich', 'du', 'und', 'ist', 'das', 'mit', 'auf', 'ein', 'am', 'sind']);

// Früh gezeigte Sichtwörter: erscheinen ab diesem Buchstabenstand in den Übungen als Ganzwort,
// auch wenn noch nicht alle ihre Buchstaben eingeführt sind (z. B. „sind“ vor dem D).
// Alle übrigen Sichtwörter erscheinen erst, wenn sie erlesbar sind.
// VORSCHLAG Stand 4 (O M E A): ab da gibt es die ersten Wörter (Mama, Oma, am). Entscheidung: Anna.
export const FRUEHE_SICHTWOERTER = Object.freeze({ am: 4, ist: 4, mit: 4, sind: 4 });

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

// ---------------------------------------------------------------------------
// Aussortieren: nicht lauttreue Silben und Wörter
// ---------------------------------------------------------------------------
// Eine Silbe oder ein Wort wird NIE angeboten (bei keinem Buchstabenstand), wenn
//   1. ein Nicht-Basisgraphem darin vorkommt (v, c, y, ß, ie – siehe NICHT_BASISGRAPHEME in config.js),
//      weil sich seine Schreibung nicht aus dem Laut ableiten lässt (NRW-Handreichung S. 70, 98), oder
//   2. „qu“ vor einem Vokal steht, vor dem es im Deutschen nicht vorkommt (quu, queu, quau, quei, quö, qü),
//      siehe VOKALE_NACH_QU in config.js.
// Was aussortiert wurde, zeigt test/woerter.html (Funktion aussortiert()).

/** Grund, warum eine Graphemfolge aussortiert wird, oder null, wenn sie lauttreu ist. */
export function aussortierGrund(grapheme) {
  const fremd = grapheme.find(gr => NICHT_BASISGRAPHEME.has(gr.id));
  if (fremd) return `kein Basisgraphem: ${fremd.id}`;
  for (let i = 0; i < grapheme.length - 1; i++) {
    const naechstes = grapheme[i + 1].id;
    if (grapheme[i].id === 'qu' && graphem(naechstes)?.typ === 'vokal' && !VOKALE_NACH_QU.has(naechstes)) {
      return `qu vor ${naechstes}`;
    }
  }
  return null;
}

/** Buchstabenstand, ab dem eine Graphemfolge lesbar ist (Infinity = nie, unbekanntes Zeichen). */
function lesbarAb(grapheme) {
  return Math.max(...grapheme.map(gr => position(gr.id)));
}

// Wortliste einmal aufbereiten
const WOERTER = WORTLISTE.map(([silbenText, art, bild], rang) => {
  const grapheme = zerlege(silbenText);
  const grund = aussortierGrund(grapheme);
  return Object.freeze({
    wort: silbenText.replaceAll('-', ''),
    silben: silbenText.split('-'),
    art, bild, rang, grapheme,
    ab: grund ? Infinity : lesbarAb(grapheme), // aussortiert = nie lesbar
    erlesbarAb: lesbarAb(grapheme),
    aussortiert: grund,
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
  const silben = new Map();

  for (const s of alleSilben(stand)) {
    if (!s.aussortiert) silben.set(s.text, s);
  }
  return [...silben.values()]
    .map(s => ({ ...s, neu: s.ab === stand }))
    .sort((a, b) => (b.neu - a.neu) || (a.art === b.art ? 0 : a.art === 'offen' ? -1 : 1));
}

/**
 * Alle Silbenkandidaten bei einem Stand – auch aussortierte (Feld aussortiert = Grund oder null):
 * offene Silben Konsonant + Vokal aus den eingeführten Graphemen und die Silben der lesbaren Wörter.
 */
function alleSilben(stand) {
  const eingefuehrt = BUCHSTABEN.slice(0, stand);
  const konsonanten = eingefuehrt.filter(b => b.typ !== 'vokal' && b.anfang);
  const vokale = eingefuehrt.filter(b => b.typ === 'vokal');
  const silben = new Map();
  for (const k of konsonanten) {
    for (const v of vokale) {
      const text = k.id + v.id;
      const grapheme = [{ id: k.id, text: k.id }, { id: v.id, text: v.id }];
      silben.set(text, { text, grapheme, art: 'offen', ab: Math.max(position(k.id), position(v.id)),
        aussortiert: aussortierGrund(grapheme) });
    }
  }
  for (const w of WOERTER) {
    if (w.ab > stand) continue;
    for (const s of w.silben) {
      const text = s.toLowerCase();
      if (silben.has(text)) continue;
      const grapheme = zerlege(text);
      silben.set(text, { text, grapheme, art: 'wort', ab: lesbarAb(grapheme), aussortiert: aussortierGrund(grapheme) });
    }
  }
  return [...silben.values()];
}

/**
 * Was bei diesem Stand aussortiert wird, obwohl alle Buchstaben eingeführt sind (für die Testseite).
 * @returns {{silben: {text, aussortiert}[], woerter: {wort, aussortiert}[]}}
 */
export function aussortiert(stand) {
  return {
    silben: alleSilben(stand).filter(s => s.aussortiert),
    woerter: WOERTER.filter(w => w.aussortiert && w.erlesbarAb <= stand),
  };
}

/**
 * Sichtwörter bei einem Buchstabenstand.
 *   ab          Stand, ab dem das Wort in Übungen erscheint (früh gezeigt oder sobald erlesbar)
 *   lesbar      darf bei diesem Stand gezeigt werden (ab <= stand)
 *   erlesbarAb  Stand, ab dem alle Buchstaben eingeführt sind
 *   erlesbar    alle Buchstaben eingeführt – das Wort kann auch Laut für Laut erlesen werden
 *   ganzwort    wird gezeigt, ist aber noch nicht erlesbar: nur als Ganzwort verwenden
 *               (nicht in Übungen, die Laut für Laut zusammenschleifen)
 * Hinweis: lesbareWoerter() enthält nur erlesbare Wörter, also nie ein Ganzwort.
 */
export function sichtwoerter(stand) {
  return SICHTWOERTER.map(wort => {
    const grapheme = zerlege(wort);
    const erlesbarAb = aussortierGrund(grapheme) ? Infinity : lesbarAb(grapheme);
    const ab = Math.min(erlesbarAb, FRUEHE_SICHTWOERTER[wort] ?? Infinity);
    return {
      wort, grapheme, ab, erlesbarAb,
      lesbar: ab <= stand,
      erlesbar: erlesbarAb <= stand,
      ganzwort: ab <= stand && erlesbarAb > stand,
    };
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
    if (w.erlesbarAb === Infinity) hinweise.push({ wort: w.wort, text: 'enthält ein unbekanntes Zeichen' });
    if (w.aussortiert) hinweise.push({ wort: w.wort, text: `aussortiert (${w.aussortiert}) – erscheint nie` });
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
