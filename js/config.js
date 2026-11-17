// Buchstabenreihenfolge (Zwergenheft) und Einstellungen.
// Einzige Stelle für die Reihenfolge; Mehrbuchstaben (Ei, Au, Sch, …) zählen als ein Graphem.
// Einstellungen kommen aus URL-Parametern, werden nicht gespeichert (kein localStorage, keine Cookies).

// ---------------------------------------------------------------------------
// Grapheme in der Reihenfolge des Zwergenhefts
// ---------------------------------------------------------------------------
// id          so steht das Graphem kleingeschrieben im Wort (Schlüssel für die Wortliste)
// anzeige     so zeigt die App das Graphem (Groß- und Kleinform, falls es beide gibt)
// typ         'vokal' | 'dauerlaut' (dehnbar, z. B. /mmm/) | 'plosiv' (nicht dehnbar) | 'sonstig'
// anfang      darf eine Silbe beginnen (für offene Silben wie „ma“, „lo“)
// sprechtext  Text, den die Sprachausgabe für den gedehnten Laut vorliest.
//             null = mit der Web Speech API nicht sauber lautierbar (Gefahr des Buchstabennamens,
//             z. B. „Te“ statt /t/). Dann gibt es dafür keinen Lautsprecher-Knopf, bis eigene
//             Aufnahmen in assets/audio/ liegen.
//             Die Texte sind ein erster Versuch und auf der Testseite (test/woerter.html) anhörbar.

const g = (id, anzeige, typ, anfang, sprechtext) => ({ id, anzeige, typ, anfang, sprechtext });

export const BUCHSTABEN = Object.freeze([
  g('o',   'O o',     'vokal',     false, 'oh'),
  g('m',   'M m',     'dauerlaut', true,  'mmmm'),
  g('e',   'E e',     'vokal',     false, 'eh'),
  g('a',   'A a',     'vokal',     false, 'ah'),
  g('l',   'L l',     'dauerlaut', true,  'llll'),
  g('s',   'S s',     'dauerlaut', true,  'ssss'),
  g('f',   'F f',     'dauerlaut', true,  'ffff'),
  g('n',   'N n',     'dauerlaut', true,  'nnnn'),
  g('t',   'T t',     'plosiv',    true,  null),
  g('r',   'R r',     'dauerlaut', true,  'rrrr'),
  g('i',   'I i',     'vokal',     false, 'ih'),
  g('u',   'U u',     'vokal',     false, 'uh'),
  g('k',   'K k',     'plosiv',    true,  null),
  g('w',   'W w',     'dauerlaut', true,  'wwww'),
  g('p',   'P p',     'plosiv',    true,  null),
  g('h',   'H h',     'dauerlaut', true,  'hhhh'),
  g('ei',  'Ei ei',   'vokal',     false, 'ei'),
  g('d',   'D d',     'plosiv',    true,  null),
  g('ch',  'Ch ch',   'dauerlaut', false, 'chchch'),
  g('au',  'Au au',   'vokal',     false, 'au'),
  g('z',   'Z z',     'sonstig',   true,  null),
  g('g',   'G g',     'plosiv',    true,  null),
  g('sch', 'Sch sch', 'dauerlaut', true,  'schschsch'),
  g('b',   'B b',     'plosiv',    true,  null),
  g('ie',  'ie',      'vokal',     false, 'ih'),
  g('ö',   'Ö ö',     'vokal',     false, 'öh'),
  g('ü',   'Ü ü',     'vokal',     false, 'üh'),
  g('st',  'St st',   'sonstig',   true,  'scht'),
  g('pf',  'Pf pf',   'sonstig',   true,  'pfff'),
  g('eu',  'Eu eu',   'vokal',     false, 'eu'),
  g('ng',  'ng',      'dauerlaut', false, null),
  g('sp',  'Sp sp',   'sonstig',   true,  null),
  g('j',   'J j',     'dauerlaut', true,  null),
  g('ä',   'Ä ä',     'vokal',     false, 'äh'),
  g('qu',  'Qu qu',   'sonstig',   true,  null),
  g('x',   'X x',     'sonstig',   false, null),
  g('v',   'V v',     'dauerlaut', true,  null),
  g('c',   'C c',     'sonstig',   false, null),
  g('y',   'Y y',     'sonstig',   false, null),
  g('ß',   'ß',       'dauerlaut', false, 'ssss'),
  g('chs', 'chs',     'sonstig',   false, null),
]);

export const ANZAHL_BUCHSTABEN = BUCHSTABEN.length; // 41

/** Graphem-Objekt zu einer id ('sch', 'o', …) oder undefined. */
export function graphem(id) {
  return BUCHSTABEN.find(b => b.id === id);
}

/** Position (1 … 41) eines Graphems in der Reihenfolge, Infinity wenn unbekannt. */
export function position(id) {
  const i = BUCHSTABEN.findIndex(b => b.id === id);
  return i < 0 ? Infinity : i + 1;
}

/** Wie viel stärker Wörter/Silben mit dem zuletzt eingeführten Buchstaben gewichtet werden. */
export const GEWICHT_NEUER_BUCHSTABE = 3;

// ---------------------------------------------------------------------------
// Lernleiter: 5 Stufen (Module kommen in eigenen Threads dazu)
// ---------------------------------------------------------------------------
export const STUFEN = Object.freeze([
  { nr: 1, titel: 'Hören', farbe: '#fde7c8',
    module: ['Anlaut-Detektiv', 'Silben klatschen', 'Schneckensprache', 'Robotersprache', 'Quatschwort-Retter'] },
  { nr: 2, titel: 'Buchstabe und Laut', farbe: '#d9ecd0',
    module: ['Buchstabenbingo', 'Buchstaben verbinden', 'Lautedomino', 'Wo hörst du es?'] },
  { nr: 3, titel: 'Laute verbinden', farbe: '#d3e4f5',
    module: ['Rutschen', 'Leseapparat', 'Leseschieber', 'Monsternamen'] },
  { nr: 4, titel: 'Automatisieren', farbe: '#eadcf2',
    module: ['Silbenteppich', 'Blitzlesen', 'Wort-Fang', 'Wortpuzzle', 'Wörternetz', 'Schnipp-Schnapp'] },
  { nr: 5, titel: 'Verstehen', farbe: '#f6dada',
    module: ['Klammerbild', 'Lies und mach', 'Hören und Mitlesen'] },
]);

// ---------------------------------------------------------------------------
// Einstellungen der Lehrkraft – nur als URL-Parameter
// ---------------------------------------------------------------------------
// Beispiel: index.html?b=12&h=bfi&z=1&t=80
//   b  Buchstabenstand (1–41): so viele Grapheme der Reihenfolge sind eingeführt
//   h  Hilfen als Kürzel (siehe HILFEN), „0“ = keine Hilfen
//   z  Zeitmodus 1 = an, 0 = aus
//   t  Sprechtempo in Prozent (50–150)

export const HILFEN = Object.freeze([
  { id: 'boegen',   kuerzel: 'b', titel: 'Silbenbögen' },
  { id: 'farben',   kuerzel: 'f', titel: 'Silbenfarben (blau/rot)' },
  { id: 'koenig',   kuerzel: 'k', titel: 'Vokal als Silbenkönig' },
  { id: 'schieber', kuerzel: 's', titel: 'Leseschieber' },
  { id: 'bilder',   kuerzel: 'i', titel: 'Bilder' },
]);

export const STANDARD = Object.freeze({
  stand: 12,                                   // O bis U
  hilfen: ['boegen', 'farben', 'bilder'],
  zeitmodus: true,
  tempo: 80,
});

const begrenze = (zahl, min, max, ersatz) =>
  Number.isFinite(zahl) ? Math.min(max, Math.max(min, Math.round(zahl))) : ersatz;

/** Liest die Einstellungen aus der Adresse (oder einem übergebenen Query-String). */
export function leseEinstellungen(query = globalThis.location?.search ?? '') {
  const p = new URLSearchParams(query);
  const e = {
    stand: begrenze(parseInt(p.get('b'), 10), 1, ANZAHL_BUCHSTABEN, STANDARD.stand),
    zeitmodus: p.has('z') ? p.get('z') !== '0' : STANDARD.zeitmodus,
    tempo: begrenze(parseInt(p.get('t'), 10), 50, 150, STANDARD.tempo),
    hilfen: {},
  };
  const h = p.get('h');
  for (const hilfe of HILFEN) {
    e.hilfen[hilfe.id] = h === null ? STANDARD.hilfen.includes(hilfe.id) : h.includes(hilfe.kuerzel);
  }
  return e;
}

/** Baut aus Einstellungen den Query-String (ohne „?“). */
export function einstellungenAlsParameter(e) {
  const h = HILFEN.filter(hilfe => e.hilfen[hilfe.id]).map(hilfe => hilfe.kuerzel).join('') || '0';
  return new URLSearchParams({ b: e.stand, h, z: e.zeitmodus ? 1 : 0, t: e.tempo }).toString();
}

/** Hängt die aktuellen Einstellungen an einen internen Link an, damit sie beim Weiterklicken erhalten bleiben. */
export function mitEinstellungen(href, e = leseEinstellungen()) {
  return `${href}?${einstellungenAlsParameter(e)}`;
}
